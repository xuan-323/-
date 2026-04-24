import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  login(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  resetPassword(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:4200/reset-password',
    });
  }
  // 🔐 給 Auth Guard 使用：只抓一次目前 session
async getSessionOnce(): Promise<Session | null> {
  const { data, error } = await this.supabase.auth.getSession();

  if (error) {
    console.error('[Supabase] getSessionOnce error:', error.message);
    return null;}
  
  return data.session;
}

async getCurrentUser() {
  const { data } = await this.supabase.auth.getUser();
  return data.user;
}}
