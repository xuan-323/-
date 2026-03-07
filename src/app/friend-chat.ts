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

  messages: any [] = []
  newMessage = ''

  userId:any
  matchId:any
  friend:any

  typing = false

  @ViewChild('chatBox') chatBox?: ElementRef

  async ngOnInit(){

const {data:{user}} = await this.supabase.auth.getUser()

this.userId = user?.id

this.matchId = history.state.matchId
this.friend = history.state.friend

console.log("matchId:", this.matchId)

await this.loadMessages()

this.listenMessages()

}

  async loadMessages(){

    const { data,error } = await this.supabase
    .from('chat_messages')
    .select('*')
    .eq('match_id',this.matchId)
    .order('created_at')

    if(error){
      console.error("讀取聊天錯誤",error)
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
      match_id:this.matchId,
      sender_id:this.userId,
      message:this.newMessage
    })

    if(error){
      console.error("送訊息錯誤",error)
      return
    }

    this.newMessage=''

  }

  listenMessages(){

    this.supabase
    .channel('chat-room')
    .on(
      'postgres_changes',
      {
        event:'INSERT',
        schema:'public',
        table:'chat_messages'
      },
      payload=>{

        const msg:any = payload.new

        if(msg.match_id===this.matchId){

          this.messages.push(msg)

          this.scrollBottom()

        }

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

  onTyping(){

    this.typing=true

    setTimeout(()=>{
      this.typing=false
    },2000)

  }

}