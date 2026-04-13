/**
 * 認證相關的類型定義
 */

import { Session, User } from '@supabase/supabase-js';

/**
 * 登入請求
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 登入响應
 */
export interface LoginResponse {
  user: User | null;
  session: Session | null;
}

/**
 * 註冊請求
 */
export interface SignupRequest {
  email: string;
  password: string;
}

/**
 * 註冊响應
 */
export interface SignupResponse {
  message: string;
  data: {
    user: User | null;
    session: Session | null;
  };
}

/**
 * 密碼重設請求
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * 密碼重設响應
 */
export interface PasswordResetResponse {
  message: string;
}

/**
 * 密碼更新請求
 */
export interface PasswordUpdateRequest {
  password: string;
}

/**
 * 密碼更新响應
 */
export interface PasswordUpdateResponse {
  message: string;
  data: {
    user: User;
  };
}

/**
 * 認證錯誤信息
 */
export interface AuthError {
  code: string;
  message: string;
}

/**
 * 認證狀態
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
}
