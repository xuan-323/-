import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './friend-chat.html',
  styleUrls: ['./friend-chat.css']
})
export class ChatComponent implements OnInit, OnDestroy {

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  supabase = createClient(
    'https://hamijkpsjaxltifhrppw.supabase.co',
    'sb_publishable_LataTu72rxsmn883jnvjgw_af3rtxRt'
  );

  currentUser: any;
  isMe(msg: any): boolean {
  return msg.sender_id === this.currentUser?.id;
}
  targetUser: string = '';
  messages: any[] = [];
  newMessage = '';

  friend: any = null;
  restaurant: any = null;
  matchId: any = null;

  private channel!: RealtimeChannel;

  constructor(private router: Router) {}

  async ngOnInit() {
    const nav = history.state;

    this.friend = nav?.friend || JSON.parse(localStorage.getItem('friend_current') || 'null');
    this.restaurant = nav?.restaurant || JSON.parse(localStorage.getItem('friend_current_restaurant') || 'null');
    this.matchId = nav?.matchId || null;

    const { data, error } = await this.supabase.auth.getUser();

    if (error || !data.user) {
      alert('取得使用者失敗');
      return;
    }

    this.currentUser = data.user;
    this.targetUser = this.friend?.user_id || localStorage.getItem('chat_target') || '';

    if (!this.targetUser) {
      alert('沒有聊天對象');
      return;
    }

    this.requestNotificationPermission();
    await this.loadMessages();

    this.channel = this.supabase
      .channel(`chat-room-${this.currentUser.id}-${this.targetUser}`)
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
            (newMsg.sender_id === this.currentUser.id && newMsg.receiver_id === this.targetUser) ||
            (newMsg.sender_id === this.targetUser && newMsg.receiver_id === this.currentUser.id);

          if (!isThisChat) return;

          const exists = this.messages.some(msg => msg.id === newMsg.id);
          if (exists) return;

          this.messages = [...this.messages, newMsg];
          setTimeout(() => this.scrollToBottom(), 50);

          if (newMsg.sender_id === this.targetUser) {
            this.showBrowserNotification(newMsg.content);
          }
        }
      )
      .subscribe();
  }

  async loadMessages() {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${this.currentUser.id},receiver_id.eq.${this.targetUser}),and(sender_id.eq.${this.targetUser},receiver_id.eq.${this.currentUser.id})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('載入訊息錯誤:', error);
      return;
    }

    this.messages = data || [];
    setTimeout(() => this.scrollToBottom(), 100);
  }

  scrollToBottom() {
    try {
      this.myScrollContainer.nativeElement.scrollTop =
        this.myScrollContainer.nativeElement.scrollHeight;
    } catch {}
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    const text = this.newMessage.trim();

    const { error } = await this.supabase
      .from('messages')
      .insert({
        sender_id: this.currentUser.id,
        receiver_id: this.targetUser,
        content: text
      });

    if (error) {
      console.error('發送訊息錯誤:', error);
      return;
    }

    this.newMessage = '';
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

  ngOnDestroy() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
    }
  }
}
