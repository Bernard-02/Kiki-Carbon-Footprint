// 在最開始加入測試訊息
console.log('🚀 carbon.js 開始載入...');

// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, push, onChildAdded, onValue, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

console.log('✅ Firebase SDK 已載入');

// Firebase 配置 - 請在這裡填入你的 Firebase 配置（與 script.js 相同）
const firebaseConfig = {
  apiKey: "AIzaSyBPi95kBaVXTBdwyWaBUZEbXz2anDeHA3s",
  authDomain: "carbon-footprint-df72a.firebaseapp.com",
  databaseURL: "https://carbon-footprint-df72a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "carbon-footprint-df72a",
  storageBucket: "carbon-footprint-df72a.firebasestorage.app",
  messagingSenderId: "644004047351",
  appId: "1:644004047351:web:47ca9ffd354a8f9b9b26f2"
};

console.log('📝 Firebase 配置已設定');

// 初始化 Firebase
let app, database;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('✅ Firebase 初始化成功');
} catch (error) {
  console.error('❌ Firebase 初始化失敗:', error);
}

// 全域變數
let totalCarbonFootprint = 0;
const PAGE_EXISTENCE_FOOTPRINT = 0.00001;
let isInitialLoad = true; // 追蹤是否為初始載入

// 圈圈物件陣列
let bubbles = [];

// 圈圈類別
class Bubble {
    constructor(footprint, action, isExisting = false) {
        this.footprint = footprint;
        this.action = action;

        // 根據碳足跡決定大小
        this.size = this.getSize(footprint);
        this.baseSize = this.size; // 保存基礎大小

        // 隨機初始位置
        this.x = random(this.size, width - this.size);
        this.y = random(this.size, height - this.size); // 可以移動到整個畫面高度

        // 隨機移動速度（很慢的漂移）
        this.vx = random(-0.3, 0.3);
        this.vy = random(-0.3, 0.3);

        // 碳足跡文字
        this.label = `${footprint.toFixed(8)} gCO2`;

        // 新圓圈動畫屬性
        if (isExisting) {
            // 已存在的資料，直接顯示為正常狀態（深灰色）
            this.isNew = false;
            this.scale = 1.0;
            this.colorValue = 60; // 深灰色
        } else {
            // 新圓圈，需要動畫
            this.isNew = true;
            this.scale = 1.2; // 初始放大1.2倍
            this.colorValue = 255; // 初始為白色
            this.creationTime = millis(); // 記錄創建時間
        }
    }

    getSize(footprint) {
        const visualSize = footprint * 5000;
        if (visualSize < 0.1) return 20;
        else if (visualSize < 0.3) return 30;
        else return 40;
    }

    update() {
        // 處理新圓圈的動畫效果（2秒過渡）
        if (this.isNew) {
            const elapsed = millis() - this.creationTime;
            const duration = 2000; // 2秒

            if (elapsed < duration) {
                // 使用 easeOutCubic 緩動函數
                const progress = elapsed / duration;
                const eased = 1 - Math.pow(1 - progress, 3);

                // 從 1.2 縮放到 1.0
                this.scale = 1.2 - (0.2 * eased);

                // 從 255 (白色) 漸變到 60 (深灰色)
                this.colorValue = 255 - ((255 - 60) * eased);
            } else {
                // 動畫完成，變成一般圓圈（灰色）
                this.isNew = false;
                this.scale = 1.0;
                this.colorValue = 60;
            }
        }

        // 根據當前縮放更新實際大小
        this.size = this.baseSize * this.scale;

        // 緩慢移動
        this.x += this.vx;
        this.y += this.vy;

        // 邊界反彈
        if (this.x < this.size / 2 || this.x > width - this.size / 2) {
            this.vx *= -1;
        }
        if (this.y < this.size / 2 || this.y > height - this.size / 2) {
            this.vy *= -1;
        }

        // 限制在畫面內
        this.x = constrain(this.x, this.size / 2, width - this.size / 2);
        this.y = constrain(this.y, this.size / 2, height - this.size / 2);
    }

    display() {
        // 使用當前顏色值繪製圓圈（從白色255漸變到深灰色60）
        fill(this.colorValue, this.colorValue, this.colorValue);
        noStroke();
        circle(this.x, this.y, this.size);

        // 繪製碳足跡數值（圓上方）
        fill(255);
        noStroke();
        textAlign(CENTER, BOTTOM);
        textSize(10);
        text(this.label, this.x, this.y - this.size / 2 - 5);
    }
}

