import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

/**
 * 認證業務邏輯服務
 * 負責處理登入、註冊、登出等業務邏輯
 * 依賴 SupabaseService 進行後端通信
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private supabaseService: SupabaseService) {}

  // ═══════════════════════════════════════════════════════════
  // 🔐 認證相關方法
  // ═══════════════════════════════════════════════════════════

  /**
   * 用戶登入
   * @param email 用戶 email
   * @param password 用戶密碼
   * @returns Promise 包含用戶和 session 資訊
   * @throws 登入失敗時拋出錯誤
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabaseService.login(email, password);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('[AuthService] Sign in failed:', error);
      throw error;
    }
  }

  /**
   * 用戶註冊
   * @param email 用戶 email
   * @param password 用戶密碼
   * @returns Promise 成功訊息
   * @throws 註冊失敗時拋出錯誤
   */
  async signUp(email: string, password: string) {
    try {
      const { data, error } = await this.supabaseService.signup(email, password);

      if (error) {
        throw new Error(error.message);
      }

      return {
        message: '📧 註冊成功！請檢查您的信箱以確認帳號。',
        data,
      };
    } catch (error) {
      console.error('[AuthService] Sign up failed:', error);
      throw error;
    }
  }

  /**
   * 用戶登出
   * @returns Promise
   */
  async signOut() {
    try {
      await this.supabaseService.logout();
    } catch (error) {
      console.error('[AuthService] Sign out failed:', error);
      throw error;
    }
  }

  /**
   * 發送密碼重設郵件
   * @param email 用戶 email
   * @returns Promise
   * @throws 發送失敗時拋出錯誤
   */
  async sendPasswordResetEmail(email: string) {
    try {
      const { error } = await this.supabaseService.resetPassword(email);

      if (error) {
        throw new Error('❌ 無法發送密碼重設郵件。請檢查 email 是否正確。');
      }

      return { message: '✅ 密碼重設郵件已發送。請檢查您的信箱。' };
    } catch (error) {
      console.error('[AuthService] Send password reset email failed:', error);
      throw error;
    }
  }

  /**
   * 更新用戶密碼（用於密碼重設流程）
   * @param password 新密碼
   * @returns Promise
   * @throws 更新失敗時拋出錯誤
   */
  async updatePassword(password: string) {
    try {
      const { data, error } = await this.supabaseService.updatePassword(password);

      if (error) {
        throw new Error(error.message);
      }

      return {
        message: '✅ 密碼已成功更新！',
        data,
      };
    } catch (error) {
      console.error('[AuthService] Update password failed:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 👤 用戶狀態方法
  // ═══════════════════════════════════════════════════════════

  /**
   * 檢查用戶是否已登入（非同步版本，更可靠）
   * @returns 是否已登入
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.supabaseService.getSessionOnce();
      return !!session;
    } catch (error) {
      console.error('[AuthService] Authentication check failed:', error);
      return false;
    }
  }

  /**
   * 取得目前登入的用戶
   * @returns Promise 用戶物件或 null
   */
  async getCurrentUser() {
    try {
      return await this.supabaseService.getCurrentUser();
    } catch (error) {
      console.error('[AuthService] Get current user failed:', error);
      return null;
    }
  }

  /**
   * 訂閱認證狀態變化
   * 用於監聽登入/登出事件以更新 UI
   * @param callback 狀態改變時的回調函數
   * @returns 訂閱物件
   */
  onAuthStateChange(callback: (isAuthenticated: boolean) => void) {
    return this.supabaseService.onAuthStateChange((session) => {
      callback(!!session);
    });
  }

  /**
   * 取消認證狀態訂閱
   */
  unsubscribeAuthStateChange() {
    this.supabaseService.unsubscribeAuthStateChange();
  }
}
