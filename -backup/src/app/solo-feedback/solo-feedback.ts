import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type HistorySoloItem = {
  type: 'solo';
  restaurant: any;
  rating: number;
  comment: string;
  time: string;
};

@Component({
  standalone: true,
  selector: 'app-solo-feedback',
  imports: [CommonModule, FormsModule],
  templateUrl: './solo-feedback.html',
  styleUrls: ['./solo-feedback.css']
})
export class SoloFeedbackComponent implements OnInit {

  restaurant: any = { name: '今天的餐廳' };
  rating = 0;
  comment = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    const stateRestaurant = history.state?.restaurant;
    const savedRestaurant = localStorage.getItem('solo_current_restaurant');

    this.restaurant = stateRestaurant ?? (savedRestaurant ? JSON.parse(savedRestaurant) : this.restaurant);
  }

  setRating(n: number): void {
    this.rating = n;
  }

  submit(): void {
    if (this.rating === 0) return;

    const raw = localStorage.getItem('history');
    const list: HistorySoloItem[] = raw ? JSON.parse(raw) : [];

    const item: HistorySoloItem = {
      type: 'solo',
      restaurant: this.restaurant,
      rating: this.rating,
      comment: this.comment.trim(),
      time: new Date().toISOString()
    };

    list.unshift(item);
    localStorage.setItem('history', JSON.stringify(list));

    localStorage.removeItem('solo_current_restaurant');

    this.router.navigate(['/auth/solo-thanks']);
  }
}
