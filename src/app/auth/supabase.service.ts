import { Injectable } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  Session,
  User,
  AuthChangeEvent,
} from '@supabase/supabase-js';
import { environment } from '../environments/environment';

/**
 * Supabase 認證與資料服務
 * 負責所有與 Supabase 後端的通信
 * 提供認證、用戶資訊和即時訂閱功能
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {

  private readonly supabase: SupabaseClient;
  private authStateSubscription: any = null;

  constructor() {
    this.supabase = this.initializeSupabase();
  }

  // ═══════════════════════════════════════════════════════════
  // 🔧 初始化方法
  // ═══════════════════════════════════════════════════════════

  /**
   * 初始化 Supabase 客戶端實例
   * @private
   * @returns Supabase 客戶端
   */
  private initializeSupabase(): SupabaseClient {
    return createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  // ═══════════════════════════════════════════════════════════
  // 🔐 認證相關方法
  // ═══════════════════════════════════════════════════════════

  /**
   * 使用 email 和密碼登入
   * @param email 用戶 email
   * @param password 用戶密碼
   * @returns Promise 包含用戶和 session 資訊
   * @throws 登入失敗時返回錯誤物件
   */
  async login(email: string, password: string) {
    try {
      const result = await this.supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (result.error) {
        console.error('[Supabase] Login error:', result.error.message);
      }

      return result;
    } catch (error) {
      console.error('[Supabase] Login exception:', error);
      throw error;
    }
  }

  /**
   * 註冊新用戶
   * @param email 用戶 email
   * @param password 用戶密碼
   * @returns Promise 包含新建用戶資訊
   */
  async signup(email: string, password: string) {
    try {
      const result = await this.supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (result.error) {
        console.error('[Supabase] Signup error:', result.error.message);
      }

      return result;
    } catch (error) {
      console.error('[Supabase] Signup exception:', error);
      throw error;
    }
  }

  /**
   * 發送密碼重設郵件
   * @param email 用戶 email
   * @returns Promise
   */
  async resetPassword(email: string) {
    try {
      const result = await this.supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: this.getResetPasswordRedirectUrl(),
        }
      );

      if (result.error) {
        console.error('[Supabase] Reset password error:', result.error.message);
      }

      return result;
    } catch (error) {
      console.error('[Supabase] Reset password exception:', error);
      throw error;
    }
  }

  /**
   * 更新用戶密碼（用於密碼重設流程）
   * @param password 新密碼
   * @returns Promise
   */
  async updatePassword(password: string) {
    try {
      const result = await this.supabase.auth.updateUser({ password });

      if (result.error) {
        console.error('[Supabase] Update password error:', result.error.message);
      }

      return result;
    } catch (error) {
      console.error('[Supabase] Update password exception:', error);
      throw error;
    }
  }

  /**
   * 用戶登出
   * @returns Promise
   */
  async logout() {
    try {
      const result = await this.supabase.auth.signOut();

      if (result.error) {
        console.error('[Supabase] Logout error:', result.error.message);
      }

      return result;
    } catch (error) {
      console.error('[Supabase] Logout exception:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 👤 用戶資訊方法
  // ═══════════════════════════════════════════════════════════

  /**
   * 取得目前登入的用戶
   * ⚠️ 每次呼叫都會向伺服器查詢
   * @returns 目前用戶或 null
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error) {
        console.error('[Supabase] Get current user error:', error.message);
        return null;
      }

      return data.user;
    } catch (error) {
      console.error('[Supabase] Get current user exception:', error);
      return null;
    }
  }

  /**
   * 取得目前 Session（一次性查詢）
   * 用於 AuthGuard 驗證登入狀態
   * @returns Session 或 null
   */
  async getSessionOnce(): Promise<Session | null> {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('[Supabase] Get session error:', error.message);
        return null;
      }

      return data.session;
    } catch (error) {
      console.error('[Supabase] Get session exception:', error);
      return null;
    }
  }

  /**
   * 訂閱認證狀態變化
   * 用於監聽登入/登出事件
   * @param callback 狀態改變時的回調函數
   * @returns 訂閱物件，可用於取消訂閱
   */
  onAuthStateChange(callback: (session: Session | null) => void) {
    try {
      const { data } = this.supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, session: Session | null) => {
          console.log(`[Supabase] Auth state changed: ${event}`);
          callback(session);
        }
      );

      if (data?.subscription) {
        this.authStateSubscription = data;
      }

      return data.subscription;
    } catch (error) {
      console.error('[Supabase] Auth state subscription error:', error);
      return null;
    }
  }

  /**
   * 取消認證狀態訂閱
   */
  unsubscribeAuthStateChange() {
    if (this.authStateSubscription?.subscription) {
      this.authStateSubscription.subscription.unsubscribe();
      this.authStateSubscription = null;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🧠 輔助方法（Private）
  // ═══════════════════════════════════════════════════════════

  /**
   * 根據環境取得重設密碼的重新導向 URL
   * @private
   * @returns 完整的重新導向 URL
   */
  private getResetPasswordRedirectUrl(): string {
    const baseUrl = environment.production
      ? environment.productionUrl
      : 'http://localhost:4200';

    return `${baseUrl}/auth/update-password`;
  }
}
