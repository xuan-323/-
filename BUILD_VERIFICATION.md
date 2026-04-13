# ✅ 本地驗證步驟

## 修復的問題

原問題：
```
TS2591: Cannot find name 'process'
```

原因：`environment.prod.ts` 中使用了 `process.env` 但沒有 Node.js 類型定義。

## 解決方案

已從 `environment.prod.ts` 中移除 `process.env` 的使用，改為使用固定值。

---

## 驗證方式

### 方式 1：開發服務器（推薦）

```bash
# 1. 清理快取
rm -rf .angular dist node_modules/.cache

# 2. 啟動開發服務器
ng serve

# 3. 觀察输出，應該看到：
# ✔ Compiled successfully.
```

如果出現編譯錯誤，確認以下檔案：
- ✅ `src/app/auth/supabase.service.ts`
- ✅ `src/app/auth/auth.service.ts`
- ✅ `src/app/environments/environment.ts`
- ✅ `src/app/environments/environment.prod.ts`

### 方式 2：生產構建

```bash
# 清理快取
rm -rf dist .angular

# 執行生產構建
ng build

# 應該看到：
# ✔ Compiled successfully. (XX.XXs)
# ✔ Build at ...
```

### 方式 3：TypeScript 檢查

```bash
# 快速類型檢查（不執行完整構建）
npx tsc --noEmit --skipLibCheck
```

---

## 修改詳情

### 改變前（environment.prod.ts）
```typescript
supabaseUrl: process.env['NG_APP_SUPABASE_URL'] || '...',
supabaseAnonKey: process.env['NG_APP_SUPABASE_ANON_KEY'] || '...',
```

❌ 問題：在瀏覽器環境中 `process` 不存在

### 改變後（environment.prod.ts）
```typescript
// ⚠️ 這些值應該在構建時從環境變數注入
// 默認值只用於開發，生產環境必須正確配置
supabaseUrl: 'https://hamijkpsjaxltifhrppw.supabase.co',
supabaseAnonKey: 'sb_publishable_LataTu72rxsmn883jnvjgw_af3rtxRt',
```

✅ 解決：使用固定值，沒有 `process` 參考

---

## 生產環境部署

對於生產環境，建議的方法：

### 方法 1：使用環境特定檔案

```bash
# 在 environment.prod.ts 中直接設定
# (已實施)
```

### 方法 2：使用構建時變數注入

如果需要動態配置，可以：

1. 安裝依賴
```bash
npm install --save-dev dotenv
```

2. 在 `angular.json` 中配置環境變數

3. 在 `environment.prod.ts` 中使用

---

## 快速驗證檢查表

- [ ] 確認 Node.js 版本 >= 20.19.0
  ```bash
  node --version
  ```

- [ ] 確認 Angular CLI 已安裝
  ```bash
  ng version
  ```

- [ ] 執行 npm install
  ```bash
  npm install
  ```

- [ ] 啟動開發服務器
  ```bash
  ng serve
  ```

- [ ] 瀏覽器打開 http://localhost:4200

- [ ] 檢查控制台是否有錯誤訊息

- [ ] (可選) 執行構建
  ```bash
  ng build
  ```

---

## 常見問題

### Q: 還是看到 "Cannot find name 'process'" 錯誤？
**A:** 
1. 確認已保存所有檔案
2. 執行 `ng build --configuration development`
3. 清理 node_modules 並重新安裝：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Q: 構建仍然失敗？
**A:** 檢查其他檔案中是否有 `process.env` 的使用：
```bash
grep -r "process\.env" src/ --include="*.ts"
```

### Q: 生產環境不知道 Supabase 金鑰怎辦？
**A:** 有幾個選項：
1. 在 `environment.prod.ts` 中硬編碼（適用於公開的 anon key）
2. 使用別的配置系統（如 Docker 環境變數）
3. 在部署時動態注入

---

## 下一步

1. ✅ 修復編譯錯誤
2. 📝 本地測試開發服務器
3. 🔨 構建生產版本
4. 🚀 部署到生產環境

---

**最後更新：2026-04-10**

