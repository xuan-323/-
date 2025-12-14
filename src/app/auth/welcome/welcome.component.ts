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

  // 顯示在畫面上的使用者名稱
  username = '朋友';

  constructor(
    private router: Router,
    private supabase: SupabaseService
  ) {}

  /**
   * 頁面初始化時取得目前登入的使用者
   */
  async ngOnInit(): Promise<void> {
    try {
      const user = await this.supabase.getCurrentUser();

      // Supabase 預設一定有 email
      if (user?.email) {
        // 先用 email @ 前面當顯示名稱
        this.username = user.email.split('@')[0];
      }
    } catch (error) {
      console.error('[WelcomeComponent] 取得使用者失敗', error);
      this.username = '朋友';
    }
  }

  /**
   * 點擊「開始使用」
   */
  startUsing(): void {
    this.router.navigate(['/home']);
  }
}
