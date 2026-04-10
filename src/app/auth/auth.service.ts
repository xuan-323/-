import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }
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
// ...

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
}