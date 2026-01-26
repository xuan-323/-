import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

type Restaurant = {
  name: string;
  image: string;
  tags: string[];
  distance: number;
  lat?: number;
  lng?: number;
};

@Component({
  selector: 'app-friend-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend-result.html',
  styleUrls: ['./friend-result.css'],
})
export class FriendResultComponent implements OnInit {

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  // 🔹 後端回來的所有候選餐廳
  allRestaurants: Restaurant[] = [];

  // 🔹 目前顯示的那一間
  restaurant: Restaurant | null = null;

  // 🔹 目前索引
  currentIndex = 0;

  // 是否已選中
  selected = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.fetchRestaurants();
  }

  // =============================
  // 從後端抓「多間」餐廳
  // =============================
  async fetchRestaurants() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) {
        console.error('❌ 尚未登入');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const res = await fetch(
        `${environment.supabaseUrl}/functions/v1/google-restaurants`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ lat, lng, mode: 'friend' }),
        }
      );

      if (!res.ok) {
        console.error('❌ 後端錯誤', await res.text());
        return;
      }

      this.allRestaurants = await res.json();

      // 預設顯示第一間
      this.currentIndex = 0;
      this.restaurant = this.allRestaurants[0] ?? null;

      console.log('✅ Friend 候選餐廳：', this.allRestaurants);

    } catch (err) {
      console.error('❌ 取得餐廳失敗', err);
    }
  }

  // 點卡片 → 選中
  selectCard() {
    this.selected = true;
  }

  // 🔄 換一換（前端切換，不打 API）
  shuffle() {
    if (this.allRestaurants.length === 0) return;

    this.currentIndex =
      (this.currentIndex + 1) % this.allRestaurants.length;

    this.restaurant = this.allRestaurants[this.currentIndex];
    this.selected = false;
  }

  // 確定 → 進配對
  confirm() {
    if (!this.selected || !this.restaurant) return;

    this.router.navigate(['/friend/matching'], {
      state: { restaurant: this.restaurant }
    });
  }
}
