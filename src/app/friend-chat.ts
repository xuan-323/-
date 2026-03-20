import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  targetUser: string = '';
  messages: any[] = [];
  newMessage = '';

  private channel!: RealtimeChannel;

  async ngOnInit() {

    const { data, error } = await this.supabase.auth.getUser();

    if (error || !data.user) {
      alert('取得使用者失敗');
      return;
    }

    this.currentUser = data.user;
    this.targetUser = localStorage.getItem('chat_target') || '';

    if (!this.targetUser) {
      alert('沒有聊天對象');
      return;
    }

    await this.loadMessages();

    // 🔥 建立專屬聊天室 channel（避免干擾）
    this.channel = this.supabase
      .channel(`chat-${this.currentUser.id}-${this.targetUser}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {

          console.log('🔥收到訊息', payload);

          const newMsg: any = payload.new;

          // ⭐只接收雙方訊息
          if (
            (newMsg.sender_id === this.currentUser.id && newMsg.receiver_id === this.targetUser) ||
            (newMsg.sender_id === this.targetUser && newMsg.receiver_id === this.currentUser.id)
          ) {
            this.messages = [...this.messages, newMsg];
            setTimeout(() => this.scrollToBottom(), 50);
          }
        }
      )
      .subscribe((status) => {
        console.log('🔥訂閱狀態:', status);
      });
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
      console.error('❌ 載入訊息錯誤:', error);
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

    const { error } = await this.supabase
      .from('messages')
      .insert({
        sender_id: this.currentUser.id,
        receiver_id: this.targetUser,
        content: this.newMessage
      });

    if (error) {
      console.error('❌ 發送訊息錯誤:', error);
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

  // 🔥 離開頁面取消訂閱（避免卡頓/重複）
  ngOnDestroy() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
    }
  }
}