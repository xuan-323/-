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

  // 前端流程狀態
  isWaiting = true;
  isMatched = false;
  matchedFriend: any = null;

  // 輪詢用
  private pollingId: any = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // 如果重整頁面，嘗試從 localStorage 補餐廳
    if (!this.restaurant) {
      const raw = localStorage.getItem('friend_current_restaurant');
      this.restaurant = raw ? JSON.parse(raw) : null;
    }

    const { data: { user } } = await this.supabase.auth.getUser();

    if (!user) {
      console.error('抓不到登入使用者');
      return;
    }

    this.currentUserId = user.id;

    // 先載入候選人
    await this.findCandidates();

    // 先檢查一次是否已有 match
    await this.checkMatch();

    // 每 3 秒檢查一次配對狀態
    this.pollingId = setInterval(async () => {
      await this.checkMatch();
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
      .neq('user_id', this.currentUserId)
      .limit(5);

    if (error) {
      console.error('找候選人錯誤', error);
      return;
    }

    console.log('候選人查詢結果:', data);

    if (!data || data.length === 0) {
      this.candidates = [];
      this.isWaiting = true;
      this.isMatched = false;
      this.cdr.detectChanges();
      return;
    }

    this.candidates = data.map((user: any) => ({
      user_id: user.user_id,
      name: user.profiles?.[0]?.username ?? '未命名使用者',
      mbti: user.profiles?.[0]?.mbti ?? '未知',
      avatar: user.profiles?.[0]?.avatar_url ?? 'https://i.pravatar.cc/300?img=32',
      intro: '一起吃飯吧！'
    }));

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

    // 先存資料，避免聊天室頁刷新後拿不到
    localStorage.setItem('chat_target', friend.user_id);
    localStorage.setItem('friend_current', JSON.stringify(friend));
    localStorage.setItem(
      'friend_current_restaurant',
      JSON.stringify(this.restaurant)
    );

    // 直接跳聊天室
    this.router.navigate(['/friend/chat'], {
      state: {
        friend: friend,
        restaurant: this.restaurant,
        matchId: friend?.match_id ?? null
      }
    });
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

    if (!data || data.length === 0) {
      this.isMatched = false;
      this.isWaiting = true;
      this.cdr.detectChanges();
      return;
    }

    const match = data[0];

    const otherUserId =
      match.user_a_id === this.currentUserId ? match.user_b_id : match.user_a_id;

    const friend =
      this.candidates.find(c => c.user_id === otherUserId) ?? {
        user_id: otherUserId,
        name: '配對成功的飯友',
        mbti: '未知',
        avatar: 'https://i.pravatar.cc/300?img=32',
        intro: '一起吃飯吧！',
        match_id: match.id
      };

    friend.match_id = match.id;

    this.matchedFriend = friend;
    this.isMatched = true;
    this.isWaiting = false;

    localStorage.setItem('friend_current', JSON.stringify(friend));

    this.cdr.detectChanges();
  }

  goToChat(friend?: any) {
    const targetFriend = friend ?? this.matchedFriend;

    if (!targetFriend) return;

    localStorage.setItem('chat_target', targetFriend.user_id);
    localStorage.setItem('friend_current', JSON.stringify(targetFriend));
    localStorage.setItem(
      'friend_current_restaurant',
      JSON.stringify(this.restaurant)
    );

    this.router.navigate(['/friend/chat'], {
      state: {
        friend: targetFriend,
        restaurant: this.restaurant,
        matchId: targetFriend?.match_id ?? null
      }
    });
  }

  retryMatch() {
    this.findCandidates();
  }

  ngOnDestroy(): void {
    if (this.pollingId) {
      clearInterval(this.pollingId);
      this.pollingId = null;
    }
  }
}
