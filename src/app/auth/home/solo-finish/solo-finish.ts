import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type HistoryItem = {
  type: 'solo';
  restaurant: any;
  rating: number;
  comment: string;
  time: string;
};

@Component({
  standalone: true,
  selector: 'app-solo-finish',
  imports: [CommonModule, FormsModule],
  templateUrl: './solo-finish.html',
  styleUrls: ['./solo-finish.css'],
})
export class SoloFinishComponent {

  restaurant: any = null;

  // ⭐ 回饋狀態
  showFeedback = false;
  rating = 0;
  comment = '';

  constructor(private router: Router) {
    this.restaurant = history.state?.restaurant ?? null;
  }

  goBack() {
    this.router.navigate(['/auth/preference']);
  }

  openMap() {
    if (!this.restaurant?.name) return;

    const query = encodeURIComponent(this.restaurant.name);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  }

  // ========================
  // ⭐ 回饋功能
  // ========================

  openFeedback() {
    this.showFeedback = true;
    this.rating = 0;
    this.comment = '';
  }

  closeFeedback() {
    this.showFeedback = false;
  }

  setRating(n: number) {
    this.rating = n;
  }

  submitFeedback() {
    if (this.rating <= 0) return;

    const payload: HistoryItem = {
      type: 'solo',
      restaurant: this.restaurant,
      rating: this.rating,
      comment: this.comment.trim(),
      time: new Date().toISOString(),
    };

    const raw = localStorage.getItem('history');
    const list: HistoryItem[] = raw ? JSON.parse(raw) : [];
    list.unshift(payload);

    localStorage.setItem('history', JSON.stringify(list));

    this.showFeedback = false;
    this.router.navigate(['/home']);
  }
}
