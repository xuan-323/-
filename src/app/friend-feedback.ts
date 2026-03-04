import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

type FriendHistoryItem = {
  type: 'friend';
  friend: any;
  restaurant: any;
  rating: number;
  comment: string;
  chat: { from: 'me' | 'friend'; text: string; time: string }[];
  time: string;
};

@Component({
  standalone: true,
  selector: 'app-friend-feedback',
  imports: [CommonModule, FormsModule],
  templateUrl: './friend-feedback.html',
  styleUrls: ['./friend-feedback.css'],
})
export class FriendFeedbackComponent implements OnInit {

  friend: any = { name: '飯友', mbti: '????' };
  restaurant: any = { name: '今天的餐廳' };

  rating = 0;
  comment = '';

  constructor(private router: Router) {}

  ngOnInit(): void {

    // 重新抓 state，避免 undefined
    if (history.state?.friend) {
      this.friend = history.state.friend;
    }

    if (history.state?.restaurant) {
      this.restaurant = history.state.restaurant;
    }

    console.log("friend:", this.friend);
    console.log("restaurant:", this.restaurant);
  }

  setRating(v: number) {
    this.rating = v;
  }

  get chatKey(): string {
    return `friend_chat_${this.friend.name}`;
  }

  get historyKey(): string {
    return `history_friend`;
  }

  get pendingFeedbackKey(): string {
    return `friend_pending_feedback_${this.friend.name}`;
  }

  submit() {
    alert("submit triggered");
    console.log("submit clicked");

    if (this.rating === 0) return;

    const chatRaw = localStorage.getItem(this.chatKey);
    const chat = chatRaw ? JSON.parse(chatRaw) : [];

    const item: FriendHistoryItem = {
      type: 'friend',
      friend: this.friend,
      restaurant: this.restaurant,
      rating: this.rating,
      comment: this.comment.trim(),
      chat: Array.isArray(chat) ? chat : [],
      time: new Date().toISOString(),
    };

    const raw = localStorage.getItem(this.historyKey);
    const list: FriendHistoryItem[] = raw ? JSON.parse(raw) : [];

    list.unshift(item);

    localStorage.setItem(this.historyKey, JSON.stringify(list));

    console.log("history saved:", list);

    localStorage.removeItem(this.chatKey);
    localStorage.removeItem(this.pendingFeedbackKey);

    this.router.navigate(['/home']);
  }

  skip() {
    localStorage.removeItem(this.pendingFeedbackKey);
    this.router.navigate(['/home']);
  }
}
