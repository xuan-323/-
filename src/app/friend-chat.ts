import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createClient } from '@supabase/supabase-js';
import { environment } from './environments/environment';

@Component({
  standalone: true,
  selector: 'app-friend-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './friend-chat.html',
  styleUrls: ['./friend-chat.css']
})
export class FriendChatComponent implements OnInit {

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  messages: any[] = []
  newMessage = ''

  userId: any
  matchId: any

  friendName = '載入中...'
  friendAvatar = ''

  @ViewChild('chatBox') chatBox?: ElementRef

  async ngOnInit(){

    const { data:{ user } } = await this.supabase.auth.getUser()
    this.userId = user?.id

    this.matchId = history.state.matchId

    console.log("matchId:", this.matchId)

    if(!this.matchId){
      console.error("❌ matchId 不存在")
      return
    }

    // 🔥 先抓 match
    const { data: match } = await this.supabase
      .from('matches')
      .select('*')
      .eq('id', this.matchId)
      .single()

    if(!match){
      console.error("❌ 找不到 match")
      return
    }

    // 🔥 找對方ID
    const otherUserId =
      match.user_a_id === this.userId
        ? match.user_b_id
        : match.user_a_id

    // 🔥 抓對方 profile（關鍵🔥）
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', otherUserId)
      .single()

    if(profile){
      this.friendName = profile.username
      this.friendAvatar = profile.avatar_url
    }

    await this.loadMessages()
    this.listenMessages()
  }

  async loadMessages(){

    const { data,error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .eq('match_id', this.matchId)
      .order('created_at')

    if(error){
      console.error("讀取聊天錯誤", error)
      return
    }

    this.messages = data || []
    this.scrollBottom()
  }

  async sendMessage(){

    if(!this.newMessage.trim()) return

    const { error } = await this.supabase
      .from('chat_messages')
      .insert({
        match_id: this.matchId,
        sender_id: this.userId,
        message: this.newMessage
      })

    if(error){
      console.error("送訊息錯誤", error)
      return
    }

    this.newMessage = ''
  }

  listenMessages(){

    this.supabase
      .channel('chat-room')
      .on(
        'postgres_changes',
        {
          event:'INSERT',
          schema:'public',
          table:'chat_messages',
          filter:`match_id=eq.${this.matchId}` // 🔥 關鍵
        },
        payload => {

          const msg:any = payload.new

          this.messages.push(msg)
          this.scrollBottom()

        }
      )
      .subscribe()
  }

  scrollBottom(){

    setTimeout(()=>{

      if(!this.chatBox) return

      this.chatBox.nativeElement.scrollTop =
        this.chatBox.nativeElement.scrollHeight

    },100)
  }
}