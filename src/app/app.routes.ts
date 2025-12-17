import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  // 預設導到登入
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // ===== Auth =====
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./auth/login/login.component')
        .then(m => m.LoginComponent),
  },

  {
    path: 'auth/signup',
    loadComponent: () =>
      import('./auth/signup/signup.component')
        .then(m => m.SignupComponent),
  },

  {
    path: 'auth/update-password',
    loadComponent: () =>
      import('./auth/update-password/update-password.component')
        .then(m => m.UpdatePasswordComponent),
  },

  // ===== Welcome（登入後第一頁，❌ 不要 Guard）=====
  {
    path: 'welcome',
    loadComponent: () =>
      import('./auth/welcome/welcome.component')
        .then(m => m.WelcomeComponent),
  },

 // ===== Preference（偏好 / 自己吃）=====
{
  path: 'auth/preference',
  loadComponent: () =>
    import('./auth/preference/preference')
      .then(m => m.PreferenceComponent),
},


  // ===== Home（需要登入）=====
  {
  path: 'home',
  loadComponent: () =>
    import('./auth/home/home.component')
      .then(m => m.HomeComponent),
}
,

  // ===== Profile（需要登入）=====
  {
    path: 'profile',
    loadComponent: () =>
      import('./auth/profile/profile.component')
        .then(m => m.ProfileComponent),
    canMatch: [authGuard],
  },

  // ===== 404 =====
  { path: '**', redirectTo: 'auth/login' },
];
