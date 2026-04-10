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

  private calcDistanceKm(lat1:number,lng1:number,lat2:number,lng2:number):number{
    const R=6371; const toRad=(v:number)=>(v*Math.PI)/180;
    const dLat=toRad(lat2-lat1); const dLng=toRad(lng2-lng1);
    const a=Math.sin(dLat/2)**2+
      Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return R*(2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
  }

  async fetchRestaurants() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) return;

      const position = await new Promise<GeolocationPosition>((res,rej)=>
        navigator.geolocation.getCurrentPosition(res,rej)
      );

      const res = await fetch(`${environment.supabaseUrl}/functions/v1/google-restaurants`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${session.access_token}`,
        },
        body:JSON.stringify({
          lat:position.coords.latitude,
          lng:position.coords.longitude,
          tag:this.selectedTag,
          mode:'friend',
        }),
      });

      const data = await res.json();

      this.allRestaurants = Array.isArray(data)
        ? data.map((r:any)=>({
            ...r,
            distance:r.lat&&r.lng
              ? Number(this.calcDistanceKm(
                  position.coords.latitude,
                  position.coords.longitude,
                  r.lat,r.lng).toFixed(1))
              : 0,
          }))
        : [];

      this.restaurant = this.allRestaurants[0] || {
        name:'附近熱門餐廳',
        image:'https://picsum.photos/400/260?fallback',
        tags:['推薦'],
        distance:0.5,
      };

      this.selected = false;
      this.cdr.detectChanges();

    } catch(err){
      console.error('取得餐廳失敗',err);
    }
  }

  selectCard(){ this.selected=true; }

  shuffle(){
    if (!this.allRestaurants.length) return;
    this.currentIndex=(this.currentIndex+1)%this.allRestaurants.length;
    this.restaurant=this.allRestaurants[this.currentIndex];
    this.selected=false;
    this.cdr.detectChanges();
  }

  async confirm() {

    if (!this.selected || !this.restaurant) return;

    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) return;

      const user = session.user;

      // ⭐ 建立或取得餐廳
      const { data: restaurantData } = await this.supabase
        .from('restaurants')
        .upsert(
          { name: this.restaurant.name },
          { onConflict: 'name' }
        )
        .select()
        .single();

      console.log('✅ 餐廳資訊:', restaurantData);

      // ⭐ 寫入配對池
      await this.supabase
        .from('dining_requests')
        .upsert(
          {
            user_id: user.id,
            restaurant_id: restaurantData.id,
            dining_type: 'match',
            status: 'active'
          },
          { onConflict: 'user_id' }
        );

      // 📌 傳遞完整的餐廳和 ID 信息到配對頁面
      this.router.navigate(['/friend/matching'], {
        state: {
          restaurant: {
            id: restaurantData.id,
            name: this.restaurant.name,
            image: this.restaurant.image,
            tags: this.restaurant.tags,
            distance: this.restaurant.distance,
            lat: this.restaurant.lat,
            lng: this.restaurant.lng
          }
        }
      });

    } catch (err) {
      console.error('系統錯誤:', err);
    }
  }
}