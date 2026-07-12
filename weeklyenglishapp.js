// 系統初始化測試
document.addEventListener("DOMContentLoaded", () => {
    // 取得 HTML 元素
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginBtn = document.getElementById('login-btn');
    // 原本取得 HTML 元素的地方
    const nameInput = document.getElementById('student-name');

    // --- 新增：取得單字關卡相關元素 ---
    const vocabScreen = document.getElementById('vocab-screen');
    const nextTaskBtn = document.getElementById('next-task-btn');
    const exitVocabBtn = document.getElementById('exit-vocab-btn');

    // 👇 在其下方新增：綁定雙英雄榜元素與滑動邏輯 👇
    const tabClass = document.getElementById('tab-class');
    const tabVisitor = document.getElementById('tab-visitor');
    const slider = document.getElementById('leaderboard-slider');

    if (tabClass && tabVisitor && slider) {
        // 點擊頁籤：平滑滾動到對應車廂
        tabClass.addEventListener('click', () => {
            slider.scrollTo({ left: 0, behavior: 'smooth' });
        });
        tabVisitor.addEventListener('click', () => {
            slider.scrollTo({ left: slider.clientWidth, behavior: 'smooth' });
        });

        // 手指滑動：自動切換頁籤高亮狀態
        slider.addEventListener('scroll', () => {
            const scrollX = slider.scrollLeft;
            const width = slider.clientWidth;
            if (scrollX < width / 2) {
                tabClass.classList.add('active');
                tabVisitor.classList.remove('active');
            } else {
                tabVisitor.classList.add('active');
                tabClass.classList.remove('active');
            }
        });
    }
    // 👆 新增結束 👆

    // --- 新增：單字關卡內部元素綁定 ---
    const englishWordEl = document.getElementById('english-word');
    const vocabOptionsEl = document.getElementById('vocab-options');
    const currentQNumEl = document.getElementById('current-q-num');
    const totalQNumEl = document.getElementById('total-q-num');

    // --- 新增：大廳分流按鈕與聽力關卡元素 ---
    const enterListeningBtn = document.getElementById('enter-listening-btn');
    const enterReadingBtn = document.getElementById('enter-reading-btn');
    const listeningScreen = document.getElementById('listening-screen');
    const exitListeningBtn = document.getElementById('exit-listening-btn');
    const listeningOptionsEl = document.getElementById('listening-options');
    const listCurrentQNumEl = document.getElementById('list-current-q-num');
    const listTotalQNumEl = document.getElementById('list-total-q-num');
    const listPlaySoundBtn = document.getElementById('list-play-sound-btn');
    const listPlayArticleBtn = document.getElementById('list-play-article-btn'); // 👈 綁定新按鈕

    let currentList3Article = null; // 👈 紀錄聽力第三關當前選中的文章

    // --- 替換：閱讀第三階段相關變數與邏輯 (紅字、洗牌與鎖定版) ---
    const readingStage3Screen = document.getElementById('reading-stage3-screen');
    const exitReadingS3Btn = document.getElementById('exit-reading-s3-btn');
    const s3StoryView = document.getElementById('s3-story-view');
    const s3QuizView = document.getElementById('s3-quiz-view');
    const storyTitleEl = document.getElementById('story-title');
    const storyContentEl = document.getElementById('story-content');
    const toggleTranslationBtn = document.getElementById('toggle-translation-btn');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const backToStoryBtn = document.getElementById('back-to-story-btn');
    const compQuizContainer = document.getElementById('comprehension-quiz-container');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');

    const s3AlertModal = document.getElementById('s3-alert-modal');
    const s3AlertTitle = document.getElementById('s3-alert-title');
    const s3AlertDesc = document.getElementById('s3-alert-desc');
    const closeS3AlertBtn = document.getElementById('close-s3-alert-btn');

    // --- 新有程式碼：老師專屬全局外掛開關元素綁定 ---
    const teacherGodBtn = document.getElementById('teacher-god-btn');
    const godTextEl = teacherGodBtn ? teacherGodBtn.querySelector('.god-text') : null;

    // 👇 --- 1. 新增：GAS API 網址與資料發送函數 --- 👇
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwF_3V5rjtgjKcUkoHqERRiAA92PqlxDOg-zwIavJbP_Bw-tZcXnLqqJZ6BloM6rvnb/exec';

    // 👇 新增全域碼錶變數 👇
    let taskStartTime = 0;

    // 👇 修改 1：擴充函式參數，接收正確率 (accuracy) 與時間 (timeSpent) 👇
    function sendDataToGAS(taskType, status, errorDetails = '', accuracy = 0, timeSpent = 0) {
        const studentName = localStorage.getItem('weekly_english_name');
        if (!studentName) return;

        const isClass = localStorage.getItem('weekly_english_is_class') === 'true';
        const deviceId = navigator.userAgent.substring(0, 30) + " / " + window.innerWidth + "x" + window.innerHeight;

        const payload = {
            studentName: studentName,
            taskType: taskType,
            status: status,
            errorLog: errorDetails,
            deviceId: deviceId,
            isClass: isClass,
            accuracy: accuracy,   // 👈 新增：打包正確率
            timeSpent: timeSpent  // 👈 新增：打包花費秒數
        };

        // 以背景非同步方式發送，不阻擋學生原本的遊戲畫面
        fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => console.log(`✅ [${taskType}] 雲端同步成功:`, data))
            .catch(error => console.error('❌ 雲端同步失敗:', error));
    }
    // 👆 ------------------------------------------------ 👆

    // 綁定各關卡的作弊框
    const vocabCheatBox = document.getElementById('vocab-cheat-box');
    const listCheatBox = document.getElementById('list-cheat-box');
    const readCheatBox = document.getElementById('read-cheat-box');

    let isGodMode = false;

    // 偵測是否為本機環境 (Live Server)
    const hostname = window.location.hostname;
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
        if (teacherGodBtn) {
            teacherGodBtn.style.display = 'flex'; // 顯示左上角外掛按鈕
        }
    }

    // --- 替換：老師專區介面控制邏輯 ---
    const teacherReviewModal = document.getElementById('teacher-review-modal');
    const closeTeacherReviewBtn = document.getElementById('close-teacher-review-btn');
    const tabViewAllBtn = document.getElementById('tab-view-all-btn');
    const tabSimPlayBtn = document.getElementById('tab-sim-play-btn');
    const tabClearBindBtn = document.getElementById('tab-clear-bind-btn'); // 👈 新增這行
    const teacherReviewContent = document.getElementById('teacher-review-content');

    if (teacherGodBtn) {
        teacherGodBtn.addEventListener('click', () => {
            teacherReviewModal.style.display = 'block';
            teacherReviewContent.style.display = 'none'; // 預設先隱藏下方長長的題目區

            // 💡 新增：每次打開選單時，依據狀態動態更新按鈕文字與顏色
            if (isGodMode) {
                tabSimPlayBtn.innerHTML = '🔴 關閉模擬作答 (關外掛)';
                tabSimPlayBtn.style.backgroundColor = '#E74C3C';
            } else {
                tabSimPlayBtn.innerHTML = '🎮 模擬作答 (開外掛)';
                tabSimPlayBtn.style.backgroundColor = '#F39C12';
            }
        });
    }

    if (closeTeacherReviewBtn) {
        closeTeacherReviewBtn.addEventListener('click', () => {
            teacherReviewModal.style.display = 'none';
        });
    }

    if (tabSimPlayBtn) {
        // 💡 修正：將模擬作答按鈕改為「切換式開關 (Toggle)」
        tabSimPlayBtn.addEventListener('click', () => {
            isGodMode = !isGodMode; // 反轉狀態

            if (isGodMode) {
                // 開啟狀態
                teacherGodBtn.classList.add('active');
                if (godTextEl) godTextEl.textContent = '外掛: ON';
                alert('🎮 模擬作答模式已開啟！\n您現在可以點擊進入各關卡，畫面會強制顯示偵探作弊框。');
            } else {
                // 關閉狀態
                teacherGodBtn.classList.remove('active');
                if (godTextEl) godTextEl.textContent = '老師專區'; // 恢復原本文字
                alert('🔴 模擬作答模式已關閉！\n作弊框已隱藏。');
            }

            updateCheatBoxesVisibility();
            teacherReviewModal.style.display = 'none'; // 切換後自動關閉選單
        });
    }

    if (tabViewAllBtn) {
        // 點擊查看所有題目：展開區域並呼叫渲染資料的函式
        tabViewAllBtn.addEventListener('click', () => {
            teacherReviewContent.style.display = 'block';
            renderTeacherReview();
        });
    }

    // 老師專區：切換學生與解除綁定
    if (tabClearBindBtn) {
        tabClearBindBtn.addEventListener('click', () => {
            const currentName = localStorage.getItem('weekly_english_name');
            const msg = currentName ? `確定要解除「${currentName}」的裝置綁定嗎？` : `目前無人綁定，確定要強制清空本機所有殘留進度嗎？`;
            
            if (confirm(`${msg}\n(這將徹底刪除這台設備上所有學生的過關記憶)`)) {
                // 1. 清除基礎設定
                localStorage.removeItem('weekly_english_name');
                localStorage.removeItem('weekly_english_is_class');
                localStorage.removeItem('weekly_english_last_update');

                // 2. 迴圈掃描並清除「所有」包含 progress_ 的過關紀錄
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('progress_')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));

                alert('✅ 已解除綁定，本機所有通關紀錄已徹底清空！');
                location.reload(); 
            }
        });
    }

    // --- 實作：教材全覽靜態校對系統 ---
    function renderTeacherReview() {
        if (!vocabData.length && !listeningData.length) {
            teacherReviewContent.innerHTML = '<h3 style="text-align: center; color: #e74c3c;">⚠️ 尚未成功載入題庫，請確認 weekly_data.json 是否正常。</h3>';
            return;
        }

        let html = '';

        // --- 區塊 1：聽力二（短句理解） ---
        html += `
            <div class="teacher-section-title" onclick="toggleTeacherElement('sec-list2')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                <span>🎧 聽力二：短句理解 (點擊展開/收合)</span>
                <span id="arrow-sec-list2" style="color: #8E44AD;">▼</span>
            </div>
            <div id="sec-list2" style="display: none; margin-bottom: 15px;">
        `;
        listeningStage2Data.forEach((q, idx) => {
            let fullText = q.sentence.replace('_______', q.correct);
            html += `
                <div class="teacher-item-box">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
                        <strong style="font-size: 17px; color: #333;">第 ${idx + 1} 題：${q.sentence}</strong>
                        <button class="sound-btn" style="padding: 4px 10px; font-size: 14px; white-space: nowrap;" 
                            onclick="window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance('${fullText.replace(/'/g, "\\'")}'); u.lang = 'en-US'; u.rate = 0.8; window.speechSynthesis.speak(u);">
                            🔊 單題發音
                        </button>
                    </div>
                    <div style="margin-top: 5px;">🎯 正確答案 (翻譯)：<span style="color: #27AE60; font-weight: bold;">${q.translation || q.chinese}</span></div>
                    <div style="color: #7f8c8d; font-size: 14px; margin-top: 3px;">❌ 錯誤選項：${q.distractors.join(', ')}</div>
                    <div style="font-size: 14px; color: #8E44AD; margin-top: 5px; background: #F5EEF8; padding: 4px 8px; border-radius: 4px;">💡 重點提示：${q.hint || '無'}</div>
                </div>
            `;
        });
        html += `</div>`; // 聽力二收合

        // --- 區塊 2：聽力三（情境對話） ---
        html += `
            <div class="teacher-section-title" onclick="toggleTeacherElement('sec-list3')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                <span>🎧 聽力三：情境對話 (點擊展開/收合)</span>
                <span id="arrow-sec-list3" style="color: #8E44AD;">▼</span>
            </div>
            <div id="sec-list3" style="display: none; margin-bottom: 15px;">
        `;
        listeningStage3Data.forEach((article, aIdx) => {
            let fullArticleText = article.articleContent.map(line => line.en.replace(/'/g, "\\'")).join('. ');
            html += `
                <button class="teacher-article-btn" onclick="toggleTeacherElement('t-list3-${aIdx}')">
                    <span>📜 ${article.title || '未命名短文'}</span>
                    <span id="arrow-t-list3-${aIdx}">▼</span>
                </button>
                <div id="t-list3-${aIdx}" class="teacher-article-content">
                    <div style="margin-bottom: 15px; padding: 12px; background: #F4F7F6; border-radius: 8px; border-left: 4px solid #16A085;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
                            <strong style="color: #16A085;">📖 聽力對話原文稿</strong>
                            <button class="sound-btn" style="padding: 4px 12px; font-size: 14px;" 
                                onclick="window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance('${fullArticleText}'); u.lang = 'en-US'; u.rate = 0.8; window.speechSynthesis.speak(u);">
                                🔊 播放整篇短文
                            </button>
                        </div>
            `;
            article.articleContent.forEach(line => {
                html += `<p style="margin-bottom: 6px; line-height: 1.4;">• <strong>${line.en}</strong><br><span style="color: #7F8C8D; font-size: 14px;">${line.zh}</span></p>`;
            });
            html += `</div><h4 style="color: #2C3E50; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 15px;">❓ 下屬測驗問題</h4>`;

            article.questions.forEach((q, qIdx) => {
                let cleanQText = q.question.replace(/[\u4e00-\u9fa5\u3000-\u303F\uFF00-\uFFEF()[\]{}]/g, '').trim().replace(/'/g, "\\'");
                html += `
                    <div style="margin: 8px 0; padding: 10px; border-left: 3px solid #3498DB; background: #F7F9FA; border-radius: 0 4px 4px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong>問 ${qIdx + 1}：${q.question}</strong>
                            <button class="sound-btn" style="padding: 2px 8px; font-size: 13px;" 
                                onclick="window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance('${cleanQText}'); u.lang = 'en-US'; u.rate = 0.8; window.speechSynthesis.speak(u);">
                                🔊 播問題
                            </button>
                        </div>
                        <div style="margin-top: 4px;">🎯 正確答案：<span style="color: #27AE60; font-weight: bold;">${q.correct}</span></div>
                        <div style="color: #7F8C8D; font-size: 14px;">📝 所有選項：${q.options.join('  |  ')}</div>
                    </div>
                `;
            });
            html += `</div>`;
        });
        html += `</div>`; // 聽力三收合

        // --- 區塊 3：閱讀一（單句選擇） ---
        html += `
            <div class="teacher-section-title" onclick="toggleTeacherElement('sec-read1')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                <span>📖 閱讀一：單句選擇 (點擊展開/收合)</span>
                <span id="arrow-sec-read1" style="color: #8E44AD;">▼</span>
            </div>
            <div id="sec-read1" style="display: none; margin-bottom: 15px;">
        `;
        readingStage1Data.forEach((q, idx) => {
            let highlightedSentence = q.sentence.replace('_______', `<span style="color: #E74C3C; font-weight: bold; text-decoration: underline; font-size: 18px;">${q.correct}</span>`);
            html += `
                <div class="teacher-item-box">
                    <strong>第 ${idx + 1} 題：${highlightedSentence}</strong>
                    <div style="margin-top: 6px; background: #FBFCFC; padding: 8px; border-radius: 4px; border: 1px dashed #EAEDED;">
                        <div>💬 中文翻譯：<span style="color: #2C3E50; font-weight: bold;">${q.translation}</span></div>
                        <div style="font-size: 14px; color: #8E44AD; margin-top: 4px;">💡 重點解析：${q.hint}</div>
                    </div>
                    <div style="color: #7F8C8D; font-size: 13px; margin-top: 5px;">❌ 錯誤干擾項：${q.distractors.join(', ')}</div>
                </div>
            `;
        });
        html += `</div>`; // 閱讀一收合

        // --- 區塊 4：閱讀二（短文填空） ---
        html += `
            <div class="teacher-section-title" onclick="toggleTeacherElement('sec-read2')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                <span>📖 閱讀二：短文填空 (點擊展開/收合)</span>
                <span id="arrow-sec-read2" style="color: #8E44AD;">▼</span>
            </div>
            <div id="sec-read2" style="display: none; margin-bottom: 15px;">
        `;
        readingStage2Data.forEach((article, aIdx) => {
            let filledArticle = article.article;
            let translationList = [];
            article.blanks.forEach(blank => {
                filledArticle = filledArticle.replace(blank.marker, `<span style="color: #27AE60; font-weight: bold; text-decoration: underline;">${blank.correct}</span>`);
                if (blank.translation) {
                    translationList.push(`• <strong>${blank.correct}</strong>: ${blank.translation} <span style="color:#8E44AD;">(解析: ${blank.hint || '無'})</span>`);
                }
            });
            html += `
                <div class="teacher-item-box">
                    <h4 style="color: #2980B9; margin-bottom: 8px; font-size: 17px;">📜 文章標題：${article.title || '未命名填空短文'}</h4>
                    <div style="line-height: 2.0; margin-bottom: 12px; padding: 12px; background: #F9EBEA; border-radius: 8px; font-size: 17px; color: #333;">
                        ${filledArticle}
                    </div>
            `;
            if (translationList.length > 0) {
                html += `
                    <div style="border-top: 1px dashed #CD6155; padding-top: 8px; font-size: 14px; color: #5D6D7E; background: #FDEDEC; padding: 10px; border-radius: 6px;">
                        <strong>🔍 挖空字詞解析與中文對照：</strong><br>
                        ${translationList.join('<br>')}
                    </div>
                `;
            }
            html += `</div>`;
        });
        html += `</div>`; // 閱讀二收合

        // --- 區塊 5：閱讀三（故事理解） ---
        html += `
            <div class="teacher-section-title" onclick="toggleTeacherElement('sec-read3')" style="cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                <span>📖 閱讀三：故事理解 (點擊展開/收合)</span>
                <span id="arrow-sec-read3" style="color: #8E44AD;">▼</span>
            </div>
            <div id="sec-read3" style="display: none; margin-bottom: 15px;">
        `;
        readingStage3Data.forEach((story, sIdx) => {
            html += `
                <button class="teacher-article-btn" onclick="toggleTeacherElement('t-read3-${sIdx}')">
                    <span>📜 ${story.title || '未命名故事'}</span>
                    <span id="arrow-t-read3-${sIdx}">▼</span>
                </button>
                <div id="t-read3-${sIdx}" class="teacher-article-content">
                    <div style="margin-bottom: 15px; padding: 12px; background: #FEF9E7; border-radius: 8px; border-left: 4px solid #F39C12;">
                        <strong style="color: #D35400; display: block; margin-bottom: 8px; border-bottom: 1px solid #FADBD8; padding-bottom: 4px;">📖 故事原文與中文對照表</strong>
            `;
            story.articleContent.forEach(line => {
                html += `<p style="margin-bottom: 8px; line-height: 1.4;">• <strong>${line.en}</strong><br><span style="color: #27AE60; font-size: 14px;">[中] ${line.zh}</span></p>`;
            });
            html += `</div><h4 style="color: #2C3E50; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 15px;">❓ 閱讀理解測驗題</h4>`;

            story.questions.forEach((q, qIdx) => {
                html += `
                    <div style="margin: 8px 0; padding: 10px; border-left: 3px solid #F39C12; background: #FEF9E7; border-radius: 0 4px 4px 0;">
                        <strong>問 ${qIdx + 1}：${q.question}</strong>
                        <div style="margin-top: 4px;">🎯 正確答案：<span style="color: #27AE60; font-weight: bold;">${q.correct}</span></div>
                        <div style="color: #7F8C8D; font-size: 14px; margin-top: 2px;">📝 所有選項：${q.options.join('  |  ')}</div>
                    </div>
                `;
            });
            html += `</div>`;
        });
        html += `</div>`; // 閱讀三收合

        teacherReviewContent.innerHTML = html;
    }

    // 💡 全域輔助函式：控制老師專區中摺疊面板的展開與收合狀態
    window.toggleTeacherElement = function (id) {
        const el = document.getElementById(id);
        const arrow = document.getElementById('arrow-' + id);
        if (el) {
            const isHidden = window.getComputedStyle(el).display === 'none';
            el.style.display = isHidden ? 'block' : 'none';
            if (arrow) {
                arrow.textContent = isHidden ? '▲' : '▼';
            }
        }
    };

    function updateCheatBoxesVisibility() {
        const displayStyle = isGodMode ? 'block' : 'none';
        if (vocabCheatBox) vocabCheatBox.style.display = displayStyle;
        if (listCheatBox) listCheatBox.style.display = displayStyle;
        if (readCheatBox) readCheatBox.style.display = displayStyle;
    }

    let vocabData = [];
    let listeningData = [];
    let listeningStage2Data = [];
    let listeningStage3Data = [];
    let readingStage1Data = [];
    let readingStage2Data = [];
    let currentReading2Article = null;
    let readingStage3Data = [];

    // 👇 修改 1：在此新增一個變數來儲存當週密碼 👇
    let currentClassPasscode = "888";

    // --- 新增：讀取 JSON 檔案的非同步函數 ---
    async function loadGameData() {
        try {
            // 讀取同一個資料夾下的 weekly_data.json
            const response = await fetch('weekly_data.json');
            const data = await response.json();

            // 👇 修改 2：擷取 JSON 中的密碼 (若無則給預設值) 👇
            currentClassPasscode = data.classPasscode || "888";
            // 👇 --- 全新：使用「日期」自動偵測並重置本機進度 --- 👇
            const newUpdateDate = data.updateDate || "2026-07-11"; // 如果 JSON 沒寫，給個預設防呆日期

            // ==========================================
            // 👇 請在這裡插入下面這三行，把日期寫入畫面 👇
            const versionDateEl = document.getElementById('version-date');
            if (versionDateEl) {
                versionDateEl.textContent = `📅 題庫更新日期：${newUpdateDate}`;
            }
            // 👆 插入結束 👆
            // ==========================================
            // ==========================================
            // 👇 新增這三行：同步把日期寫入首頁大廳的標籤 👇
            const dashboardVersionDateEl = document.getElementById('dashboard-version-date');
            if (dashboardVersionDateEl) {
                dashboardVersionDateEl.textContent = `📅 題庫更新日期：${newUpdateDate}`;
            }
            // 👆 新增結束 👆
            // ==========================================
            const savedUpdateDate = localStorage.getItem('weekly_english_last_update');

            // 如果本機已經存過舊日期，且跟新題庫的日期「不一樣」，代表老師更新題庫了！
            if (savedUpdateDate && savedUpdateDate !== newUpdateDate) {
                console.log(`🔄 偵測到新題庫 (日期: ${newUpdateDate})！自動重置本機進度...`);
                
                const currentName = localStorage.getItem('weekly_english_name');
                if (currentName) {
                    // 核心動作：銷毀該學生的過關記憶，讓聽力與閱讀重新上鎖
                    localStorage.removeItem(`progress_${currentName}`);
                    
                    // 👇 加上這兩行：換週時，一併銷毀裝置綁定與本班身分，強迫重新輸入密碼！
                    localStorage.removeItem('weekly_english_name');
                    localStorage.removeItem('weekly_english_is_class');
                }
                
                // 存入新日期，避免無限重新整理
                localStorage.setItem('weekly_english_last_update', newUpdateDate);
                
                // 強制網頁重新整理，確保畫面上的所有鎖頭與燈號回到最原始狀態
                location.reload();
                return; // 終止下方讀取，交給重新整理後的網頁處理
                
            } else if (!savedUpdateDate) {
                // 如果是這台設備「第一次」玩，單純把新日期存起來就好
                localStorage.setItem('weekly_english_last_update', newUpdateDate);
            }
            // 👆 --- 日期自動重置機制結束 --- 👆

            // 將 JSON 裡的資料塞進全域變數中
            vocabData = data.vocabData || [];
            listeningData = data.listeningData || [];
            listeningStage2Data = data.listeningStage2Data || [];

            // 聽力第三關如果是空的，保留原本的防呆文字
            listeningStage3Data = data.listeningStage3Data || [{ id: 301, english: "Wait for development.", chinese: "情境對話開發中", distractors: ["錯誤選項一", "錯誤選項二"] }];

            readingStage1Data = data.readingStage1Data || [];
            readingStage2Data = data.readingStage2Data || [];
            readingStage3Data = data.readingStage3Data || [];

            console.log("✅ 成功載入本週題庫！");
        } catch (error) {
            console.error("載入 JSON 失敗：", error);
            alert("無法讀取題庫！請確認 weekly_data.json 是否存在，並確認您是透過本機伺服器 (Live Server) 開啟網頁。");
        }
    }

    // 網頁初始化時立刻執行讀取資料
    loadGameData();

    let currentStoryData = null;
    let currentS3Questions = []; // 💡 新增：用來存放抽出來的 3 題
    let s3UserAnswers = {};
    let isTranslationVisible = false;
    let isS3PunishmentMode = false;

    // --- 更新：全域任務追蹤變數 (加入閱讀進度) ---
    let currentTask = '';
    let isVocabCompleted = false;
    let currentListIndex = 0;
    let listQuizData = [];
    let currentListeningStage = 1;
    let currentReadingStage = 1; // 👈 閱讀當前階段
    let currentReadIndex = 0;    // 👈 閱讀當前題號
    let readQuizData = [];       // 👈 閱讀當前題庫
    let userProgress = { listeningMaxStage: 1, readingMaxStage: 1 }; // 記憶最高關卡

    // --- 新增：單字關卡狀態控制與軌跡紀錄變數 ---
    let currentQuestionIndex = 0;
    let errorLog = {};         // 記錄錯題與點選過的錯誤選項
    let hasRetried = false;    // 記錄是否按過「再來一次」
    let currentQuizData = [];  // 當前要測驗的題目陣列 (支援重試過濾)

    closeS3AlertBtn.addEventListener('click', () => {
        s3AlertModal.classList.remove('active');
    });

    function showS3Alert(title, desc) {
        s3AlertTitle.textContent = title;
        s3AlertDesc.textContent = desc;
        s3AlertModal.classList.add('active');
    }

    startQuizBtn.addEventListener('click', () => {
        s3StoryView.style.display = 'none';
        s3QuizView.style.display = 'block';
    });

    backToStoryBtn.addEventListener('click', () => {
        s3QuizView.style.display = 'none';
        s3StoryView.style.display = 'block';

        if (isS3PunishmentMode) {
            // 💡 答錯懲罰：強制將畫面上所有翻譯展開
            document.querySelectorAll('.s3-trans-line').forEach(el => el.style.display = 'block');

            startQuizBtn.disabled = true;
            let timeLeft = 10;
            startQuizBtn.style.backgroundColor = '#f5f5f5';
            startQuizBtn.style.color = '#999';
            startQuizBtn.textContent = `鎖定中 (${timeLeft}s)`;

            const timer = setInterval(() => {
                timeLeft--;
                if (timeLeft > 0) {
                    startQuizBtn.textContent = `鎖定中 (${timeLeft}s)`;
                } else {
                    clearInterval(timer);
                    startQuizBtn.disabled = false;
                    startQuizBtn.style.backgroundColor = '#fff';
                    startQuizBtn.style.color = '#333';
                    startQuizBtn.textContent = '📝 再次開始測驗';

                    isS3PunishmentMode = false;
                    
                    // 👇 核心修改：在解鎖的瞬間，重新從大題庫中抽取 3 題全新題目 👇
                    currentS3Questions = shuffleArray([...currentStoryData.questions]).slice(0, 3);
                    // 👆 修改結束 👆

                    renderS3Quiz();
                }
            }, 1000);
        }
    });

    function loadReadingStage3() {

        // 💡 實作：從 5 題中隨機洗牌，並只取出前 3 題
        currentS3Questions = shuffleArray([...currentStoryData.questions]).slice(0, 3);

        isTranslationVisible = false;
        isS3PunishmentMode = false;
        errorLog = {};

        s3StoryView.style.display = 'block';
        s3QuizView.style.display = 'none';

        startQuizBtn.disabled = false;
        startQuizBtn.style.backgroundColor = '#fff';
        startQuizBtn.style.color = '#333';
        startQuizBtn.textContent = '📝 開始測驗';

        toggleTranslationBtn.disabled = false;
        toggleTranslationBtn.style.backgroundColor = '#fff';
        toggleTranslationBtn.style.color = '#333';
        toggleTranslationBtn.style.cursor = 'pointer';

        storyTitleEl.textContent = currentStoryData.title || "故事理解";
        storyContentEl.innerHTML = '';

        // 💡 自動尋找這篇文章在第二關的資料，用來解開克漏字
        const matchingS2 = readingStage2Data.find(s2 => s2.id === (currentStoryData.id - 100));

        currentStoryData.articleContent.forEach((line, index) => {
            let enText = line.en;
            // 如果有找到對應資料，把 {{1}} 等記號換成正確單字
            if (matchingS2 && matchingS2.blanks) {
                matchingS2.blanks.forEach(blank => {
                    enText = enText.replace(blank.marker, blank.correct);
                });
            }

            const p = document.createElement('p');
            p.style.marginBottom = '10px';
            p.style.cursor = 'pointer';

            p.onclick = () => {
                if (isS3PunishmentMode) return;
                const targetTrans = document.getElementById(`s3-trans-${index}`);
                const isAlreadyVisible = targetTrans.style.display === 'block';
                document.querySelectorAll('.s3-trans-line').forEach(el => el.style.display = 'none');
                if (!isAlreadyVisible) {
                    targetTrans.style.display = 'block';
                }
            };

            p.innerHTML = `
                <span style="color: #333; font-weight: bold;">${enText}</span>
                <span id="s3-trans-${index}" class="s3-trans-line" style="display: none; color: #27AE60; font-size: 16px; margin-top: 4px; border-left: 3px solid #27AE60; padding-left: 8px;">${line.zh}</span>
            `;
            storyContentEl.appendChild(p);
        });

        // 💡 隱藏畫面上原本的「👀 中文翻譯」按鈕 (因為現在改成點句子了)
        toggleTranslationBtn.style.display = 'none';
        // 👇 修正：新增這行，呼叫渲染題目的函數，這樣點擊「開始測驗」才會有東西！
        renderS3Quiz();
    } // 這是 loadReadingStage3() 的結尾大括號

    function renderS3Quiz() {
        compQuizContainer.innerHTML = '';
        s3UserAnswers = {};

        submitQuizBtn.disabled = false;
        submitQuizBtn.style.backgroundColor = '#fff';
        submitQuizBtn.style.color = '#333';

        // 💡 實作：每次渲染題目時，將這 3 題的順序再次打亂
        currentS3Questions = shuffleArray([...currentS3Questions]);

        currentS3Questions.forEach((q, index) => {
            const qBlock = document.createElement('div');
            qBlock.style.marginBottom = '20px';
            qBlock.style.padding = '15px';
            qBlock.style.backgroundColor = '#f9f9f9';
            qBlock.style.borderRadius = '8px';
            qBlock.style.border = '1px solid #ddd';

            const title = document.createElement('div');
            // 動態加上 1. 2. 3. 的題號
            title.textContent = `${index + 1}. ${q.question}`;
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '10px';
            title.style.fontSize = '18px';
            title.style.color = '#333';
            qBlock.appendChild(title);

            let shuffledOptions = shuffleArray([...q.options]);

            shuffledOptions.forEach(opt => {
                const optItem = document.createElement('div');
                optItem.textContent = opt;
                optItem.style.padding = '10px';
                optItem.style.margin = '5px 0';
                optItem.style.borderRadius = '5px';
                optItem.style.cursor = 'pointer';
                optItem.style.border = '1px solid #ccc';
                optItem.style.backgroundColor = '#fff';
                optItem.style.transition = 'all 0.2s';
                // 👇 在設定樣式之後、optItem.onclick 之前，加入這段外掛判定 👇
                if (isGodMode && opt === q.correct) {
                    optItem.style.backgroundColor = '#FDEDEC';
                    optItem.style.color = '#E74C3C';
                    optItem.style.borderColor = '#E74C3C';
                    optItem.style.fontWeight = 'bold';
                    optItem.innerHTML = `🌟 ${opt}`; // 加上星星圖示與紅色標示
                }
                // 👆 加入結束 👆
                optItem.onclick = () => {
                    if (isS3PunishmentMode) return;

                    Array.from(qBlock.children).forEach(child => {
                        if (child !== title) {
                            child.style.backgroundColor = '#fff';
                            child.style.color = '#333';
                            child.style.borderColor = '#ccc';
                        }
                    });
                    optItem.style.backgroundColor = '#3498DB';
                    optItem.style.color = '#fff';
                    optItem.style.borderColor = '#3498DB';

                    s3UserAnswers[q.qId] = { value: opt, btn: optItem };
                };
                qBlock.appendChild(optItem);
            });
            compQuizContainer.appendChild(qBlock);
        });
    }

    submitQuizBtn.addEventListener('click', () => {
        const totalQ = currentS3Questions.length;
        if (Object.keys(s3UserAnswers).length < totalQ) {
            showS3Alert("💡 提示", `請回答完所有問題喔！目前已答 ${Object.keys(s3UserAnswers).length} / ${totalQ} 題。`);
            return;
        }

        let hasError = false;

        // 檢查選出的 3 題答案
        currentS3Questions.forEach(q => {
            const userAnswer = s3UserAnswers[q.qId];
            if (userAnswer.value !== q.correct) {
                hasError = true;

                userAnswer.btn.style.backgroundColor = '#E74C3C';
                userAnswer.btn.style.borderColor = '#C0392B';
                userAnswer.btn.style.color = '#FFF';

                const errorId = "s3_" + q.qId;
                if (!errorLog[errorId]) {
                    errorLog[errorId] = { word: q.question, correct: q.correct, mistakes: [userAnswer.value] };
                }
            }
        });

        if (!hasError) {
            // 💡 修正：第三關只要「當次全對」就算通關！
            // 在呼叫過關視窗前，強制清空錯題本，系統就會直接發放過關通知
            errorLog = {};
            showCompletionModal();
        } else {
            showS3Alert("⚠️ 答錯囉！", "有錯，請再仔細閱讀文章。");

            isS3PunishmentMode = true;
            submitQuizBtn.disabled = true;
            submitQuizBtn.style.backgroundColor = '#f5f5f5';
            submitQuizBtn.style.color = '#999';
        }
    });

    // --- 新增：分流群組標記與大循環進度 ---
    let isReadingGroup = false;
    let currentReadingLoop = 1; // 記錄目前在閱讀(一)還是閱讀(二)
    let usedArticleId = null;   // 記錄第一循環抽到的文章 ID

    // 1. 檢查 LocalStorage 是否已有裝置登入紀錄
    const savedName = localStorage.getItem('weekly_english_name');
    if (savedName) {
        const savedProgress = localStorage.getItem(`progress_${savedName}`);
        if (savedProgress) {
            userProgress = JSON.parse(savedProgress);
            if (!userProgress.readingMaxStage) userProgress.readingMaxStage = 1;
        }

        // 💡 裝置鎖定：隱藏輸入框，修改登入按鈕為「歡迎回來」
        const nameInputEl = document.getElementById('student-name');
        if (nameInputEl) nameInputEl.style.display = 'none';
        loginBtn.textContent = `歡迎回來，${savedName}！`;
        loginBtn.style.backgroundColor = '#27AE60';
        loginBtn.style.color = '#FFF';
    }

    // 2. 點擊登入按鈕事件
    loginBtn.addEventListener('click', async () => { // 👈 加上 async 支援非同步查詢
        const nameInputEl = document.getElementById('student-name');
        
        let rawName = "";
        let isClass = false; // 預設身分為訪客路人

        // 👇 核心修正：判斷是「歡迎回來(已綁定)」還是「全新登入」
        if (savedName) {
            // 情況 A：這台設備在當週已經綁定過
            rawName = savedName;
            isClass = localStorage.getItem('weekly_english_is_class') === 'true';
        } else {
            // 情況 B：全新登入 (或換週後被解除綁定)
            rawName = nameInputEl.value.trim();
            if (rawName === '') {
                alert('請輸入你的名字喔！');
                return;
            }

            // 檢查輸入的名字是否以當週密碼結尾
            if (rawName.endsWith(currentClassPasscode) && currentClassPasscode !== "") {
                isClass = true; // 標記為本班生
                rawName = rawName.slice(0, -currentClassPasscode.length).trim();
            }
            // 只有「全新登入」時，才將身分印章存入 LocalStorage
            localStorage.setItem('weekly_english_is_class', isClass.toString());
        }

        // 💡 名字防呆自動校正 (不論大小寫，一律轉為標準格式)
        let name = rawName.toLowerCase();

        if (name === 'wayne') name = 'Wayne';
        else if (name === 'kevin') name = 'Kevin';
        else if (name === 'jimmy') name = 'Jimmy';
        else if (name === '大anna') name = '大Anna';
        else if (name === '小anna') name = '小Anna';
        else {
            name = name.replace(/(^|[^a-zA-Z])([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
        }

        // 若發現系統內有舊格式(全小寫)的進度，進行無痛轉移
        if (rawName !== name) {
            let oldProgress = localStorage.getItem(`progress_${rawName}`);
            if (oldProgress && !localStorage.getItem(`progress_${name}`)) {
                localStorage.setItem(`progress_${name}`, oldProgress);
            }
        }

        if (!savedName) {
            localStorage.setItem('weekly_english_name', name);
            alert(`✅ 裝置已綁定！這台機器以後是 ${name} 專屬囉！`);
        } else if (savedName !== name) {
            localStorage.setItem('weekly_english_name', name);
        }

        // 先給予最基本進度，這確保了未輸入密碼的「訪客」一律從單字(第一關)開始
        const localProgress = localStorage.getItem(`progress_${name}`);
        if (localProgress) {
            userProgress = JSON.parse(localProgress);
            if (!userProgress.readingMaxStage) userProgress.readingMaxStage = 1;
        } else {
            userProgress = { listeningMaxStage: 1, readingMaxStage: 1 };
        }

        // 👇 跨裝置無縫接續核心邏輯 👇
        // 如果是「本班生」且為「全新登入」(本機還沒有任何進度)，我們主動向雲端拉取燈號！
        if (isClass && !localProgress) {
            loginBtn.textContent = '🔄 正在同步雲端進度...';
            loginBtn.disabled = true;
            try {
                const noCacheUrl = GAS_URL + '?t=' + new Date().getTime();
                const response = await fetch(noCacheUrl);
                const res = await response.json();
                
                if (res.status === 'success' && res.data.classData[name]) {
                    const lights = res.data.classData[name]; // 雲端的三顆燈：[L1, L2, L3, finalTime]
                    const isReadGrp = (name === 'Wayne' || name === 'Kevin');
                    
                    // 第 1 顆燈：單字過關
                    if (lights[0] === 2) isVocabCompleted = true; 
                    
                    // 第 2 顆燈：聽力(常規) 或 閱讀一(強化組) 過關
                    if (lights[1] === 2) {
                        if (isReadGrp) {
                            currentReadingLoop = 2; // 開放閱讀二
                            userProgress.readingMaxStage = 4; // 閱讀一全破 (階段全部解鎖)
                        } else {
                            userProgress.listeningMaxStage = 4; // 聽力全破 (階段全部解鎖)
                        }
                    }
                    
                    // 第 3 顆燈：閱讀(常規) 或 閱讀二(強化組) 過關
                    if (lights[2] === 2) {
                        userProgress.readingMaxStage = 4; // 閱讀全破
                        if (isReadGrp) currentReadingLoop = 3; // 雙循環全破
                    }

                    // 將算好的進度寫回本機，完成無縫接軌！
                    localStorage.setItem(`progress_${name}`, JSON.stringify(userProgress));
                }
            } catch (err) {
                console.error("雲端同步失敗", err);
            }
            loginBtn.textContent = '開始挑戰 🚀';
            loginBtn.disabled = false;
        }

        showDashboard(name);
    });

    // 3. 切換到首頁大廳的共用邏輯 (加入分流判定與標題顯示)
    function showDashboard(studentName) {
        loginScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
        console.log(`歡迎 ${studentName} 進入遊戲大廳！`);

        // 💡 顯示目前使用的學生帳號名稱，並附帶隱藏的「切換學生」按鈕 (供老師測試用)
        const dashboardTitle = document.querySelector('#dashboard-screen .nav-bar h2');
        if (dashboardTitle) {
            // 👇 將原本帶有紅色背景與圖示的按鈕，替換為以下乾淨統一的風格 👇
            dashboardTitle.innerHTML = `任務大廳 <span style="font-size: 15px; color: #8E44AD;">(${studentName})</span> 
                <button id="universal-logout-btn" style="margin-left: 10px; background-color: #FFFFFF; color: #000000; border: 2px solid #3498DB; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">登出</button>`;

            document.getElementById('universal-logout-btn').addEventListener('click', () => {
                if (confirm(`確定要登出「${studentName}」並切換帳號嗎？\n(登出後本設備將不再記憶此帳號的通關進度)`)) {
                    localStorage.removeItem('weekly_english_name');
                    localStorage.removeItem(`progress_${studentName}`);
                    localStorage.removeItem('weekly_english_is_class'); // 👈 新增這行：徹底銷毀身分印章
                    location.reload();
                }
            });
        }

        // 💡 判定是否為閱讀強化組 (修正：必須輸入過通行碼、具備本班生身分才生效！)
        const isClassStudent = localStorage.getItem('weekly_english_is_class') === 'true';
        isReadingGroup = (studentName === 'Wayne' || studentName === 'Kevin') && isClassStudent;

        // 💡 動態替換進度條文字
        const progressSteps = document.querySelector('.progress-steps');
        if (progressSteps) {
            if (isReadingGroup) {
                progressSteps.innerHTML = `
                    <span class="step active">單字</span> ➔
                    <span class="step locked">閱讀(一)</span> ➔
                    <span class="step locked">閱讀(二)</span>
                `;
            } else {
                progressSteps.innerHTML = `
                    <span class="step active">單字</span> ➔
                    <span class="step locked">聽力</span> ➔
                    <span class="step locked">閱讀</span>
                `;
            }
        }

        // 💡 強制在進入大廳時，執行一次排行榜渲染，確保高亮名稱即時出現
        renderLeaderboard(); 
        
        if (isVocabCompleted) updateDashboardUI();
    }

    // 👇 新增本班固定 10 人名單 (依老師希望的預設順序填寫)
    const CLASS_STUDENTS = [
        "Wayne", "Kevin", "Jimmy", "大Anna", "小Anna",
        "Miya", "Mina", "Yanyan", "Sandy", "Sherry"
    ];

    function renderLeaderboard() {
        const studentListEl = document.getElementById('student-list');
        const visitorListEl = document.getElementById('visitor-list'); 
        const classCounterEl = document.getElementById('class-counter'); 
        if (!studentListEl || !visitorListEl) return;

        const lightMap = { 0: '⚪', 1: '🟡', 2: '🟢' };
        // 加上時間戳記強制不抓取快取
        const noCacheUrl = GAS_URL + '?t=' + new Date().getTime();

        console.log("⏳ 正在向雲端請求最新雙英雄榜資料...");

        fetch(noCacheUrl)
            .then(response => response.json())
            .then(res => {
                if (res.status === 'success') {
                    // --- 1. 處理本班進度 ---
                    let classData = res.data.classData || {};
                    let sortedClass = [];
                    let completedCount = 0;

                    CLASS_STUDENTS.forEach((name, index) => {
                        let studentInfo = classData[name] || [0, 0, 0, 0];
                        
                        // 接收三顆燈的狀態
                        let light1 = studentInfo[0];
                        let light2 = studentInfo[1];
                        let light3 = studentInfo[2];
                        
                        let greenCount = (light1 === 2 ? 1 : 0) + (light2 === 2 ? 1 : 0) + (light3 === 2 ? 1 : 0);

                        // 集滿 3 顆綠燈才算全破
                        if (greenCount === 3) completedCount++; 

                        sortedClass.push({
                            name: name,
                            lights: [light1, light2, light3], 
                            greenCount: greenCount,
                            lastTime: studentInfo[3] || 0, 
                            originalOrder: index       
                        });
                    });

                    // 排序邏輯同步更新為 3 顆燈滿分
                    sortedClass.sort((a, b) => {
                        if (b.greenCount !== a.greenCount) return b.greenCount - a.greenCount;
                        if (a.greenCount === 3 && a.lastTime !== b.lastTime) {
                            if (a.lastTime === 0) return 1;
                            if (b.lastTime === 0) return -1;
                            return a.lastTime - b.lastTime; 
                        }
                        return a.originalOrder - b.originalOrder; 
                    });

                    studentListEl.innerHTML = '';
                    const myName = localStorage.getItem('weekly_english_name');
                    const myIsClass = localStorage.getItem('weekly_english_is_class') === 'true';

                    sortedClass.forEach(student => {
                        let nameStyle = (student.name === myName && myIsClass === true)
                            ? 'color: #3498DB; font-weight: 900; background-color: #EBF5FB; padding: 2px 10px; border-radius: 6px;'
                            : '';

                        // 渲染出 3 顆燈，完美對應大廳的 3 個任務階段
                        studentListEl.innerHTML += `
                        <li>
                            <span class="student-name" style="${nameStyle}">${student.name}</span>
                            <div class="lights">
                                <span>${lightMap[student.lights[0]]}</span>
                                <span>${lightMap[student.lights[1]]}</span>
                                <span>${lightMap[student.lights[2]]}</span>
                            </div>
                        </li>
                    `;
                    });
                    classCounterEl.textContent = `${completedCount}/10`;

                    // --- 2. 處理訪客進度 (💡 這裡完美接住全破與挑戰中的名單) ---
                    let visitorData = res.data.visitorData || [];
                    window.pendingVisitorsData = res.data.pendingVisitors || [];
                    window.challengingVisitorsData = res.data.challengingVisitors || []; // 👈 這是最重要的接球手
                    
                    visitorListEl.innerHTML = '';
                    if (visitorData.length === 0) {
                        visitorListEl.innerHTML = '<li style="justify-content:center; color:#999; font-size:14px;">目前還沒有訪客喔！</li>';
                    } else {
                        visitorData.sort((a, b) => {
                            if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy; 
                            return a.timeSpent - b.timeSpent;                              
                        });

                        visitorData = visitorData.slice(0, 10);

                        visitorData.forEach(visitor => {
                            let nameStyle = (visitor.name === myName && myIsClass === false)
                                ? 'color: #3498DB; font-weight: 900; background-color: #EBF5FB; padding: 2px 10px; border-radius: 6px;'
                                : '';

                            let min = Math.floor(visitor.timeSpent / 60);
                            let sec = visitor.timeSpent % 60;
                            let timeText = min > 0 ? `${min}分${sec}秒` : `${sec}秒`;

                            visitorListEl.innerHTML += `
                            <li>
                                <span class="student-name" style="${nameStyle}">${visitor.name}</span>
                                <div class="visitor-stats" style="font-size: 15px; font-weight: bold; color: #8E44AD;">
                                    🎯 ${visitor.accuracy}% <span style="color:#bdc3c7; margin:0 5px;">|</span> ⏱️ ${timeText}
                                </div>
                            </li>
                        `;
                        });
                    }
                } else {
                    console.error("❌ 讀取雲端英雄榜失敗:", res.message);
                }
            })
            .catch(error => console.error("❌ 雲端英雄榜連線失敗:", error));
    }

    // 6. 關卡內點擊「首頁」按鈕，退回大廳 (防呆中斷機制)
    exitVocabBtn.addEventListener('click', () => {
        vocabScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
        // 👇 新增這行：中斷退出時，強制更新榜單 👇
        renderLeaderboard();
    });

    // 功能性洗牌陣列
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    // 5. 點擊大廳按鈕，進入單字關卡
    nextTaskBtn.addEventListener('click', () => {
        dashboardScreen.classList.remove('active');
        vocabScreen.classList.add('active');

        currentTask = 'vocab';
        taskStartTime = Date.now(); // 👈 新增這行：按下碼錶開始計時

        // 👇 --- 2. 新增：發送開始任務的狀態 --- 👇
        sendDataToGAS('單字', '🟡 進行中');
        // 👆 -------------------------------- 👆

        // 初始化測驗狀態
        currentQuestionIndex = 0;
        errorLog = {};
        hasRetried = false;
        currentQuizData = shuffleArray([...vocabData]); // 載入並打亂題庫

        loadVocabQuestion();
    });

    // --- 更新：大廳進度與解鎖按鈕 (專屬按鈕替換) ---
    function updateDashboardUI() {
        if (isVocabCompleted) {
            const steps = document.querySelectorAll('.step');
            if (steps.length > 0) {
                steps[0].classList.remove('active');
                steps[0].classList.add('completed');
            }

            nextTaskBtn.style.display = 'none';

            if (isReadingGroup) {
                // 💡 Wayne & Kevin 專屬介面：隱藏聽力，顯示兩個閱讀
                enterListeningBtn.style.display = 'none';
                enterReadingBtn.style.display = 'block';
                enterReadingBtn.textContent = '📖 進入：閱讀大作戰 (一)';

                // 動態生成第二階段按鈕 (若尚未建立)
                let btnRead2 = document.getElementById('enter-reading-btn-2');
                if (!btnRead2) {
                    btnRead2 = document.createElement('button');
                    btnRead2.id = 'enter-reading-btn-2';
                    btnRead2.className = 'big-btn task-btn';
                    btnRead2.style.marginTop = '15px';
                    btnRead2.addEventListener('click', () => {
                        dashboardScreen.classList.remove('active');
                        currentReadingLoop = 2; // 💡 標記為第二循環
                        startReadingStage(1);   // 💡 一樣從單句選擇開始無縫大循環
                    });
                    document.querySelector('.action-area').appendChild(btnRead2);
                }

                // 根據目前完成度切換燈號與按鈕狀態
                if (currentReadingLoop === 2) {
                    if (steps.length > 2) {
                        steps[1].classList.remove('locked', 'active');
                        steps[1].classList.add('completed');
                        steps[2].classList.remove('locked');
                        steps[2].classList.add('active');
                    }
                    enterReadingBtn.textContent = '✅ 閱讀大作戰 (一) 已完成';
                    enterReadingBtn.disabled = true;
                    enterReadingBtn.style.backgroundColor = '#E5E7E9';

                    btnRead2.style.display = 'block';
                    btnRead2.textContent = '📖 進入：閱讀大作戰 (二)';
                    btnRead2.disabled = false;
                    btnRead2.style.backgroundColor = '#F7F5EE';
                    btnRead2.style.color = '#2C3E50';
                } else {
                    if (steps.length > 1) {
                        steps[1].classList.remove('locked');
                        steps[1].classList.add('active');
                    }
                    btnRead2.style.display = 'block';
                    btnRead2.innerHTML = '🔒 閱讀大作戰 (二)<br><span style="font-size:14px">(請先完成閱讀一)</span>';
                    btnRead2.disabled = true;
                    btnRead2.style.backgroundColor = '#F0F0F0';
                    btnRead2.style.color = '#999';
                }
            } else {
                // 💡 常規組介面
                if (steps.length > 1) {
                    steps[1].classList.remove('locked');
                    steps[1].classList.add('active');
                }
                enterListeningBtn.style.display = 'block';
                enterReadingBtn.style.display = 'block';
                enterReadingBtn.textContent = '📖 進入：閱讀大作戰';

                // 隱藏可能存在的閱讀二按鈕
                let btnRead2 = document.getElementById('enter-reading-btn-2');
                if (btnRead2) btnRead2.style.display = 'none';
            }
        }
    }

    // --- 更新：單字測驗核心邏輯 (加入動態干擾、防重複與複習機制) ---
    function loadVocabQuestion() {
        if (currentQuestionIndex >= currentQuizData.length) {
            showCompletionModal();
            return;
        }

        const currentQ = currentQuizData[currentQuestionIndex];
        currentQNumEl.textContent = currentQuestionIndex + 1;
        totalQNumEl.textContent = vocabData.length;

        englishWordEl.textContent = currentQ.english.toLowerCase();
        playWordAudio(currentQ.english);
        // [外掛] 注入單字解答
        if (vocabCheatBox) {
            vocabCheatBox.innerHTML = `🕵️ 答案：${currentQ.chinese} (${currentQ.english})`;
        }

        // 從當週單字庫抽取其他中文作為干擾項
        let otherItems = vocabData.filter(q => q.id !== currentQ.id);
        otherItems = shuffleArray(otherItems).slice(0, 2);

        let opt2 = otherItems.length > 0 ? otherItems[0].chinese : currentQ.distractors[0];
        let opt3 = otherItems.length > 1 ? otherItems[1].chinese : currentQ.distractors[1];

        // 組合並使用 Set 絕對排除重複項
        let options = [...new Set([currentQ.chinese, opt2, opt3])];
        while (options.length < 3) {
            options.push("備用選項" + options.length); // 防呆機制
        }
        options = shuffleArray(options);

        vocabOptionsEl.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => checkVocabAnswer(opt, currentQ.chinese, btn);
            vocabOptionsEl.appendChild(btn);
        });
    }

    function checkVocabAnswer(selected, correct, btn) {
        if (selected === correct) {
            btn.classList.add('correct');
            const allBtns = vocabOptionsEl.querySelectorAll('.option-btn');
            allBtns.forEach(b => b.disabled = true);

            setTimeout(() => {
                currentQuestionIndex++;
                loadVocabQuestion();
            }, 1000);
        } else {
            btn.disabled = true;
            const currentQ = currentQuizData[currentQuestionIndex];

            // --- 新增：答錯時顯示該選項的英文 (順便複習) ---
            const foundDistractor = vocabData.find(q => q.chinese === selected);
            if (foundDistractor) {
                // 將按鈕文字改為：中文(換行)英文
                btn.innerHTML = `${selected}<br><span style="font-size: 18px; color: #666; margin-top: 5px; display: block;">${foundDistractor.english}</span>`;
            }

            if (!errorLog[currentQ.id]) {
                errorLog[currentQ.id] = { word: currentQ.english, correct: currentQ.chinese, mistakes: [] };
            }
            if (!errorLog[currentQ.id].mistakes.includes(selected)) {
                errorLog[currentQ.id].mistakes.push(selected);
            }
        }
    }

    // --- 新增：全域語速變數 (預設 0.8) ---
    let currentAudioRate = 0.8;

    // --- 新增：獨立的發音功能與按鈕邏輯 ---
    function playWordAudio(text) {
        window.speechSynthesis.cancel(); // 💡 解決問題 1：強制切斷上一句，防止排隊卡住
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = currentAudioRate; // 💡 解決問題 2：套用自訂語速
        window.speechSynthesis.speak(utterance);
    }

    // 取得畫面上所有的語速按鈕 (包含單字和聽力關卡)
    const speedBtns = document.querySelectorAll('.speed-btn');

    // 點擊循環切換語速：0.8 -> 0.6 -> 0.9 -> 0.8 (微調倍速讓發音更自然)
    speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentAudioRate === 0.8) {
                currentAudioRate = 0.6;
                speedBtns.forEach(b => b.innerHTML = '🐌 語速: 0.6x');
            } else if (currentAudioRate === 0.6) {
                currentAudioRate = 0.9;
                speedBtns.forEach(b => b.innerHTML = '🐇 語速: 0.9x');
            } else {
                currentAudioRate = 0.8;
                speedBtns.forEach(b => b.innerHTML = '🐢 語速: 0.8x');
            }
        });
    });

    const playSoundBtn = document.getElementById('play-sound-btn');
    playSoundBtn.addEventListener('click', () => {
        // 將 vocabData 改為 currentQuizData
        const currentQ = currentQuizData[currentQuestionIndex];
        if (currentQ) playWordAudio(currentQ.english);
    });

    // --- 更新：關閉自訂完成視窗事件 (支援解鎖判定與閱讀大循環) ---
    const closeModalBtn = document.getElementById('close-modal-btn');
    const completionModal = document.getElementById('completion-modal');
    closeModalBtn.addEventListener('click', () => {
        completionModal.classList.remove('active');
        vocabScreen.classList.remove('active');
        listeningScreen.classList.remove('active');

        // 確保關閉所有可能開啟的閱讀畫面
        const readingScreen = document.getElementById('reading-screen');
        const readingStage2Screen = document.getElementById('reading-stage2-screen');
        const readingStage3Screen = document.getElementById('reading-stage3-screen');
        if (readingScreen) readingScreen.classList.remove('active');
        if (readingStage2Screen) readingStage2Screen.classList.remove('active');
        if (readingStage3Screen) readingStage3Screen.classList.remove('active');

        dashboardScreen.classList.add('active');

        renderLeaderboard(); // 👈 新增這行：每次關閉結算視窗回大廳，強制重新拉取最新榜單！

        if (Object.keys(errorLog).length === 0) {
            if (currentTask === 'vocab') {
                isVocabCompleted = true;
                updateDashboardUI();
            } else if (currentTask === 'reading' && isReadingGroup && currentReadingStage === 3) {
                // 💡 Wayne 完成了整個閱讀大循環
                if (currentReadingLoop === 1) {
                    currentReadingLoop = 2; // 解鎖閱讀二
                } else if (currentReadingLoop === 2) {
                    currentReadingLoop = 3; // 雙重循環皆完成，全破關
                }
                updateDashboardUI(); // 刷新大廳按鈕狀態
            }
        }
    });

    // --- 更新：結算視窗顯示邏輯 (依據關卡顯示對應按鈕) ---
    function showCompletionModal() {
        const modal = document.getElementById('completion-modal');
        const titleEl = document.getElementById('modal-title');
        const descEl = document.getElementById('modal-desc');
        const errorListEl = document.getElementById('error-list');

        // 取得所有按鈕
        const retryBtn = document.getElementById('retry-btn');
        const nextStageBtn = document.getElementById('next-stage-btn');
        const backToListMenuBtn = document.getElementById('back-to-list-menu-btn');
        const closeModalBtn = document.getElementById('close-modal-btn');

        // 每次打開視窗前，先將所有按鈕隱藏
        if (retryBtn) retryBtn.style.display = "none";
        if (nextStageBtn) nextStageBtn.style.display = "none";
        if (backToListMenuBtn) backToListMenuBtn.style.display = "none";
        if (closeModalBtn) closeModalBtn.style.display = "none";

        errorListEl.innerHTML = ''; // 清空錯題清單
        const errorKeys = Object.keys(errorLog);
        // 👇 --- 新增這整段：結算正確率與時間 --- 👇
        let totalQ = 0;
        if (currentTask === 'vocab') totalQ = vocabData.length;
        else if (currentTask === 'listening') totalQ = listQuizData.length;
        else if (currentTask === 'reading') {
            if (currentReadingStage === 1) totalQ = readQuizData.length;
            else if (currentReadingStage === 2) totalQ = currentReading2Article ? currentReading2Article.blanks.length : 3;
            else if (currentReadingStage === 3) totalQ = currentS3Questions.length;
        }
        let correctCount = totalQ - errorKeys.length;
        if (correctCount < 0) correctCount = 0;
        let accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
        let timeSpent = taskStartTime > 0 ? Math.floor((Date.now() - taskStartTime) / 1000) : 0;
        // 👇 --- 5. 新增：判斷當前任務名稱，準備回傳給 GAS --- 👇
        let currentTaskName = currentTask === 'vocab' ? '單字' :
            currentTask === 'listening' ? `聽力(階段${currentListeningStage})` :
                `閱讀(階段${currentReadingStage})`;
        if (isReadingGroup && currentTask === 'reading') currentTaskName += ` (循環${currentReadingLoop})`;
        // 👆 -------------------------------- 👆

        if (errorKeys.length === 0) {
            // 完美通關 (或補救成功)
            titleEl.textContent = "🎉 太棒了！";
            descEl.textContent = "任務完美完成。";

            // 👇 --- 6. 新增：發送完美通關紀錄 --- 👇
            sendDataToGAS(currentTaskName, '🟢 已完成', '完美通關/補救成功', accuracy, timeSpent);
            // 👆 -------------------------------- 👆

            if (currentTask === 'listening') {
                if (currentListeningStage === userProgress.listeningMaxStage && userProgress.listeningMaxStage < 4) {
                    userProgress.listeningMaxStage++;
                    const savedName = localStorage.getItem('weekly_english_name');
                    if (savedName) localStorage.setItem(`progress_${savedName}`, JSON.stringify(userProgress));
                }
                if (currentListeningStage < 3) nextStageBtn.style.display = "inline-block";
                backToListMenuBtn.style.display = "inline-block";

            } else if (currentTask === 'reading') {
                if (currentReadingStage === userProgress.readingMaxStage && userProgress.readingMaxStage < 4) {
                    userProgress.readingMaxStage++;
                    const savedName = localStorage.getItem('weekly_english_name');
                    if (savedName) localStorage.setItem(`progress_${savedName}`, JSON.stringify(userProgress));
                }

                if (isReadingGroup) {
                    // 💡 Wayne 的無縫大循環模式
                    if (currentReadingStage < 3) {
                        nextStageBtn.style.display = "inline-block"; // 繼續挑戰下一階段
                    } else {
                        // 第三關完成，大循環結束，只顯示回大廳
                        closeModalBtn.style.display = "inline-block";
                        closeModalBtn.textContent = "回大廳";
                    }
                } else {
                    // 常規組模式
                    if (currentReadingStage < 3) nextStageBtn.style.display = "inline-block";
                    backToListMenuBtn.style.display = "inline-block";
                }

            } else if (currentTask === 'vocab') {
                closeModalBtn.style.display = "inline-block";
            }
        } else {
            // 有錯題，強迫重試
            titleEl.textContent = "💪 任務完成！";
            retryBtn.style.display = "inline-block";

            // 👇 --- 7. 新增：發送錯題紀錄 --- 👇
            let errorDetails = "錯題數: " + errorKeys.length;
            if (currentTask === 'vocab') {
                errorDetails = "錯題: " + errorKeys.map(k => errorLog[k].word).join(", ");
            }
            // 👇 修改這行：將計算好的正確率與時間加入包裹 👇
            sendDataToGAS(currentTaskName, '🔴 需重試', errorDetails, accuracy, timeSpent);
            // 👆 -------------------------------- 👆

            if (currentTask === 'listening' || currentTask === 'reading') {
                // 💡 修改點：聽力與閱讀關卡，只顯示答對題數，不顯示錯題清單
                let totalQ = 0;
                if (currentTask === 'listening') {
                    totalQ = listQuizData.length;
                } else if (currentTask === 'reading') {
                    if (currentReadingStage === 1) totalQ = readQuizData.length;
                    // 預留給後續要修復的閱讀二與閱讀三
                    else if (currentReadingStage === 2) totalQ = currentReading2Article ? currentReading2Article.blanks.length : 3;
                    else if (currentReadingStage === 3) totalQ = currentS3Questions.length;
                }

                let correctCount = totalQ - errorKeys.length;
                // 防呆：避免出現負數
                if (correctCount < 0) correctCount = 0;

                descEl.textContent = `答對題數：${correctCount} / ${totalQ}`;

            } else {
                // 單字關卡：保留原本的單字錯題複習清單
                descEl.textContent = "請複習以下單字：";
                errorKeys.forEach(key => {
                    const err = errorLog[key];
                    const li = document.createElement('li');
                    li.className = 'error-item';
                    li.textContent = `${err.word} - ${err.correct}`;
                    errorListEl.appendChild(li);
                });
            }
        }

        modal.classList.add('active');
    }
    // --- 更新：結算視窗點擊「回選單」事件 ---
    document.getElementById('back-to-list-menu-btn').addEventListener('click', () => {
        document.getElementById('completion-modal').classList.remove('active');
        if (currentTask === 'listening') {
            listeningScreen.classList.remove('active');
            listMenuScreen.classList.add('active'); renderListeningMenu();
        } else if (currentTask === 'reading') {
            // 💡 修正：確保閱讀階段一、階段二、階段三的畫面都被確實關閉
            readingScreen.classList.remove('active');
            readingStage2Screen.classList.remove('active');
            readingStage3Screen.classList.remove('active'); // 👈 新增這行關閉第三關
            readingMenuScreen.classList.add('active');
            renderReadingMenu();
        }
    });

    // --- 更新：再來一次按鈕事件 (支援閱讀關卡鎖定文章) ---
    const retryBtn = document.getElementById('retry-btn');
    retryBtn.addEventListener('click', () => {
        hasRetried = true;
        document.getElementById('completion-modal').classList.remove('active');
        const errorIds = Object.keys(errorLog).map(id => parseInt(id));

        if (currentTask === 'vocab') {
            currentQuizData = shuffleArray(vocabData.filter(q => errorIds.includes(q.id)));
            currentQuestionIndex = 0;
            errorLog = {}; loadVocabQuestion();
        } else if (currentTask === 'listening') {
            let baseData = listeningData;
            if (currentListeningStage === 2) baseData = listeningStage2Data;

            if (currentListeningStage === 3) {
                // 💡 聽力第三關：保留同一篇文章，並重新抽取 3 題全新的題目
                listQuizData = shuffleArray([...currentList3Article.questions]).slice(0, 3);
            } else {
                // 💡 聽力第一關與第二關：有錯就從大題庫重新抽 5 題全新的
                listQuizData = shuffleArray([...baseData]).slice(0, 5);
            }
            currentListIndex = 0; errorLog = {}; loadListeningQuestion();
        } else if (currentTask === 'reading') {

            if (currentReadingStage === 1) {
                // 💡 維持剛剛的修改：閱讀一答錯，從大題庫重新抽取 5 題全新的題目
                readQuizData = shuffleArray([...readingStage1Data]).slice(0, 5);
                currentReadIndex = 0;
                errorLog = {};
                loadReadingQuestion();

            } else if (currentReadingStage === 2) {
                // 💡 恢復換文章機制：閱讀二答錯，重新從題庫抽選一篇新文章
                currentReading2Article = readingStage2Data[Math.floor(Math.random() * readingStage2Data.length)];
                errorLog = {};
                loadReadingStage2();

            } else if (currentReadingStage === 3) {
                // 💡 維持原樣：閱讀三已經是保留同一篇故事，並重新抽取 3 題全新的題目
                errorLog = {};
                currentS3Questions = shuffleArray([...currentStoryData.questions]).slice(0, 3);
                s3QuizView.style.display = 'none';
                s3StoryView.style.display = 'block';
                isS3PunishmentMode = false;

                // 恢復初始狀態：隱藏所有翻譯
                document.querySelectorAll('.s3-trans-line').forEach(el => el.style.display = 'none');

                startQuizBtn.disabled = false;
                startQuizBtn.style.backgroundColor = '#fff';
                startQuizBtn.style.color = '#333';
                startQuizBtn.textContent = '📝 開始測驗';

                // 重新渲染選項 (選項洗牌)，但維持原本抽出的 3 題不變
                renderS3Quiz();
            }
        }
    }); // 這是 retryBtn.addEventListener 的結尾

    // --- 更新：進入下一階段按鈕點擊事件 ---
    const nextStageBtn = document.getElementById('next-stage-btn');
    if (nextStageBtn) {
        nextStageBtn.addEventListener('click', () => {
            document.getElementById('completion-modal').classList.remove('active');
            errorLog = {}; hasRetried = false;

            if (currentTask === 'listening') {
                currentListeningStage++;
                // 直接呼叫選關函數，讓系統自動處理所有初始化與隨機抽文章的邏輯
                startListeningStage(currentListeningStage);
            } else if (currentTask === 'reading') {
                // 💡 修正：切換下一階段前，先把可能殘留的閱讀畫面關閉
                readingScreen.classList.remove('active');
                readingStage2Screen.classList.remove('active');

                currentReadingStage++; currentReadIndex = 0;
                startReadingStage(currentReadingStage);
            }
        });
    }

    // --- 新增：聽力選關大廳相關元素 ---
    const listMenuScreen = document.getElementById('listening-menu-screen');
    const exitListMenuBtn = document.getElementById('exit-listening-menu-btn');
    const listStageContainer = document.getElementById('listening-stage-container');

    // --- 更新：大廳點擊進入聽力館 (改為顯示選關單) ---
    enterListeningBtn.addEventListener('click', () => {
        dashboardScreen.classList.remove('active');
        listMenuScreen.classList.add('active');
        renderListeningMenu(); // 繪製選關按鈕
    });

    exitListMenuBtn.addEventListener('click', () => {
        listMenuScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
        // 👇 新增這行：中斷退出時，強制更新榜單 👇
        renderLeaderboard();
    });

    exitListeningBtn.addEventListener('click', () => {
        listeningScreen.classList.remove('active');
        listMenuScreen.classList.add('active'); // 退回選關單而不是首頁
        renderListeningMenu(); // 👈 修正：加上這行，確保鎖頭狀態重新判定
    });

    // --- 新增：動態繪製聽力選關按鈕 ---
    function renderListeningMenu() {
        listStageContainer.innerHTML = '';
        const stages = [
            { stage: 1, title: "階段一：聽音辨字" },
            { stage: 2, title: "階段二：短句理解" },
            { stage: 3, title: "階段三：情境對話" }
        ];

        stages.forEach(s => {
            const btn = document.createElement('button');
            // 直接套用選項按鈕的類別，達成完美的白底黑字藍框，與反灰失效效果
            btn.className = 'option-btn';
            btn.style.textAlign = 'center';
            btn.style.lineHeight = '1.6';
            btn.style.padding = '15px'; // 稍微縮減高度，讓畫面更清爽

            if (s.stage < userProgress.listeningMaxStage) {
                // 已過關，可重玩
                btn.innerHTML = `🟢 ${s.title}<br><span style="font-size: 16px; color: #555;">(已完成，可重玩)</span>`;
                btn.onclick = () => startListeningStage(s.stage);
            } else if (s.stage === userProgress.listeningMaxStage) {
                // 當前進度
                btn.innerHTML = `🔵 ${s.title}<br><span style="font-size: 16px; color: #555;">(挑戰中)</span>`;
                btn.onclick = () => startListeningStage(s.stage);
            } else {
                // 尚未解鎖
                btn.innerHTML = `🔒 ${s.title}<br><span style="font-size: 16px; color: #999;">(未解鎖)</span>`;
                btn.disabled = true; // 自動觸發 option-btn:disabled 的灰底效果
            }
            listStageContainer.appendChild(btn);
        });
    }

    // --- 新增：開始特定聽力關卡 ---
    function startListeningStage(stage) {
        listMenuScreen.classList.remove('active');
        listeningScreen.classList.add('active');
        currentTask = 'listening';
        currentListeningStage = stage;
        currentListIndex = 0;
        errorLog = {};
        hasRetried = false;
        taskStartTime = Date.now(); // 👈 新增這行：按下碼錶開始計時

        // 👇 --- 3. 新增：發送聽力開始任務 --- 👇
        sendDataToGAS(`聽力(階段${stage})`, '🟡 進行中');
        // 👆 -------------------------------- 👆

        if (stage === 1) {
            document.getElementById('listening-title').textContent = "🎧 聽力：聽音辨字";
            listQuizData = shuffleArray([...listeningData]).slice(0, 5);
            listPlayArticleBtn.style.display = 'none';
            listPlaySoundBtn.innerHTML = '🔊 聽發音';
        } else if (stage === 2) {
            document.getElementById('listening-title').textContent = "🎧 聽力：短句理解";
            listQuizData = shuffleArray([...listeningStage2Data]).slice(0, 5);
            listPlayArticleBtn.style.display = 'none';
            listPlaySoundBtn.innerHTML = '🔊 聽發音';
        } else if (stage === 3) {
            document.getElementById('listening-title').textContent = "🎧 聽力：情境對話";
            // 💡 隨機抽選文章，並確保跟上一次玩的不同篇
            let newArticle = listeningStage3Data[Math.floor(Math.random() * listeningStage3Data.length)];
            if (listeningStage3Data.length > 1) {
                while (currentList3Article && newArticle.id === currentList3Article.id) {
                    newArticle = listeningStage3Data[Math.floor(Math.random() * listeningStage3Data.length)];
                }
            }
            currentList3Article = newArticle;
            listQuizData = shuffleArray([...currentList3Article.questions]).slice(0, 3);

            // 💡 顯示「聽短文」按鈕，修改題目播放按鈕文字
            listPlayArticleBtn.style.display = 'inline-block';
            listPlaySoundBtn.innerHTML = '🔊 聽題目';

            // 進入第三關時，先載入題目畫面，但不發出聲音 (傳入 true)
            loadListeningQuestion(true);

            // 延遲 1 秒後，自動串接並播放整篇文章
            setTimeout(() => {
                // 防呆：如果學生在 1 秒內就按首頁退出，則不執行語音
                if (currentTask === 'listening' && currentListeningStage === 3) {
                    const fullArticle = currentList3Article.articleContent.map(line => line.en).join(". ");
                    playWordAudio(fullArticle);
                }
            }, 1000);

            return; // 提前結束，避免執行最底下的常規載入
        }
        loadListeningQuestion();
    }

    // 聽力館播放按鈕
    listPlaySoundBtn.addEventListener('click', () => {
        const currentQ = listQuizData[currentListIndex];
        if (currentQ) {
            let audioText = "";
            if (currentListeningStage === 3) {
                // 💡 第三關只唸題目，並利用 Regex 濾除中文字元、全形標點與半形括號
                audioText = currentQ.question.replace(/[\u4e00-\u9fa5\u3000-\u303F\uFF00-\uFFEF()[\]{}]/g, '').trim();
            } else {
                audioText = currentQ.sentence ? currentQ.sentence.replace('_______', currentQ.correct) : currentQ.english;
            }
            playWordAudio(audioText);
        }
    });

    // 聽力第三關專屬：播放整篇文章按鈕
    if (listPlayArticleBtn) {
        listPlayArticleBtn.addEventListener('click', () => {
            if (currentListeningStage === 3 && currentList3Article) {
                // 將文章中所有的英文句子串接起來一次朗讀
                const fullArticle = currentList3Article.articleContent.map(line => line.en).join(". ");
                playWordAudio(fullArticle);
            }
        });
    }

    // 新增參數 preventAutoPlay，預設為 false
    function loadListeningQuestion(preventAutoPlay = false) {
        if (currentListIndex >= listQuizData.length) {
            showCompletionModal();
            return;
        }

        const currentQ = listQuizData[currentListIndex];
        listCurrentQNumEl.textContent = currentListIndex + 1;
        listTotalQNumEl.textContent = listQuizData.length;

        let audioText = "";
        let correctText = "";
        let options = [];

        if (currentListeningStage === 3) {
            // 💡 第三關邏輯：濾除中文字元、全形標點與半形括號
            audioText = currentQ.question.replace(/[\u4e00-\u9fa5\u3000-\u303F\uFF00-\uFFEF()[\]{}]/g, '').trim();
            correctText = currentQ.correct;
            options = shuffleArray([...currentQ.options]);

            // 如果沒有被禁止，才自動唸出題目
            if (!preventAutoPlay) {
                playWordAudio(audioText);
            }

            if (listCheatBox) {
                listCheatBox.innerHTML = `
                    <span style="color: #8E44AD; font-size: 14px;">📖 文章：${currentList3Article.title}</span><br>
                    <span style="color: #333;">🕵️ 題目：${audioText}</span><br>
                    <span style="color: #27AE60; font-size: 15px;">💡 答案：${correctText}</span>
                `;
            }
        } else {
            // 💡 第一、二關邏輯
            audioText = currentQ.sentence ? currentQ.sentence.replace('_______', currentQ.correct) : currentQ.english;
            correctText = currentQ.translation ? currentQ.translation : currentQ.chinese;

            playWordAudio(audioText); // 進入新題目自動播放

            if (listCheatBox) {
                listCheatBox.innerHTML = `
                    <span style="color: #333;">🕵️ 原文：${audioText}</span><br>
                    <span style="color: #27AE60; font-size: 15px;">💡 翻譯：${correctText}</span>
                `;
            }

            let baseData = currentListeningStage === 2 ? listeningStage2Data : listeningData;
            let otherItems = baseData.filter(q => q.id !== currentQ.id);
            otherItems = shuffleArray(otherItems).slice(0, 2);

            let opt2 = otherItems.length > 0 ? (otherItems[0].translation || otherItems[0].chinese) : "備用選項1";
            let opt3 = otherItems.length > 1 ? (otherItems[1].translation || otherItems[1].chinese) : "備用選項2";

            options = [...new Set([correctText, opt2, opt3])];
            while (options.length < 3) {
                options.push("備用選項" + options.length);
            }
            options = shuffleArray(options);
        }

        listeningOptionsEl.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;

            // 👇 在 btn.onclick 的上方，加入這段外掛判定 👇
            if (isGodMode && opt === correctText) {
                btn.style.backgroundColor = '#FDEDEC';
                btn.style.color = '#E74C3C';
                btn.style.borderColor = '#E74C3C';
                btn.style.fontWeight = 'bold';
                btn.innerHTML = `🌟 ${opt}`; // 加上星星圖示與紅色標示
            }
            btn.onclick = () => checkListeningAnswer(opt, correctText, btn, currentQ);
            listeningOptionsEl.appendChild(btn);
        });
    }

    function checkListeningAnswer(selected, correct, btn, currentQ) {
        if (selected === correct) {
            btn.classList.add('correct');
            const allBtns = document.getElementById('listening-options').querySelectorAll('.option-btn');
            allBtns.forEach(b => b.disabled = true);

            setTimeout(() => {
                currentListIndex++;
                loadListeningQuestion();
            }, 1000);
        } else {
            btn.disabled = true;

            if (currentListeningStage === 3) {
                // 💡 第三關答錯防呆處理 (純英文無翻譯)
                const qId = currentQ.qId || currentQ.id;
                if (!errorLog[qId]) {
                    errorLog[qId] = { word: currentQ.question, correct: currentQ.correct, mistakes: [] };
                }
                if (!errorLog[qId].mistakes.includes(selected)) {
                    errorLog[qId].mistakes.push(selected);
                }
            } else {
                // 💡 第一、二關答錯處理 (顯示提示詞)
                let baseData = currentListeningStage === 2 ? listeningStage2Data : listeningData;
                const foundDistractor = baseData.find(q => q.chinese === selected || q.translation === selected);
                if (foundDistractor) {
                    btn.innerHTML = `${selected}<br><span style="font-size: 18px; color: #666; margin-top: 5px; display: block;">${foundDistractor.english || foundDistractor.sentence}</span>`;
                }

                if (!errorLog[currentQ.id]) {
                    errorLog[currentQ.id] = { word: currentQ.english || currentQ.sentence, correct: currentQ.chinese || currentQ.translation, mistakes: [] };
                }
                if (!errorLog[currentQ.id].mistakes.includes(selected)) {
                    errorLog[currentQ.id].mistakes.push(selected);
                }
            }
        }
    }
    // --- 新增：閱讀選關大廳與測驗綁定 ---
    const readingMenuScreen = document.getElementById('reading-menu-screen');
    const exitReadingMenuBtn = document.getElementById('exit-reading-menu-btn');
    const readingStageContainer = document.getElementById('reading-stage-container');
    const readingScreen = document.getElementById('reading-screen');
    const exitReadingBtn = document.getElementById('exit-reading-btn');
    const readCurrentQNumEl = document.getElementById('read-current-q-num');
    const readTotalQNumEl = document.getElementById('read-total-q-num');
    const readingSentenceEl = document.getElementById('reading-sentence');
    const readingOptionsEl = document.getElementById('reading-options');

    // --- 新增：閱讀第二階段相關元素 ---
    const readingStage2Screen = document.getElementById('reading-stage2-screen');
    const exitReadingS2Btn = document.getElementById('exit-reading-s2-btn');
    const readingArticleBox = document.getElementById('reading-article-box');
    const clozeModal = document.getElementById('cloze-modal');
    const closeClozeBtn = document.getElementById('close-cloze-btn');
    const clozeOptionsEl = document.getElementById('cloze-options');

    // 用於追蹤當前點擊的空格資訊
    let currentBlankData = null;
    let currentBlankBtn = null;
    let completedBlanksCount = 0; // 記錄已完成的空格數

    // --- 修正：閱讀大作戰入口分流 ---
    enterReadingBtn.addEventListener('click', () => {
        dashboardScreen.classList.remove('active');
        if (isReadingGroup) {
            currentReadingLoop = 1;
            startReadingStage(1); // 💡 跳過選單，直接進入閱讀(一)單句選擇
        } else {
            readingMenuScreen.classList.add('active');
            renderReadingMenu();
        }
    });

    exitReadingMenuBtn.addEventListener('click', () => {
        readingMenuScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
        // 👇 新增這行：中斷退出時，強制更新榜單 👇
        renderLeaderboard();
    });

    exitReadingBtn.addEventListener('click', () => {
        readingScreen.classList.remove('active');
        readingMenuScreen.classList.add('active');
        renderReadingMenu(); // 👈 修正：加上這行
    });
    exitReadingS2Btn.addEventListener('click', () => {
        readingStage2Screen.classList.remove('active');
        readingMenuScreen.classList.add('active');
        renderReadingMenu(); // 👈 修正：加上這行
    });
    exitReadingS3Btn.addEventListener('click', () => {
        readingStage3Screen.classList.remove('active');
        readingMenuScreen.classList.add('active');
        renderReadingMenu(); // 👈 修正：加上這行
    });

    closeClozeBtn.addEventListener('click', () => {
        clozeModal.classList.remove('active');
    });

    function renderReadingMenu() {
        readingStageContainer.innerHTML = '';
        const stages = [
            { stage: 1, title: "階段一：單句選擇" },
            { stage: 2, title: "階段二：短文填空" },
            { stage: 3, title: "階段三：閱讀理解" }
        ];

        stages.forEach(s => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.style.textAlign = 'center'; btn.style.lineHeight = '1.6'; btn.style.padding = '15px';

            if (s.stage < userProgress.readingMaxStage) {
                btn.innerHTML = `🟢 ${s.title}<br><span style="font-size: 16px; color: #555;">(已完成，可重玩)</span>`;
                btn.onclick = () => startReadingStage(s.stage);
            } else if (s.stage === userProgress.readingMaxStage) {
                btn.innerHTML = `🔵 ${s.title}<br><span style="font-size: 16px; color: #555;">(挑戰中)</span>`;
                btn.onclick = () => startReadingStage(s.stage);
            } else {
                btn.innerHTML = `🔒 ${s.title}<br><span style="font-size: 16px; color: #999;">(未解鎖)</span>`;
                btn.disabled = true;
            }
            readingStageContainer.appendChild(btn);
        });
    }

    window.usedStoryId = null; // 💡 新增：用來記憶第一循環的故事 ID

    function startReadingStage(stage) {
        readingMenuScreen.classList.remove('active');

        currentTask = 'reading';
        currentReadingStage = stage;
        currentReadIndex = 0;
        errorLog = {};
        hasRetried = false;
        taskStartTime = Date.now(); // 👈 新增這行：按下碼錶開始計時

        // 👇 --- 4. 新增：發送閱讀開始任務 (支援 Wayne 雙循環判定) --- 👇
        let loopText = (isReadingGroup && currentReadingLoop > 1) ? ` (循環${currentReadingLoop})` : "";
        sendDataToGAS(`閱讀(階段${stage})${loopText}`, '🟡 進行中');
        // 👆 -------------------------------- 👆

        if (stage === 1) {
            readingScreen.classList.add('active');
            document.getElementById('reading-title').textContent = "📖 閱讀：句子選填";
            readQuizData = shuffleArray([...readingStage1Data]).slice(0, 5);
            loadReadingQuestion();

        } else if (stage === 2) {
            readingScreen.classList.remove('active');
            readingStage2Screen.classList.add('active');

            let availableArticles = [...readingStage2Data];

            // 💡 核心防重複機制：如果是第二循環，過濾掉第一循環玩過的文章
            if (isReadingGroup && currentReadingLoop === 2 && usedArticleId) {
                availableArticles = availableArticles.filter(a => a.id !== usedArticleId);
                if (availableArticles.length === 0) availableArticles = [...readingStage2Data]; // 防呆：萬一文章用光了保底恢復
            }

            let newArticle = availableArticles[Math.floor(Math.random() * availableArticles.length)];
            if (availableArticles.length > 1 && currentReading2Article) {
                while (newArticle.id === currentReading2Article.id) {
                    newArticle = availableArticles[Math.floor(Math.random() * availableArticles.length)];
                }
            }
            currentReading2Article = newArticle;

            // 💡 記憶第一循環的文章 ID
            if (isReadingGroup && currentReadingLoop === 1) {
                usedArticleId = newArticle.id;
            }

            document.getElementById('reading-s2-title').textContent = "📖 閱讀：短文填空";
            loadReadingStage2();

        } else if (stage === 3) {
            readingScreen.classList.remove('active');
            readingStage2Screen.classList.remove('active');
            readingStage3Screen.classList.add('active');

            let availableStories = [...readingStage3Data];

            // 💡 核心防重複機制：如果是第二循環，過濾掉第一循環玩過的故事
            if (isReadingGroup && currentReadingLoop === 2 && window.usedStoryId) {
                availableStories = availableStories.filter(s => s.id !== window.usedStoryId);
                if (availableStories.length === 0) availableStories = [...readingStage3Data];
            }

            let newStory = availableStories[Math.floor(Math.random() * availableStories.length)];
            if (availableStories.length > 1 && currentStoryData) {
                while (newStory.id === currentStoryData.id) {
                    newStory = availableStories[Math.floor(Math.random() * availableStories.length)];
                }
            }
            currentStoryData = newStory;

            // 💡 記憶第一循環的故事 ID
            if (isReadingGroup && currentReadingLoop === 1) {
                window.usedStoryId = newStory.id;
            }

            document.getElementById('reading-s3-title').textContent = "📖 閱讀：短文理解";
            loadReadingStage3();
        }
    }

    // --- 新增：閱讀第一階段核心邏輯 ---
    function loadReadingQuestion() {
        if (currentReadIndex >= readQuizData.length) {
            showCompletionModal(); return;
        }

        const currentQ = readQuizData[currentReadIndex];
        readCurrentQNumEl.textContent = currentReadIndex + 1;
        readTotalQNumEl.textContent = readQuizData.length;
        readingSentenceEl.textContent = currentQ.sentence;
        // [外掛] 注入完整句子與翻譯
        if (readCheatBox) {
            const fullSentence = currentQ.sentence.replace('_______', `<span style="color: #27AE60; text-decoration: underline;">${currentQ.correct}</span>`);
            readCheatBox.innerHTML = `
                <span style="color: #333;">🕵️ 完整：${fullSentence}</span><br>
                <span style="color: #27AE60; font-size: 15px;">💡 翻譯：${currentQ.translation}</span>
            `;
        }

        let options = [currentQ.correct, ...currentQ.distractors];
        options = shuffleArray(options);
        readingOptionsEl.innerHTML = '';

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => checkReadingAnswer(opt, currentQ.correct, btn, currentQ);
            readingOptionsEl.appendChild(btn);
        });
    }

    function checkReadingAnswer(selected, correct, btn, currentQ) {
        if (selected === correct) {
            btn.classList.add('correct');
            // 把空格填上正確答案，給予視覺回饋
            readingSentenceEl.textContent = currentQ.sentence.replace('_______', correct);

            // 先讓所有選項失效，並在 0.5 秒後將選項區轉換為「中文解析模式」
            const allBtns = readingOptionsEl.querySelectorAll('.option-btn');
            allBtns.forEach(b => b.disabled = true);

            setTimeout(() => {
                // 💡 修正：將答對了與中文翻譯放在同一行，並靠右對齊，節省空間
                readingOptionsEl.innerHTML = `
                    <div class="explanation-box" style="text-align: left; padding: 15px; border: 2px solid #3498DB; border-radius: 8px; background-color: #F8F9FA; margin-top: 5px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                            <span style="font-size: 16px; font-weight: bold; color: #333;">💡 中文翻譯：</span>
                            <span style="font-size: 16px; font-weight: bold; color: #27AE60; white-space: nowrap;">🎯 答對了！</span>
                        </div>
                        <p style="font-size: 18px; color: #333; margin-bottom: 12px; margin-top: 0;">${currentQ.translation}</p>
                        
                        <span style="font-size: 16px; font-weight: bold; color: #555;">📝 重點複習：</span>
                        <p style="font-size: 16px; color: #555; line-height: 1.5; margin-top: 4px; margin-bottom: 0;">${currentQ.hint}</p>
                    </div>
                    <div id="next-read-btn-container" style="text-align: center; margin-top: 15px; min-height: 60px;">
                        <p style="color: #999; font-size: 14px; animation: blink 1s infinite;">認真讀完解析中...🕒</p>
                    </div>
                `;

                // 嚴格防呆：等待 3 秒後才將「下一題」的大按鈕塞入容器
                setTimeout(() => {
                    const container = document.getElementById('next-read-btn-container');
                    if (container) {
                        container.innerHTML = ''; // 清除讀取提示文字

                        const nextBtn = document.createElement('button');
                        nextBtn.className = 'big-btn';
                        nextBtn.style.maxWidth = '100%';
                        nextBtn.textContent = '下一題 ➔';
                        nextBtn.onclick = () => {
                            currentReadIndex++;
                            loadReadingQuestion();
                        };
                        container.appendChild(nextBtn);
                    }
                }, 3000);
            }, 500);

        } else {
            btn.disabled = true;
            // 答錯顯示預設好的文法或單字提示
            if (currentQ.hint) {
                btn.innerHTML = `${selected}<br><span style="font-size: 16px; color: #e74c3c; margin-top: 5px; display: block;">提示：${currentQ.hint}</span>`;
            }

            if (!errorLog[currentQ.id]) {
                errorLog[currentQ.id] = { word: currentQ.sentence, correct: currentQ.correct, mistakes: [] };
            }
            if (!errorLog[currentQ.id].mistakes.includes(selected)) {
                errorLog[currentQ.id].mistakes.push(selected);
            }
        }
    }
    // 👇 將整段 loadReadingStage2() 替換為以下 👇
    function loadReadingStage2() {
        completedBlanksCount = 0;
        let articleHTML = currentReading2Article.article;

        currentReading2Article.blanks.forEach(blank => {
            const btnHTML = `<button class="blank-btn" data-marker="${blank.marker}">[ 點我作答 ]</button>`;
            articleHTML = articleHTML.replace(blank.marker, btnHTML);
        });

        // 💡 將文章標題加在內文的最上方，並設定置中與底部間距
        const titleHTML = currentReading2Article.title
            ? `<h3 style="text-align: center; color: #2C3E50; margin-bottom: 20px; font-size: 24px;">${currentReading2Article.title}</h3>`
            : "";
        readingArticleBox.innerHTML = titleHTML + articleHTML;

        // 綁定所有空格按鈕的點擊事件
        const blankBtns = readingArticleBox.querySelectorAll('.blank-btn');
        blankBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const marker = e.target.getAttribute('data-marker');
                currentBlankData = currentReading2Article.blanks.find(b => b.marker === marker);
                currentBlankBtn = e.target;

                openClozeModal(currentBlankData);
            });
        });
    }

    // 開啟選詞彈窗
    function openClozeModal(blankData) {
        clozeOptionsEl.innerHTML = '';
        let options = [blankData.correct, ...blankData.distractors];
        options = shuffleArray(options);

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;

            // 👇 在 btn.onclick 的上方，加入這段外掛判定 👇
            if (isGodMode && opt === blankData.correct) {
                btn.style.backgroundColor = '#FDEDEC';
                btn.style.color = '#E74C3C';
                btn.style.borderColor = '#E74C3C';
                btn.style.fontWeight = 'bold';
                btn.innerHTML = `🌟 ${opt}`; // 加上星星圖示與紅色標示
            }
            // 👆 加入結束 👆

            btn.onclick = () => checkClozeAnswer(opt, blankData.correct, btn, blankData);
            clozeOptionsEl.appendChild(btn);
        });

        clozeModal.classList.add('active');
    }

    // 檢核選詞彈窗答案
    function checkClozeAnswer(selected, correct, btn, blankData) {
        if (selected === correct) {
            btn.classList.add('correct');
            const allBtns = clozeOptionsEl.querySelectorAll('.option-btn');
            allBtns.forEach(b => b.disabled = true);

            // 答對時，短暫停留後關閉彈窗並更新原文
            setTimeout(() => {
                clozeModal.classList.remove('active');

                // 更新按鈕狀態：變綠色並顯示單字
                currentBlankBtn.textContent = correct;
                currentBlankBtn.classList.add('filled');

                completedBlanksCount++;

                // 檢查是否全部填完
                if (completedBlanksCount === currentReading2Article.blanks.length) {
                    setTimeout(() => {
                        showCompletionModal(); // 全部填完，呼叫共用結算視窗
                    }, 1000);
                }
            }, 800);

        } else {
            // 答錯防呆：按鈕變灰，顯示提示與翻譯
            btn.disabled = true;

            if (blankData.hint && blankData.translation) {
                btn.innerHTML = `${selected}<br>
                 <span style="font-size: 16px; color: #e74c3c; margin-top: 5px; display: block;">${blankData.hint}</span>
                 <span style="font-size: 15px; color: #555; margin-top: 3px; display: block;">${blankData.translation}</span>`;
            }

            if (!errorLog[blankData.id]) {
                errorLog[blankData.id] = { word: blankData.marker, correct: blankData.correct, mistakes: [] };
            }
            if (!errorLog[blankData.id].mistakes.includes(selected)) {
                errorLog[blankData.id].mistakes.push(selected);
            }
        }
    }
    // ==========================================
    // 👇 請在 DOMContentLoaded 結束前，貼上這段後台管理邏輯 👇

    // 專屬老師的後台指令發送器
    function sendAdminCommand(payload) {
        return fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        }).then(res => res.json());
    }

    // 1. 🧹 一鍵重置榜單與試算表
    const resetBoardBtn = document.getElementById('tab-reset-board-btn');
    if (resetBoardBtn) {
        resetBoardBtn.addEventListener('click', () => {
            if (confirm('⚠️ 嚴重警告！\n確定要清空本週所有「本班進度」與「訪客紀錄」嗎？\n(此動作無法復原，通常用於換週更新)')) {
                
                const userInput = prompt('🔐 為避免誤刪，請輸入「當週的通行碼」以確認清空動作：');
                if (userInput !== currentClassPasscode) {
                    alert('❌ 通行碼錯誤，已取消清空動作！');
                    return; 
                }

                resetBoardBtn.textContent = "⏳ 正在清空...";
                sendAdminCommand({ action: 'resetBoard' }).then(res => {
                    
                    // 👇 新增本機全面清空核彈 👇
                    localStorage.removeItem('weekly_english_name');
                    localStorage.removeItem('weekly_english_is_class');
                    localStorage.removeItem('weekly_english_last_update');
                    
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('progress_')) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    // 👆 新增結束 👆

                    alert('✅ 雲端榜單與本機通關紀錄皆已成功歸零！');
                    location.reload();
                });
            }
        });
    }
    // 2. ✏️ 修改違規名字
    const renameBtn = document.getElementById('tab-rename-btn');
    if (renameBtn) {
        renameBtn.addEventListener('click', () => {
            const oldName = prompt('🔍 請輸入要修改的「原名字」(大小寫需完全相符)：');
            if (!oldName) return;
            const newName = prompt(`✏️ 要把「${oldName}」修改成什麼乾淨的名字？`);
            if (!newName) return;

            renameBtn.textContent = "⏳ 修改中...";
            sendAdminCommand({ action: 'renameUser', oldName: oldName, newName: newName }).then(res => {
                alert(`✅ 成功將所有名為「${oldName}」的紀錄替換為「${newName}」！`);
                location.reload();
            });
        });
    }

    // 3. 🌍 審核與查看訪客名單
    const approveVisitorBtn = document.getElementById('tab-approve-visitor-btn');
    if (approveVisitorBtn) {
        approveVisitorBtn.addEventListener('click', () => {
            document.getElementById('teacher-review-content').style.display = 'none';
            const approvalContainer = document.getElementById('teacher-visitor-approval-content');
            approvalContainer.style.display = 'block';

            // 💡 1. 點擊後先顯示讀取中動畫，提升專業感
            approvalContainer.innerHTML = '<div style="text-align:center; padding: 30px; font-size: 18px; color:#3498DB; font-weight: bold;">⏳ 正在向雲端同步最新名單...</div>';

            // 💡 2. 強制獨立向雲端發送請求，確保抓到最新資料 (不受是否登入影響)
            const noCacheUrl = GAS_URL + '?t=' + new Date().getTime();
            fetch(noCacheUrl)
                .then(response => response.json())
                .then(res => {
                    if (res.status === 'success') {
                        const pendingVisitorsData = res.data.pendingVisitors || [];
                        const challengingVisitorsData = res.data.challengingVisitors || [];

                        // --- 區塊 1：完全通關 (待審核) ---
                        let html = '<h3 style="color:#27AE60; border-bottom: 2px solid #27AE60; padding-bottom: 10px; margin-bottom: 15px;">🌍 待審核訪客 (已完整通關)</h3>';
                        
                        if (pendingVisitorsData.length === 0) {
                            html += '<div style="text-align:center; padding: 15px; background: #F8F9FA; border-radius: 8px; color:#7F8C8D;">目前沒有已全破待審核的訪客。</div>';
                        } else {
                            pendingVisitorsData.forEach(v => {
                                let min = Math.floor(v.timeSpent / 60);
                                let sec = v.timeSpent % 60;
                                let timeText = min > 0 ? `${min}分${sec}秒` : `${sec}秒`;

                                html += `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:#FEF9E7; padding:15px; margin-bottom:10px; border-radius:8px; border-left:5px solid #27AE60;">
                                    <div>
                                        <strong style="font-size:18px; color: #333;">${v.name}</strong> <span style="font-size: 14px; color: #27AE60; font-weight:bold;">(全破)</span><br>
                                        <span style="font-size:14px; color:#555; font-weight: bold;">🎯 正確率: ${v.accuracy}% | ⏱️ 總時間: ${timeText}</span>
                                    </div>
                                    <div style="display: flex; gap: 8px;">
                                        <button onclick="handleVisitorApprove('${v.name}')" style="background:#27AE60; color:white; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; font-weight: bold;">✅ 核准</button>
                                        <button onclick="handleVisitorDelete('${v.name}')" style="background:#E74C3C; color:white; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; font-weight: bold;">🗑️ 刪除</button>
                                    </div>
                                </div>`;
                            });
                        }

                        // --- 分隔虛線 ---
                        html += '<hr style="border: 0; border-top: 2px dashed #BDC3C7; margin: 25px 0;">';

                        // --- 區塊 2：挑戰中 (未通關) ---
                        html += '<h3 style="color:#F39C12; border-bottom: 2px solid #F39C12; padding-bottom: 10px; margin-bottom: 15px;">🏃 挑戰中訪客 (尚未全破)</h3>';
                        
                        if (challengingVisitorsData.length === 0) {
                            html += '<div style="text-align:center; padding: 15px; background: #F8F9FA; border-radius: 8px; color:#7F8C8D;">目前沒有正在挑戰的訪客。</div>';
                        } else {
                            challengingVisitorsData.forEach(v => {
                                let min = Math.floor(v.timeSpent / 60);
                                let sec = v.timeSpent % 60;
                                let timeText = min > 0 ? `${min}分${sec}秒` : `${sec}秒`;

                                html += `
                                <div style="display:flex; justify-content:space-between; align-items:center; background:#FDF2E9; padding:15px; margin-bottom:10px; border-radius:8px; border-left:5px solid #F39C12; opacity: 0.9;">
                                    <div>
                                        <strong style="font-size:18px; color: #333;">${v.name}</strong> <span style="font-size: 14px; color: #E67E22; font-weight:bold;">(已過 ${v.completed}/7 關)</span><br>
                                        <span style="font-size:14px; color:#555; font-weight: bold;">🎯 目前正確率: ${v.accuracy}% | ⏱️ 累積時間: ${timeText}</span>
                                    </div>
                                    <div style="display: flex; gap: 8px;">
                                        <button onclick="handleVisitorDelete('${v.name}')" style="background:#E74C3C; color:white; border:none; padding:6px 10px; border-radius:5px; cursor:pointer; font-weight: bold; font-size: 13px;">🗑️ 刪除</button>
                                    </div>
                                </div>`;
                            });
                        }

                        approvalContainer.innerHTML = html;
                    }
                })
                .catch(err => {
                    approvalContainer.innerHTML = '<div style="text-align:center; padding: 20px; color:#E74C3C; font-weight: bold;">❌ 無法連線至雲端，請檢查網路狀態。</div>';
                });
        });

        // 綁定全域核准與刪除函數
        window.handleVisitorApprove = function (name) {
            if (confirm(`確定要讓訪客「${name}」正式登上大廳排行榜嗎？`)) {
                sendAdminCommand({ action: 'approveVisitor', targetName: name }).then(() => {
                    alert(`✅ 已核准「${name}」！`);
                    location.reload();
                });
            }
        };

        window.handleVisitorDelete = function (name) {
            if (confirm(`確定要將違規訪客「${name}」的紀錄永久刪除嗎？`)) {
                sendAdminCommand({ action: 'deleteVisitor', targetName: name }).then(() => {
                    alert(`🗑️ 已刪除「${name}」的紀錄！`);
                    location.reload();
                });
            }
        };
    }
}); // 這裡才是整個 DOMContentLoaded 最正確的收尾位置！
