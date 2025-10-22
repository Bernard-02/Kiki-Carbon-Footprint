# Firebase 設定指南

## 步驟 1：創建 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」或「Add project」
3. 輸入專案名稱（例如：kiki-carbon-footprint）
4. 關閉 Google Analytics（非必要）
5. 點擊「建立專案」

## 步驟 2：啟用 Realtime Database

1. 在 Firebase Console 左側選單，點擊「Realtime Database」
2. 點擊「建立資料庫」
3. 選擇資料庫位置（建議選擇 `asia-southeast1`）
4. 選擇「以測試模式啟動」（之後會修改規則）
5. 點擊「啟用」

## 步驟 3：設定安全性規則

1. 在 Realtime Database 頁面，點擊「規則」標籤
2. 將規則修改為以下內容：

```json
{
  "rules": {
    "carbonData": {
      ".read": true,
      ".write": true
    }
  }
}
```

3. 點擊「發布」

**重要說明**：這個規則允許所有人讀寫資料，適合展示用途。如果需要更安全的設定，請參考後續說明。

## 步驟 4：獲取 Firebase 配置

1. 在 Firebase Console，點擊齒輪圖示 ⚙️ → 「專案設定」
2. 向下滾動到「你的應用程式」區塊
3. 點擊「Web」圖示（</>）
4. 輸入應用程式暱稱（例如：Kiki Carbon Web）
5. **不要勾選** Firebase Hosting
6. 點擊「註冊應用程式」
7. 複製顯示的 `firebaseConfig` 物件

範例如下：
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "kiki-carbon.firebaseapp.com",
  databaseURL: "https://kiki-carbon-default-rtdb.firebaseio.com",
  projectId: "kiki-carbon",
  storageBucket: "kiki-carbon.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

## 步驟 5：更新專案配置

### 方法 1：直接修改文件（推薦）

1. 打開 `script.js`，找到第 6-13 行的 `firebaseConfig`
2. 將 Firebase Console 複製的配置貼上，替換現有的 `YOUR_API_KEY` 等佔位符

3. 打開 `carbon.js`，找到第 6-13 行的 `firebaseConfig`
4. 同樣貼上相同的配置

### 方法 2：使用配置文件

1. 將配置複製到 `firebase-config.js`
2. 在 `script.js` 和 `carbon.js` 中 import 使用

## 步驟 6：測試

1. 在本地開啟 `index.html`（使用 Live Server 或其他本地伺服器）
2. 點擊按鈕進行操作
3. 在新分頁開啟 `carbon.html`
4. 應該會看到碳足跡圓圈出現

5. 打開 Firebase Console 的 Realtime Database
6. 應該會看到 `carbonData` 節點下有新增的資料

## 運作原理

### index.html (觀眾使用)
- 觀眾在手機上掃描 QR code 打開 index.html
- 他們的操作（點擊按鈕、輸入文字）會計算碳足跡
- 碳足跡資料會即時寫入 Firebase Realtime Database

### carbon.html (投影顯示)
- 投影螢幕顯示 carbon.html
- 使用 Firebase 的 `onChildAdded` 監聽器
- 當任何裝置新增碳足跡資料時，投影上會即時顯示新圓圈
- 新圓圈會以白色、1.2倍大小出現，2秒後過渡成灰色、1倍大小

## 資料結構

Firebase Realtime Database 中的資料結構：

```
carbonData/
  ├─ -NxxxxxxxxxxXX/
  │   ├─ action: "button_2"
  │   ├─ footprint: 0.00007925
  │   ├─ timestamp: 1234567890000
  │   └─ seconds: 5
  ├─ -NxxxxxxxxxxXY/
  │   ├─ action: "submit"
  │   ├─ footprint: 0.000004
  │   ├─ timestamp: 1234567890100
  │   ├─ charCount: 10
  │   └─ text: "Hello World"
  └─ -NxxxxxxxxxxXZ/
      ├─ action: "page_existence"
      ├─ footprint: 0.00001
      └─ timestamp: 1234567890200
```

## 安全性注意事項

### 目前的設定（測試用）
```json
{
  "rules": {
    "carbonData": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 建議的生產環境設定

如果你希望：
1. **限制寫入次數**（防止濫用）：

```json
{
  "rules": {
    "carbonData": {
      ".read": true,
      ".write": "!data.exists() || (now - data.child('timestamp').val()) > 1000"
    }
  }
}
```
這會限制同一位置每秒只能寫入一次。

2. **驗證資料格式**：

```json
{
  "rules": {
    "carbonData": {
      ".read": true,
      "$itemId": {
        ".write": "newData.hasChildren(['action', 'footprint', 'timestamp'])",
        ".validate": "newData.child('footprint').isNumber() && newData.child('action').isString()"
      }
    }
  }
}
```

3. **展示結束後清空資料**：

在 Firebase Console 的 Realtime Database 中，點擊 `carbonData` 節點，然後點擊刪除圖示。

## 疑難排解

### 問題：網頁無法寫入資料
- 檢查 Console 是否有錯誤訊息
- 確認 Firebase 配置正確
- 確認 Realtime Database 規則允許寫入

### 問題：投影螢幕看不到觀眾的操作
- 確認兩個頁面使用相同的 Firebase 配置
- 檢查網路連線
- 打開 Firebase Console 確認資料有成功寫入

### 問題：CORS 錯誤
- 確保使用本地伺服器（如 Live Server）而非直接開啟 HTML 文件
- Firebase SDK 需要通過 HTTP/HTTPS 協議載入

## 部署到 GitHub Pages

1. 在專案根目錄創建 `.gitignore`：
```
firebase-config.js
```

2. **不要** 將包含真實 API Key 的文件推送到 GitHub
3. 或者，使用環境變數（需要構建工具）

**注意**：Firebase Web API Key 可以公開，因為安全性由 Firebase 規則控制，但建議仍然謹慎處理。

## 費用說明

Firebase 免費方案（Spark Plan）包含：
- Realtime Database: 1GB 儲存空間
- 10GB/月 下載流量
- 100 個同時連線

對於短期展示活動，完全足夠使用。

## 進階功能（可選）

### 重置碳足跡
如果需要在展示前清空所有資料，可以使用以下方法：

1. 在 Firebase Console 手動刪除 `carbonData` 節點
2. 或添加一個管理頁面，使用以下代碼：

```javascript
import { ref, remove } from 'firebase/database';
const carbonRef = ref(database, 'carbonData');
await remove(carbonRef);
```

### 匯出資料
在 Firebase Console 的 Realtime Database，點擊右上角的 ⋮ → 「匯出 JSON」

---

如有任何問題，請參考 [Firebase 官方文件](https://firebase.google.com/docs/database)
