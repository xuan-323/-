import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment'; // 🔥 正確路徑

@Component({
  standalone: true,
  selector: 'app-mbti',
  imports: [CommonModule],
  templateUrl: './mbti.html',
  styleUrls: ['./mbti.css'],
})
export class MbtiComponent {

  // ===== Supabase =====
  supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  // ===== 選項 =====
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

  selectedMbti: string | null = null;
  selectedZodiac: string | null = null;
  selectedGender: string | null = null;

  constructor(private router: Router) {}

  selectMbti(mbti: string) {
    this.selectedMbti = mbti;
  }

  selectZodiac(zodiac: string) {
    this.selectedZodiac = zodiac;
  }

  selectGender(gender: string) {
    this.selectedGender = gender;
  }

  async save() {
    if (!this.selectedMbti || !this.selectedZodiac || !this.selectedGender) return;

    try {
      const {
        data: { user }
      } = await this.supabase.auth.getUser();

      if (!user) {
        alert('請先登入');
        return;
      }

      const { error } = await this.supabase
        .from('profiles')
        .upsert({
          id: user.id,
          mbti: this.selectedMbti,
          zodiac: this.selectedZodiac,
          gender: this.selectedGender
        });

      if (error) {
        console.error(error);
        alert('儲存失敗');
        return;
      }

      console.log('儲存成功');

      this.router.navigate(['/home']);

    } catch (err) {
      console.error(err);
      alert('系統錯誤');
    }
  }
}