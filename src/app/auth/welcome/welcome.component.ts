import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.component.html',
})
export class WelcomeComponent implements OnInit {

  username = '朋友';

  constructor(
    private router: Router,
    private supabase: SupabaseService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (user?.email) {
        this.username = user.email.split('@')[0];
      }

      const mbti = localStorage.getItem('mbti');

      if (!mbti) {
        this.router.navigate(['/mbti']);
        return;
      }

    } catch (error) {
      console.error('[WelcomeComponent] 取得使用者失敗', error);
      this.username = '朋友';
    }
  }

  startUsing(): void {
    const mbti = localStorage.getItem('mbti');

    if (!mbti) {
      this.router.navigate(['/mbti']);
      return;
    }

    this.router.navigate(['/home']);
  }
}
