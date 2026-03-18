import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
export class FriendMatchingComponent implements OnInit {

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  tag = history.state?.tag ?? null;
  restaurant = history.state?.restaurant ?? null;

  candidates: any[] = [];
  currentUserId: string | null = null;

  private matched = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {

    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return;

    this.currentUserId = user.id;
      await this.supabase.from('dining_requests').insert({
    user_id: this.currentUserId,
    restaurant_id: this.restaurant?.name,
    status: 'waiting'
  });
    await this.findCandidates();
    await this.checkMatch();

    // 🔥 即時監聽
    this.supabase
      .channel('matches-listener')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches' },
        async () => {
          await this.checkMatch();
        }
      )
      .subscribe();

    // 🔥 輪詢保底
    setInterval(async () => {
      await this.checkMatch();
    }, 2000);
  }

  /* =========================
     找候選人 + 自動配對
  ========================= */

  async findCandidates() {

    if (!this.currentUserId || this.matched) return;

    const { data, error } = await this.supabase
      .from('dining_requests')
      .select('user_id, restaurant_id')
      .eq('restaurant_id', this.restaurant?.name)
      .eq('status', 'waiting')
      .neq('user_id', this.currentUserId)
      .limit(1);

    if (error) {
      console.error("找候選人錯誤:", JSON.stringify(error, null, 2));
      return;
    }

    if (!data || data.length === 0) {
      console.log("沒有候選人（持續等待）");
      return;
    }

    const user = data[0];
    console.log("找到候選人:", user);

    // 🔥 抓 profile
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('username, mbti, avatar_url')
      .eq('id', user.user_id)
      .single();

    // 🔥 用 upsert（避免 409 + 一步拿 id）
    const { data: match, error: matchError } = await this.supabase
      .from('matches')
      .upsert(
        {
          user_a_id: this.currentUserId,
          user_b_id: user.user_id,
          restaurant_id: this.restaurant?.name
        },
        {
          onConflict: 'user_a_id,user_b_id'
        }
      )
      .select()
      .single();

    if (matchError) {
      console.error("建立 match 失敗:", matchError);
      return;
    }

    const matchId = match?.id;

    if (!matchId) {
      console.error("❌ matchId 沒拿到");
      return;
    }

    console.log("✅ matchId:", matchId);

    // 🔥 更新狀態
    await this.supabase
      .from('dining_requests')
      .update({ status: 'completed' })
      .in('user_id', [this.currentUserId, user.user_id]);

    // 🔥 UI 顯示
    this.candidates = [
      {
        user_id: user.user_id,
        name: profile?.username || '匿名使用者',
        mbti: profile?.mbti,
        avatar: profile?.avatar_url,
        intro: "一起吃飯吧！"
      }
    ];

    this.cdr.detectChanges();

    // 🔥 直接跳聊天室（不等 checkMatch）
    this.matched = true;

    this.router.navigate(['/friend/chat'], {
      state: {
        matchId: matchId,
        restaurant: this.restaurant
      }
    });
  }

  /* =========================
     保底：檢查是否已配對
  ========================= */

  async checkMatch() {

    if (!this.currentUserId || this.matched) return;

    const { data } = await this.supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${this.currentUserId},user_b_id.eq.${this.currentUserId}`)
      .limit(1);

    if (!data || data.length === 0) return;

    const match = data[0];

    if (!match?.id) return;

    console.log("🎉 配對成功:", match);

    this.matched = true;

    this.router.navigate(['/friend/chat'], {
      state: {
        matchId: match.id,
        restaurant: this.restaurant
      }
    });
  }

  async likeFriend(friend: any) {
    console.log("like:", friend);
  }

  goToChat(friend: any) {
    this.router.navigate(['/friend/chat'], {
      state: {
        friend: friend,
        restaurant: this.restaurant
      }
    });
  }
}