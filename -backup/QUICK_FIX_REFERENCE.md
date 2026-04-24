# 🎯 404 & 實時性修復快速參考

## 📌 三個核心修改

### 1️⃣ 修復 404 錯誤
```typescript
// ❌ 舊（Supabase 無法解析）
.or(`and(sender_id.eq.${id1}),and(sender_id.eq.${id2})`)  // ← 導致 404

// ✅ 新（分開查詢）
const sent = await supabase.from('messages').select('*').eq('sender_id', id1)...
const received = await supabase.from('messages').select('*').eq('sender_id', id2)...
const all = [...sent, ...received].sort(...)
```

**效果** ✅ 404 消失

---

### 2️⃣ 改善聊天實時性
```typescript
// 新增心跳檢測
setInterval(async () => {
  const recent = await supabase
    .from('messages')
    .select('*')
    .gte('created_at', fiveSecondsAgo);  // 只查最近 5 秒
  
  recent.forEach(msg => {
    if (!messages.includes(msg)) {
      messages.push(msg);  // 添加新消息
    }
  });
}, 5000);  // 每 5 秒檢查一次
```

**效果** ✅ 聊天延遲 < 5 秒（即使 Realtime 失敗）

---

### 3️⃣ 改進錯誤提示
```typescript
// 發送時顯示具體錯誤
try {
  await supabase.from('messages').insert(...);
} catch (error) {
  alert('❌ 失敗：' + error.message);  // ← 用戶看得懂
}
```

**效果** ✅ 問題更容易排查

---

## 🔍 你會看到的日誌

打開 F12 → Console，應該看到：

```
✅ 已加載 5 條消息              ← 加載成功
📡 建立聊天頻道: chat_id1_id2  ← Realtime 連接建立
📨 收到新消息: {id: 123...}    ← 實時消息推送
💓 心跳檢測到新消息            ← 心跳補救機制
✅ 消息發送成功               ← 發送成功
```

---

## ✅ 驗證修復成功

| 檢查項 | 預期結果 | 操作 |
|--------|---------|------|
| **404 錯誤** | ❌ 不出現 | F12 → Network，看資源加載 |
| **聊天延遲** | < 5 秒 | 發送消息，計時對方接收時間 |
| **錯誤提示** | 清晰明確 | 故意輸入錯誤，看是否有 alert |
| **Console 日誌** | 正常輸出 | F12 → Console，看日誌 |

---

## 🚀 文件位置

- 📄 **修復文檔**：`FIX_404_AND_REALTIME.md` ← 詳細說明
- 📄 **代碼**：`src/app/friend-chat.ts` ← 已更新
- 📄 **數據庫**：`DATABASE_SETUP.sql` ← RLS 政策設置

---

## ⚡ 一句話總結

✅ **替換 `.or()` 查詢** → 404 修復  
✅ **添加 5 秒心跳檢測** → 聊天即時性改善  
✅ **改進錯誤捕捉** → 調試更容易
