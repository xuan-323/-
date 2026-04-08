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
  matches: any[] = [];
  myRequest: any = null; 

  async ngOnInit() {
    await this.init();
  }

  async init() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data.user) return;

    this.currentUser = data.user;

    await this.loadMyRequest();
    await this.loadUsers();
    await this.loadLikes();
    await this.loadMatches();
  }

  // =============================
  // ⭐ 優化 1：取得自己「最新一筆」請求
  // =============================
  async loadMyRequest() {
    const { data } = await this.supabase
      .from('dining_requests')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .eq('dining_type', 'match')
      .order('created_at', { ascending: false }) // 排序：最新在最前
      .limit(1) // 只取一筆
      .maybeSingle();
    
    this.myRequest = data;
  }

  // =============================
  // ⭐ 載入配對用戶
  // =============================
  async loadUsers() {
    if (!this.myRequest) return;

    // 5 分鐘內的有效請求
    const fiveMin = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from('dining_requests')
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .eq('dining_type', 'match')
      .eq('restaurant_id', this.myRequest.restaurant_id)
      .gte('created_at', fiveMin)
      .order('created_at', { ascending: false }); // 對方也要是最新請求

    if (error) {
      console.error('❌ loadUsers 錯誤:', error.message);
      return;
    }

    // 這裡使用 filter 確保畫面上不會出現同一個人的重複請求 (如果資料庫沒清乾淨)
    const uniqueUsers: any[] = [];
    const seenIds = new Set();
    
    (data || []).forEach(u => {
      if (u.user_id !== this.currentUser.id && !seenIds.has(u.user_id)) {
        uniqueUsers.push(u);
        seenIds.add(u.user_id);
      }
    });

    this.users = uniqueUsers;
    this.cdr.detectChanges();
  }

  async loadLikes() {
    const { data } = await this.supabase
      .from('likes')
      .select('*')
      .eq('user_id', this.currentUser.id);
    this.likes = data || [];
  }

  async loadMatches() {
    const { data } = await this.supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${this.currentUser.id},user_b_id.eq.${this.currentUser.id}`);
    this.matches = data || [];
  }

  getAvatar(url: string | null, username: string | null) {
    if (!url || url === 'default') {
      return `https://api.dicebear.com/7.x/initials/svg?seed=${username || 'user'}`;
    }
    return url;
  }

  isMatched(user: any): boolean {
    return this.matches.some(m =>
      (m.user_a_id === this.currentUser.id && m.user_b_id === user.user_id) ||
      (m.user_b_id === this.currentUser.id && m.user_a_id === user.user_id)
    );
  }

  // =============================
  // ⭐ 核心配對邏輯：雙向最新一筆卡控
  // =============================
  async likeUser(user: any) {
    // 1️⃣ 檢查自己 (再次確保狀態最新)
    await this.loadMyRequest();
    if (!this.myRequest) {
      alert('您的請求已過期，請重新選擇餐廳！');
      window.location.href = '/auth/preference'; 
      return;
    }

    // 2️⃣ 檢查重複 Like
    const { data: exist } = await this.supabase
      .from('likes')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .eq('target_user_id', user.user_id)
      .maybeSingle();

    if (exist) {
      alert('已經點過喜歡囉！');
      return;
    }

    // 3️⃣ 執行 Like
    await this.supabase.from('likes').insert({
      user_id: this.currentUser.id,
      target_user_id: user.user_id
    });

    // 4️⃣ 檢查對方是否也 Like 我
    const { data: mutual } = await this.supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('target_user_id', this.currentUser.id)
      .maybeSingle();

    if (!mutual) {
      alert('👍 已傳達你的喜歡！');
      return;
    }

    // 5️⃣ ⭐ 優化 2：取得對方「最新一筆」有效請求
    const { data: targetRequest } = await this.supabase
      .from('dining_requests')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('dining_type', 'match')
      .order('created_at', { ascending: false }) // 最新優先
      .limit(1)
      .maybeSingle();

    if (!targetRequest) {
      alert('對方目前沒有有效的餐廳請求');
      return;
    }

    // 6️⃣ 終極餐廳比對
    if (this.myRequest.restaurant_id !== targetRequest.restaurant_id) {
      alert('配對失敗：對方的餐廳選擇已變更！');
      return;
    }

    // 7️⃣ 建立 Match
    const { error: matchError } = await this.supabase.from('matches').insert({
      user_a_id: this.currentUser.id,
      user_b_id: user.user_id,
      status: 'matched',
      created_at: new Date().toISOString()
    });

    if (!matchError) {
      alert('🎉 餐廳選擇一致，配對成功！');
      await this.loadMatches(); 
    } else {
      console.error('建立配對失敗', matchError);
    }
  }

  goChat(user: any) {
    localStorage.setItem('chat_target', user.user_id);
    window.location.href = '/friend/chat';
  }
}