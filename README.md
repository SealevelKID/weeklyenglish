# 🏆 全民英檢每週練習 (GEPT Weekly Practice)

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python Version](https://img.shields.io/badge/python-3.8%2B-blue)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile-orange)
![Google Apps Script](https://img.shields.io/badge/backend-Google%20Apps%20Script-green)

這是一套為國小學生量身打造的 **互動式全民英檢（GEPT）每週練習系統**。本系統採用極簡的高效能架構：前端使用輕量無框架的純網頁技術（HTML / CSS / JS），配合 Python 自動化腳本進行題庫轉譯，並結合 Google 試算表（Google Sheets & Google Forms）作為雲端後台資料庫，完美實現了**低營運成本、跨裝置進度無縫同步**與**即時全班英雄榜**。

---

## 🛠️ 專案核心檔案結構

本專案結構清晰，兼顧了「學生作答端」、「教師管理端」與「資料轉譯端」的三維需求：

| 檔案名稱 | 類型說明 | 核心職責 |
| :--- | :--- | :--- |
| **`weeklyenglish.html`** | HTML5 | 系統主入口，採用單頁式應用（SPA）設計，確保行動端無縫滿版與極速切換。 |
| **`weeklyenglishstyle.css`** | CSS3 | 響應式介面樣式，支援雙英雄榜平滑滾動車廂、按鈕禁用灰化與動態高亮。 |
| **`weeklyenglishapp.js`** | JavaScript | 客戶端核心引擎。處理關卡狀態機、Web Speech API 朗讀、無縫雲端同步（GAS API）及「老師上帝視角」模擬作答模式。 |
| **`weeklyenglish.py`** | Python 3 | 核心轉譯腳本。運用正規表達式（Regex）自動過濾題目中不必要的 AI 提示詞（如 `(關於人)`、`(關於事)` 等），並將 Excel 題目檔轉為標準的 JSON。 |
| **`啟動每週英文py.txt`** | Batch/Text | 一鍵啟動腳本。用於在本地端快速呼叫 Python 執行轉譯任務，簡化教師日常工作流。 |
| **`weekly_data.json`** | JSON | 當週的活躍題庫檔案，包含單字、三階段聽力、三階段閱讀的完整題目與解析資料。 |
| **`appscript.js`** | Apps Script | 部署於 Google Cloud 的後端服務程式碼。負責接收全班學生答題數據、計算正確率與時間、進行訪客審核並回傳英雄榜。 |
| **`每週英文題目檔.xlsx`** | Excel (xlsx) | Google 表單匯出的原始答對回覆檔，作為當週新題庫的輸入源頭。 |

---

## 🔄 系統自動化工作流程

本系統的運作流程十分流暢，能協助教師在 5 分鐘內完成每週題庫更新：

```
 [1. Gemini AI 出題] ──> [2. 貼至 Google 表單] ──> [3. 匯出為 Excel]
                                                               │
 [6. 網頁完美呈現] <── [5. Python 自動淨化/轉 json] <── [4. 啟動轉譯指令]
```

### 1️⃣ AI 輔助出題 (Gemini)
* 教師在 **Gemini (AI)** 輸入當週要練習的單字（Vocabulary）與語法規則（Grammar）。
* Gemini 依照系統預設的格式自動產出結構化的「單字題」、「短句理解聽力題」、「對話聽力題」、「克漏字閱讀題」與「閱讀理解題」。

### 2️⃣ Google 表單收集與匯出
* 教師將 Gemini 生成好的題目複製，並貼到 **Google 表單 (Google Forms)** 或對應的後台試算表中。
* 將該表單的回應結果直接匯出並下載為 **`每週英文題目檔.xlsx`**。

### 3️⃣ Python 自動淨化與轉譯 (JSON Build)
* 執行 **`啟動每週英文py`** 腳本，呼叫 **`weeklyenglish.py`**。
* **正規表達式（Regex）淨化**：Python 腳本在解析過程中，會自動捕捉並抹除類似 `(關於人)`、`(關於事)`、`(關於時)`、`(關於地)` 的題目標籤，只留下最純淨的英文題目。
* **資料日期戳記綁定**：腳本會自動將當天日期寫入 `weekly_data.json` 的 `updateDate`，並寫入最新的班級密碼。
* 最終將資料轉譯並匯出為乾淨的 **`weekly_data.json`**。

### 4️⃣ 網頁自動載入與防呆更新
* 當學生或老師開啟網頁 **`weeklyenglish.html`** 時，系統會自動讀取 `weekly_data.json`。
* **換週自動重置機制**：如果網頁偵測到 JSON 的 `updateDate` 與本機儲存的上次更新日期不同，代表老師已經發布了全新一週的題庫！系統將會**自動清空本機殘留的所有舊過關進度**並重新整理，強迫學生從第一關單字重新挑戰，防範進度殘留造成的作弊可能。

---

## ✨ 獨家進階功能特色

### 🕵️ 老師上帝視角 & 後台管理系統
當網頁在 `Live Server`（`localhost` 或 `127.0.0.1`）環境下執行時，左上角會自動喚醒 **老師專區按鈕**：
* **手風琴式（Accordion）自動互斥收合**：查看所有題目時，開啟新的大單元或底下的子故事短文，其餘展開中的單元將**自動優雅收合**，畫面永遠保持一屏清爽。
* **聽力二直接填空**：聽力第二階段「短句理解」在老師查看題目時，會自動將答案以紅色底線高亮顯示在空格 `_______` 中，一目了然。
* **對話文章雙引號安全轉譯**：聽力三及閱讀三的「播放整篇短文」按鈕已全面升級 HTML 實體轉譯（Entity Escape）。即使對話中富含雙引號（`"`）等口語標記，按鈕結構也絕對不會破裂，並維持 **1.0x 正常速度** 進行無瑕、自然的連讀發音。
* **模擬作答（外掛模式）**：開啟後進入關卡，系統會強制在畫面上方秀出作弊解密框，並在正確答案旁亮起 🌟 星星提示，方便老師進行教學示範。

### 👥 雙英雄榜與智能分流
* **常規組 vs 閱讀強化組（Wayne & Kevin）**：系統會依據登入名字與身分，自動切換大廳進度條與任務按鈕。閱讀強化組將被分流至「閱讀一 + 閱讀二雙大循環」進度線。
* **本班英雄榜**：串接 Google Apps Script。集滿三顆通關綠燈（🟢）的本班學生，會依照全破總花費秒數進行雲端即時排序。
* **訪客體驗榜**：不需通行碼即可體驗。未達全破標準則列為挑戰中，待通關並經老師於後台「核准」後，即可登上大廳訪客排行榜。

---

## 🚀 快速開始指南

### 前提條件
請確保您的電腦已安裝：
* [Python 3.8 或更高版本](https://www.python.org/)
* Python 依賴套件 `openpyxl`（用於讀取 Excel）：
  ```bash
  pip install openpyxl
  ```

### 開始使用步驟
1. 將下載的 `每週英文題目檔.xlsx` 置於專案根目錄下。
2. 點擊執行 **`啟動每週英文py`**（或在終端機輸入 `python weeklyenglish.py`）。
3. 確認根目錄下成功產生 `weekly_data.json`。
4. 使用 VS Code 的 **Live Server** 套件開啟 `weeklyenglish.html` 即可開始挑戰或進入教師後台！

---

## 📝 授權條款

本專案採用 [MIT License](LICENSE) 進行授權。歡迎自由修改、擴充與應用於非商業性質之教學環境。
