let idleSprite;   // 待機用精靈（資料夾 2 的 all.png）
let runSprite;    // 走/跑動作（資料夾 1 的 all.png）
let jumpSprite;   // 起跳動作（資料夾 3 的 all.png）
let crouchSprite; // 蹲下動作（資料夾 4 的 all.png）
let bgImage;      // 背景圖片（背景資料夾的 1.jpg）

// 幀切換延遲（數值越大越慢）
// - 待機使用 IDLE_FRAME_DELAY
// - 移動（左右鍵）使用 RUN_FRAME_DELAY（通常比待機慢一些以避免看起來像兩個角色）
const IDLE_FRAME_DELAY = 12;
const RUN_FRAME_DELAY = 20;

// 待機圖片尺寸（自動偵測結果）
const IDLE_IMAGE_TOTAL_W = 111;
const IDLE_IMAGE_TOTAL_H = 50;
const IDLE_TOTAL_FRAMES = 4;
const IDLE_FRAME_W = IDLE_IMAGE_TOTAL_W / IDLE_TOTAL_FRAMES; // 精確分割
const IDLE_FRAME_H = IDLE_IMAGE_TOTAL_H; // 50

// 走/跑圖片（資料夾 1）的參數（總寬由檔案量測為 235x51，使用者指定為 6 幀）
const RUN_IMAGE_TOTAL_W = 235;
const RUN_IMAGE_TOTAL_H = 51;
const RUN_TOTAL_FRAMES = 6;
const RUN_FRAME_W = RUN_IMAGE_TOTAL_W / RUN_TOTAL_FRAMES; // 精確分割
const RUN_FRAME_H = RUN_IMAGE_TOTAL_H; // 51

// 起跳圖片（資料夾 3）的參數（已量測總寬 235x53，假設為 6 幀水平排列）
const JUMP_IMAGE_TOTAL_W = 235;
const JUMP_IMAGE_TOTAL_H = 53;
const JUMP_TOTAL_FRAMES = 6;
const JUMP_FRAME_W = JUMP_IMAGE_TOTAL_W / JUMP_TOTAL_FRAMES; // 58.75
const JUMP_FRAME_H = JUMP_IMAGE_TOTAL_H; // 53

// 蹲下圖片（資料夾 4）的參數（已量測總寬 183x49，假設為 4 幀水平排列）
const CROUCH_IMAGE_TOTAL_W = 183;
const CROUCH_IMAGE_TOTAL_H = 49;
const CROUCH_TOTAL_FRAMES = 4;
const CROUCH_FRAME_W = CROUCH_IMAGE_TOTAL_W / CROUCH_TOTAL_FRAMES; // 45.75
const CROUCH_FRAME_H = CROUCH_IMAGE_TOTAL_H; // 49

// 跳躍物理參數
let isJumping = false;
let vy = 0;
// 調整為較小的重力與較小的初速，產生較緩慢、漂浮感的起落
const GRAVITY = 0.35;
const JUMP_V = -12;
// 落地後保留最後一幀的設定（落地時顯示 jump 的最後一格）
const LAND_HOLD_FRAMES = 6; // 落地後保持最後一幀的更新次數（可調）
let landHoldCounter = 0;

// 繪製用：角色位置
let playerX;
let playerY;
let groundY;

function preload() {
  // 載入待機用精靈（資料夾 2）
  idleSprite = loadImage('2/all.png');
  // 載入走/跑用精靈（資料夾 1）
  runSprite = loadImage('1/all.png');
  // 載入起跳用精靈（資料夾 3）
  jumpSprite = loadImage('3/all.png');
  // 載入蹲下用精靈（資料夾 4）
  crouchSprite = loadImage('4/all.png');
  // 載入背景圖片（背景資料夾的 1.jpg）
  bgImage = loadImage('背景/1.jpg');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noSmooth();
  // 初始位置置中
  playerX = width / 2;
  // 設定地面高度與初始 Y（角色站在畫面中間偏下位置）
  groundY = height * 0.6;
  playerY = groundY;
}

