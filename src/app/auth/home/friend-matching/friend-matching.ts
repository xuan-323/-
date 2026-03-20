import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-friend-matching',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend-matching.html',
  styleUrls: ['./friend-matching.css']
})
export class FriendMatchingComponent implements OnInit {

  supabase = createClient(
    'https://hamijkpsjaxltifhrppw.supabase.co',
    'sb_publishable_LataTu72rxsmn883jnvjgw_af3rtxRt'
  );

  constructor(private cdr: ChangeDetectorRef) {}

  currentUser: any;
  users: any[] = [];
  likes: any[] = [];

  async ngOnInit() {
    await this.init();
  }

  async init() {
    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      console.error('取得使用者錯誤', error);
      return;
    }

    if (!data.user) return;

    this.currentUser = data.user;

    // ✅ 只讀資料（不再寫入）
    await this.loadUsers();
    await this.loadLikes();
  }

  async loadUsers() {
    const fiveMin = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from('dining_requests')
      .select('*')
      .eq('dining_type', 'match') // ⭐只顯示配對的人
      .gte('created_at', fiveMin);

    if (error) {
      console.error('❌ loadUsers錯誤:', error);
      return;
    }

    // ❗排除自己
    this.users = (data || []).filter(
      u => u.user_id !== this.currentUser.id
    );

    this.cdr.detectChanges();
  }

  async loadLikes() {
    const { data, error } = await this.supabase
      .from('likes')
      .select('*')
      .eq('user_id', this.currentUser.id);

    if (error) {
      console.error('❌ loadLikes錯誤:', error);
      return;
    }

    this.likes = data || [];
  }

  hasLiked(user: any): boolean {
    return this.likes.some(l =>
      l.target_user_id === user.user_id
    );
  }

  async likeUser(user: any) {

    const { data: exist, error } = await this.supabase
      .from('likes')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .eq('target_user_id', user.user_id)
      .maybeSingle();

    if (error) {
      console.error('❌ 檢查like錯誤:', error);
      return;
    }

    if (exist) {
      alert('已按過');
      return;
    }

    const { error: insertError } = await this.supabase
      .from('likes')
      .insert({
        user_id: this.currentUser.id,
        target_user_id: user.user_id
      });

    if (insertError) {
      console.error('❌ like寫入錯誤:', insertError);
      return;
    }

    alert('👍 已喜歡');

    await this.loadLikes();
  }

  goChat(user: any) {
    localStorage.setItem('chat_target', user.user_id);
    window.location.href = '/friend/chat';
  }
}