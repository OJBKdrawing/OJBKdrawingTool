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
  pg.pixelDensity(1); // 非常重要：确保缓冲区像素密度也为 1
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
  // 移除原来的自动连线逻辑
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
function floodFill(canvasX, canvasY, fillColor) {
  // 将主画布坐标映射到离屏缓冲区 pg 的像素坐标
  let startX = Math.floor(map(canvasX, 0, width, 0, pg.width));
  let startY = Math.floor(map(canvasY, 0, height, 0, pg.height));
  
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
