# 🔧 食伴配對功能修復總結

## 🚨 發現的三個核心問題

### 問題 #1：一方跳出卡片，一方沒有（需要手動刷新）
**原因**：`setupRealtime()` 只監聽 `matches` 表，沒有監聽 `dining_requests` 變化
- 當用戶 A 已在配對頁面，用戶 B 加入時，A 無法實時看到 B

**修復方案**：
✅ 添加第二個 Realtime 頻道監聽 `dining_requests` 表
✅ 用戶加入時立即觸發 `loadUsers()` 更新列表
✅ 添加關鍵索引優化查詢效能

---

### 問題 #2：A-B 配對後，A-C 聊天卻顯示 A-B 的對話
**原因**：
1. 路由參數改變時沒有正確清除舊的 Realtime 訂閱
2. 舊聊天室的消息事件監聽仍在運行
3. 多個微弱事件通道同時活躍導致消息混亂

**修復方案**：
✅ 在 `ngOnInit` 中監聽 `route.params` 的變化
✅ 當 URL 參數改變時，先清除舊訂閱，再建立新的聊天房間
✅ 為每個聊天建立獨立的頻道名稱：`chat_${sorted_ids}`
✅ 在 `loadMessages()` 中驗證參數有效性

代碼片段：
```typescript
this.route.params.subscribe(async (params) => {
  const newTargetId = params['id'];
  if (newTargetId && newTargetId !== this.targetUserId) {
    // 切換對象時，清除舊訂閱
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
    // 重新初始化聊天
    await this.loadMessages();
    this.listenMessages();
  }
});
```

---

### 問題 #3：實時性差，不同步
**原因**：
- 心跳機制只有 30 秒一次，但用戶在線判定為 60 秒
- 沒有詳細的錯誤日誌，難以診斷
- Realtime 頻道沒有狀態日誌

**修復方案**：
✅ 添加詳細的 `console.log()` 日誌（development 環境）
✅ 驗證字段是否為 null（防止查詢失敗）
✅ 優化頻道命名避免衝突

---

## ✅ 具體修改清單

### 📝 [friend-matching.ts](friend-matching.ts) 修改
1. **屬性修改**：
   ```typescript
   // 舊
   private channel: any;
   
   // 新
   private matchesChannel: any;
   private usersChannel: any;  // 👈 新增
   ```

2. **ngOnDestroy 修改**：清除兩個頻道
   ```typescript
   ngOnDestroy() {
     if (this.matchesChannel) supabase.removeChannel(this.matchesChannel);
     if (this.usersChannel) supabase.removeChannel(this.usersChannel);  // 👈 新增
     if (this.intervalId) clearInterval(this.intervalId);
   }
   ```

3. **setupRealtime 修改**：添加 dining_requests 監聽
   ```typescript
   setupRealtime() {
     // ... 清除舊頻道 ...
     
     // 監聽 matches（配對更新）
     this.matchesChannel = supabase
       .channel('sync-matches')
       .on('postgres_changes', ...)
       .subscribe();

     // 📌 新增：監聽 dining_requests（用戶上線/下線）
     this.usersChannel = supabase
       .channel('sync-users-' + this.myRequest.restaurant_id)
       .on('postgres_changes', ...)
       .subscribe();
   }
   ```

4. **loadUsers 修改**：添加錯誤處理和日誌
   ```typescript
   async loadUsers() {
     const { data, error } = await supabase.from('dining_requests')...
     if (error) {
       console.error('加載用戶出錯:', error);
       return;
     }
     this.users = (data || []).filter(...);
     console.log(`👥 當前在線用戶: ${this.users.length}`);
   }
   ```

### 📝 [friend-chat.ts](friend-chat.ts) 修改
1. **ngOnInit 修改**：監聽路由參數變化
   ```typescript
   async ngOnInit() {
     // ... 初始化 ...
     
     // 📌 新增：監聽路由參數變化
     this.route.params.subscribe(async (params) => {
       const newTargetId = params['id'];
       if (newTargetId && newTargetId !== this.targetUserId) {
         // 切換對象時清除舊訂閱
         if (this.subscription) {
           this.supabase.removeChannel(this.subscription);
         }
         this.targetUserId = newTargetId;
         this.messages = [];
         
         // 重新建立聊天
         await this.loadMessages();
         this.listenMessages();
       }
     });
   }
   ```

2. **listenMessages 修改**：完整清除舊訂閱和詳細日誌
   ```typescript
   listenMessages() {
     // 先清除舊訂閱
     if (this.subscription) {
       console.log('🧹 清除舊的聊天訂閱');
       this.supabase.removeChannel(this.subscription);
       this.subscription = null;
     }
     
     // 驗證參數
     if (!this.currentUser?.id || !this.targetUserId) {
       console.warn('⚠️ 聊天參數不完整');
       return;
     }
     
     // ... 建立新訂閱 ...
     // 添加詳細日誌：🔍 加載消息、📨 收到新消息、✅ 添加消息等
   }
   ```

