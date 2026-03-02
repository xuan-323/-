import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // ===== Auth =====
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

  // ===== Welcome =====
  {
    path: 'welcome',
    loadComponent: () =>
      import('./auth/welcome/welcome.component')
        .then(m => m.WelcomeComponent),
  },

  // ===== MBTI =====
  {
    path: 'mbti',
    loadComponent: () =>
      import('./auth/mbti/mbti')
        .then(m => m.MbtiComponent),
    canMatch: [authGuard],
  },

  // ===== Preference =====
  {
    path: 'auth/preference',
    loadComponent: () =>
      import('./auth/preference/preference')
        .then(m => m.PreferenceComponent),
    canMatch: [authGuard],
  },

  // ===== 自己吃 =====
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

  // ===== 找飯友 =====
  {
    path: 'friend/result',
    loadComponent: () =>
      import('./auth/home/friend-result/friend-result')
        .then(m => m.FriendResultComponent),
  },
  {
    path: 'friend/matching',
    loadComponent: () =>
      import('./auth/home/friend-matching/friend-matching')
        .then(m => m.FriendMatchingComponent),
  },

  // ✅ 聊天頁
  {
    path: 'friend/chat',
    loadComponent: () =>
      import('./friend-chat')
        .then(m => m.FriendChatComponent),
  },

  // ✅ 回饋頁
  {
    path: 'friend/feedback',
    loadComponent: () =>
      import('./friend-feedback')
        .then(m => m.FriendFeedbackComponent),
  },

  // ===== Home =====
  {
    path: 'home',
    loadComponent: () =>
      import('./auth/home/home.component')
        .then(m => m.HomeComponent),
    canMatch: [authGuard],
  },

  // ===== Profile =====
  {
    path: 'profile',
    loadComponent: () =>
      import('./auth/profile/profile.component')
        .then(m => m.ProfileComponent),
    canMatch: [authGuard],
  },

  { path: '**', redirectTo: 'auth/login' },
];
