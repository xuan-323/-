import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../supabase.service';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.component.html',
})
export class WelcomeComponent implements OnInit {

  username = '朋友';

  // ⭐ 新增：直接查資料庫用
  supabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  constructor(
    private router: Router,
    private supabase: SupabaseService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const user = await this.supabase.getCurrentUser();

      if (!user) {
        this.router.navigate(['/auth/login']);
        return;
      }

      // ⭐ 顯示名稱
      if (user.email) {
        this.username = user.email.split('@')[0];
      }

      // ⭐ 改：從資料庫檢查（重點🔥）
      const { data: profile } = await this.supabaseClient
        .from('profiles')
        .select('mbti, zodiac, gender')
        .eq('id', user.id)
        .maybeSingle();

      // ⭐ 如果沒填 → 導去 mbti
      if (!profile?.mbti || !profile?.zodiac || !profile?.gender) {
        this.router.navigate(['/mbti']);
        return;
      }

    } catch (error) {
      console.error('[WelcomeComponent] 取得使用者失敗', error);
      this.username = '朋友';
    }
  }

  // 👉 開始使用
  async startUsing(): Promise<void> {

    const user = await this.supabase.getCurrentUser();

    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // ⭐ 再檢查一次（雙保險🔥）
    const { data: profile } = await this.supabaseClient
      .from('profiles')
      .select('mbti, zodiac, gender')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.mbti || !profile?.zodiac || !profile?.gender) {
      this.router.navigate(['/mbti']);
      return;
    }

    this.router.navigate(['/home']);
  }
}