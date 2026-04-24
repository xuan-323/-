import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type HistoryFriendItem = {
  type: 'friend';
  friend: any;
  restaurant: any;
  rating: number;
  comment: string;
  time: string;
  chat?: any[];
};

@Component({
  standalone: true,
  selector: 'app-friend-feedback',
  imports: [CommonModule, FormsModule],
  templateUrl: './friend-feedback.html',
  styleUrls: ['./friend-feedback.css']
})
export class FriendFeedbackComponent implements OnInit {

  friend: any = null;
  restaurant: any = null;
  matchId: any = null;

  rating = 0;
  comment = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    const nav = history.state;

    this.friend =
      nav?.friend ??
      JSON.parse(localStorage.getItem('friend_feedback_friend') || 'null');

    this.restaurant =
      nav?.restaurant ??
      JSON.parse(localStorage.getItem('friend_feedback_restaurant') || 'null');

    this.matchId = nav?.matchId ?? null;
  }

  setRating(n: number): void {
    this.rating = n;
  }

  submit(): void {
    if (this.rating === 0) return;

    const raw = localStorage.getItem('history_friend');
    const list: HistoryFriendItem[] = raw ? JSON.parse(raw) : [];

    const item: HistoryFriendItem = {
      type: 'friend',
      friend: this.friend,
      restaurant: this.restaurant,
      rating: this.rating,
      comment: this.comment.trim(),
      time: new Date().toISOString(),
      chat: []
    };

    list.unshift(item);
    localStorage.setItem('history_friend', JSON.stringify(list));

    localStorage.removeItem('friend_feedback_friend');
    localStorage.removeItem('friend_feedback_restaurant');

    this.router.navigate(['/friend/thanks']);
  }
}
