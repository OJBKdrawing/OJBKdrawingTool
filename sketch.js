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
  
  // 响应式画布大小：取窗口宽高中的较小值，最大不超过 787
  let size = min(windowWidth * 0.95, windowHeight * 0.7, 787);
  let canvas = createCanvas(size, size);
  canvas.parent('main');
  
  // 创建离屏缓冲区，保持固定比例
  pg = createGraphics(size, size);
  pg.background(0);
  
  textFont('Arial');
  textSize(size * 0.025); // 文字大小随画布缩放

  // 绑定分享按钮点击事件
  let shareBtn = document.getElementById('shareButton');
  if (shareBtn) {
    shareBtn.onclick = uploadToGallery;
  }
}

// 适配窗口缩放
function windowResized() {
  let size = min(windowWidth * 0.95, windowHeight * 0.7, 787);
  resizeCanvas(size, size);
  // 注意：pg 不随之缩放，以保护已画内容，或者根据需要处理 pg 缩放
}

function draw() {
  // 1. 先把底层画板的内容“印”到主画布上
  image(pg, 0, 0, width, height);
  
  // 2. 然后在主画布上画出说明文字
  instructionText();

  // 检查是否有按键被持续按下 (仅 PC 端有效)
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

// 移动端触摸开始 (对应 mouseClicked)
function touchStarted() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    if (!keyIsPressed) {
      pg.stroke(255);
      if (clickCount % 2 === 0) {
        lastDotX = mouseX;
        lastDotY = mouseY;
        pg.point(lastDotX, lastDotY);
        clickCount++;
      } else {
        pg.line(lastDotX, lastDotY, mouseX, mouseY);
        clickCount++;
      }
    }
    // 防止手机浏览器默认滚动
    return false;
  }
}

// 移动端触摸拖动 (对应 mouseDragged)
function touchMoved() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    if (!keyIsPressed) {
        pg.stroke(255);
        pg.line(pmouseX, pmouseY, mouseX, mouseY);
    }
    // 防止手机浏览器默认滚动
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
  } else if (key === 'o') {
    floodFill(mouseX, mouseY, color(255));
  } else if (key === 'p') {
    floodFill(mouseX, mouseY, color(0));
  }
}

function keyReleased() {
  if (key === 'x') {
    bTime = 0;
  }
}

function mouseClicked() {
  if (!keyIsPressed) {
    pg.stroke(255);
    if (clickCount % 2 === 0) {
      lastDotX = mouseX;
      lastDotY = mouseY;
      pg.point(lastDotX, lastDotY);
      clickCount++;
    } else {
      pg.line(lastDotX, lastDotY, mouseX, mouseY);
      clickCount++;
    }
  }
}

function mouseDragged() {
    if (!keyIsPressed) {
        pg.stroke(255);
        pg.line(pmouseX, pmouseY, mouseX, mouseY);
    }
}

function instructionText() {
  // 仅在 PC 端显示按键说明，手机端显示简略说明
  fill(255);
  noStroke();
  let size = width;
  textSize(size * 0.03); 
  
  if (windowWidth > 600) {
    text("Drag Mouse OR 'z' to free-draw", 10, size * 0.04);
    text("'a' to draw straight lines", 10, size * 0.07);
    text("'c' to reset straight lines", 10, size * 0.10);
    text("'e' to erase / 'x' for dotted line", 10, size * 0.13);
    text("'o'/'p' to fill white/black", 10, size * 0.16);
  } else {
    text("Touch to draw / drag to free-draw", 10, size * 0.05);
    text("OJBK Drawing Tool - Mobile", 10, size * 0.10);
  }
}

// --- Firebase 上传逻辑 (Firestore Base64 方式) ---
async function uploadToGallery() {
    const shareBtn = document.getElementById('shareButton');
    shareBtn.innerText = "Uploading...";
    shareBtn.disabled = true;

    try {
        // 1. 将 pg 内容转换为 Base64 字符串
        // 使用较小的质量压缩以确保不超出 Firestore 的 1MB 限制
        const dataUrl = pg.canvas.toDataURL('image/png');
        
        // 2. 检查大小 (1MB = 1,048,576 bytes)
        if (dataUrl.length > 1048576) {
            alert("Drawing is too complex to share for free! Try erasing some parts.");
            shareBtn.innerText = "Share to Gallery";
            shareBtn.disabled = false;
            return;
        }

        // 3. 直接保存 Base64 字符串到 Firestore
        await window.firebaseRefs.addDoc(window.firebaseRefs.collection(window.firebaseDB, "drawings"), {
            imageData: dataUrl, // 直接存字符串
            createdAt: window.firebaseRefs.serverTimestamp(),
            reportCount: 0,      // 初始化举报次数为 0
            status: 'active'    // 初始化状态为活跃
        });
        
        alert("Shared to Gallery successfully! (Stored in Database)");
        shareBtn.innerText = "Share to Gallery";
        shareBtn.disabled = false;
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Make sure Firestore is enabled in Test Mode.");
        shareBtn.innerText = "Share to Gallery";
        shareBtn.disabled = false;
    }
}

// 油漆桶功能 (Flood Fill) 的 JavaScript 高性能实现
function floodFill(startX, startY, fillColor) {
  startX = Math.floor(startX);
  startY = Math.floor(startY);
  
  if (startX < 0 || startX >= pg.width || startY < 0 || startY >= pg.height) return;

  pg.loadPixels();
  
  const targetR = red(fillColor);
  const targetG = green(fillColor);
  const targetB = blue(fillColor);
  const targetA = alpha(fillColor);

  const startPos = (startY * pg.width + startX) * 4;
  const startR = pg.pixels[startPos];
  const startG = pg.pixels[startPos + 1];
  const startB = pg.pixels[startPos + 2];
  const startA = pg.pixels[startPos + 3];

  if (startR === targetR && startG === targetG && startB === targetB && startA === targetA) {
    return;
  }

  const stack = [[startX, startY]];
  
  pg.pixels[startPos] = targetR;
  pg.pixels[startPos+1] = targetG;
  pg.pixels[startPos+2] = targetB;
  pg.pixels[startPos+3] = targetA;
  
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < pg.width && ny >= 0 && ny < pg.height) {
        const nPos = (ny * pg.width + nx) * 4;
        if (pg.pixels[nPos] === startR && 
            pg.pixels[nPos+1] === startG && 
            pg.pixels[nPos+2] === startB && 
            pg.pixels[nPos+3] === startA) {
          
          pg.pixels[nPos] = targetR;
          pg.pixels[nPos+1] = targetG;
          pg.pixels[nPos+2] = targetB;
          pg.pixels[nPos+3] = targetA;
          
          stack.push([nx, ny]);
        }
      }
    }
  }
  pg.updatePixels();
}
