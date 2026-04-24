# ⚡ 完整設置執行清單

> 按照這個清單一步步操作，大約需要 **10 分鐘**

---

## 📍 第一部分：資料庫設置 (在 Supabase 網站執行)

### ✅ 步驟1: 打開 Supabase 並進入 SQL Editor

1. 打開 https://supabase.com/dashboard/projects
2. 選擇你的專案 `hamijkpsjaxltifhrppw`
3. 左邊選單 → **SQL Editor**
4. 點擊 **New Query**

---

### ✅ 步驟2: 複製並執行完整SQL

1. 打開此檔案中的 `SUPABASE_SETUP_EXECUTE.sql`
2. **複製全部內容** (Ctrl+A, Ctrl+C)
3. 貼到 Supabase SQL Editor (Ctrl+V)
4. 點擊藍色 **Run** 按鈕

**等待完成...** ⏳ 應該看到：
```
Execution completed successfully
6 rows returned
```

### ✅ 步驟3: 驗證表已建立

在SQL Editor再執行一次這個驗證查詢：

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**應該看到這6個表：**
- ✅ dining_requests
- ✅ likes
- ✅ matches
- ✅ messages
- ✅ profiles
- ✅ restaurants

---

## 📍 第二部分：創建測試數據

### ✅ 步驟4: 創建餐廳

在SQL Editor執行：

```sql
INSERT INTO restaurants (name, image, tags, distance) VALUES
('石安牧場', 'https://via.placeholder.com/300?text=restaurant1', '烤肉,牧場', '1.5km'),
('米其林A餐廳', 'https://via.placeholder.com/300?text=restaurant2', '法餐,精緻', '2.0km'),
('米其林B餐廳', 'https://via.placeholder.com/300?text=restaurant3', '日料,壽司', '1.8km');
```

**檢查**: 應該看到 `3 rows affected`

---

### ✅ 步驟5: 創建2個測試用戶 (在 Authentication 中)

1. Supabase Dashboard → **Authentication** → **Users**
2. 點擊 **Add user**
3. 建立第一個用戶：
   - **Email**: testuser1@example.com
   - **Password**: Test123456 (記住！)
   - 點 **Create user**

4. 重複建立第二個用戶：
   - **Email**: testuser2@example.com
   - **Password**: Test123456

**記下這兩個用戶的 UUID**（點用戶→複製ID）✍️

---

### ✅ 步驟6: 為測試用戶建立 Profile

在SQL Editor執行（**替換UUID為實際ID**）：

```sql
-- 替換 'UUID1' 和 'UUID2' 為你剛才複製的用戶ID
INSERT INTO profiles (id, username, mbti, gender, zodiac, avatar_url, intro) VALUES
('UUID1', 'TestUserA', 'INFP', 'M', 'Leo', 'https://via.placeholder.com/150?text=A', '我喜歡烤肉'),
('UUID2', 'TestUserB', 'ENFJ', 'F', 'Virgo', 'https://via.placeholder.com/150?text=B', '美食愛好者');
```

例如，如果UUID是 `550e8400-e29b-41d4-a716-446655440000`，就改成：

```sql
INSERT INTO profiles (id, username, mbti, gender, zodiac, avatar_url, intro) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'TestUserA', 'INFP', 'M', 'Leo', 'https://via.placeholder.com/150?text=A', '我喜歡烤肉'),
('550e8400-e29b-41d4-a716-446655440999', 'TestUserB', 'ENFJ', 'F', 'Virgo', 'https://via.placeholder.com/150?text=B', '美食愛好者');
```

---

## 📍 第三部分：測試前端應用

### ✅ 步驟7: 重啟開發伺服器

在終端執行：

```bash
cd c:\Users\evely\Desktop\new\my_app
npm run build
```

等待完成後：

```bash
ng serve -o
```

應該自動打開 `http://localhost:4200`

---

### ✅ 步驟8: 測試 Issue #1 (餐廳篩選)

**分別用兩個瀏覽器視窗/無痕模式：**

