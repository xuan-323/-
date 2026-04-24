import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  standalone: true,
  selector: 'app-solo-result',
  imports: [CommonModule],
  templateUrl: './solo-result.html',
  styleUrls: ['./solo-result.css'],
})
export class SoloResultComponent implements OnInit {
  private supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

  restaurants: Restaurant[] = [];
  selectedIndex = 0;
  errorMessage: string | null = null;
  isLoading = false;
  selectedTag: string | null = null; // ✅ 儲存標籤名稱

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // ✅ 從上一頁的 router state 取得 tag
    this.selectedTag = history.state?.tag ?? null;
    this.fetchRestaurants();
  }

  async fetchRestaurants() {
    this.isLoading = true;
    this.errorMessage = null;
    this.restaurants = [];

    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) {
        this.errorMessage = '請先登入。';
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 0
        })
      );

      const res = await fetch(`${environment.supabaseUrl}/functions/v1/google-restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          tag: this.selectedTag, // ✅ 傳送標籤給後端
          mode: 'solo'
        }),
      });

      if (!res.ok) throw new Error('伺服器回應錯誤');

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        this.restaurants = data;
        this.selectedIndex = 0;
      } else {
        this.errorMessage = `附近找不到關於「${this.selectedTag || '推薦'}」的餐廳 😢`;
      }

    } catch (err: any) {
      console.error('❌ 抓取失敗：', err);
      this.errorMessage = '無法取得資料，請檢查定位權限或 API 設定。';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  selectCard(i: number) { this.selectedIndex = i; }

  shuffle() {
    if (this.restaurants.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.restaurants.length;
    this.cdr.detectChanges();
  }

  finish() {
    if (this.restaurants.length === 0) return;
    const restaurant = this.restaurants[this.selectedIndex];
    this.router.navigate(['/auth/solo-finish'], { state: { restaurant } });
  }
}