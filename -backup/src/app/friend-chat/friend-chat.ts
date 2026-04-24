import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../environments/environment';

interface Message {
  id: string | number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  isTemp?: boolean;
}

@Component({
  selector: 'app-friend-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './friend-chat.html',
  styleUrls: ['./friend-chat.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  currentUser: any;
  targetUserId: string | null = null;
  messages: Message[] = [];
  newMessage: string = '';

  friend: any = null;
  restaurant: any = null;
  matchId: any = null;

  private subscription: RealtimeChannel | null = null;
  private messageCheckTimer: any = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  async ngOnInit() {
    console.log('🔍 聊天頁面初始化...');

    // 1. 從 history state 或 localStorage 獲取朋友和餐廳信息
    this.friend = history.state?.friend || null;
    this.restaurant = history.state?.restaurant || null;
    this.matchId = history.state?.matchId || null;

    // 如果 history state 沒有，嘗試從 localStorage 補救
    if (!this.friend) {
      const rawFriend = localStorage.getItem('friend_current');
      if (rawFriend) {
        try {
          this.friend = JSON.parse(rawFriend);
          console.log('✅ 從 localStorage 恢復 friend:', this.friend);
        } catch (e) {
          console.error('❌ 解析 friend_current 失敗:', e);
          this.friend = null;
        }
      }
    }

    if (!this.restaurant) {
      const rawRestaurant = localStorage.getItem('friend_current_restaurant');
      if (rawRestaurant) {
        try {
          this.restaurant = JSON.parse(rawRestaurant);
          console.log('✅ 從 localStorage 恢復 restaurant:', this.restaurant);
        } catch (e) {
          console.error('❌ 解析 restaurant 失敗:', e);
          this.restaurant = null;
        }
      }
    }

    // 2. 獲取當前使用者
    const { data } = await this.supabase.auth.getUser();
    if (!data.user) {
      console.error('❌ 未登入，導航回登入頁');
      this.router.navigate(['/login']);
      return;
    }
    this.currentUser = data.user;
    console.log('✅ 當前使用者:', this.currentUser.id);

    // 3. 從路由參數獲取 targetUserId（新增支持 URL 參數）
    this.route.params.subscribe(async (params) => {
      const newTargetId = params['id'];
      if (newTargetId && newTargetId !== this.targetUserId) {
        this.targetUserId = newTargetId;
        console.log('🔄 從 URL 參數更新 targetUserId:', this.targetUserId);
        // 清除舊訂閱，重新加載新聊天
        if (this.subscription) {
          this.supabase.removeChannel(this.subscription);
          this.subscription = null;
        }
        await this.loadMessages();
        this.listenMessages();
      }
    });

    // 4. 如果沒有 URL 參數，使用 friend.user_id 或 localStorage
    if (!this.targetUserId) {
      this.targetUserId = this.friend?.user_id || localStorage.getItem('chat_target') || null;
      console.log('🎯 目標用戶 ID:', this.targetUserId);
    }

    // 5. 驗證必要的數據
    if (!this.targetUserId) {
      console.error('❌ 沒有聊天對象，無法進行聊天。数据:', {
        friendId: this.friend?.user_id,
        storedChatTarget: localStorage.getItem('chat_target'),
        storedFriend: localStorage.getItem('friend_current')
      });
      alert('❌ 無法建立聊天連接，請重新選擇飯友');
      this.router.navigate(['/friend/matching']);
      return;
    }

    console.log('✅ 所有必要數據已就緒，準備加載消息');
    this.requestNotificationPermission();
    await this.loadMessages();
    this.listenMessages();
  }

  // ✅ 修復 #1: 替換 .or() 查詢為分開查詢，避免 404 錯誤
  async loadMessages() {
    if (!this.currentUser?.id || !this.targetUserId) {
      console.log('❌ 缺少必要信息', { userId: this.currentUser?.id, targetId: this.targetUserId });
      return;
    }

    console.log('📡 開始加載訊息:', { from: this.currentUser.id, to: this.targetUserId });

    try {
      // 分開查詢：我發送的消息
      const { data: sent, error: sentError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('sender_id', this.currentUser.id)
        .eq('receiver_id', this.targetUserId)
        .order('created_at', { ascending: true });

      if (sentError) throw sentError;

      // 分開查詢：我接收的消息
      const { data: received, error: receivedError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('sender_id', this.targetUserId)
        .eq('receiver_id', this.currentUser.id)
        .order('created_at', { ascending: true });

      if (receivedError) throw receivedError;

      // 合併並排序
      const allMessages = [...(sent || []), ...(received || [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      this.messages = allMessages;
      console.log('✅ 已加載 ' + this.messages.length + ' 條消息');
      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      console.error('❌ 加載訊息錯誤:', error);
    }
  }

  // ✅ 修復 #2: 監聽聊天消息並添加心跳檢測
  private listenMessages() {
    if (!this.currentUser?.id || !this.targetUserId) return;

    // 清除舊的監聽器
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
    }
    if (this.messageCheckTimer) {
      clearInterval(this.messageCheckTimer);
    }

    // 建立聊天頻道（使用排序後的 ID 確保一致性）
    const [id1, id2] = [this.currentUser.id, this.targetUserId].sort();
    this.subscription = this.supabase
      .channel(`chat_${id1}_${id2}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg: any = payload.new;
          const isThisChat =
            (newMsg.sender_id === this.currentUser.id && newMsg.receiver_id === this.targetUserId) ||
            (newMsg.sender_id === this.targetUserId && newMsg.receiver_id === this.currentUser.id);

          if (!isThisChat) return;

          const exists = this.messages.some(msg => msg.id === newMsg.id);
          if (exists) return;

          console.log('📨 收到新消息:', newMsg);
          this.messages.push(newMsg);
          this.scrollToBottom();

          if (newMsg.sender_id === this.targetUserId) {
            this.showBrowserNotification(newMsg.content);
          }
        }
      )
      .subscribe();

    console.log('📡 建立聊天頻道: chat_' + id1 + '_' + id2);

    // 添加 5 秒心跳檢測（如果 Realtime 失敗則用輪詢補救）
    this.messageCheckTimer = setInterval(async () => {
      if (!this.currentUser?.id || !this.targetUserId) return;

      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();

      const { data: sent } = await this.supabase
        .from('messages')
        .select('*')
        .eq('sender_id', this.currentUser.id)
        .eq('receiver_id', this.targetUserId)
        .gte('created_at', fiveSecondsAgo);

      const { data: received } = await this.supabase
        .from('messages')
        .select('*')
        .eq('sender_id', this.targetUserId)
        .eq('receiver_id', this.currentUser.id)
        .gte('created_at', fiveSecondsAgo);

      const recentMessages = [...(sent || []), ...(received || [])];
      recentMessages.forEach(msg => {
        if (!this.messages.some(m => m.id === msg.id)) {
          console.log('💓 心跳檢測到新消息:', msg);
          this.messages.push(msg);
          this.scrollToBottom();
        }
      });
    }, 5000);
  }

  scrollToBottom() {
    try {
      this.myScrollContainer.nativeElement.scrollTop =
        this.myScrollContainer.nativeElement.scrollHeight;
    } catch {}
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;
    if (!this.currentUser?.id || !this.targetUserId) {
      alert('❌ 缺少必要信息，無法發送消息');
      return;
    }

    const text = this.newMessage.trim();

    try {
      const { error } = await this.supabase
        .from('messages')
        .insert({
          sender_id: this.currentUser.id,
          receiver_id: this.targetUserId,
          content: text
        });

      if (error) {
        throw error;
      }

      console.log('✅ 消息發送成功');
      this.newMessage = '';
    } catch (error: any) {
      console.error('❌ 發送訊息錯誤:', error);
      alert('❌ 失敗：' + (error?.message || '未知錯誤'));
    }
  }

  isMe(msg: Message): boolean {
    return msg.sender_id === this.currentUser?.id;
  }

  addEmoji(emoji: string) {
    this.newMessage += emoji;
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  showBrowserNotification(message: string) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    new Notification('你收到新訊息', {
      body: message,
      icon: '/favicon.ico'
    });
  }

  // ✅ 用餐完成 → 跳回饋頁
  finishMeal() {
    localStorage.setItem('friend_feedback_restaurant', JSON.stringify(this.restaurant || null));
    localStorage.setItem('friend_feedback_friend', JSON.stringify(this.friend || null));

    this.router.navigate(['/friend/feedback'], {
      state: {
        restaurant: this.restaurant,
        friend: this.friend,
        matchId: this.matchId
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
    }
    if (this.messageCheckTimer) {
      clearInterval(this.messageCheckTimer);
    }
  }
}
