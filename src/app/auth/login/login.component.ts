//src\app\auth\login\login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { AuthService } from '../auth.service'; 

@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [
    CommonModule,         
    ReactiveFormsModule,  
    RouterModule,         
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'], 
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false; 
  errorMessage: string | null = null; 
  
  showResetForm = false; 
  resetMessage: string | null = null;
  
  showLoginFailPrompt: boolean = false; 

  constructor(
    private fb: FormBuilder,
    private authService: AuthService, 
    private router: Router 
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { return this.loginForm.controls; }

  // 處理表單提交 (登入) - 修正 this 引用和超時問題
  async onSubmit(): Promise<void> { 
    this.errorMessage = null; 
    this.showLoginFailPrompt = false; 

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); 
      return;
    }

    this.isLoading = true; 
    const { email, password } = this.loginForm.value;

    let success = false;
    let errorCaught: any = null; 
    
    // 關鍵修正：將 'this' 存入區域變數，防止 setTimeout 內部捕獲錯誤
    const component = this; 

    // 設置一個 5 秒超時的強制防呆機制
    const timeoutId = setTimeout(function() { 
        if (!success && component.isLoading) {
            component.errorMessage = '登入請求超時，請檢查網路連線。';
            component.showLoginFailPrompt = true; 
            component.isLoading = false; 
        }
    }, 5000); 

    try {
      await this.authService.signIn(email, password); 
      
      success = true; 
      this.errorMessage = null; 
      await this.router.navigate(['/home']); 

    } catch (error) {
      errorCaught = error; 
      
      // 登入失敗時，主動清除密碼欄位的值
      this.loginForm.get('password')?.setValue('');
      
    } finally {
      clearTimeout(timeoutId); 
      
      if (!success && errorCaught) {
          console.error('登入失敗:', errorCaught);
          this.errorMessage = (errorCaught as Error).message || '登入失敗，請檢查信箱和密碼。';
          this.showLoginFailPrompt = true; 
      }
      
      this.isLoading = false; 
    }
  }

  // 處理忘記密碼流程
  async onForgotPassword(): Promise<void> {
    const email = this.loginForm.get('email')?.value;
    
    if (!email || this.loginForm.get('email')?.invalid) {
      this.resetMessage = '請先輸入有效的電子郵件地址！';
      return;
    }

    this.isLoading = true;
    this.resetMessage = null;

    try {
      await this.authService.resetPasswordForEmail(email); 
      this.resetMessage = `密碼重設郵件已發送至 ${email}，請檢查您的收件箱。`;
      this.showResetForm = false; 
    } catch (error) {
      this.resetMessage = '若該郵件存在，密碼重設郵件已發送。';
    } finally {
      this.isLoading = false;
    }
  }

  // 輔助方法：切換重設表單
  toggleResetForm() {
    this.showResetForm = !this.showResetForm;
    this.errorMessage = null; 
  }
}