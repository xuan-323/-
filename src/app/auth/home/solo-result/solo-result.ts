import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type Restaurant = {
  name: string;
  image: string;
  tags: string[];
  distance: number; // km
};

@Component({
  standalone: true,
  selector: 'app-solo-result',
  imports: [CommonModule],
  templateUrl: './solo-result.html',
  styleUrls: ['./solo-result.css'],
})
export class SoloResultComponent {

  constructor(private router: Router) {}

  // ✅ 假資料（UI 用）
  restaurants: Restaurant[] = [
    {
      name: '日式拉麵店',
      image: 'https://picsum.photos/400/260?1',
      tags: ['日式', '拉麵'],
      distance: 0.6
    },
    {
      name: '義式小餐館',
      image: 'https://picsum.photos/400/260?2',
      tags: ['義式', '麵食'],
      distance: 1.2
    },
    {
      name: '麻辣火鍋',
      image: 'https://picsum.photos/400/260?3',
      tags: ['火鍋', '辣'],
      distance: 0.8
    },
  ];

  // 選中的卡片 index
  selectedIndex: number | null = null;

  selectCard(i: number) {
    this.selectedIndex = i;
  }

  shuffle() {
    this.selectedIndex = null;
    this.restaurants = [...this.restaurants].sort(() => Math.random() - 0.5);
  }

  finish() {
    if (this.selectedIndex === null) {
      console.warn('尚未選擇餐廳');
      return;
    }

    const restaurant = this.restaurants[this.selectedIndex];

    // 🔍 除錯用（確定一定有資料）
    console.log('準備送出的 restaurant:', restaurant);

    this.router.navigate(['/auth/solo-finish'], {
      state: { restaurant }
    });
  }
}
