// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component'; 
import { authGuard } from './auth-guard'; 

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' }, 

  // 登入頁面：移除 .ts 副檔名
  { 
    path: 'auth/login', 
    // 【修正 1】移除 .ts
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) 
    //                                                   ^^^^^ <-- 這裡被移除了
  },

  // 註冊頁面路由：移除 .ts 副檔名
  { 
    path: 'auth/signup', 
    // 【修正 2】移除 .ts
    loadComponent: () => import('./auth/signup/signup.component').then(m => m.SignupComponent)
    //                                                       ^^^^^ <-- 這裡被移除了
  },

  // 首頁：保持不變
  { 
    path: 'home', 
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard] // 應用守衛
  },

  { path: '**', redirectTo: 'auth/login' }
];