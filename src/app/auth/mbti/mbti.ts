import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-mbti',
  imports: [CommonModule],
  templateUrl: './mbti.html',
  styleUrls: ['./mbti.css'],
})
export class MbtiComponent {

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

  save() {
    if (!this.selectedMbti || !this.selectedZodiac || !this.selectedGender) return;

    // ✅ 暫存（下一步再改 Supabase）
    localStorage.setItem('mbti', this.selectedMbti);
    localStorage.setItem('zodiac', this.selectedZodiac);
    localStorage.setItem('gender', this.selectedGender);

    console.log('MBTI:', this.selectedMbti);
    console.log('星座:', this.selectedZodiac);
    console.log('性別:', this.selectedGender);

    this.router.navigate(['/home']);
  }
}
