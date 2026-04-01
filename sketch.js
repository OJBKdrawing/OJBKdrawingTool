let lastDotX, lastDotY;
let clickCount = 0;
let kClickCount = 0;

let pointsX = new Array(400);
let pointsY = new Array(400);

let saveCount = 0;
let bTime = 0;

let pg; // 离屏缓冲区，用于保存纯净的画作

function setup() {
  pixelDensity(1); 
  
  let canvasWidth, canvasHeight;
  // 更加直接的判断：如果是横屏（电脑端），强制正方形
  if (windowWidth > windowHeight) {
    let size = min(windowWidth * 0.8, windowHeight * 0.8, 900);
    canvasWidth = size;
    canvasHeight = size;
    console.log("Desktop Mode: Square Canvas", canvasWidth, "x", canvasHeight);
  } else {
    // 手机端：适配长画幅
    canvasWidth = windowWidth * 0.95;
    canvasHeight = windowHeight * 0.8;
    console.log("Mobile Mode: Long Canvas", canvasWidth, "x", canvasHeight);
  }
  
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('main');
  
  pg = createGraphics(canvasWidth, canvasHeight);
  pg.background(0);
  
  textFont('Arial');
  textSize(min(canvasWidth, canvasHeight) * 0.025);

  let shareBtn = document.getElementById('shareButton');
  if (shareBtn) {
    shareBtn.onclick = uploadToGallery;
  }
}

function windowResized() {
  let canvasWidth, canvasHeight;
  if (windowWidth > windowHeight) {
    let size = min(windowWidth * 0.8, windowHeight * 0.8, 900);
    canvasWidth = size;
    canvasHeight = size;
  } else {
    canvasWidth = windowWidth * 0.95;
    canvasHeight = windowHeight * 0.8;
  }
  resizeCanvas(canvasWidth, canvasHeight);
}

function draw() {
  image(pg, 0, 0, width, height);
  instructionText();

  if (keyIsPressed) {
    if (key === 'z') {
      pg.stroke(255);
      pg.line(mouseX, mouseY, pmouseX, pmouseY);
    } else if (key === 'x') {
      bTime++;
      if (bTime % 10 <= 4) {
        pg.stroke(255);
        pg.line(mouseX, mouseY, pmouseX, pmouseY);
      }
    } else if (key === 'e') {
      pg.fill(0);
      pg.noStroke();
      pg.circle(mouseX, mouseY, 10);
    }
  }
}

// 移除原来的 mouseClicked 自动连线逻辑，统一使用 mouseDragged 自由画
function mouseDragged() {
  if (!keyIsPressed) {
    pg.stroke(255);
    pg.line(pmouseX, pmouseY, mouseX, mouseY);
  }
}

// 手机端触摸开始：仅记录位置或画点，不画直线
function touchStarted() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    if (!keyIsPressed) {
      pg.stroke(255);
      pg.point(mouseX, mouseY);
    }
    return false;
  }
}

// 手机端触摸拖动：自由画
function touchMoved() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    if (!keyIsPressed) {
      pg.stroke(255);
      pg.line(pmouseX, pmouseY, mouseX, mouseY);
    }
    return false;
  }
}

function keyPressed() {
  if (key === 'a') {
    pg.stroke(255);
    if (kClickCount === 0) {
      pointsX[kClickCount] = mouseX;
      pointsY[kClickCount] = mouseY;
      pg.point(pointsX[kClickCount], pointsY[kClickCount]);
      kClickCount++;
    } else {
      pointsX[kClickCount] = mouseX;
      pointsY[kClickCount] = mouseY;
      pg.line(pointsX[kClickCount - 1], pointsY[kClickCount - 1], pointsX[kClickCount], pointsY[kClickCount]);
      kClickCount++;
    }
  } else if (key === 'c') {
    kClickCount = 0;
  } else if (keyCode === BACKSPACE || keyCode === DELETE) {
    pg.background(0);
  } else if (key === 's') {
    // 保存本地
    pg.saveCanvas(`OJBKDrawing_${year()}${month()}${day()}${hour()}${minute()}${saveCount}`, 'png');
    saveCount++;
  }
}

