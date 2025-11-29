// src/app/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { CommonModule } from '@angular/common'; // << 確保基本指令可用
import { AuthService } from '../auth.service'; // << 導入我們寫好的連線服務

// src/app/auth/login/login.component.ts
@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  // 關鍵修正：將這裡的樣式路徑清空！
  styleUrls: [], // << 修正為空陣列
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false; 
  errorMessage: string | null = null; 

  // 注入服務
  constructor(
    private fb: FormBuilder,
    private authService: AuthService, 
    private router: Router 
  ) { }

  ngOnInit(): void {
    // 建立登入表單
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { return this.loginForm.controls; }

  // 處理表單提交
  async onSubmit(): Promise<void> { 
    this.errorMessage = null; 

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); 
      return;
    }

    this.isLoading = true; 
    const { email, password } = this.loginForm.value;

    try {
      await this.authService.signIn(email, password); 
      
      // 成功！導航到 /home
      await this.router.navigate(['/home']); 

    } catch (error) {
      console.error('登入失敗:', error);
      this.errorMessage = (error as Error).message || '登入失敗，請檢查信箱和密碼。';
    } finally {
      this.isLoading = false; 
    }
  }
}