function draw() {
  // 繪製背景圖片（縮放至視窗大小）
  if (bgImage) {
    image(bgImage, 0, 0, width, height);
  } else {
    background('#f5c9eaff');
  }

  // 決定要顯示哪張圖與參數（預設待機）
  let img = idleSprite;
  let fw = IDLE_FRAME_W;
  let fh = IDLE_FRAME_H;
  let tf = IDLE_TOTAL_FRAMES;
  let flipped = false; // 是否需水平鏡像（按左鍵時鏡向顯示）

  const movingRight = keyIsDown(RIGHT_ARROW);
  const movingLeft = keyIsDown(LEFT_ARROW);
  const movingDown = keyIsDown(DOWN_ARROW);

  // 起跳：當按上鍵且目前不在跳躍中，開始跳躍
  if (keyIsDown(UP_ARROW) && !isJumping) {
    isJumping = true;
    vy = JUMP_V;
  }

  // 蹲下狀態優先級最高（若按下箭頭則蹲下，同時可按左鍵鏡向）
  if (movingDown && crouchSprite) {
    img = crouchSprite;
    fw = CROUCH_FRAME_W;
    fh = CROUCH_FRAME_H;
    tf = CROUCH_TOTAL_FRAMES;
    if (movingLeft) {
      flipped = true; // 蹲下時按左鍵，鏡向朝左
    }
  } else if (movingRight && runSprite) {
    img = runSprite;
    fw = RUN_FRAME_W;
    fh = RUN_FRAME_H;
    tf = RUN_TOTAL_FRAMES;
    playerX += 4; // 向右移動速度
  } else if (movingLeft && runSprite) {
    img = runSprite;
    fw = RUN_FRAME_W;
    fh = RUN_FRAME_H;
    tf = RUN_TOTAL_FRAMES;
    flipped = true; // 以鏡像方式畫同一張圖
    playerX -= 4; // 向左移動速度
  }

  // 若在跳躍中，覆蓋使用 jumpSprite 並套用垂直物理
  if (isJumping && jumpSprite) {
    img = jumpSprite;
    fw = JUMP_FRAME_W;
    fh = JUMP_FRAME_H;
    tf = JUMP_TOTAL_FRAMES;
    // 水平移動在空中仍然允許
    if (movingRight) playerX += 4;
    if (movingLeft) playerX -= 4;

    // 更新垂直速度與位置
    vy += GRAVITY;
    playerY += vy;
    // 落地判斷
    if (playerY >= groundY) {
      playerY = groundY;
      vy = 0;
      // 標記為已落地，開始落地保持最後一幀的計時
      isJumping = false;
      landHoldCounter = LAND_HOLD_FRAMES;
    }
  }

  // 如果剛落地，保持 jump 的最後一幀數個更新次數
  let idx, sx, sy = 0;
  if (landHoldCounter > 0 && jumpSprite) {
    img = jumpSprite;
    fw = JUMP_FRAME_W;
    fh = JUMP_FRAME_H;
    tf = JUMP_TOTAL_FRAMES;
    idx = JUMP_TOTAL_FRAMES - 1; // 最後一幀
    sx = Math.round(idx * fw);
    landHoldCounter--;
  } else {
    // 計算目前幀以連續播放（依狀態選擇延遲）
    const frameDelay = isJumping ? RUN_FRAME_DELAY : ((movingLeft || movingRight) ? RUN_FRAME_DELAY : IDLE_FRAME_DELAY);
    idx = floor(frameCount / frameDelay) % tf;
    sx = Math.round(idx * fw);
  }

  // 放大比例
  const SCALE = 4;
  const drawW = fw * SCALE;
  const drawH = fh * SCALE;

  // 邊界限制
  playerX = constrain(playerX, drawW / 2, width - drawW / 2);

  // 繪製（置中）
  const dx = playerX - drawW / 2;
  const dy = playerY - drawH / 2;

  if (flipped) {
    push();
    translate(playerX, playerY);
    scale(-1, 1);
    image(img, -drawW / 2, -drawH / 2, drawW, drawH, sx, sy, fw, fh);
    pop();
  } else {
    image(img, dx, dy, drawW, drawH, sx, sy, fw, fh);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 重新計算地面高度與角色 Y（若不在跳躍中）
  groundY = height * 0.6;
  if (!isJumping) playerY = groundY;
}