**用戶A：**
1. 登入 testuser1@example.com / Test123456
2. 選擇 **石安牧場** → 點 **確認**
3. 進入配對頁面
4. 打開 Browser Console (F12)

**用戶B (同時)：**
1. 在無痕視窗登入 testuser2@example.com / Test123456
2. 選擇 **米其林A餐廳** (不同) → 點 **確認**
3. 進入配對頁面

**檢查結果：** ✅ 用戶A 應該看到 **空候選名單**（沒有用戶B）

**Console 應該打印：**
```
🔍 查詢候選人: { restaurant: '石安牧場', restaurantId: '...' }
⏳ 暫無同餐廳的候選人
```

---

### ✅ 步驟9: 改變測試，兩人選同一家

**用戶B：**
1. 回到選餐廳頁面 (重新整理或重新登入)
2. 選擇 **石安牧場** (改成跟A相同) → 點 **確認**
3. 進入配對頁面

**檢查結果：** ✅ 用戶A 應該現在看到 **用戶B的卡片**

**Console 應該打印：**
```
📊 候選人查詢結果: [ { user_id: '...', profiles: { username: 'TestUserB', ... } } ]
✅ 已加載 1 位候選人，同在「石安牧場」
```

---

### ✅ 步驟10: 測試 Issue #2 (聊天導向)

**用戶A：**
1. 看到用戶B的卡片
2. 點擊 **"一起吃 🍜"** 按鈕

**檢查結果：** ✅ 應該 **直接進入聊天頁面**（不是登入頁）

**Console 應該打印：**
```
💾 保存到 localStorage: { user_id: '...', name: 'TestUserB', ... }
🔍 聊天頁面初始化...
🎯 目標用戶 ID: ...
✅ 所有必要數據已就緒，準備加載消息
```

**在聊天頁面：**
- [ ] 能看到對方的頭像和名字
- [ ] 能輸入訊息
- [ ] 點 **發送**

---

## 🚨 故障排除 

### 問題：SQL 執行失敗

❌ **錯誤**: `relation "restaurants" already exists`
- 若數據表已存在，執行第一部分的 `DROP TABLE` 便可

❌ **錯誤**: `invalid input syntax for type uuid`
- 確認你複製的 UUID 格式正確

---

### 問題：登入失敗

❌ **錯誤**: `Invalid login credentials`
- 確認密碼是 `Test123456`
- 確認 email 是小寫

---

### 問題：看不到候選人

❌ **症狀**: 兩個用戶選相同餐廳但仍看不到彼此

**除錯步驟：**

1. **檢查 dining_requests 是否已創建**

在SQL Editor執行：
```sql
SELECT user_id, restaurant_id, dining_type FROM dining_requests;
```

應該看到2筆記錄（每個用戶各一筆）

2. **檢查 restaurant_id 是否匹配**

```sql
SELECT id, name FROM restaurants;
```

確認3家餐廳都列出

3. **檢查 RLS 政策**

```sql
SELECT tablename FROM pg_tables WHERE tablename IN ('dining_requests', 'restaurants', 'profiles');
```

---

### 問題：聊天頁面空白或報錯

❌ **症狀**: 進入聊天頁面但沒有界面

**開發者工具檢查：**
- 按 F12 → **Console** 標籤
- 搜尋 `❌` 看是否有錯誤
- 看是否有 `Supabase` 相關的錯誤

---

## ✨ 驗收清單

完成後檢查：

- [ ] 所有6個數據表已在 Supabase 建立
- [ ] 3家餐廳已新增
- [ ] 2個測試用戶已建立並有 Profile
- [ ] 不同餐廳的用戶看不到彼此 ✅
- [ ] 相同餐廳的用戶能看到彼此 ✅
- [ ] 點擊"一起吃"進入聊天頁面而非登入頁 ✅
- [ ] 能發送和接收訊息 ✅

---

## 📞 需要幫助？

完成以上步驟後告訴我結果！
- ✅ **一切正常** → 配對系統已完全就緒！
- ❌ **還有問題** → 告訴我 Console 的錯誤消息

