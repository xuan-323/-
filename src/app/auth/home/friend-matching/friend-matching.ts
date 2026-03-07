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

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {

    const { data: { user } } = await this.supabase.auth.getUser();

    if (!user) return;

    this.currentUserId = user.id;

    // 先找候選人
    await this.findCandidates();

    // 監聽配對
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

  /* =========================
     找候選人（從 dining_requests）
  ========================= */

  async findCandidates() {

    if (!this.currentUserId) return;

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
      .eq('restaurant_id', this.restaurant?.id)
      .neq('user_id', this.currentUserId)
      .limit(1);

    if (error) {
      console.error("找候選人錯誤", error);
      return;
    }

    if (!data || data.length === 0) {
      console.log("沒有候選人");
      this.candidates = [];
      return;
    }

    const user = data[0];

this.candidates = [
  {
    user_id: user.user_id,
    name: user.profiles?.[0]?.username,
    mbti: user.profiles?.[0]?.mbti,
    avatar: user.profiles?.[0]?.avatar_url,
    intro: "一起吃飯吧！"
  }
];

    this.cdr.detectChanges();
  }

  /* =========================
     按「一起吃」
  ========================= */

  async likeFriend(friend: any) {

    if (!this.currentUserId) return;

    const { error } = await this.supabase
      .from("likes")
      .insert({
        from_user_id: this.currentUserId,
        to_user_id: friend.user_id
      });

    if (error) {
      console.error("送出 like 失敗", error);
      return;
    }

    console.log("👍 已送出一起吃邀請");
  }

  /* =========================
     檢查是否配對成功
  ========================= */

  async checkMatch() {

    if (!this.currentUserId) return;

    const { data } = await this.supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${this.currentUserId},user_b_id.eq.${this.currentUserId}`)
      .limit(1);

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

  if (!friend.match_id) {
    console.error("沒有 match_id", friend);
    return;
  }

  this.router.navigate(['/friend/chat'], {
    state: {
      friend: friend,
      matchId: friend.match_id,
      restaurant: this.restaurant
    }
  });

}
}