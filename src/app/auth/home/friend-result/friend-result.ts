console.log('🔥 confirm 有被點擊');
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

type Restaurant = {
  id?: string;
  name: string;
  image: string;
  tags: string[];
  distance: number;
  lat?: number;
  lng?: number;
};

@Component({
  standalone: true,
  selector: 'app-friend-result',
  imports: [CommonModule],
  templateUrl: './friend-result.html',
  styleUrls: ['./friend-result.css'],
})
export class FriendResultComponent implements OnInit {
  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  allRestaurants: Restaurant[] = [];
  restaurant: Restaurant | null = null;
  currentIndex = 0;
  selected = false;
  selectedTag: string | null = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.selectedTag = history.state?.tag ?? null;
    this.fetchRestaurants();
  }

  private calcDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  async fetchRestaurants() {
    try {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();

      if (!session) {
        console.error('❌ 沒有 session');
        alert('請先登入');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );

      const res = await fetch(
        `${environment.supabaseUrl}/functions/v1/google-restaurants`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            tag: this.selectedTag,
            mode: 'friend',
          }),
        }
      );

      const data = await res.json();

      this.allRestaurants = Array.isArray(data)
        ? data.map((r: any) => ({
            ...r,
            distance:
              r.lat && r.lng
                ? Number(
                    this.calcDistanceKm(
                      position.coords.latitude,
                      position.coords.longitude,
                      r.lat,
                      r.lng
                    ).toFixed(1)
                  )
                : 0,
          }))
        : [];

      this.restaurant = this.allRestaurants[0] || {
        name: '附近熱門餐廳',
        image: 'https://picsum.photos/400/260?fallback',
        tags: ['推薦'],
        distance: 0.5,
      };

      this.selected = false;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('❌ 取得餐廳失敗', err);
      alert('取得餐廳失敗');
    }
  }

  selectCard() {
    this.selected = true;
  }

  shuffle() {
    if (!this.allRestaurants.length) return;

    this.currentIndex = (this.currentIndex + 1) % this.allRestaurants.length;
    this.restaurant = this.allRestaurants[this.currentIndex];
    this.selected = false;
    this.cdr.detectChanges();
  }

  async confirm() {
    console.log('🔥 confirm 有被點擊');
console.log('🔥 selected =', this.selected, 'restaurant =', this.restaurant);
    if (!this.restaurant) {
      alert('目前沒有餐廳資料');
      return;
    }

    if (!this.selected) {
      alert('請先點選餐廳卡片');
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();

      if (userError || !user) {
        console.error('❌ 取得使用者失敗:', userError);
        alert('使用者未登入');
        return;
      }

      console.log('🟢 confirm 被觸發');
      console.log('🟢 目前登入 user.id =', user.id);
      console.log('🟢 目前登入 email =', user.email);
      console.log('🟢 餐廳 =', this.restaurant.name);

      // 1. 建立或取得餐廳
      const { data: restaurantData, error: restaurantError } = await this.supabase
        .from('restaurants')
        .upsert(
          { name: this.restaurant.name },
          { onConflict: 'name' }
        )
        .select()
        .single();

      if (restaurantError || !restaurantData) {
        console.error('❌ 餐廳寫入失敗:', restaurantError);
        alert('餐廳寫入失敗');
        return;
      }

      console.log('✅ 餐廳資訊:', restaurantData);

      // 2. 清掉自己舊的 match 配對請求
      const { error: deleteError } = await this.supabase
        .from('dining_requests')
        .delete()
        .eq('user_id', user.id)
        .eq('dining_type', 'match');

      if (deleteError) {
        console.error('❌ 清除舊配對請求失敗:', deleteError);
        alert('清除舊配對請求失敗');
        return;
      }

      console.log('🧹 已清除之前的配對請求');

      // 3. 寫入新的配對池
      const payload = {
        user_id: user.id,
        restaurant_id: restaurantData.id ?? null,
        restaurant_name: this.restaurant.name,
        dining_type: 'match',
        status: 'active',
        last_active: new Date().toISOString(),
      };

      console.log('🔥 要寫入 dining_requests:', payload);

      const { data: insertData, error: insertError } = await this.supabase
        .from('dining_requests')
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        console.error('❌ 寫入配對池失敗:', insertError);
        alert('寫入配對池失敗');
        return;
      }

      console.log('✅ 已加入配對池:', insertData);
      alert('已成功加入配對池');

      // 4. 整理要傳去 matching 的餐廳資料
      const restaurantForMatching: Restaurant = {
        id: restaurantData.id,
        name: this.restaurant.name,
        image: this.restaurant.image,
        tags: this.restaurant.tags,
        distance: this.restaurant.distance,
        lat: this.restaurant.lat,
        lng: this.restaurant.lng,
      };

      // 5. 存本地，避免刷新 matching 頁拿不到
      localStorage.setItem(
        'friend_current_restaurant',
        JSON.stringify(restaurantForMatching)
      );

      // 6. 跳轉到 matching 頁
      this.router.navigate(['/friend/matching'], {
        state: {
          restaurant: restaurantForMatching,
        },
      });
    } catch (err) {
      console.error('❌ confirm 系統錯誤:', err);
      alert('confirm 系統錯誤');
    }
  }
}
