-- 📊 Supabase 数据库初始化脚本
-- 运行这些 SQL 命令在你的 Supabase 数据库中

-- ===== 0️⃣ Restaurants 表 =====
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

-- ===== 1️⃣ Profiles 表 =====
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

-- ===== 2️⃣ Dining Requests 表 =====
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

-- 📌 关键索引（加速查询在线用户）
CREATE INDEX idx_dining_requests_online 
  ON dining_requests(restaurant_id, last_active, dining_type)
  WHERE dining_type = 'match';

-- ===== 3️⃣ Likes 表 =====
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can create own likes" ON likes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== 4️⃣ Matches 表 =====
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

-- ===== 5️⃣ Messages 表 =====
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

-- 📌 关键索引（加速聊天查询）
CREATE INDEX idx_messages_conversation 
  ON messages(sender_id, receiver_id, created_at);

-- ===== 📡 启用 Realtime 监听 =====
ALTER PUBLICATION supabase_realtime ADD TABLE dining_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;

-- ✅ 验证表创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'dining_requests', 'likes', 'matches', 'messages');
