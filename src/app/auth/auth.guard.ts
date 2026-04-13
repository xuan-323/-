import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

/**
 * 認證路由守衛
 * 用於保護需要登入的路由
 * 在允許訪問路由之前檢查用戶是否已登入
 */
export const authGuard: CanMatchFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  try {
    // 🔐 檢查目前 session
    const session = await supabase.getSessionOnce();

    // ✅ 有有效的 session → 放行
    if (session) {
      console.log('[AuthGuard] ✅ User is authenticated');
      return true;
    }

    // ❌ 沒有 session → 導向登入頁
    console.log('[AuthGuard] ❌ User is not authenticated, redirecting to login');
    return router.createUrlTree(['/auth/login']);
  } catch (error) {
    console.error('[AuthGuard] ⚠️ Authentication check error:', error);
    return router.createUrlTree(['/auth/login']);
  }
};
