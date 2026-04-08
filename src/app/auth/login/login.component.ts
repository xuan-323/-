import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

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

  // ⭐ 直接用 supabase client（不動你原本 service）
  supabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

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

    // ⭐ 取得登入後 user
    const { data } = await this.supabaseClient.auth.getUser();
    const user = data.user;

    if (!user) {
      this.router.navigate(['/welcome']);
      return;
    }

    // ⭐ 檢查是否填過資料
    const { data: profile } = await this.supabaseClient
      .from('profiles')
      .select('mbti, zodiac, gender')
      .eq('id', user.id)
      .maybeSingle();

    // ⭐ 存一個 flag（給 welcome 用）
    if (!profile?.mbti || !profile?.zodiac || !profile?.gender) {
      localStorage.setItem('need_profile', 'true');
    } else {
      localStorage.setItem('need_profile', 'false');
    }

    // ✅ 原本流程不動
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