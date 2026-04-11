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

  isWaiting = true;
  isMatched = false;
  matchedFriend: any = null;

  private pollingId: any = null;
  private hasNavigated = false;

  enterTime: string = '';

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

    // 🔥 關鍵：記錄進入時間
    this.enterTime = new Date().toISOString();

    await this.findCandidates();

    // ❗ 這裡不要一開始就強制跳
    this.pollingId = setInterval(async () => {
      await this.checkMatch();
    }, 2000);
  }

  async findCandidates() {
    if (!this.currentUserId || !this.restaurant?.id) return;

    const { data } = await this.supabase
      .from('dining_requests')
      .select(`
        user_id,
        profiles (
          username,
          mbti,
          avatar_url
        )
      `)
      .eq('restaurant_id', this.restaurant.id)
      .eq('status', 'active')
      .neq('user_id', this.currentUserId);

    this.candidates =
      data?.map((item: any) => ({
        user_id: item.user_id,
        name: item.profiles?.[0]?.username ?? '使用者',
        mbti: item.profiles?.[0]?.mbti ?? '',
        avatar:
          item.profiles?.[0]?.avatar_url ??
          `https://i.pravatar.cc/150?u=${item.user_id}`,
      })) || [];

    this.cdr.detectChanges();
  }

  async likeFriend(friend: any) {
    if (!this.currentUserId) return;

    // ✅ 存 like
    await this.supabase.from('likes').upsert(
      {
        user_id: this.currentUserId,
        target_user_id: friend.user_id,
      },
      { onConflict: 'user_id,target_user_id' }
    );

   const { data: reverseLikes } = await this.supabase
  .from('likes')
  .select('user_id')
  .eq('user_id', friend.user_id)
  .eq('target_user_id', this.currentUserId);

if (!reverseLikes || reverseLikes.length === 0) {
  alert('已送出喜歡，等待對方中 ❤️');
  return;
}

  async likeFriend(friend: any) {
  if (!this.currentUserId) return;

  // ✅ 先存自己的 like
  await this.supabase.from('likes').upsert(
  {
    user_id: this.currentUserId,
    target_user_id: friend.user_id,
    created_at: new Date().toISOString(), // 🔥 加在這
  },
  { onConflict: 'user_id,target_user_id' }
);

  // ✅ 檢查對方是否也 like 你（關鍵）
  const { data: reverseLikes } = await this.supabase
  .from('likes')
  .select('user_id, created_at')
  .eq('user_id', friend.user_id)
  .eq('target_user_id', this.currentUserId)
  .gte('created_at', this.enterTime); // 🔥 關鍵！
  // ❗ 沒互相 like → 不跳
  if (!reverseLikes || reverseLikes.length === 0) {
    alert('已送出喜歡，等待對方中 ❤️');
    return;
  }

  // ✅ 有互相 like → 建立 / 取得 match
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
    const { data: newMatch } = await this.supabase
      .from('matches')
      .insert({
        user_a_id: this.currentUserId,
        user_b_id: friend.user_id,
        status: 'matched',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    matchId = newMatch.id;
  }



  // ✅ 只有雙方 like 才會走到這裡
  this.navigateToChat(friend, matchId);
}

    // 🔥 檢查是否已存在 match（避免重複）
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
      const { data: newMatch } = await this.supabase
        .from('matches')
        .insert({
          user_a_id: this.currentUserId,
          user_b_id: friend.user_id,
          status: 'matched',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      matchId = newMatch.id;
    }

    this.navigateToChat(friend, matchId);
  }

  async checkMatch() {
    if (!this.currentUserId) return;

    const { data } = await this.supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${this.currentUserId},user_b_id.eq.${this.currentUserId}`)
      .eq('status', 'matched')
      .gte('created_at', this.enterTime) // 🔥 只抓新 match
      .order('created_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return;

    const match = data[0];

    const otherUserId =
      match.user_a_id === this.currentUserId
        ? match.user_b_id
        : match.user_a_id;

    this.navigateToChat({ user_id: otherUserId }, match.id);
  }

  private navigateToChat(friend: any, matchId: any) {
    if (this.hasNavigated) return;
    this.hasNavigated = true;

    this.router.navigate(['/friend/chat', friend.user_id], {
      state: {
        friend,
        matchId,
        restaurant: this.restaurant,
      },
    });
  }

  ngOnDestroy() {
    if (this.pollingId) clearInterval(this.pollingId);
  }
}
