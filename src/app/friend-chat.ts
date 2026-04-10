import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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
export class FriendChatComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  supabase = createClient(
    'https://hamijkpsjaxltifhrppw.supabase.co',
    'sb_publishable_LataTu72rxsmn883jnvjgw_af3rtxRt'
  );

  currentUser: any;
  targetUserId: string | null = null;
  messages: Message[] = [];
  newMessage: string = '';
  private subscription: RealtimeChannel | null = null;
  private messageCheckTimer: any = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  async ngOnInit() {
    // 1. 取得當前使用者
    const { data } = await this.supabase.auth.getUser();
    if (!data.user) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUser = data.user;

    // 2. 初始化聊天
    await this.initChat();

    // 3. 監聽路由參數變化（重要：用戶可能直接改 URL 進入新聊天）
    this.route.params.subscribe(async (params) => {
      const newTargetId = params['id'];
      if (newTargetId && newTargetId !== this.targetUserId) {
        console.log(`🔄 切換聊天對象: ${this.targetUserId} -> ${newTargetId}`);
        this.targetUserId = newTargetId;
        this.messages = [];
        
        // 移除舊訂閱
        if (this.subscription) {
          this.supabase.removeChannel(this.subscription);
          this.subscription = null;
        }
        
        // 建立新聊天
        await this.loadMessages();
        this.listenMessages();
      }
    });
  }

  private async initChat() {
    this.targetUserId = this.route.snapshot.paramMap.get('id');

    if (!this.targetUserId) {
      alert('無效的對話對象');
      this.router.navigate(['/friend/matching']);
      return;
    }

    await this.loadMessages();
    this.listenMessages();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
    }
    if (this.messageCheckTimer) {
      clearTimeout(this.messageCheckTimer);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop =
        this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  async loadMessages() {
    if (!this.currentUser?.id || !this.targetUserId) {
      console.warn('⚠️ 用戶ID或目標ID缺失');
      return;
    }

    console.log(`🔍 加載消息 (${this.currentUser.id} <-> ${this.targetUserId})`);
    
    try {
      // 🔥 修正1：使用分開查詢替代 or()，避免404錯誤
      const { data: sent, error: sentError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('sender_id', this.currentUser.id)
        .eq('receiver_id', this.targetUserId)
        .order('created_at', { ascending: true });

      const { data: received, error: receivedError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('sender_id', this.targetUserId)
        .eq('receiver_id', this.currentUser.id)
        .order('created_at', { ascending: true });

      if (sentError) throw sentError;
      if (receivedError) throw receivedError;

      const allMessages = [...(sent || []), ...(received || [])]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      this.messages = allMessages;
      console.log(`✅ 已加載 ${this.messages.length} 條消息`);
    } catch (error) {
      console.error('❌ 加載消息失敗:', error);
    }
  }

  listenMessages() {
    // 確保先清除舊的訂閱
    if (this.subscription) {
      console.log('🧹 清除舊的聊天訂閱');
      this.supabase.removeChannel(this.subscription);
      this.subscription = null;
    }

    // 清除舊的心跳檢測
    if (this.messageCheckTimer) {
      clearInterval(this.messageCheckTimer);
      this.messageCheckTimer = null;
    }

    if (!this.currentUser?.id || !this.targetUserId) {
      console.warn('⚠️ 聊天參數不完整，無法監聽消息');
      return;
    }

    // 使用唯一的頻道名稱（包含排序的ID）
    const channelName = `chat_${[this.currentUser.id, this.targetUserId].sort().join('_')}`;
    console.log(`📡 建立聊天頻道: ${channelName}`);

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
          const newMsg = payload.new as Message;
          console.log('📨 收到新消息:', newMsg);

          // 嚴謹過濾：確保訊息是發給我，且來自當前對話對象
          const isRelevant =
            (newMsg.sender_id === this.targetUserId && newMsg.receiver_id === this.currentUser.id) ||
            (newMsg.sender_id === this.currentUser.id && newMsg.receiver_id === this.targetUserId);

          if (isRelevant) {
            const exists = this.messages.some(m => m.id === newMsg.id);
            if (!exists) {
              this.messages.push(newMsg);
              console.log(`✅ 添加消息 (共${this.messages.length}條)`);
              setTimeout(() => this.scrollToBottom(), 50);
            } else {
              console.log('⏭️ 消息已存在，跳過');
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`📌 頻道訂閱狀態: ${status}`);
      });

    // 🔥 心跳檢測：每 5 秒檢查一次新消息（Realtime 的備用方案）
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
          this.messages.push(msg);
          console.log(`💓 心跳檢測到新消息`);
          this.scrollToBottom();
        }
      });
    }, 5000);
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.currentUser || !this.targetUserId) return;

    const contentToSend = this.newMessage;
    this.newMessage = '';

    const tempId = 'temp-' + Date.now();
    const temporaryMsg: Message = {
      id: tempId,
      sender_id: this.currentUser.id,
      receiver_id: this.targetUserId,
      content: contentToSend,
      created_at: new Date().toISOString(),
      isTemp: true
    };

    this.messages.push(temporaryMsg);
    this.scrollToBottom();

    try {
      console.log('📤 正在發送消息...');
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          sender_id: this.currentUser.id,
          receiver_id: this.targetUserId,
          content: contentToSend
        })
        .select()
        .single();

      if (error) {
        console.error('❌ 發送失敗:', error.message);
        this.messages = this.messages.filter(m => m.id !== tempId);
        this.newMessage = contentToSend;
        alert('❌ 發送失敗：' + (error.message || '未知錯誤'));
      } else if (data) {
        const index = this.messages.findIndex(m => m.id === tempId);
        if (index !== -1) {
          this.messages[index] = data as Message;
          console.log('✅ 消息發送成功');
        }
      }
    } catch (err) {
      console.error('💥 發送異常:', err);
      this.messages = this.messages.filter(m => m.id !== tempId);
      this.newMessage = contentToSend;
    }
  }

  isMe(msg: Message): boolean {
    return msg.sender_id === this.currentUser.id;
  }
}