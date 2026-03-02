import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-friend-feedback',
  imports: [CommonModule, FormsModule],
  templateUrl: './friend-feedback.html',
  styleUrls: ['./friend-feedback.css'],
})
export class FriendFeedbackComponent implements OnInit {
  friend = history.state?.friend ?? { name: '飯友', mbti: '????' };
  restaurant = history.state?.restaurant ?? { name: '今天的餐廳' };

  rating = 0;          // 1~5
  comment = '';        // 可空

  get pendingFeedbackKey() {
    return `friend_pending_feedback_${this.friend?.name ?? 'unknown'}`;
  }
  get feedbackKey() {
    return `friend_feedback_${this.friend?.name ?? 'unknown'}_${this.restaurant?.name ?? 'restaurant'}`;
  }

  constructor(private router: Router) {}

  ngOnInit(): void {
    // 若已經評過，載入（可選）
    const raw = localStorage.getItem(this.feedbackKey);
    if (raw) {
      const data = JSON.parse(raw);
      this.rating = data.rating ?? 0;
      this.comment = data.comment ?? '';
    }
  }

  setRating(v: number) {
    this.rating = v;
  }

  submit() {
    if (this.rating === 0) return; // 必須至少給星

    localStorage.setItem(this.feedbackKey, JSON.stringify({
      friend: this.friend,
      restaurant: this.restaurant,
      rating: this.rating,
      comment: this.comment.trim(),
      createdAt: new Date().toISOString(),
    }));

    // ✅ 回饋完成：清掉「待回饋」旗標，避免下次又被導到回饋頁
    localStorage.removeItem(this.pendingFeedbackKey);

    // 你想回 home 或顯示完成頁都行
    this.router.navigate(['/home']);
  }

  skip() {
    // 你如果要「不回饋也能跳過」：就清旗標並回 home
    localStorage.removeItem(this.pendingFeedbackKey);
    this.router.navigate(['/home']);
  }
}
