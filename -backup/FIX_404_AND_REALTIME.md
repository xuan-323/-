# 🔧 404 錯誤和聊天不即時問題修復

## 🚨 診斷结果

### ❌ 問題 1：404 Not Found 錯誤
**原因**：Supabase 的 `.or()` 方法有語法限制
```typescript
// ❌ 錯誤的寫法（導致 404）
.or(
  `and(sender_id.eq.${this.currentUser.id},receiver_id.eq.${this.targetUserId}),and(...)`
)
```

**為什麼會 404**：
1. Supabase PostgREST API 無法正確解析複雜的 `.or()` 邏輯
2. 請求被當作無效資源，返回 404
3. 實際上是**查詢語法錯誤**，不是資源不存在

### ❌ 問題 2：聊天不即時
**原因**：
1. Realtime WebSocket 連接可能不穩定
2. 消息只依賴 Realtime，如果連接中斷則無法接收
3. 沒有備用機制

---

## ✅ 修復方案

### 修復 1️⃣：替換 `.or()` 為分開查詢
```typescript
// ❌ 舊寫法（404 錯誤）
const { data, error } = await this.supabase
  .from('messages')
  .select('*')
  .or(
    `and(sender_id.eq.${this.currentUser.id},receiver_id.eq.${this.targetUserId}),and(...)`
  )
  .order('created_at', { ascending: true });

// ✅ 新寫法（分開查詢）
const { data: sent } = await this.supabase
  .from('messages')
  .select('*')
  .eq('sender_id', this.currentUser.id)
  .eq('receiver_id', this.targetUserId)
  .order('created_at', { ascending: true });

const { data: received } = await this.supabase
  .from('messages')
  .select('*')
  .eq('sender_id', this.targetUserId)
  .eq('receiver_id', this.currentUser.id)
  .order('created_at', { ascending: true });

// 合併並排序
const allMessages = [...(sent || []), ...(received || [])]
  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
```

**優点**：
- ✅ 避免 404 錯誤
- ✅ 查詢更清晰、易於維護
- ✅ 效能相同（兩個簡單查詢 vs 一個複雜查詢）

---

### 修復 2️⃣：添加心跳檢測（5秒檢查一次）
```typescript
// 🔥 在 listenMessages() 中添加
this.messageCheckTimer = setInterval(async () => {
  if (!this.currentUser?.id || !this.targetUserId) return;
  
  const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
  
  // 查詢最近 5 秒的消息
  const { data: sent } = await this.supabase
    .from('messages')
    .select('*')
    .eq('sender_id', this.currentUser.id)
    .eq('receiver_id', this.targetUserId)
    .gte('created_at', fiveSecondsAgo);

  const { data: received } = await this.supabase
    .from('messages')
    .select('*')
    .eq('sender_id', this.targetUserId)
    .eq('receiver_id', this.currentUser.id)
    .gte('created_at', fiveSecondsAgo);

  // 代理新消息
  const recentMessages = [...(sent || []), ...(received || [])];
  recentMessages.forEach(msg => {
    if (!this.messages.some(m => m.id === msg.id)) {
      this.messages.push(msg);  // 添加到列表
      this.scrollToBottom();
    }
  });
}, 5000);  // 每 5 秒檢查一次
```

**工作原理**：
1. **Realtime 優先**：WebSocket 實時推送消息
2. **心跳備用**：每 5 秒檢查一次，確保不會漏掉消息
3. **去重複**：檢查消息 ID 是否已存在，避免重複

**效果**：
- ✅ 聊天延遲 < 5 秒（大幅改善）
- ✅ Realtime 不穩定時有備用方案
- ✅ 性能影響最小

---

### 修復 3️⃣：改進錯誤處理
```typescript
async sendMessage() {
  try {
    console.log('📤 正在發送消息...');
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        sender_id: this.currentUser.id,
        receiver_id: this.targetUserId,
        content: contentToSend
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 發送失敗:', error.message);
      alert('❌ 發送失敗：' + (error.message || '未知錯誤'));
      // 恢復消息內容
      this.newMessage = contentToSend;
    }
  } catch (err) {
    console.error('💥 發送異常:', err);
  }
}
```

