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

  private pollingId: any = null;
  private hasNavigated = false;
  private hasLikedSomeone = false;

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

    this.pollingId = setInterval(async () => {
      await this.findCandidates();
      await this.checkMatch();
    }, 1000);
  }

  async findCandidates() {
    if (!this.currentUserId || !this.restaurant?.name) {
      this.candidates = [];
      this.isWaiting = true;
      this.cdr.detectChanges();
      return;
    }

    const { data, error } = await this.supabase
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

    if (error) {
      console.error('❌ 抓候選人失敗:', error);
      return;
    }

    console.log('👥 找到候選人:', data);

    this.candidates =
      data?.map((item: any) => {
        const username =
          item?.profiles?.username?.trim?.() ||
          item?.profiles?.username ||
          item?.user_id?.slice(0, 8) ||
          '使用者';

        const avatar =
          item?.profiles?.avatar_url &&
          String(item.profiles.avatar_url).trim() !== ''
            ? item.profiles.avatar_url
            : `https://i.pravatar.cc/150?u=${item.user_id}`;

        return {
          user_id: item.user_id,
          name: username,
          avatar,
        };
      }) || [];

    this.isWaiting = this.candidates.length === 0;
    this.cdr.detectChanges();
  }

  async likeFriend(friend: any) {
    if (!this.currentUserId || !friend?.user_id) return;

    this.hasNavigated = false;
    this.hasLikedSomeone = true;

    const { error: likeError } = await this.supabase
      .from('likes')
      .upsert(
        {
          user_id: this.currentUserId,
          target_user_id: friend.user_id,
        },
        { onConflict: 'user_id,target_user_id' }
      );

    if (likeError) {
      console.error('❌ like 失敗:', likeError);
      return;
    }

    console.log('👍 我按 like');

    const { data: reverse, error: reverseError } = await this.supabase
      .from('likes')
      .select('*')
      .eq('user_id', friend.user_id)
      .eq('target_user_id', this.currentUserId)
      .maybeSingle();

    if (reverseError) {
      console.error('❌ 檢查 reverse like 失敗:', reverseError);
      return;
    }

    if (!reverse) {
      alert('已送出喜歡 ❤️，等待對方中');
      return;
    }

    const { data: existing, error: existingError } = await this.supabase
      .from('matches')
      .select('*')
      .or(
        `and(user_a_id.eq.${this.currentUserId},user_b_id.eq.${friend.user_id}),and(user_a_id.eq.${friend.user_id},user_b_id.eq.${this.currentUserId})`
      )
      .maybeSingle();

    if (existingError) {
      console.error('❌ 查 existing match 失敗:', existingError);
      return;
    }

    let matchId: any;

    if (existing) {
      matchId = existing.id;
    } else {
      const { data: newMatch, error: newMatchError } = await this.supabase
        .from('matches')
        .insert({
          user_a_id: this.currentUserId,
          user_b_id: friend.user_id,
          status: 'accepted',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newMatchError) {
        console.error('❌ 建立 match 失敗:', newMatchError);
        return;
      }

      matchId = newMatch.id;
    }

    console.log('🔥 MATCH 成功');
    this.navigateToChat(friend, matchId);
  }

  async checkMatch() {
    if (!this.currentUserId || this.hasNavigated || !this.hasLikedSomeone) return;

    const { data, error } = await this.supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${this.currentUserId},user_b_id.eq.${this.currentUserId}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ checkMatch 失敗:', error);
      return;
    }

    if (!data || data.length === 0) return;

    const match = data[0];

    const targetId =
      match.user_a_id === this.currentUserId
        ? match.user_b_id
        : match.user_a_id;

    const friend =
      this.candidates.find(c => c.user_id === targetId) ?? {
        user_id: targetId,
        name: targetId?.slice?.(0, 8) || '使用者',
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
  }

  ngOnDestroy() {
    if (this.pollingId) clearInterval(this.pollingId);
  }
}
