import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [FormsModule, CommonModule],
  // 必須確保這兩個檔案存在且名稱完全相同
  templateUrl: './update-password.component.html', 
  styleUrls: ['./update-password.component.css']
})
export class UpdatePasswordComponent implements OnInit {
  newPassword = '';
  confirmPassword = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {}

  async onUpdatePassword() {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = '兩次輸入的密碼不一致！';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = '密碼長度必須至少為 6 個字元。';
      return;
    }

    this.isLoading = true;

    try {
      await this.authService.updatePassword(this.newPassword); 
      
      this.successMessage = '密碼更新成功！正在導航至登入頁面...';

      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 3000);

    } catch (error: any) {
      this.errorMessage = error.message || '密碼更新失敗，請確保連結有效。';
      console.error('密碼更新失敗:', error);
    } finally {
      this.isLoading = false;
    }
  }
}