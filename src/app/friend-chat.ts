import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 定義訊息資料結構，解決 ts(4111) 錯誤
interface Message {
  id: string | number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  isTemp?: boolean; // 標記是否為樂觀更新的暫時訊息
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

  async ngOnInit() {
    const { data } = await this.supabase.auth.getUser();
    this.currentUser = data.user;
    this.targetUserId = localStorage.getItem('chat_target');

    if (!this.targetUserId) {
      console.error('❌ 沒有對話對象');
      return;
    }

    if (this.currentUser) {
      await this.loadMessages();
      this.listenMessages();
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  // =============================
  // ⭐ 載入訊息
  // =============================
  async loadMessages() {
    const { data } = await this.supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${this.currentUser.id},receiver_id.eq.${this.targetUserId}),and(sender_id.eq.${this.targetUserId},receiver_id.eq.${this.currentUser.id})`)
      .order('created_at', { ascending: true });

    this.messages = data || [];
  }

  // =============================
  // ⭐ 即時監聽 (優化過濾與重複處理)
  // =============================
  listenMessages() {
    // 建立唯一的頻道名稱
    const channelName = `chat-${this.currentUser.id}-${this.targetUserId}`;
    
    this.subscription = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;

          // 判斷這則訊息是否屬於當前對話
          const isRelevant =
            (newMsg.sender_id === this.currentUser.id && newMsg.receiver_id === this.targetUserId) ||
            (newMsg.sender_id === this.targetUserId && newMsg.receiver_id === this.currentUser.id);

          if (isRelevant) {
            // ⭐ 重要：檢查訊息是否已存在（避免樂觀更新與 Realtime 重複顯示）
            const exists = this.messages.some(m => m.id === newMsg.id);
            if (!exists) {
              // 如果是自己發出的，嘗試替換掉暫時訊息；如果是對方發出的，直接推入
              this.messages.push(newMsg);
            }
          }
        }
      )
      .subscribe();
  }

  // =============================
  // ⭐ 發送訊息 (樂觀更新版)
  // =============================
  async sendMessage() {
    if (!this.newMessage.trim() || !this.currentUser || !this.targetUserId) return;

    const contentToSend = this.newMessage;
    this.newMessage = ''; 

    // 1. 建立樂觀更新的暫時訊息 (立即顯示)
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

    // 2. 異步發送到 Supabase
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
      console.error('發送失敗:', error);
      // 失敗時移除暫時訊息並復原輸入框
      this.messages = this.messages.filter(m => m.id !== tempId);
      this.newMessage = contentToSend;
    } else if (data) {
      // 3. 用正式資料替換暫時資料，確保 ID 正確
      const index = this.messages.findIndex(m => m.id === tempId);
      if (index !== -1) {
        this.messages[index] = data as Message;
      }
    }
  }

  isMe(msg: Message): boolean {
    return msg.sender_id === this.currentUser.id;
  }
}