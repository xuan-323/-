import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

/**
 * Auth Guard
 * - 只保護「需要登入」的頁面（home / profile）
 * - 不保護 welcome（避免登入後第一跳被擋）
 */
export const authGuard: CanMatchFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  try {
    // 🔐 只檢查一次目前 session
    const session = await supabase.getSessionOnce();

    // ✅ 有 session → 放行
    if (session) {
      return true;
    }

    // ❌ 沒 session → 導回登入頁
    return router.createUrlTree(['/auth/login']);
  } catch (error) {
    console.error('[AuthGuard] 發生錯誤', error);
    return router.createUrlTree(['/auth/login']);
  }
};
