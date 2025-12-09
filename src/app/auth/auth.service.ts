import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hamijkpsjaxltifhrppw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LataTu72rxsmn883jnvjgw_af3rtxRt';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  // 1. 核心登入功能
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 確保 Supabase 的錯誤物件被正確轉換為 JavaScript Error
      throw new Error(error.message);
    }

    return data;
  }

  // 2. 註冊功能
  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message);
    }
    return { message: '註冊成功！請檢查您的信箱以確認您的帳號。' };
  }

  // 3. 登出功能
  async signOut() {
    await this.supabase.auth.signOut();
  }

  // 4. 發送密碼重設郵件
  async resetPasswordForEmail(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      throw new Error('無法發送密碼重設郵件。');
    }
  }

  // 5. 更新密碼 (用於密碼重設流程)
  async updatePassword(password: string) {
    const { data, error } = await this.supabase.auth.updateUser({ password });
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  // 6. 檢查登入狀態的方法 (供 Guard 使用)
  isAuthenticated(): boolean {
    const storedSession = localStorage.getItem('supabase.auth.token');
    return !!storedSession;
  }

  // 7. 新增：更新用戶名稱和 Bio 的方法 (用於個人檔案設定頁面)
  async updateProfile(name: string, bio: string): Promise<any> {
    // 這裡應呼叫您的 Supabase 或後端 API 來儲存 Name 和 Bio
    console.log(`[AuthService] 正在更新個人檔案: ${name}, ${bio}`);

    // 模擬 Supabase API 調用和潛在的錯誤處理 (您可以替換為真正的 Supabase 'profiles' 表更新邏輯)
    if (name.toLowerCase().includes('fail')) {
        throw new Error('名稱中含有禁用詞，更新失敗。');
    }

    // 模擬成功返回
    return { success: true };
  }
}
