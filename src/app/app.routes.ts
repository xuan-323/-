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
  {
  path: 'auth/solo-feedback',
  loadComponent: () =>
    import('./solo-feedback/solo-feedback')
      .then(m => m.SoloFeedbackComponent),
},
{
  path: 'auth/solo-thanks',
  loadComponent: () =>
    import('./solo-thanks/solo-thanks')
      .then(m => m.SoloThanksComponent),
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

  // ===== 聊天頁（已修正🔥）=====
  {
    path: 'friend/chat',
    loadComponent: () =>
      import('./friend-chat').then(m => m.FriendChatComponent),
  },

  // ===== 回饋頁 =====
  {
    path: 'friend/feedback',
    loadComponent: () =>
      import('./friend-feedback')
        .then(m => m.FriendFeedbackComponent),
  },

  // ===== 歷史紀錄 =====
  {
    path: 'history',
    loadComponent: () =>
      import('./auth/history/history')
        .then(m => m.HistoryComponent),
    canMatch: [authGuard],
  },

// ✅ 自己吃回饋
{
  path: 'auth/solo-feedback',
  loadComponent: () =>
    import('./solo-feedback/solo-feedback')
      .then(m => m.SoloFeedbackComponent),
},

// ✅ 結束頁
{
  path: 'auth/solo-thanks',
  loadComponent: () =>
    import('./solo-thanks/solo-thanks')
      .then(m => m.SoloThanksComponent),
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

  // ⚠️ 一定要最後
  { path: '**', redirectTo: 'auth/login' },
];
