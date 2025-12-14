import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {

  email = '';
  password = '';
  showPassword = false;
  isLoading = false;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  // 👁️ 切換密碼顯示
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // 🔐 登入
  async handleLogin(): Promise<void> {
    if (!this.email || !this.password) {
      alert('請輸入 Email 與密碼');
      return;
    }

    this.isLoading = true;

    const { error } = await this.supabase.login(
      this.email,
      this.password
    );

    this.isLoading = false;

    if (error) {
      alert(error.message);
      return;
    }

    // ✅ 登入成功 → 先到 Welcome 頁
    this.router.navigate(['/welcome']);
  }

  // 🔁 忘記密碼
  async forgotPassword(): Promise<void> {
    if (!this.email) {
      alert('請先輸入 Email');
      return;
    }

    const { error } = await this.supabase.resetPassword(this.email);

    if (error) {
      alert(error.message);
      return;
    }

    alert('已寄送重設密碼信件，請檢查信箱');
  }

  // 👉 前往註冊頁
  navigateToRegister(): void {
    this.router.navigate(['/auth/signup']);
  }
}
