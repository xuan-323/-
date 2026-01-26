import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-solo-finish',
  imports: [CommonModule],
  templateUrl: './solo-finish.html',
  styleUrls: ['./solo-finish.css'],
})
export class SoloFinishComponent {

  // 👉 完成頁要顯示的餐廳
  restaurant: any = null;

  constructor(private router: Router) {
    // ✅ 正確接 solo-result finish() 傳來的 restaurant
    this.restaurant = history.state?.restaurant ?? null;

    // 🔍 除錯（現在一定看得到）
    console.log('完成頁收到 restaurant：', this.restaurant);
  }

  // 🔙 回到偏好頁
  goBack() {
    this.router.navigate(['/auth/preference']);
  }

  // 📍 打開 Google Maps
  openMap() {
    if (!this.restaurant?.name) return;

    const query = encodeURIComponent(this.restaurant.name);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  }
}
