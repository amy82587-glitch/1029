// ==========================================
// PBL 專題：生活好幫手 - 職業與工具連連看（全螢幕版）
// 使用技術：p5.js + Web Audio API + Web Speech API
// ==========================================

let gameState = 'START'; // START, QUIZ, FEEDBACK, RESULT, REVIEW
let currentQIndex = 0;
let score = 0;
let userAnswers = []; // [{ qIndex, selected, isCorrect }]

// 聲音相關
let synth;
let isAudioInited = false;

// 拖曳與作答暫存狀態
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragCurrentX = 0, dragCurrentY = 0;
let currentFeedback = null; // 紀錄剛答完的狀態 { selectedId, isCorrect }

// 題目資料（5 題職業與工具配對）
const QUESTIONS = [
  {
    id: 1,
    job: "老師 👩‍🏫",
    jobDesc: "教導學生知識與禮貌",
    options: [
      { id: "A", text: "聽診器 🩺" },
      { id: "B", text: "黑板與粉筆 🖍️" },
      { id: "C", text: "菜刀與鍋鏟 🍳" },
      { id: "D", text: "哨子與警示燈 🚨" }
    ],
    correctId: "B",
    explain: "老師在教室上課時，會使用黑板與粉筆寫字教導大家。"
  },
  {
    id: 2,
    job: "警察 👮‍♂️",
    jobDesc: "維護交通安全與治安",
    options: [
      { id: "A", text: "送信包與郵票 ✉️" },
      { id: "B", text: "聽診器 🩺" },
      { id: "C", text: "哨子與警示燈 🚨" },
      { id: "D", text: "黑板與粉筆 🖍️" }
    ],
    correctId: "C",
    explain: "警察叔叔、阿姨指揮交通或維護治安時，會使用哨子與警示燈。"
  },
  {
    id: 3,
    job: "醫生 👨‍⚕️",
    jobDesc: "幫生病的人看病治療",
    options: [
      { id: "A", text: "聽診器與藥包 🩺" },
      { id: "B", text: "菜刀與鍋鏟 🍳" },
      { id: "C", text: "送信包與郵票 ✉️" },
      { id: "D", text: "哨子與警示燈 🚨" }
    ],
    correctId: "A",
    explain: "醫生看病時，會用聽診器檢查我們的心跳與呼吸。"
  },
  {
    id: 4,
    job: "廚師 👨‍🍳",
    jobDesc: "煮出美味又營養的飯菜",
    options: [
      { id: "A", text: "黑板與粉筆 🖍️" },
      { id: "B", text: "菜刀與鍋鏟 🍳" },
      { id: "C", text: "聽診器 🩺" },
      { id: "D", text: "送信包與郵票 ✉️" }
    ],
    correctId: "B",
    explain: "廚師在廚房準備美味飯菜時，最常使用菜刀和鍋鏟。"
  },
  {
    id: 5,
    job: "郵差 📮",
    jobDesc: "把信件和包裹送到家",
    options: [
      { id: "A", text: "哨子與警示燈 🚨" },
      { id: "B", text: "菜刀與鍋鏟 🍳" },
      { id: "C", text: "黑板與粉筆 🖍️" },
      { id: "D", text: "送信包與郵票 ✉️" }
    ],
    correctId: "D",
    explain: "郵差送信時，會把信件整理在送信包裡送到我們家。"
  }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('sans-serif');
  textAlign(CENTER, CENTER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(245, 247, 250);

  if (gameState === 'START') {
    drawStartScreen();
  } else if (gameState === 'QUIZ' || gameState === 'FEEDBACK') {
    drawQuizScreen();
  } else if (gameState === 'RESULT') {
    drawResultScreen();
  } else if (gameState === 'REVIEW') {
    drawReviewScreen();
  }
}

// ----------------------------------------------------
// 1. 開始畫面 (全螢幕自動置中)
// ----------------------------------------------------
function drawStartScreen() {
  fill(31, 122, 77);
  rect(0, 0, width, 100);

  fill(255);
  textSize(min(width * 0.04, 36));
  textStyle(BOLD);
  text("🎨 生活好幫手：職業與工具連連看", width / 2, 50);

  // 說明卡片
  let cardW = min(width * 0.8, 600);
  let cardH = 260;
  fill(255);
  stroke(220);
  strokeWeight(2);
  rect(width / 2 - cardW / 2, height / 2 - 140, cardW, cardH, 16);

  noStroke();
  fill(50);
  textSize(22);
  text("👋 小朋友你好！", width / 2, height / 2 - 100);
  textSize(18);
  textStyle(NORMAL);
  text("你知道不同職業的人工作時需要什麼工具嗎？\n\n請用按住滑鼠或手指拉線，把左邊的人物\n連到右邊正確的工具上喔！", width / 2, height / 2 - 20);

  // 開始按鈕
  let btnW = min(width * 0.5, 260);
  let btnH = 65;
  let btnY = height / 2 + 150;

  fill(31, 122, 77);
  rect(width / 2 - btnW / 2, btnY, btnW, btnH, 32);
  fill(255);
  textSize(24);
  textStyle(BOLD);
  text("🚀 開始測驗", width / 2, btnY + btnH / 2);
}

// ----------------------------------------------------
// 2. 作答與即時回饋畫面
// ----------------------------------------------------
function drawQuizScreen() {
  let q = QUESTIONS[currentQIndex];

  // 頂部進度條
  fill(230);
  noStroke();
  rect(0, 0, width, 50);
  fill(31, 122, 77);
  rect(0, 0, (width / QUESTIONS.length) * (currentQIndex + 1), 50);

  fill(255);
  textSize(20);
  textStyle(BOLD);
  text(`第 ${currentQIndex + 1} / ${QUESTIONS.length} 題`, width / 2, 25);

  // 題目指示
  fill(50);
  textSize(min(width * 0.025, 22));
  text("請用拉線方式，把【人物】連到【正確的工具】上：", width / 2, 85);

  // 計算動態左右位置
  let leftX = width * 0.25;
  let leftY = height * 0.4;
  let rightX = width * 0.75;
  let startY = height * 0.22;
  let gapY = min(height * 0.12, 80);

  // 左側：人物卡片
  fill(255, 248, 220);
  stroke(242, 183, 5);
  strokeWeight(3);
  rect(leftX - 100, leftY - 70, 200, 140, 16);

  noStroke();
  fill(40);
  textSize(26);
  textStyle(BOLD);
  text(q.job, leftX, leftY - 15);
  textSize(15);
  textStyle(NORMAL);
  fill(100);
  text(q.jobDesc, leftX, leftY + 30);

  // 左側連接點
  let leftNodeX = leftX + 100;
  fill(242, 183, 5);
  circle(leftNodeX, leftY, 20);

  // 右側：選項列表
  for (let i = 0; i < q.options.length; i++) {
    let opt = q.options[i];
    let optY = startY + i * gapY;

    // 判斷是否為即時回饋狀態 (FEEDBACK)
    if (gameState === 'FEEDBACK') {
      if (opt.id === q.correctId) {
        fill(235, 247, 238);
        stroke(31, 122, 77); // 顯示正確答案（綠框）
        strokeWeight(4);
      } else if (opt.id === currentFeedback.selectedId && !currentFeedback.isCorrect) {
        fill(253, 237, 237);
        stroke(200, 50, 50); // 答錯的選項（紅框）
        strokeWeight(3);
      } else {
        fill(250);
        stroke(220);
        strokeWeight(1);
      }
    } else {
      fill(255);
      stroke(200);
      strokeWeight(2);
    }

    rect(rightX - 110, optY - 28, 220, 56, 12);

    noStroke();
    fill(50);
    textSize(18);
    textStyle(BOLD);
    text(opt.text, rightX, optY);

    // 右側連接點
    fill(31, 122, 77);
    circle(rightX - 110, optY, 18);
  }

  // 繪製拉線
  if (gameState === 'QUIZ' && isDragging) {
    stroke(242, 183, 5);
    strokeWeight(5);
    line(dragStartX, dragStartY, dragCurrentX, dragCurrentY);
  } else if (gameState === 'FEEDBACK') {
    // 1. 畫出正確連線 (綠線)
    let correctOptIndex = q.options.findIndex(o => o.id === q.correctId);
    stroke(31, 122, 77);
    strokeWeight(5);
    line(leftNodeX, leftY, rightX - 110, startY + correctOptIndex * gapY);

    // 2. 若玩家選錯，畫出玩家連的錯誤線 (紅虛線)
    if (!currentFeedback.isCorrect) {
      let userOptIndex = q.options.findIndex(o => o.id === currentFeedback.selectedId);
      stroke(200, 50, 50);
      strokeWeight(3);
      drawingContext.setLineDash([6, 6]);
      line(leftNodeX, leftY, rightX - 110, startY + userOptIndex * gapY);
      drawingContext.setLineDash([]); // 恢復實線
    }

    // 下方即時解說卡片與「下一題」按鈕
    let cardW = min(width * 0.85, 700);
    let cardY = height - 130;
    fill(currentFeedback.isCorrect ? 235 : 253, currentFeedback.isCorrect ? 247 : 237, currentFeedback.isCorrect ? 238 : 237);
    stroke(currentFeedback.isCorrect ? 31 : 200, currentFeedback.isCorrect ? 122 : 50, currentFeedback.isCorrect ? 77 : 50);
    strokeWeight(2);
    rect(width / 2 - cardW / 2, cardY, cardW, 110, 16);

    noStroke();
    fill(currentFeedback.isCorrect ? 31 : 200, currentFeedback.isCorrect ? 122 : 50, currentFeedback.isCorrect ? 77 : 50);
    textSize(20);
    textStyle(BOLD);
    text(currentFeedback.isCorrect ? "⭕ 答對了！" : `❌ 答錯囉！正確答案是：${q.options.find(o => o.id === q.correctId).text}`, width / 2 - 60, cardY + 35);

    fill(60);
    textSize(15);
    textStyle(NORMAL);
    text(q.explain, width / 2 - 60, cardY + 75);

    // 下一題按鈕
    let nextBtnX = width / 2 + cardW / 2 - 130;
    let nextBtnY = cardY + 30;
    fill(31, 122, 77);
    rect(nextBtnX, nextBtnY, 110, 50, 25);
    fill(255);
    textSize(18);
    textStyle(BOLD);
    text("下一題 ➡️", nextBtnX + 55, nextBtnY + 25);
  }
}

// ----------------------------------------------------
// 3. 成績結算畫面
// ----------------------------------------------------
function drawResultScreen() {
  fill(31, 122, 77);
  rect(0, 0, width, 90);

  fill(255);
  textSize(min(width * 0.04, 32));
  textStyle(BOLD);
  text("🎉 測驗完成！", width / 2, 45);

  let cardW = min(width * 0.8, 500);
  fill(255);
  stroke(220);
  strokeWeight(2);
  rect(width / 2 - cardW / 2, 130, cardW, 250, 20);

  noStroke();
  fill(50);
  textSize(22);
  text("太棒了！你完成了所有題目！", width / 2, 180);

  fill(200, 50, 50);
  textSize(50);
  textStyle(BOLD);
  text(`${score} 分`, width / 2, 250);

  let correctCount = userAnswers.filter(a => a.isCorrect).length;
  fill(80);
  textSize(18);
  textStyle(NORMAL);
  text(`答對題數：${correctCount} / ${QUESTIONS.length} 題`, width / 2, 320);

  // 按鈕區
  let btnW = 180, btnH = 55;
  fill(242, 183, 5);
  rect(width / 2 - btnW - 15, 420, btnW, btnH, 28);
  fill(255);
  textSize(18);
  textStyle(BOLD);
  text("🔍 看對答案", width / 2 - btnW / 2 - 15, 420 + btnH / 2);

  fill(31, 122, 77);
  rect(width / 2 + 15, 420, btnW, btnH, 28);
  fill(255);
  text("🔄 再玩一次", width / 2 + btnW / 2 + 15, 420 + btnH / 2);
}

// ----------------------------------------------------
// 4. 總對答案（檢討）畫面
// ----------------------------------------------------
function drawReviewScreen() {
  let q = QUESTIONS[currentQIndex];
  let ans = userAnswers[currentQIndex];

  fill(50);
  rect(0, 0, width, 55);
  fill(255);
  textSize(20);
  textStyle(BOLD);
  text(`總檢討 (第 ${currentQIndex + 1} / ${QUESTIONS.length} 題)`, width / 2, 28);

  let leftX = width * 0.25;
  let leftY = height * 0.38;
  let rightX = width * 0.75;
  let startY = height * 0.2;
  let gapY = min(height * 0.1, 70);

  // 左側人物
  fill(255, 248, 220);
  stroke(242, 183, 5);
  strokeWeight(3);
  rect(leftX - 90, leftY - 45, 180, 90, 12);
  noStroke();
  fill(40);
  textSize(22);
  textStyle(BOLD);
  text(q.job, leftX, leftY);

  // 右側選項
  for (let i = 0; i < q.options.length; i++) {
    let opt = q.options[i];
    let optY = startY + i * gapY;

    if (opt.id === q.correctId) {
      fill(235, 247, 238); stroke(31, 122, 77); strokeWeight(3);
    } else if (opt.id === ans.selected && !ans.isCorrect) {
      fill(253, 237, 237); stroke(200, 50, 50); strokeWeight(3);
    } else {
      fill(255); stroke(220); strokeWeight(1);
    }

    rect(rightX - 100, optY - 24, 200, 48, 10);
    noStroke(); fill(50); textSize(17); text(opt.text, rightX, optY);
  }

  // 繪製連線
  let correctOptIndex = q.options.findIndex(o => o.id === q.correctId);
  stroke(31, 122, 77); strokeWeight(4);
  line(leftX + 90, leftY, rightX - 100, startY + correctOptIndex * gapY);

  if (!ans.isCorrect && ans.selected) {
    let userOptIndex = q.options.findIndex(o => o.id === ans.selected);
    stroke(200, 50, 50); strokeWeight(3);
    drawingContext.setLineDash([6, 6]);
    line(leftX + 90, leftY, rightX - 100, startY + userOptIndex * gapY);
    drawingContext.setLineDash([]);
  }

  // 解說卡
  let cardW = min(width * 0.85, 700);
  let cardY = height - 130;
  fill(ans.isCorrect ? 235 : 253, ans.isCorrect ? 247 : 237, ans.isCorrect ? 238 : 237);
  stroke(ans.isCorrect ? 31 : 200, ans.isCorrect ? 122 : 50, ans.isCorrect ? 77 : 50);
  strokeWeight(2);
  rect(width / 2 - cardW / 2, cardY, cardW, 100, 12);

  noStroke();
  fill(ans.isCorrect ? 31 : 200, ans.isCorrect ? 122 : 50, ans.isCorrect ? 77 : 50);
  textSize(18); textStyle(BOLD);
  text(ans.isCorrect ? "⭕ 你答對了！" : "❌ 答錯囉！", width / 2, cardY + 30);
  fill(60); textSize(15); textStyle(NORMAL);
  text(q.explain, width / 2, cardY + 65);

  // 換頁控制
  if (currentQIndex > 0) {
    fill(100); rect(width / 2 - 200, height - 35, 100, 30, 15);
    fill(255); textSize(14); text("⬅️ 上一題", width / 2 - 150, height - 20);
  }
  if (currentQIndex < QUESTIONS.length - 1) {
    fill(31, 122, 77); rect(width / 2 + 100, height - 35, 100, 30, 15);
    fill(255); textSize(14); text("下一題 ➡️", width / 2 + 150, height - 20);
  } else {
    fill(242, 183, 5); rect(width / 2 + 90, height - 35, 120, 30, 15);
    fill(255); textSize(14); text("返回成績 🏆", width / 2 + 150, height - 20);
  }
}

// ----------------------------------------------------
// 事件處理
// ----------------------------------------------------
function mousePressed() {
  initAudio();

  if (gameState === 'START') {
    let btnW = min(width * 0.5, 260);
    let btnY = height / 2 + 150;
    if (mouseX > width / 2 - btnW / 2 && mouseX < width / 2 + btnW / 2 && mouseY > btnY && mouseY < btnY + 65) {
      startGame();
    }
  } else if (gameState === 'QUIZ') {
    let leftX = width * 0.25;
    let leftY = height * 0.4;
    let leftNodeX = leftX + 100;
    if (dist(mouseX, mouseY, leftNodeX, leftY) < 40) {
      isDragging = true;
      dragStartX = leftNodeX;
      dragStartY = leftY;
      dragCurrentX = mouseX;
      dragCurrentY = mouseY;
    }
  } else if (gameState === 'FEEDBACK') {
    // 點擊「下一題」按鈕
    let cardW = min(width * 0.85, 700);
    let nextBtnX = width / 2 + cardW / 2 - 130;
    let nextBtnY = height - 100;
    if (mouseX > nextBtnX && mouseX < nextBtnX + 110 && mouseY > nextBtnY && mouseY < nextBtnY + 50) {
      nextQuestion();
    }
  } else if (gameState === 'RESULT') {
    let btnW = 180, btnH = 55;
    if (mouseX > width / 2 - btnW - 15 && mouseX < width / 2 - 15 && mouseY > 420 && mouseY < 420 + btnH) {
      gameState = 'REVIEW';
      currentQIndex = 0;
      speakExplanation();
    }
    if (mouseX > width / 2 + 15 && mouseX < width / 2 + btnW + 15 && mouseY > 420 && mouseY < 420 + btnH) {
      startGame();
    }
  } else if (gameState === 'REVIEW') {
    if (currentQIndex > 0 && mouseX > width / 2 - 200 && mouseX < width / 2 - 100 && mouseY > height - 35) {
      currentQIndex--; speakExplanation();
    } else if (currentQIndex < QUESTIONS.length - 1 && mouseX > width / 2 + 100 && mouseX < width / 2 + 200 && mouseY > height - 35) {
      currentQIndex++; speakExplanation();
    } else if (currentQIndex === QUESTIONS.length - 1 && mouseX > width / 2 + 90 && mouseX < width / 2 + 210 && mouseY > height - 35) {
      gameState = 'RESULT';
    }
  }
}

function mouseDragged() {
  if (isDragging) {
    dragCurrentX = mouseX;
    dragCurrentY = mouseY;
  }
}

function mouseReleased() {
  if (gameState === 'QUIZ' && isDragging) {
    isDragging = false;
    let q = QUESTIONS[currentQIndex];
    let rightX = width * 0.75 - 110;
    let startY = height * 0.22;
    let gapY = min(height * 0.12, 80);

    for (let i = 0; i < q.options.length; i++) {
      let optY = startY + i * gapY;
      if (dist(mouseX, mouseY, rightX, optY) < 40) {
        submitAnswer(q.options[i].id);
        break;
      }
    }
  }
}

// ----------------------------------------------------
// 邏輯管理
// ----------------------------------------------------
function startGame() {
  gameState = 'QUIZ';
  currentQIndex = 0;
  score = 0;
  userAnswers = [];
}

function submitAnswer(selectedId) {
  let q = QUESTIONS[currentQIndex];
  let isCorrect = (selectedId === q.correctId);

  if (isCorrect) {
    score += 20;
    playCorrectSound();
  } else {
    playWrongSound();
  }

  userAnswers.push({ qIndex: currentQIndex, selected: selectedId, isCorrect: isCorrect });

  // 切換至 FEEDBACK 狀態，停留顯示對錯
  currentFeedback = { selectedId, isCorrect };
  gameState = 'FEEDBACK';
  speakExplanation();
}

function nextQuestion() {
  currentQIndex++;
  if (currentQIndex >= QUESTIONS.length) {
    gameState = 'RESULT';
    playVictorySound();
  } else {
    gameState = 'QUIZ';
  }
}

function initAudio() {
  if (!isAudioInited) {
    synth = new p5.PolySynth();
    isAudioInited = true;
  }
}

function playCorrectSound() { if (synth) { synth.play('G4', 0.2, 0, 0.1); synth.play('C5', 0.2, 0.1, 0.2); } }
function playWrongSound() { if (synth) { synth.play('C3', 0.3, 0, 0.25); } }
function playVictorySound() {
  if (synth) {
    synth.play('C4', 0.2, 0, 0.15); synth.play('E4', 0.2, 0.15, 0.15);
    synth.play('G4', 0.2, 0.3, 0.15); synth.play('C5', 0.3, 0.45, 0.4);
  }
}

function speakExplanation() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    let q = QUESTIONS[currentQIndex];
    let isCorrect = gameState === 'FEEDBACK' ? currentFeedback.isCorrect : userAnswers[currentQIndex].isCorrect;
    let textToSpeak = (isCorrect ? "答對了！" : "答錯囉！") + q.explain;

    let msg = new SpeechSynthesisUtterance(textToSpeak);
    msg.lang = 'zh-TW';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
  }
}