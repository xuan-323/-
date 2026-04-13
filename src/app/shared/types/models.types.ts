/**
 * 應用共用類型定義
 */

/**
 * 標準响應結構
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分頁响應
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 用戶個人資料
 */
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  mbti?: string;
  zodiac?: string;
  gender?: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 配對信息
 */
export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

/**
 * 餐廳信息
 */
export interface Restaurant {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  cuisine: string;
  rating?: number;
  image?: string;
  createdAt: string;
}

/**
 * 聊天訊息
 */
export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 用餐請求
 */
export interface DiningRequest {
  id: string;
  creatorId: string;
  restaurantId: string;
  location: string;
  time: string;
  status: 'open' | 'closed' | 'completed';
  createdAt: string;
}

/**
 * 按讚紀錄
 */
export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  likedAt: string;
}
