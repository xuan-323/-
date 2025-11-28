// src/app/auth/signup/signup.component.ts

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; 
import { Router, RouterLink } from '@angular/router'; 
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common'; // << 確保導入 CommonModule

@Component({
  selector: 'app-signup',
  standalone: true,
  // 修正：在 imports 中添加 CommonModule
  imports: [FormsModule, RouterLink, CommonModule], // << 關鍵修正
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css' // 現在檔案名稱匹配了
})
export class SignupComponent {
    // ... (其他程式碼不變)
  email = '';
  password = '';
  errorMessage = ''; // 用來顯示錯誤訊息
  successMessage = ''; // 用來顯示成功訊息

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSignUp() {
    this.errorMessage = ''; // 清除之前的錯誤
    this.successMessage = ''; // 清除之前的成功訊息
    
    try {
      // 呼叫 AuthService 中的註冊方法
      const result = await this.authService.signUp(this.email, this.password);
      
      // 如果註冊成功 (Supabase 會發送確認信)
      this.successMessage = result.message;

      // 可選擇：幾秒後導航到登入頁面
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000); 

    } catch (error: any) {
      // 顯示錯誤訊息 (例如：密碼太短、Email 格式錯誤)
      this.errorMessage = error.message;
      console.error('註冊失敗:', error);
    }
  }
}