import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-friend-matching',
  imports: [CommonModule],
  templateUrl: './friend-matching.html',
  styleUrls: ['./friend-matching.css'],
})
export class FriendMatchingComponent implements OnInit, OnDestroy {

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  tag = history.state?.tag ?? null;
  restaurant = history.state?.restaurant ?? null;

  candidates: any[] = [];
  currentUserId: string | null = null;
  pollingId: any = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    console.log('matching 頁收到 restaurant:', this.restaurant);

    const { data: { user } } = await this.supabase.auth.getUser();

    if (!user) {
      console.error('抓不到登入使用者');
      return;
    }

    this.currentUserId = user.id;

    // 先查一次
    await this.findCandidates();

    // 開始輪詢
    this.startPolling();

    // 監聽 matches
    this.supabase
      .channel('matches-listener')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches'
        },
        async () => {
          await this.checkMatch();
        }
      )
      .subscribe();
  }

  startPolling() {
    this.pollingId = setInterval(async () => {
      await this.findCandidates();

      if (this.candidates.length > 0) {
        clearInterval(this.pollingId);
        this.pollingId = null;
        console.log('找到候選人，停止輪詢');
      }
    }, 3000);
  }

  async findCandidates() {
    if (!this.currentUserId) return;

    console.log('目前 restaurant:', this.restaurant);
    console.log('目前 restaurant.name:', this.restaurant?.name);

    if (!this.restaurant?.name) {
      console.error('restaurant.name 不存在，查不到候選人', this.restaurant);
      this.candidates = [];
      this.cdr.detectChanges();
      return;
    }

    const { data, error } = await this.supabase
      .from('dining_requests')
      .select(`
        user_id,
        restaurant_id,
        profiles (
          username,
          mbti,
          avatar_url
        )
      `)
      .eq('restaurant_id', this.restaurant.name)
      .neq('user_id', this.currentUserId)
      .limit(1);

    if (error) {
      console.error('找候選人錯誤', error);
      return;
    }

    console.log('候選人查詢結果:', data);

    if (!data || data.length === 0) {
      console.log('沒有候選人');
      this.candidates = [];
      this.cdr.detectChanges();
      return;
    }

    const user = data[0];

    this.candidates = [
      {
        user_id: user.user_id,
        name: user.profiles?.[0]?.username ?? '未命名使用者',
        mbti: user.profiles?.[0]?.mbti ?? '未知',
        avatar: user.profiles?.[0]?.avatar_url ?? 'https://i.pravatar.cc/300?img=32',
        intro: '一起吃飯吧！'
      }
    ];

    this.cdr.detectChanges();
  }

  async likeFriend(friend: any) {
    if (!this.currentUserId) return;

    const { error } = await this.supabase
      .from('likes')
      .insert({
        from_user_id: this.currentUserId,
        to_user_id: friend.user_id
      });

    if (error) {
      console.error('送出 like 失敗', error);
      return;
    }

    console.log('👍 已送出一起吃邀請');
  }

  async checkMatch() {
    if (!this.currentUserId) return;

    const { data, error } = await this.supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${this.currentUserId},user_b_id.eq.${this.currentUserId}`)
      .limit(1);

    if (error) {
      console.error('檢查配對失敗', error);
      return;
    }

    if (!data || data.length === 0) return;

    const match = data[0];

    this.router.navigate(['/friend/chat'], {
      state: {
        matchId: match.id,
        restaurant: this.restaurant
      }
    });
  }

  goToChat(friend: any) {
    this.router.navigate(['/friend/chat'], {
      state: {
        friend: friend,
        restaurant: this.restaurant
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pollingId) {
      clearInterval(this.pollingId);
      this.pollingId = null;
    }
  }
}