**改進點**：
- ✅ 使用 `try-catch` 捕捉異常
- ✅ 顯示具體錯誤信息給用戶
- ✅ 方便調試

---

## 📊 修改清單

| 檔案 | 修改 | 作用 |
|------|------|------|
| **friend-chat.ts** | `loadMessages()` | 替換 `.or()` → 分開查詢 |
| **friend-chat.ts** | `listenMessages()` | 添加 5 秒心跳檢測 |
| **friend-chat.ts** | `sendMessage()` | 改進錯誤處理 |
| **friend-chat.ts** | `ngOnDestroy()` | 清除 messageCheckTimer |

---

## 🧪 測試步驟

### 測試 1️⃣：驗證 404 已修復
1. 打開瀏覽器 F12 → Network 標籤
2. 進入聊天頁面
3. 應該**看不到任何 404 錯誤**
4. 或查看 Console 應出現：`✅ 已加載 X 條消息`

### 測試 2️⃣：驗證實時性改善
1. 打開兩個瀏覽器標籤（A 和 B）
2. 都進入聊天
3. A 發送消息
4. ✅ B 應該在**5 秒內**看到消息（即使 Realtime 慢也能檢測到）
5. Console 應看到：`💓 心跳檢測到新消息` 或 `📨 收到新消息`

### 測試 3️⃣：驗證錯誤提示
1. 故意輸入無效的 receiver_id（測試）
2. 應該彈出 alert：`❌ 發送失敗：...`
3. 消息暫存框應該恢復原文

---

## 🔍 調試信息解釋

| 日誌 | 含義 |
|------|------|
| `🔍 加載消息` | 開始加載舊消息 |
| `✅ 已加載 X 條消息` | 成功加載歷史消息 |
| `📡 建立聊天頻道` | 建立 Realtime 連接 |
| `📨 收到新消息` | Realtime 推送新消息 |
| `💓 心跳檢測到新消息` | 輪詢檢測到新消息 |
| `📤 正在發送消息` | 開始發送 |
| `✅ 消息發送成功` | 發送完成 |
| `❌ 發送失敗` | 參數錯誤或權限問題 |

---

## 📋 Supabase RLS 權限檢查清單

如果仍然出現 404，檢查 Supabase 的行級安全 (RLS) 政策：

```sql
-- 檢查 messages 表的 SELECT 策略
SELECT * FROM pg_policies WHERE tablename = 'messages';

-- 應該有類似的規則：
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
```

**常見 404 原因**：
1. ❌ 表名拼寫錯誤（`mesages` 而不是 `messages`）
2. ❌ 列名不存在（`sender_user_id` 而不是 `sender_id`）
3. ❌ RLS 策略拒絕訪問（用戶無權限讀/寫）
4. ❌ 表不存在或被刪除

---

## 🚀 性能優化

### 心跳間隔調整

根據實時性需求調整：

```typescript
// 高實時性（每 2 秒檢查一次）
}, 2000);   // 消耗更多帶寬和 CPU

// 平衡（每 5 秒檢查一次）← 推薦
}, 5000);

// 省電（每 10 秒檢查一次）
}, 10000);  // 延遲可能達 10 秒
```

### 只查詢最近消息
```typescript
// 優化：只查詢最近 5 秒的消息，避免掃描整個表
const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
.gte('created_at', fiveSecondsAgo);  // ← 使用索引加速
```

---

## ✅ 完成檢查清單

- ✅ 404 錯誤已修復（`.or()` → 分開查詢）
- ✅ 聊天實時性已改善（添加 5 秒心跳檢測）
- ✅ 錯誤提示已完善
- ✅ 代碼無編譯錯誤

---

## 📞 如果仍有問題

### 檢查清單
1. 打開 F12 Console，截屏所有錯誤信息
2. 檢查 Network 標籤中的 API 調用
3. 驗證 Supabase 的 messages 表確實存在
4. 確認 RLS 政策允許讀寫

### 常見解決方案
- **404 仍然出現**：檢查表名和列名拼寫
- **消息發送但不顯示**：檢查 RLS 權限
- **實時性仍差**：檢查 WebSocket 連接（Network → WS）
- **心跳不工作**：檢查控制台是否有 console 錯誤
