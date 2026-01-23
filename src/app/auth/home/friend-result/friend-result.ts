import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type Restaurant = {
  name: string;
  image: string;
  tags: string[];
  distance: number;
};

@Component({
  selector: 'app-friend-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend-result.html',
  styleUrls: ['./friend-result.css'],
})
export class FriendResultComponent {

  // 🔖 使用者選的標籤
  tag: string | null = null;

  // 🍽️ 假餐廳資料（之後接 Supabase）
  restaurant: Restaurant = {
    name: '麻辣火鍋',
    image: 'https://picsum.photos/500/300?friend',
    tags: ['火鍋', '聚餐'],
    distance: 0.8
  };

  // 👉 是否被選中（控制選中感）
  selected = false;

  constructor(private router: Router) {
    // ✅ 從 preference 頁接標籤
    this.tag = history.state?.tag ?? null;
  }

  // ① 點卡片 → 選中
  selectCard() {
    this.selected = true;
  }

  // ① 換一換（目前假動作）
  shuffle() {
    this.selected = false;
    alert('之後會換下一間餐廳（目前先假）');
  }

  // ② 確定 → 進入「匹配中頁」
  confirm() {
    if (!this.selected) return;

    this.router.navigate(['/friend/matching'], {
      state: {
        tag: this.tag,
        restaurant: this.restaurant
      }
    });
  }
}
