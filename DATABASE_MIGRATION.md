# 🔧 資料庫修復指南

## ❌ 發現的問題

1. **缺少 `restaurants` 表** - 代碼中調用但未在SQL中定義
2. **dining_requests.restaurant_id 類型錯誤** - 原本是TEXT，應該是UUID (外鍵)
3. **profiles表缺少字段** - 缺少 `mbti`, `gender`, `zodiac`, `intro`

## ✅ 解決方案

### 第一步：清理舊表 (如果存在)

在 Supabase SQL Editor 中執行：

```sql
-- ⚠️ 警告：這會刪除所有數據！
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS dining_requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
```

### 第二步：執行新的 DATABASE_SETUP.sql

1. 打開 Supabase Dashboard
2. 進入 **SQL Editor** → **New Query**
3. 複製 `DATABASE_SETUP.sql` 中的全部內容
4. 貼到SQL編輯器
5. 點擊 **Run** 執行

### 第三步：驗證表創建成功

在SQL Editor執行：

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'dining_requests', 'likes', 'matches', 'messages', 'restaurants');
```

**應出現6個表：**
- ✅ profiles
- ✅ dining_requests
- ✅ likes
- ✅ matches
- ✅ messages
- ✅ restaurants

### 第四步：創建測試餐廳

```sql
INSERT INTO restaurants (name, image, tags, distance) VALUES
('石安牧場', 'https://example.com/image1.jpg', '烤肉,牧場', '1.5km'),
('米其林A餐廳', 'https://example.com/image2.jpg', '法餐,精緻', '2km'),
('米其林B餐廳', 'https://example.com/image3.jpg', '日料,壽司', '1.8km');
```

### 第五步：創建測試用戶

在 **Supabase Authentication** 中創建至少2個測試帳號

然後在 Supabase 執行，將用戶ID替換為實際ID：

```sql
INSERT INTO profiles (id, username, mbti, gender, zodiac, avatar_url, intro) VALUES
('用戶A的UUID', 'TestUserA', 'INFP', 'M', 'leo', 'https://example.com/a.jpg', '我喜歡烤肉'),
('用戶B的UUID', 'TestUserB', 'ENFJ', 'F', 'virgo', 'https://example.com/b.jpg', '美食愛好者');
```

### 第六步：啟用 Realtime

在SQL Editor執行：

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE restaurants;
ALTER PUBLICATION supabase_realtime ADD TABLE dining_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
```

## 🧪 測試清單

完成後，重新啟動開發伺服器：

```bash
npm run build
ng serve -o
```

### 測試Issue #1：餐廳篩選

- [ ] 用戶A選擇"石安牧場"進入配對頁面
- [ ] 用戶B選擇"米其林A餐廳"進入配對頁面
- [ ] 用戶A應該看到**空候選名單**（不能看到B）
- [ ] 改變用戶B改選"石安牧場"
- [ ] 用戶A應該能看到用戶B

### 測試Issue #2：聊天導向

- [ ] 兩用戶選擇同一家餐廳
- [ ] 都應看到彼此的卡片
- [ ] 點擊"一起吃 🍜" → **直接進入聊天頁面**（不是登入頁）
- [ ] 應能發送和接收訊息

## 🐛 除錯技巧

**查看瀏覽器Console：**
- 搜尋 `🔍 查詢候選人` - 檢查 `restaurantId` 是否正確
- 搜尋 `💾 保存到 localStorage` - 檢查friend數據是否完整
- 搜尋 `❌` - 查看任何錯誤訊息

**查看Supabase操作日誌：**
進入 Supabase Dashboard → Database → Query Performance 檢查是否有錯誤查詢

## 📋 表結構摘要

### restaurants
```
id (UUID) - 主鍵
name (TEXT) - 唯一
image, tags, distance (TEXT)
created_at (TIMESTAMP)
```

### dining_requests  
```
id (UUID) - 主鍵
user_id (UUID) - 外鍵 → profiles
restaurant_id (UUID) - 外鍵 → restaurants ⭐ 已修復
dining_type ('match'/'solo')
status ('active')
last_active (TIMESTAMP)
UNIQUE(user_id, restaurant_id, dining_type)
```

### profiles
```
id (UUID) - 外鍵 → auth.users
username (TEXT) - 唯一
mbti, gender, zodiac, intro, avatar_url (TEXT)
updated_at (TIMESTAMP)
```

其他表結構保持不變。

---

**❓有問題？檢查：**
1. 所有6個表是否已創建？
2. dining_requests.restaurant_id 是否是UUID類型？
3. profiles是否包含mbti, gender, zodiac字段？
4. Realtime是否已在這些表上啟用？
