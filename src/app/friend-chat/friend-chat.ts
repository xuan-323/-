import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  styleUrls: ['./friend-chat.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  currentUser: any;
  targetUserId: string | null = null;
  messages$ = new BehaviorSubject<Message[]>([]);
  messages: Message[] = [];
  newMessage: string = '';

  friend: any = null;
  restaurant: any = null;
  matchId: any = null;

  private subscription: RealtimeChannel | null = null;
  private messageCheckTimer: any = null;
  private destroy$ = new Subject<void>();
  private isLoadingMessages = false;
  private lastCheckedTime: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // ✅ 訂閱消息流
    this.messages$.pipe(takeUntil(this.destroy$)).subscribe(msgs => {
      this.messages = msgs;
      this.cdr.markForCheck();
    });
  }

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
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(async (params) => {
      const newTargetId = params['id'];
      if (newTargetId && newTargetId !== this.targetUserId) {
        this.targetUserId = newTargetId;
        console.log('🔄 從 URL 參數更新 targetUserId:', this.targetUserId);
        // 清除舊訂閱，重新加載新聊天
        this.cleanupSubscriptions();
        await this.loadMessages();
        this.listenMessages();
        this.cdr.markForCheck();
      }
    });

    // 4. 如果沒有 URL 參數，使用 friend.user_id 或 localStorage
    if (!this.targetUserId) {
      this.targetUserId = this.friend?.user_id || localStorage.getItem('chat_target') || null;
      console.log('🎯 目標用戶 ID:', this.targetUserId);
    }

    // 5. 驗證必要的數據
    if (!this.targetUserId) {
      console.error('❌ 沒有聊天對象，無法進行聊天。數據:', {
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
    if (this.isLoadingMessages) {
      console.log('⏳ 正在加載消息，跳過重複請求');
      return;
    }

    if (!this.currentUser?.id || !this.targetUserId) {
      console.log('❌ 缺少必要信息', { userId: this.currentUser?.id, targetId: this.targetUserId });
      return;
    }

    this.isLoadingMessages = true;
    console.log('📡 開始加載訊息:', { from: this.currentUser.id, to: this.targetUserId });

    try {
      // 分開查詢：我發送的消息
      const { data: sent, error: sentError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('sender_id', this.currentUser.id)
        .eq('receiver_id', this.targetUserId)
        .order('created_at', { ascending: true });

      if (sentError) {
        console.error('❌ 加載已發送消息失敗:', sentError);
        throw sentError;
      }

      // 分開查詢：我接收的消息
      const { data: received, error: receivedError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('sender_id', this.targetUserId)
        .eq('receiver_id', this.currentUser.id)
        .order('created_at', { ascending: true });

      if (receivedError) {
        console.error('❌ 加載已接收消息失敗:', receivedError);
        throw receivedError;
      }

      // 合併並排序
      const allMessages = [...(sent || []), ...(received || [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      this.messages$.next(allMessages);
      console.log('✅ 已加載 ' + allMessages.length + ' 條消息');
      this.lastCheckedTime = Date.now();
      
      // 使用多個滾動機制確保成功
      this.scrollToBottom();
      setTimeout(() => this.scrollToBottom(), 50);
      setTimeout(() => this.scrollToBottom(), 150);
    } catch (error) {
      console.error('❌ 加載訊息錯誤:', error);
    } finally {
      this.isLoadingMessages = false;
    }
  }

  // ✅ 修復 #2: 改進 Realtime 監聽並添加優化的心跳檢測
  private listenMessages() {
    if (!this.currentUser?.id || !this.targetUserId) {
      console.warn('⚠️ 無法建立監聽：缺少必要參數');
      return;
    }

    // 清除舊的監聽器
    this.cleanupSubscriptions();

    // 建立聊天頻道（使用排序後的 ID 確保一致性）
    const [id1, id2] = [this.currentUser.id, this.targetUserId].sort();
    const channelName = `chat_${id1}_${id2}`;
    
    console.log('🚀 建立 Realtime 訂閱:', channelName);

    this.subscription = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg: any = payload.new;
          console.log('📨 Realtime 收到新消息:', newMsg);
          
          // 驗證這條消息是否屬於當前聊天
          const isThisChat =
            (newMsg.sender_id === this.currentUser.id && newMsg.receiver_id === this.targetUserId) ||
            (newMsg.sender_id === this.targetUserId && newMsg.receiver_id === this.currentUser.id);

          if (!isThisChat) {
            console.log('⚠️ 消息不屬於當前聊天，忽略');
            return;
          }

          // 檢查消息是否已存在
          const currentMessages = this.messages$.value;
          const exists = currentMessages.some(msg => msg.id === newMsg.id);
          if (exists) {
            console.log('⚠️ 消息已存在，忽略重複');
            return;
          }

          // 添加新消息
          console.log('✅ 添加新消息到列表');
          this.messages$.next([...currentMessages, newMsg]);
          this.lastCheckedTime = Date.now();
          
          // 立即滾動到底部
          this.scrollToBottom();
          setTimeout(() => this.scrollToBottom(), 50);

          // 如果是来自对方的消息，显示通知
          if (newMsg.sender_id === this.targetUserId) {
            this.showBrowserNotification(newMsg.content);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime 訂閱狀態:', status);
      });

    // ✨ 改進的心跳檢測：1 秒檢查一次，但只查最近 1 秒的消息
    this.messageCheckTimer = setInterval(async () => {
      if (!this.currentUser?.id || !this.targetUserId) return;
      
      // 避免检查太频繁中没有新消息发生时的重复检查
      const oneSecondAgo = new Date(Date.now() - 1000).toISOString();

      try {
        const { data: sent } = await this.supabase
          .from('messages')
          .select('*')
          .eq('sender_id', this.currentUser.id)
          .eq('receiver_id', this.targetUserId)
          .gte('created_at', oneSecondAgo);

        const { data: received } = await this.supabase
          .from('messages')
          .select('*')
          .eq('sender_id', this.targetUserId)
          .eq('receiver_id', this.currentUser.id)
          .gte('created_at', oneSecondAgo);

        const recentMessages = [...(sent || []), ...(received || [])];
        const currentMessages = this.messages$.value;
        
        let hasNewMessages = false;
        recentMessages.forEach(msg => {
          if (!currentMessages.some(m => m.id === msg.id)) {
            console.log('💓 心跳檢測到新消息:', msg);
            currentMessages.push(msg);
            hasNewMessages = true;
          }
        });

        if (hasNewMessages) {
          // 重新排序以確保順序正確
          currentMessages.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          this.messages$.next([...currentMessages]);
          
          // 立即滾動到底部
          this.scrollToBottom();
          setTimeout(() => this.scrollToBottom(), 50);
        }
      } catch (error) {
        console.error('❌ 心跳檢測失敗:', error);
      }
    }, 1000);
  }

  scrollToBottom() {
    if (!this.myScrollContainer) {
      console.warn('⚠️ scrollContainer 還未初始化');
      return;
    }

    // 使用 requestAnimationFrame 確保 DOM 已更新
    requestAnimationFrame(() => {
      try {
        const element = this.myScrollContainer.nativeElement;
        if (element) {
          element.scrollTop = element.scrollHeight;
          console.log('✅ 滾動至底部 | 高度:', element.scrollHeight);
        }
      } catch (error) {
        console.error('❌ 滾動失敗:', error);
      }
    });
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;
    if (!this.currentUser?.id || !this.targetUserId) {
      alert('❌ 缺少必要信息，無法發送消息');
      return;
    }

    const text = this.newMessage.trim();
    console.log('📤 準備發送消息:', text);

    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          sender_id: this.currentUser.id,
          receiver_id: this.targetUserId,
          content: text
        })
        .select()
        .single();

      if (error) {
        console.error('❌ 發送失敗:', error);
        alert('❌ 失敗：' + (error?.message || '未知錯誤'));
        return;
      }

      console.log('✅ 消息發送成功，數據:', data);
      
      // 清空輸入框
      this.newMessage = '';
      this.cdr.markForCheck();

      // 確保消息顯示（防止 Realtime 延遲）
      if (data) {
        const currentMessages = this.messages$.value;
        if (!currentMessages.some(m => m.id === data.id)) {
          this.messages$.next([...currentMessages, data]);
          
          // 立即滾動到底部
          this.scrollToBottom();
          setTimeout(() => this.scrollToBottom(), 50);
          setTimeout(() => this.scrollToBottom(), 150);
        }
      }
    } catch (error: any) {
      console.error('❌ 發送訊息異常:', error);
      alert('❌ 異常：' + (error?.message || '未知錯誤'));
      // 恢復消息內容
      this.newMessage = text;
      this.cdr.markForCheck();
    }
  }

  isMe(msg: Message): boolean {
    return msg.sender_id === this.currentUser?.id;
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

  // ✅ 新增：集中管理訂閱清理
  private cleanupSubscriptions() {
    console.log('🧹 清理舊訂閱...');
    
    if (this.subscription) {
      try {
        this.supabase.removeChannel(this.subscription);
        this.subscription = null;
        console.log('✅ Realtime 訂閱已清理');
      } catch (error) {
        console.error('❌ 清理 Realtime 訂閱失敗:', error);
      }
    }

    if (this.messageCheckTimer) {
      clearInterval(this.messageCheckTimer);
      this.messageCheckTimer = null;
      console.log('✅ 心跳檢測已停止');
    }
  }

  ngAfterViewChecked() {
    // 每次視圖檢查後嘗試滾動（以防 DOM 剛好更新）
    try {
      this.scrollToBottom();
    } catch (error) {
      console.error('❌ ngAfterViewChecked 滾動失敗:', error);
    }
  }

  ngOnDestroy() {
    console.log('🛑 聊天組件銷毀...');
    this.cleanupSubscriptions();
    this.destroy$.next();
    this.destroy$.complete();
    console.log('✅ 聊天組件已完全清理');
  }
}
