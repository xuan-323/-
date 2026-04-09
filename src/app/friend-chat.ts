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

  constructor(private route: ActivatedRoute, private router: Router) {}

  async ngOnInit() {
    // 1. 取得當前使用者
    const { data } = await this.supabase.auth.getUser();
    if (!data.user) {
      this.router.navigate(['/login']);
      return;
    }
    this.currentUser = data.user;

    // 2. 關鍵：直接從網址參數取得 target ID
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
    const { data } = await this.supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${this.currentUser.id},receiver_id.eq.${this.targetUserId}),and(sender_id.eq.${this.targetUserId},receiver_id.eq.${this.currentUser.id})`
      )
      .order('created_at', { ascending: true });

    this.messages = data || [];
  }

  listenMessages() {
    // 使用唯一的頻道名稱
    const channelName = `chat_${[this.currentUser.id, this.targetUserId].sort().join('_')}`;

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

          // 嚴謹過濾：確保訊息是發給我，且來自當前對話對象
          const isRelevant =
            (newMsg.sender_id === this.targetUserId && newMsg.receiver_id === this.currentUser.id) ||
            (newMsg.sender_id === this.currentUser.id && newMsg.receiver_id === this.targetUserId);

          if (isRelevant) {
            const exists = this.messages.some(m => m.id === newMsg.id);
            if (!exists) {
              this.messages.push(newMsg);
              setTimeout(() => this.scrollToBottom(), 50);
            }
          }
        }
      )
      .subscribe();
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
      this.messages = this.messages.filter(m => m.id !== tempId);
      this.newMessage = contentToSend;
    } else if (data) {
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