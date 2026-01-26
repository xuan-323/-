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

  selectedMbti: string | null = null;

  constructor(private router: Router) {}

  selectMbti(mbti: string) {
    this.selectedMbti = mbti;
  }

  save() {
    if (!this.selectedMbti) return;

    // ✅ 暫存 MBTI（之後換 Supabase）
    localStorage.setItem('mbti', this.selectedMbti);

    // 👉 填完才可以進 Home
    this.router.navigate(['/home']);
  }
}
