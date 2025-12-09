// src/app/profile/profile.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 建立表單群組，設定名稱和 Bio 的驗證規則
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      bio: ['', [Validators.maxLength(250)]]
    });

    // 載入預設資料（模擬從後端獲取）
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    // 這裡應呼叫 AuthService 獲取當前用戶資料，並填充表單
    this.profileForm.patchValue({
        name: '用戶預設名稱',
        bio: '這是一段用戶個人簡介。'
    });
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.errorMessage = '請檢查輸入欄位是否有效。';
      return;
    }

    this.isLoading = true;
    const { name, bio } = this.profileForm.value;

    try {
      // 呼叫 AuthService 中的更新方法 (步驟 5)
      await this.authService.updateProfile(name, bio);
      this.successMessage = '個人檔案更新成功！';
    } catch (error: any) {
      this.errorMessage = error.message || '更新失敗，請稍後再試。';
    } finally {
      this.isLoading = false;
    }
  }
}
