-- ============================================
-- 🚀 完整的 Supabase 資料庫設置腳本
-- 複製全部內容到 Supabase SQL Editor 執行
-- ============================================

-- ⚠️ 步驟 1: 清理舊表 (如果存在)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS dining_requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- ============================================
-- 步驟 2: 建立 Restaurants 表
-- ============================================
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  image TEXT,
  tags TEXT,
  distance TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view restaurants" ON restaurants FOR SELECT USING (true);

-- ============================================
-- 步驟 3: 建立 Profiles 表
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  mbti TEXT,
  gender TEXT,
  zodiac TEXT,
  intro TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 步驟 4: 建立 Dining Requests 表
-- ============================================
CREATE TABLE dining_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  dining_type TEXT CHECK (dining_type IN ('solo', 'match')) NOT NULL,
  status TEXT DEFAULT 'active',
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id, dining_type)
);

ALTER TABLE dining_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view requests in same restaurant" ON dining_requests 
  FOR SELECT USING (true);
CREATE POLICY "Users can create own request" ON dining_requests 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own request" ON dining_requests 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own request" ON dining_requests 
  FOR DELETE USING (auth.uid() = user_id);

-- 📌 關鍵索引
CREATE INDEX idx_dining_requests_restaurant 
  ON dining_requests(restaurant_id, dining_type);
CREATE INDEX idx_dining_requests_user 
  ON dining_requests(user_id, dining_type);
CREATE INDEX idx_dining_requests_online 
  ON dining_requests(restaurant_id, last_active, dining_type)
  WHERE dining_type = 'match';

-- ============================================
-- 步驟 5: 建立 Likes 表
-- ============================================
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can create own likes" ON likes 
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE INDEX idx_likes_from_user ON likes(from_user_id);
CREATE INDEX idx_likes_to_user ON likes(to_user_id);

-- ============================================
-- 步驟 6: 建立 Matches 表
-- ============================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('matched', 'archived')) DEFAULT 'matched',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_a_id, user_b_id)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their matches" ON matches FOR SELECT 
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);
CREATE POLICY "System can create matches" ON matches FOR INSERT WITH CHECK (true);

CREATE INDEX idx_matches_user_a ON matches(user_a_id);
CREATE INDEX idx_matches_user_b ON matches(user_b_id);

-- ============================================
-- 步驟 7: 建立 Messages 表
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their messages" ON messages FOR SELECT 
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );
CREATE POLICY "Users can send messages" ON messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- 📌 關鍵索引
CREATE INDEX idx_messages_conversation 
  ON messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);

-- ============================================
-- 步驟 8: 啟用 Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE restaurants;
ALTER PUBLICATION supabase_realtime ADD TABLE dining_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- ============================================
-- ✅ 驗證: 所有表已建立
-- ============================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'dining_requests', 'likes', 'matches', 'messages', 'restaurants')
ORDER BY table_name;
