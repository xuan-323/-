import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

// =============================
// 餐廳型別
// =============================
type Restaurant = {
  name: string;
  image: string;
  tags: string[];
  distance: number; // km
  lat?: number;
  lng?: number;
};

@Component({
  standalone: true,
  selector: 'app-solo-result',
  imports: [CommonModule],
  templateUrl: './solo-result.html',
  styleUrls: ['./solo-result.css'],
})
export class SoloResultComponent implements OnInit {

  constructor(private router: Router) {}

  // 🔐 Supabase client
  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  // 後端回來的餐廳
  restaurants: Restaurant[] = [];

  // 選中的卡片 index
  selectedIndex: number | null = null;

  // 使用者選的標籤
  selectedTag: string | null = null;

  // =============================
  // 初始化
  // =============================
  ngOnInit(): void {
    // 從前一頁接收標籤
    this.selectedTag = history.state?.tag ?? null;

    // 呼叫後端
    this.fetchRestaurantsFromBackend();
  }

  // =============================
  // 呼叫 Supabase Edge Function
  // =============================
  async fetchRestaurantsFromBackend() {
    try {
      // 1️⃣ 取得 session
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) {
        console.error('❌ 使用者尚未登入');
        return;
      }

      // 2️⃣ 取得定位
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // 3️⃣ 呼叫 Edge Function
      const res = await fetch(
        `${environment.supabaseUrl}/functions/v1/google-restaurants`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            lat,
            lng,
            tag: this.selectedTag,
            mode: 'solo'
          })
        }
      );

      if (!res.ok) {
        console.error('❌ 後端錯誤', await res.text());
        return;
      }

      // 4️⃣ 保險處理：單筆 / 多筆都能顯示
      const data = await res.json();
      console.log('✅ 後端回來的資料:', data);

      this.restaurants = Array.isArray(data) ? data : [data];

    } catch (err) {
      console.error('❌ 取得餐廳失敗', err);
    }
  }

  // =============================
  // UI 行為
  // =============================
  selectCard(index: number) {
    this.selectedIndex = index;
  }

  // 🔄 換一換 → 重新打後端
  shuffle() {
    this.selectedIndex = null;
    this.fetchRestaurantsFromBackend();
  }

  finish() {
    if (this.selectedIndex === null) {
      return;
    }

    const restaurant = this.restaurants[this.selectedIndex];

    this.router.navigate(['/auth/solo-finish'], {
      state: { restaurant }
    });
  }
}
