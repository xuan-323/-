import { Component, OnInit } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-mbti',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mbti.html',
  styleUrls: ['./mbti.css']
})
export class MbtiComponent implements OnInit {

  supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  constructor(private router: Router) {}

  // =============================
  // ⭐ 選項
  // =============================
  mbtis: string[] = [
    'INTJ','INTP','ENTJ','ENTP',
    'INFJ','INFP','ENFJ','ENFP',
    'ISTJ','ISFJ','ESTJ','ESFJ',
    'ISTP','ISFP','ESTP','ESFP'
  ];

  zodiacOptions: string[] = [
    '牡羊座','金牛座','雙子座','巨蟹座',
    '獅子座','處女座','天秤座','天蠍座',
    '射手座','摩羯座','水瓶座','雙魚座'
  ];

  genderOptions: string[] = [
    '男','女','其他','不公開'
  ];

  // =============================
  // ⭐ 使用者選擇
  // =============================
  selectedMbti: string = '';
  selectedZodiac: string = '';
  selectedGender: string = '';

  currentUser: any;

  // =============================
  // ⭐ 初始化（升級版🔥）
  // =============================
  async ngOnInit() {

    const { data, error } = await this.supabase.auth.getUser();

    if (error || !data.user) {
      console.error('❌ 取得使用者失敗', error);
      return;
    }

    this.currentUser = data.user;

    // ⭐ 先檢查是否已填過（關鍵🔥）
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('mbti, zodiac, gender')
      .eq('id', this.currentUser.id)
      .maybeSingle();

    // ⭐ 如果已填過 → 直接跳過這頁
    if (profile?.mbti && profile?.zodiac && profile?.gender) {
      this.router.navigate(['/home']);
      return;
    }

    // ⭐ 沒填才做回填（避免覆蓋空值）
    if (profile) {
      this.selectedMbti = profile.mbti || '';
      this.selectedZodiac = profile.zodiac || '';
      this.selectedGender = profile.gender || '';
    }
  }

  // =============================
  // ⭐ 選擇事件
  // =============================
  selectMbti(m: string) {
    this.selectedMbti = m;
  }

  selectZodiac(z: string) {
    this.selectedZodiac = z;
  }

  selectGender(g: string) {
    this.selectedGender = g;
  }

  // =============================
  // ⭐ 儲存資料
  // =============================
  async saveProfile() {

    if (!this.selectedMbti || !this.selectedZodiac || !this.selectedGender) {
      alert('請完整選擇所有項目');
      return;
    }

    const { error } = await this.supabase
      .from('profiles')
      .upsert({
        id: this.currentUser.id,
        mbti: this.selectedMbti,
        zodiac: this.selectedZodiac,
        gender: this.selectedGender,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ 儲存失敗', error);
      alert('儲存失敗');
      return;
    }

    alert('✅ 已儲存');

    // ⭐ 導頁
    this.router.navigate(['/home']);
  }
}