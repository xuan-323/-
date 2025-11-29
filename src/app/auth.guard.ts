// src/app/auth-guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth/auth.service'; // << 確保路徑是正確的

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 檢查是否已登入
  if (authService.isAuthenticated()) {
    return true; // 允許進入 /home 頁面
  } 
  
  // 如果未登入，導航到 /auth/login 並阻止訪問
  router.navigate(['/auth/login']);
  return false;
};