3. **loadMessages 修改**：驗證參數和錯誤處理
   ```typescript
   async loadMessages() {
     if (!this.currentUser?.id || !this.targetUserId) {
       console.warn('⚠️ 用戶ID或目標ID缺失');
       return;
     }
     
     const { data, error } = await supabase.from('messages')...
     if (error) {
       console.error('❌ 加載消息失敗:', error);
       return;
     }
     this.messages = data || [];
   }
   ```

---

## 📊 需要的數據庫表格

在 Supabase 中創建以下表：

### 1. **profiles** - 用戶資料
```typescript
{
  id: UUID (主鍵，外鍵ref auth.users)
  username: TEXT (唯一)
  avatar_url: TEXT (可選)
  updated_at: TIMESTAMP
}
```

### 2. **dining_requests** - 用戶的食伴請求 ⭐ 關鍵
```typescript
{
  id: UUID (主鍵)
  user_id: UUID (外鍵ref profiles)
  restaurant_id: TEXT (餐廳ID)
  dining_type: TEXT ('solo' 或 'match')
  last_active: TIMESTAMP (⭐ 用於判定在線狀態)
  created_at: TIMESTAMP
  
  UNIQUE(user_id, restaurant_id, dining_type)
  INDEX: (restaurant_id, last_active, dining_type)
}
```

### 3. **likes** - 喜歡記錄
```typescript
{
  id: UUID (主鍵)
  user_id: UUID (發送者)
  target_user_id: UUID (接收者)
  created_at: TIMESTAMP
  
  UNIQUE(user_id, target_user_id)
}
```

### 4. **matches** - 成功配對
```typescript
{
  id: UUID (主鍵)
  user_a_id: UUID (排序後較小的ID)
  user_b_id: UUID (排序後較大的ID)
  status: TEXT ('matched' 或 'archived')
  created_at: TIMESTAMP
  
  UNIQUE(user_a_id, user_b_id)
}
```

### 5. **messages** - 聊天消息
```typescript
{
  id: UUID (主鍵)
  sender_id: UUID (發送者)
  receiver_id: UUID (接收者)
  content: TEXT
  created_at: TIMESTAMP
  
  INDEX: (sender_id, receiver_id, created_at)
}
```

✅ **已在 DATABASE_SETUP.sql 提供完整的初始化腳本**

---

## 🧪 測試步驟

### 測試場景 1️⃣：一方顯示，一方不顯示（實時同步）
1. 打開兩個瀏覽器標籤：用戶 A 和用戶 B
2. A 選擇餐廳進入配對頁面
3. B 選擇**同一家餐廳**進入配對頁面
4. ✅ **預期**：A 應該立即看到 B（無需刷新）
5. ✅ **檢查控制台**：應該看到 `🔄 用戶列表更新` 日誌

### 測試場景 2️⃣：聊天室混亂
1. A 和 B 互相點喜歡→配對成功
2. A 和 B 進入聊天，發送幾條消息
3. A 返回配對頁面
4. A 和 C 互相點喜歡→配對成功
5. A 點擊進入 C 的聊天
6. ✅ **預期**：聊天內容應該只顯示 A-C 的對話，不應該有 A-B 的消息
7. ✅ **檢查控制台**：應該看到 `🔄 切換聊天對象` 和 `🧹 清除舊的聊天訂閱` 日誌

### 測試場景 3️⃣：在線狀態
1. A 進入配對頁面
2. 停留 1 分鐘不操作
3. B 進入配對頁面
4. ✅ **預期**：A 仍然應該出現在 B 的列表中（60秒內有活動）
5. 等待超過 1 分鐘，重新加載 B 的列�表
6. ✅ **預期**：A 應該消失

---

## 🔧 啟用 Realtime

在 Supabase 控制台：
1. 進入 **Database → Publications**
2. 展開 **supabase_realtime**
3. 確保以下表的 **「 Enable」** 已勾選：
   - ✅ `dining_requests`
   - ✅ `matches`
   - ✅ `messages`
   - ✅ `likes`

---

## 📝 後端邏輯檢查清單

- ✅ **在線檢測**：使用 `last_active` 判定（60秒內）
- ✅ **心跳機制**：每 30 秒更新一次
- ✅ **Realtime 監聽**：dining_requests + matches
- ✅ **聊天隔離**：每對使用者有獨立的頻道
- ✅ **參數驗證**：檢查 null/undefined
- ✅ **清空邏輯**：ngOnDestroy 和路由變化時清除

---

## 🚀 下一步

1. **立即測試**：檢查瀏覽器控制台是否看到新的日誌
2. **執行 SQL**：在 Supabase 中執行 DATABASE_SETUP.sql
3. **驗證索引**：確保 `idx_dining_requests_online` 索引已建立
4. **性能監控**：如果仍然緩慢，檢查 Supabase 行數限制

💡 **提示**：如果實時同步仍然有問題，可以將心跳機制改為 **15秒**：
```typescript
}, 15000);  // 從 30000 改為 15000
```

---

## 📞 調試技巧

如果仍有問題，檢查：
1. 瀏覽器控制台（F12）的紅色錯誤信息
2. Supabase 的 **Logs** 面板
3. Network 標籤中的 WebSocket 連接
4. 確認用戶已登驗證和授權
