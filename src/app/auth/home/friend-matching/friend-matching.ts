import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

const supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseAnonKey
);

@Component({
  standalone: true,
  selector: 'app-friend-matching',
  imports: [CommonModule],
  templateUrl: './friend-matching.html',
  styleUrls: ['./friend-matching.css'],
})
export class FriendMatchingComponent implements OnInit, OnDestroy {

  currentUser: any;
  users: any[] = [];
  matches: any[] = [];
  myRequest: any = null;
  private matchesChannel: any;
  private usersChannel: any;
  private intervalId: any;

  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

  async ngOnInit() {
    await this.init();

    // 心跳機制：每 30 秒更新一次自己的在線狀態
    this.intervalId = setInterval(async () => {
      if (this.currentUser) {
        await supabase
          .from('dining_requests')
          .update({ last_active: new Date().toISOString() })
          .eq('user_id', this.currentUser.id);
      }
    }, 30000);
  }

  ngOnDestroy() {
    if (this.matchesChannel) supabase.removeChannel(this.matchesChannel);
    if (this.usersChannel) supabase.removeChannel(this.usersChannel);
    if (this.intervalId) clearInterval(this.intervalId);
  }

  async init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    this.currentUser = user;

    await this.loadMyRequest();

    if (this.myRequest) {
      // 進入時立刻更新一次狀態
      await supabase
        .from('dining_requests')
        .update({ last_active: new Date().toISOString() })
        .eq('user_id', this.currentUser.id);

      await Promise.all([
        this.loadUsers(),
        this.loadMatches()
      ]);
      this.setupRealtime();
    }
    this.cdr.detectChanges();
  }

  setupRealtime() {
    // 清除舊的頻道
    if (this.matchesChannel) supabase.removeChannel(this.matchesChannel);
    if (this.usersChannel) supabase.removeChannel(this.usersChannel);

    // 監聽 matches 表（配對更新）
    this.matchesChannel = supabase
      .channel('sync-matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          console.log('✅ 配對表更新:', payload);
          this.loadMatches();
        }
      )
      .subscribe();

    // 🔥 關鍵修正：監聽 dining_requests（用戶上線/下線）
    this.usersChannel = supabase
      .channel('sync-users-' + this.myRequest.restaurant_id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dining_requests' },
        (payload) => {
          console.log('🔄 用戶列表更新:', payload);
          this.loadUsers();
        }
      )
      .subscribe();
  }

  async loadMyRequest() {
    const { data } = await supabase
      .from('dining_requests')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .eq('dining_type', 'match')
      .maybeSingle();
    this.myRequest = data;
  }

  async loadUsers() {
    if (!this.myRequest) return;

    // 關鍵：只抓取「1分鐘內」有活動的用戶，過濾離線用戶
    const onlineThreshold = new Date(Date.now() - 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('dining_requests')
      .select('*, profiles(username, avatar_url)')
      .eq('dining_type', 'match')
      .eq('restaurant_id', this.myRequest.restaurant_id)
      .gte('last_active', onlineThreshold);

    if (error) {
      console.error('❌ 加載用戶出錯:', error);
      return;
    }

    this.users = (data || []).filter(u => u.user_id !== this.currentUser.id);
    console.log('👥 當前在線用戶:', this.users.length);
    this.cdr.detectChanges();
  }

  async loadMatches() {
    // 抓取所有跟我有關的成功配對
    const { data } = await supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${this.currentUser.id},user_b_id.eq.${this.currentUser.id}`)
      .eq('status', 'matched');

    this.matches = data || [];
    this.cdr.detectChanges();
  }

  // 嚴謹判定：目前卡片上的 user 是否跟我配對成功
  isMatched(user: any): boolean {
    return this.matches.some(m => 
      (m.user_a_id === this.currentUser.id && m.user_b_id === user.user_id) ||
      (m.user_b_id === this.currentUser.id && m.user_a_id === user.user_id)
    );

  async likeUser(user: any) {
    // 1. 送出喜歡
    const { error: likeError } = await supabase.from('likes').upsert({
      user_id: this.currentUser.id,
      target_user_id: user.user_id
    });

    if (likeError) return;

    // 2. 檢查對方是否也喜歡我
    const { data: mutual } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('target_user_id', this.currentUser.id)
      .maybeSingle();

    if (mutual) {
      const [id1, id2] = [this.currentUser.id, user.user_id].sort();
      const { error: matchError } = await supabase.from('matches').upsert({
        user_a_id: id1,
        user_b_id: id2,
        status: 'matched'
      });

      if (!matchError) {
        alert('🎉 配對成功！');
        await this.loadMatches();
      }
    } else {
      alert('👍 已送出喜歡');
    }
  }

  goChat(user: any) {
    // 關鍵：改用網址傳遞 ID，不再依賴 localStorage
    this.router.navigate(['/friend/chat', user.user_id]);
  }

  getAvatar(url: string | null, username: string | null) {
    return (!url || url === 'default')
      ? `https://api.dicebear.com/7.x/initials/svg?seed=${username || 'user'}`
      : url;
  }

  ngOnDestroy(): void {
    if (this.pollingId) {
      clearInterval(this.pollingId);
      this.pollingId = null;
    }
  }
}
