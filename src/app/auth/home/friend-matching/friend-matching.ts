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

  restaurant = history.state?.restaurant ?? null;

  candidates: any[] = [];
  currentUserId: string | null = null;

  private pollingId: any = null;
  private hasNavigated = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    if (!this.restaurant) {
      const raw = localStorage.getItem('friend_current_restaurant');
      this.restaurant = raw ? JSON.parse(raw) : null;
    }

    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) return;

    this.currentUserId = user.id;

    await this.findCandidates();

    // ⭐ 輪詢（讓另一方自動跳）
    this.pollingId = setInterval(async () => {
      await this.checkMatch();
      await this.findCandidates();
    }, 1000);
  }

  async findCandidates() {
    if (!this.currentUserId || !this.restaurant?.name) return;

    const { data } = await this.supabase
      .from('dining_requests')
      .select(`
        user_id,
        profiles (
          username,
          avatar_url
        )
      `)
      .eq('restaurant_name', this.restaurant.name)
      .eq('status', 'active')
      .eq('dining_type', 'match')
      .neq('user_id', this.currentUserId);

    this.candidates =
      data?.map((item: any) => ({
        user_id: item.user_id,
        name: item.profiles?.[0]?.username ?? '使用者',
        avatar:
          item.profiles?.[0]?.avatar_url ??
          `https://i.pravatar.cc/150?u=${item.user_id}`,
      })) || [];

    this.cdr.detectChanges();
  }

  // ❤️ 按 like（核心）
  async likeFriend(friend: any) {
    if (!this.currentUserId || !friend?.user_id) return;

    // ⭐ 防止重複跳
    this.hasNavigated = false;

    // 1️⃣ 我 like 對方
    await this.supabase.from('likes').upsert(
      {
        user_id: this.currentUserId,
        target_user_id: friend.user_id,
      },
      { onConflict: 'user_id,target_user_id' }
    );

    console.log('👍 我按 like');

    // 2️⃣ 檢查對方有沒有 like 我
    const { data: reverse } = await this.supabase
      .from('likes')
      .select('*')
      .eq('user_id', friend.user_id)
      .eq('target_user_id', this.currentUserId)
      .maybeSingle();

    // ❌ 沒互 like
    if (!reverse) {
      alert('已送出喜歡 ❤️');
      return;
    }

    // 3️⃣ 檢查是否已有 match（🔥重點）
    const { data: existing } = await this.supabase
      .from('matches')
      .select('*')
      .or(
        `and(user_a_id.eq.${this.currentUserId},user_b_id.eq.${friend.user_id}),and(user_a_id.eq.${friend.user_id},user_b_id.eq.${this.currentUserId})`
      )
      .maybeSingle();

    let matchId;

    if (existing) {
      matchId = existing.id;
    } else {
      const { data: newMatch, error } = await this.supabase
        .from('matches')
        .insert({
          user_a_id: this.currentUserId,
          user_b_id: friend.user_id,
          status: 'accepted',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ 建立 match 失敗:', error);
        return;
      }

      matchId = newMatch.id;
    }

    console.log('🔥 MATCH 成功');

    // 4️⃣ 跳聊天室
    this.navigateToChat(friend, matchId);
  }

  // 🔥 讓另一方自動跳
  async checkMatch() {
    if (!this.currentUserId || this.hasNavigated) return;

    const { data } = await this.supabase
      .from('matches')
      .select('*')
      .or(
        `user_a_id.eq.${this.currentUserId},user_b_id.eq.${this.currentUserId}`
      )
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return;

    const match = data[0];

    const targetId =
      match.user_a_id === this.currentUserId
        ? match.user_b_id
        : match.user_a_id;

    const friend =
      this.candidates.find(c => c.user_id === targetId) ?? {
        user_id: targetId,
        name: '使用者',
        avatar: `https://i.pravatar.cc/150?u=${targetId}`,
      };

    this.navigateToChat(friend, match.id);
  }

  private navigateToChat(friend: any, matchId: any) {
    if (this.hasNavigated) return;
    this.hasNavigated = true;

    console.log('🚀 跳聊天室成功');

    localStorage.setItem('chat_target', friend.user_id);
    localStorage.setItem('friend_current', JSON.stringify(friend));
    localStorage.setItem(
      'friend_current_restaurant',
      JSON.stringify(this.restaurant)
    );

    this.router.navigate(['/friend/chat', friend.user_id], {
      state: {
        friend,
        matchId,
        restaurant: this.restaurant,
      },
    });
  }

  async retryMatch() {
    await this.findCandidates();
    await this.checkMatch();
  }

  ngOnDestroy() {
    if (this.pollingId) clearInterval(this.pollingId);
  }
}
