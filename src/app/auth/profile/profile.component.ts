import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {

  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  username = '';
  gender: 'male' | 'female' | 'secret' = 'secret';
  bio = '';

  avatarUrl = 'https://api.dicebear.com/9.x/adventurer/svg?seed=Lai';

  avatarOptions = [
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Lai',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Kai',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Foodie',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Apple',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Milk',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Cookie'
  ];

  coverUrl = 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?q=80&w=1200&auto=format&fit=crop';

  coverOptions = [
    'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop'
  ];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadProfile();
  }

  async loadProfile() {
    const { data: { user }, error: userError } =
      await this.supabase.auth.getUser();

    if (userError || !user) {
      console.error('尚未登入或取得使用者失敗：', userError);
      return;
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select('username, gender, bio, avatar_url, cover_url')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('讀取個人資料失敗：', error);
      return;
    }

    if (data) {
      this.username = data.username || '';
      this.gender = (data.gender || 'secret') as 'male' | 'female' | 'secret';
      this.bio = data.bio || '';
      this.avatarUrl = data.avatar_url || this.avatarUrl;
      this.coverUrl = data.cover_url || this.coverUrl;
      this.cdr.detectChanges();
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  selectAvatar(url: string) {
    this.avatarUrl = url;
    this.cdr.detectChanges();
  }

  selectCover(url: string) {
    this.coverUrl = url;
    this.cdr.detectChanges();
  }

  async saveProfile() {
    const { data: { user }, error: userError } =
      await this.supabase.auth.getUser();

    if (userError || !user) {
      alert('請先登入');
      console.error('取得使用者失敗：', userError);
      return;
    }

    const { error } = await this.supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        username: this.username,
        gender: this.gender,
        bio: this.bio,
        avatar_url: this.avatarUrl,
        cover_url: this.coverUrl,
        updated_at: new Date().toISOString()
      });

    if (error) {
      alert('儲存失敗，請看 Console');
      console.error('儲存個人資料失敗：', error);
      return;
    }

    alert('個人資料已儲存');
    this.router.navigate(['/home']);
  }
}
