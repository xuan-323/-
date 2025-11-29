// src/app/auth/auth.service.ts (請確保這是檔案的唯一內容)
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ========== 請在這裡替換成您自己的資訊！ ==========
const SUPABASE_URL = 'https://hamijkpsjaxltifhrppw.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_LataTu72rxsmn883jnvjgw_af3rtxRt';
// ===============================================

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  // 核心登入功能
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
    
    return data; 
  }

// 檢查登入狀態的方法
isAuthenticated(): boolean {
  const storedSession = localStorage.getItem('supabase.auth.token');
  return !!storedSession; 
}

// ============== 新增：登出功能 ==============
async signOut() {
  // 呼叫 Supabase 提供的登出 API
  const { error } = await this.supabase.auth.signOut();

  if (error) {
    // 雖然登出失敗機率低，但我們仍然印出錯誤訊息
    console.error('Supabase 登出失敗:', error);
    // 這裡不需要拋出錯誤，讓程式繼續清除本地狀態
  }
}
// // ============== 新增：註冊功能 ==============
async signUp(email: string, password: string) {
  // 呼叫 Supabase 提供的註冊 API
  const { data, error } = await this.supabase.auth.signUp({
    email,
    password,
  });

  // 註冊成功後，Supabase 通常會發送一個確認信到使用者的信箱。
  // 我們不需要 data，只需要檢查是否有 error。
  if (error) {
    throw new Error(error.message);
  }

  // 這裡可以選擇返回 data 或一個成功的訊息
  return { message: '註冊成功！請檢查您的信箱以確認您的帳號。' };
}
// ===========================================

// ... (isAuthenticated 方法之後)

} // 確保這個 } 是 AuthService 類別的結束

