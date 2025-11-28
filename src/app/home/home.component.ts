// src/app/home/home.component.ts

import { Component } from '@angular/core';
import { Router } from '@angular/router'; 
import { AuthService } from '../auth/auth.service'; // << 確保路徑是正確的

@Component({
  selector: 'app-home',
  standalone: true,
  // 如果有其他模組，例如 CommonModule，請在 imports 中加入
  imports: [], 
  template: `
    <div class="container">
      <h1>🎉 登入成功！歡迎來到主頁面</h1>
      <p>這是只有登入使用者才能看到的內容。</p>
      
      <button (click)="logout()">登出</button> 

      </div>
  `,
  styles: [`
    .container { padding: 20px; text-align: center; }
    button { 
      padding: 10px 20px; 
      font-size: 16px; 
      cursor: pointer; 
      margin-top: 20px;
      background-color: #f44336; /* 紅色 */
      color: white;
      border: none;
      border-radius: 5px;
    }
  `]
})
export class HomeComponent {

  // 注入 AuthService 和 Router
  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  // 登出方法
  async logout() {
    // 1. 呼叫 AuthService 中的登出方法，通知 Supabase 銷毀 Session
    await this.authService.signOut();
    
    // 2. 手動將使用者導航到登入頁面
    // 雖然 Guard 會阻止使用者停留在 /home，但手動導航提供更流暢的體驗。
    this.router.navigate(['/auth/login']);
  }
}