import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // 登入頁面
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },

  // 註冊頁面
  {
    path: 'auth/signup',
    loadComponent: () => import('./auth/signup/signup.component').then(m => m.SignupComponent)
  },

  // 密碼更新頁面
  {
    path: 'auth/update-password',
    loadComponent: () => import('./auth/update-password/update-password.component').then(m => m.UpdatePasswordComponent)
  },

  // 新增：個人檔案設定頁面
  {
    path: 'profile/settings',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },

  // 首頁 (主頁面)
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: 'auth/login' }
];