// p5.js setup - 使用 window 確保全域可見
window.setup = function() {
    console.log('🎨 p5.js setup 開始...');
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    console.log('✅ Canvas 已創建:', windowWidth, 'x', windowHeight);

    // 載入現有資料
    console.log('📡 開始載入 Firebase 資料...');
    loadExistingData();

    // 開始監控新資料
    startMonitoring();

    // 開始頁面存在追蹤
    console.log('⏰ 啟動頁面存在追蹤（每10秒）...');
    startPageExistenceTracking();
}

// p5.js draw - 使用 window 確保全域可見
window.draw = function() {
    background(26, 26, 26); // #1a1a1a

    // 更新並繪製所有圈圈
    for (let bubble of bubbles) {
        bubble.update();
        bubble.display();
    }
}

// 視窗大小改變時重新調整 canvas - 使用 window 確保全域可見
window.windowResized = function() {
    resizeCanvas(windowWidth, windowHeight);
}

// 載入現有資料並監聽新資料（使用 Firebase）
function loadExistingData() {
    console.log('🔄 開始連接 Firebase...');
    const carbonRef = ref(database, 'carbonData');

    // 使用 onChildAdded 監聽每一筆資料
    onChildAdded(carbonRef, (snapshot) => {
        const data = snapshot.val();
        console.log('📊 收到 Firebase 資料:', data);

        if (data && data.footprint) {
            if (isInitialLoad) {
                // 初始載入時，顯示為已存在的資料（灰色圓圈）
                console.log('⚪ 添加已存在的圓圈（灰色）');
                addBubble(data.footprint, data.action, true);
            } else {
                // 之後新增的資料，顯示為新圓圈（白色動畫）
                console.log('⚪ 添加新圓圈（白色動畫）');
                addBubble(data.footprint, data.action, false);
            }

            totalCarbonFootprint += data.footprint;
            updateTotalDisplay();
            console.log('✅ 當前總碳足跡:', totalCarbonFootprint);
        }
    }, (error) => {
        console.error('❌ Firebase 連接錯誤:', error);
        console.error('錯誤詳情:', error.message);
    });

    // 初始載入完成後，設置 flag
    setTimeout(() => {
        isInitialLoad = false;
        console.log('✅ Firebase 即時監聽已啟動');
        console.log('📊 當前圓圈數量:', bubbles.length);
    }, 1000);
}

// 監控新資料（現在由 Firebase onChildAdded 處理，不再需要輪詢）
function startMonitoring() {
    // Firebase 的 onChildAdded 已經在 loadExistingData 中設置
    // 這個函數保留為空，以保持代碼結構
    console.log('✅ 使用 Firebase 即時監聽，不需要輪詢');
}

// 追蹤頁面存在本身的碳足迹（寫入 Firebase）
async function startPageExistenceTracking() {
    // 添加頁面存在碳足跡到 Firebase 的函數
    const addPageFootprint = async () => {
        const data = {
            action: 'page_existence',
            footprint: PAGE_EXISTENCE_FOOTPRINT,
            timestamp: serverTimestamp()
        };

        try {
            console.log('💾 準備寫入頁面存在碳足跡:', data);
            const carbonRef = ref(database, 'carbonData');
            await push(carbonRef, data);
            console.log('✅ 頁面存在碳足跡已記錄到 Firebase');
        } catch (error) {
            console.error('❌ Firebase 儲存失敗:', error);
            console.error('錯誤詳情:', error.message);
        }
    };

    // 初始立即產生一個
    console.log('⚡ 立即新增第一個頁面存在碳足跡...');
    await addPageFootprint();

    // 每 10 秒產生一個
    setInterval(() => {
        console.log('⏰ 10秒到了，新增頁面存在碳足跡...');
        addPageFootprint();
    }, 10000);
}

// 添加新圈圈
function addBubble(footprint, action, isExisting = false) {
    bubbles.push(new Bubble(footprint, action, isExisting));
}

// 更新累計顯示
function updateTotalDisplay() {
    const totalValue = document.querySelector('.total-value');
    if (totalValue) {
        totalValue.textContent = `${totalCarbonFootprint.toFixed(8)} gCO2`;
    }
}