function keyReleased() {
  if (key === 'x') {
    bTime = 0;
  }
}

function mouseClicked() {
  // 移除原来的自动连线逻辑
}

function instructionText() {
  fill(255);
  noStroke();
  let size = width;
  let tSize = size * 0.025; // 稍微调小一点字体，贴合感更好
  textSize(tSize); 
  
  if (windowWidth > 600) {
    // 电脑端说明文字
    let x = 5; // 贴合左边缘
    text("Drag Mouse OR 'z' to free-draw", x, tSize * 1.2);
    text("'a' to draw straight lines", x, tSize * 2.4);
    text("'c' to reset straight lines", x, tSize * 3.6);
    text("'e' to erase / 'x' for dotted line", x, tSize * 4.8);

    // 鼠标悬停检测逻辑 (检测是否在说明文字区域内)
    if (mouseX > 0 && mouseX < 250 && mouseY > 0 && mouseY < tSize * 6) {
      // 绘制半透明黑色背景框
      fill(0, 0, 0, 180);
      rect(mouseX + 15, mouseY, 220, 110, 5);
      
      // 绘制中文版说明
      fill(255);
      textSize(14);
      text("拖动鼠标或按'z'：自由绘画", mouseX + 25, mouseY + 25);
      text("按'a'：绘制连续直线", mouseX + 25, mouseY + 45);
      text("按'c'：重置直线起点", mouseX + 25, mouseY + 65);
      text("按'e'：橡皮擦 / 按'x'：虚线", mouseX + 25, mouseY + 85);
    }
  } else {
    // 手机端简略说明
    textSize(size * 0.04);
    text("Touch to draw / drag to free-draw", 10, size * 0.06);
    text("OJBK Drawing Tool - Mobile", 10, size * 0.12);
  }
}

// --- MemFire Cloud (Supabase) 上传逻辑 ---
async function uploadToGallery() {
    const shareBtn = document.getElementById('shareButton');
    const originalText = "分享到画廊 / Share to Gallery";

    // 检查数据库客户端是否准备好
    if (!window.supabaseClient) {
        console.error("Database client not found. Attempting to re-init...");
        if (typeof initSupabase === 'function') {
            window.supabaseClient = initSupabase();
        }
    }

    if (!window.supabaseClient) {
        alert("数据库连接失败，请检查网络并刷新页面。\nDatabase connection failed. Please check network and refresh.");
        return;
    }

    shareBtn.innerText = "上传中... / Uploading...";
    shareBtn.disabled = true;

    try {
        // 1. 将 pg 内容转换为 Base64 字符串
        const dataUrl = pg.canvas.toDataURL('image/png');
        
        // 2. 检查大小 (由于数据库限制不同，这里依然保持 1MB 检查)
        if (dataUrl.length > 1048576) {
            alert("画作太复杂，无法分享！请尝试擦除部分内容。\nDrawing is too complex to share!");
            shareBtn.innerText = originalText;
            shareBtn.disabled = false;
            return;
        }

        // 3. 直接保存到 MemFire (Supabase) 的 drawings 表
        const { data, error } = await window.supabaseClient
            .from('drawings')
            .insert([
                { 
                    image_data: dataUrl, 
                    status: 'active' 
                }
            ]);

        if (error) throw error;
        
        alert("分享成功！\nShared to Gallery successfully!");
        shareBtn.innerText = originalText;
        shareBtn.disabled = false;
    } catch (error) {
        console.error("Upload failed:", error);
        alert("上传失败，请检查网络或控制台。\nUpload failed. Check console for details.");
        shareBtn.innerText = originalText;
        shareBtn.disabled = false;
    }
}


