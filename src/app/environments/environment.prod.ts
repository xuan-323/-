/**
 * 生產環境配置
 * 用於生產環境部署
 *
 * 設定環境變數方式：
 * ng build --configuration production --define 'NG_APP_SUPABASE_URL=your_url'
 *
 * 或在 .env 檔案中定義（需要支援包）
 */
export const environment = {
  production: true,

  // ═══════════════════════════════════════════════════════════
  // Supabase 設定（生產環境密鑰）
  // ═══════════════════════════════════════════════════════════
  // ⚠️ 這些值應該在構建時從環境變數注入
  // 默認值只用於開發，生產環境必須正確配置
  supabaseUrl: 'https://hamijkpsjaxltifhrppw.supabase.co',
  supabaseAnonKey: 'sb_publishable_LataTu72rxsmn883jnvjgw_af3rtxRt',

  // ═══════════════════════════════════════════════════════════
  // 應用設定
  // ═══════════════════════════════════════════════════════════
  productionUrl: 'https://eatmeet.com',
  appName: 'EatMeet',
  appVersion: '1.0.0',

  // ═══════════════════════════════════════════════════════════
  // API 超時設定（毫秒）
  // ═══════════════════════════════════════════════════════════
  requestTimeout: 60000,

  // ═══════════════════════════════════════════════════════════
  // 日誌設定（生產環境只記錄警告和錯誤）
  // ═══════════════════════════════════════════════════════════
  enableLogging: true,
  logLevel: 'warn', // 'debug' | 'info' | 'warn' | 'error'
};
