import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

/**
 * 應用路由配置
 * 使用 Lazy Loading 優化性能
 * 使用 authGuard 保護需要認證的路由
 */
export const routes: Routes = [
  // ═══════════════════════════════════════════════════════════
  // 🏠 預設路由
  // ═══════════════════════════════════════════════════════════
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // ═══════════════════════════════════════════════════════════
  // 🔐 認證路由（不需要 authGuard）
  // ═══════════════════════════════════════════════════════════
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'auth/signup',
    loadComponent: () =>
      import('./auth/signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: 'auth/update-password',
    loadComponent: () =>
      import('./auth/update-password/update-password.component')
        .then(m => m.UpdatePasswordComponent),
  },

  // ═══════════════════════════════════════════════════════════
  // 📋 歡迎 & 問卷頁
  // ═══════════════════════════════════════════════════════════
  {
    path: 'welcome',
    loadComponent: () =>
      import('./auth/welcome/welcome.component')
        .then(m => m.WelcomeComponent),
    canMatch: [authGuard],
  },
  {
    path: 'mbti',
    loadComponent: () =>
      import('./auth/mbti/mbti')
        .then(m => m.MbtiComponent),
    canMatch: [authGuard],
  },
  {
    path: 'auth/preference',
    loadComponent: () =>
      import('./auth/preference/preference')
        .then(m => m.PreferenceComponent),
    canMatch: [authGuard],
  },

  // ═══════════════════════════════════════════════════════════
  // 🏠 主頁面
  // ═══════════════════════════════════════════════════════════
  {
    path: 'home',
    loadComponent: () =>
      import('./auth/home/home.component')
        .then(m => m.HomeComponent),
    canMatch: [authGuard],
  },

  // ═══════════════════════════════════════════════════════════
  // 👤 個人檔案
  // ═══════════════════════════════════════════════════════════
  {
    path: 'profile',
    loadComponent: () =>
      import('./auth/profile/profile.component')
        .then(m => m.ProfileComponent),
    canMatch: [authGuard],
  },

  // ═══════════════════════════════════════════════════════════
  // 🍽️ 自己吃流程
  // ═══════════════════════════════════════════════════════════
  {
    path: 'solo/result',
    loadComponent: () =>
      import('./auth/home/solo-result/solo-result')
        .then(m => m.SoloResultComponent),
    canMatch: [authGuard],
  },
  {
    path: 'auth/solo-finish',
    loadComponent: () =>
      import('./auth/home/solo-finish/solo-finish')
        .then(m => m.SoloFinishComponent),
    canMatch: [authGuard],
  },
  {
    path: 'auth/solo-feedback',
    loadComponent: () =>
      import('./solo-feedback/solo-feedback')
        .then(m => m.SoloFeedbackComponent),
    canMatch: [authGuard],
  },
  {
    path: 'auth/solo-thanks',
    loadComponent: () =>
      import('./solo-thanks/solo-thanks')
        .then(m => m.SoloThanksComponent),
    canMatch: [authGuard],
  },

  // ═══════════════════════════════════════════════════════════
  // 👥 找飯友流程
  // ═══════════════════════════════════════════════════════════
  {
    path: 'friend/result',
    loadComponent: () =>
      import('./auth/home/friend-result/friend-result')
        .then(m => m.FriendResultComponent),
    canMatch: [authGuard],
  },
  {
    path: 'friend/matching',
    loadComponent: () =>
      import('./auth/home/friend-matching/friend-matching')
        .then(m => m.FriendMatchingComponent),
    canMatch: [authGuard],
  },
  {
    path: 'friend/chat',
    loadComponent: () =>
      import('./friend-chat').then(m => m.FriendChatComponent),
    canMatch: [authGuard],
  },
  {
    path: 'friend/feedback',
    loadComponent: () =>
      import('./friend-feedback')
        .then(m => m.FriendFeedbackComponent),
    canMatch: [authGuard],
  },

  // ═══════════════════════════════════════════════════════════
  // 📚 歷史紀錄
  // ═══════════════════════════════════════════════════════════
  {
    path: 'history',
    loadComponent: () =>
      import('./auth/history/history')
        .then(m => m.HistoryComponent),
    canMatch: [authGuard],
  },

  // ═══════════════════════════════════════════════════════════
  // ❌ 404 - 必須是最後一個
  // ═══════════════════════════════════════════════════════════
  { path: '**', redirectTo: 'auth/login' },
];
