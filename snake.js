// 贪吃蛇游戏 - Web 版本
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏配置 - 修复移动端显示
const GRID_ROWS = 20;  // 减少行数，增大格子
const GRID_COLS = 20;  // 减少列数
const CELL_SIZE = Math.min(
    Math.floor((window.innerWidth - 40) / GRID_COLS),
    Math.floor((window.innerHeight - 250) / GRID_ROWS),
    20  // 最小20px
);

canvas.width = GRID_COLS * CELL_SIZE;
canvas.height = GRID_ROWS * CELL_SIZE;

// 颜色配置
const COLOR_BG = '#141420';
const COLOR_GRID = '#2a2a35';
const COLOR_SNAKE = '#4CAF50';
const COLOR_SNAKE_HEAD = '#66BB6A';
const COLOR_SNAKE_BORDER = '#2E7D32';
const COLOR_FOOD = '#FF5722';
const COLOR_FOOD_BORDER = '#D84315';

// 游戏状态
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
let gameOver = false;
let paused = false;
let gameSpeed = 150;
let lastUpdateTime = 0;

// 初始化
function init() {
    const centerX = Math.floor(GRID_COLS / 2);
    const centerY = Math.floor(GRID_ROWS / 2);
    
    snake = [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY }
    ];
    
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameOver = false;
    paused = false;
    
    updateScore();
    placeFood();
    draw();
}

// 放置食物
function placeFood() {
    do {
        food.x = Math.floor(Math.random() * GRID_COLS);
        food.y = Math.floor(Math.random() * GRID_ROWS);
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// 更新游戏
function update() {
    if (gameOver || paused) return;
    
    direction = { ...nextDirection };
    
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // 检测碰撞
    if (head.x < 0 || head.x >= GRID_COLS || 
        head.y < 0 || head.y >= GRID_ROWS ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver = true;
        draw();
        return;
    }
    
    snake.unshift(head);
    
    // 吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateScore();
        placeFood();
    } else {
        snake.pop();
    }
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格线
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= GRID_COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(canvas.width, y * CELL_SIZE);
        ctx.stroke();
    }
    
    // 绘制食物
    drawFood(food.x, food.y);
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        if (index === 0) {
            drawSnakeHead(segment.x, segment.y);
        } else {
            drawSnakeBody(segment.x, segment.y);
        }
    });
    
    // 游戏结束提示
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束！', canvas.width / 2, canvas.height / 2 - 30);
        ctx.font = '18px Arial';
        ctx.fillText(`得分: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('按空格键重新开始', canvas.width / 2, canvas.height / 2 + 40);
    }
    
    // 暂停提示
    if (paused && !gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('暂停中', canvas.width / 2, canvas.height / 2);
    }
}

// 绘制蛇头
function drawSnakeHead(x, y) {
    const px = x * CELL_SIZE + 2;
    const py = y * CELL_SIZE + 2;
    const size = CELL_SIZE - 4;
    
    // 主体
    ctx.fillStyle = COLOR_SNAKE_HEAD;
    ctx.fillRect(px, py, size, size);
    
    // 边框
    ctx.strokeStyle = COLOR_SNAKE_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, size, size);
    
    // 眼睛
    const eyeSize = Math.max(2, Math.floor(size * 0.15));
    const eyeOffset = size * 0.3;
    
    ctx.fillStyle = '#000000';
    if (direction.x === 1) { // 右
        ctx.fillRect(px + size - eyeSize * 2, py + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(px + size - eyeSize * 2, py + size - eyeOffset - eyeSize, eyeSize, eyeSize);
    } else if (direction.x === -1) { // 左
        ctx.fillRect(px + eyeSize, py + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(px + eyeSize, py + size - eyeOffset - eyeSize, eyeSize, eyeSize);
    } else if (direction.y === -1) { // 上
        ctx.fillRect(px + eyeOffset, py + eyeSize, eyeSize, eyeSize);
        ctx.fillRect(px + size - eyeOffset - eyeSize, py + eyeSize, eyeSize, eyeSize);
    } else { // 下
        ctx.fillRect(px + eyeOffset, py + size - eyeSize * 2, eyeSize, eyeSize);
        ctx.fillRect(px + size - eyeOffset - eyeSize, py + size - eyeSize * 2, eyeSize, eyeSize);
    }
}

// 绘制蛇身
function drawSnakeBody(x, y) {
    const px = x * CELL_SIZE + 2;
    const py = y * CELL_SIZE + 2;
    const size = CELL_SIZE - 4;
    
    ctx.fillStyle = COLOR_SNAKE;
    ctx.fillRect(px, py, size, size);
    
    ctx.strokeStyle = COLOR_SNAKE_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, size, size);
}

// 绘制食物
function drawFood(x, y) {
    const px = x * CELL_SIZE + CELL_SIZE / 2;
    const py = y * CELL_SIZE + CELL_SIZE / 2;
    const radius = Math.max(3, CELL_SIZE * 0.35);
    
    // 外圈
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_FOOD;
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = COLOR_FOOD_BORDER;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 高光
    ctx.beginPath();
    ctx.arc(px - radius * 0.3, py - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
}

// 更新分数显示
function updateScore() {
    document.getElementById('score').textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
    }
    document.getElementById('highScore').textContent = highScore;
}

// 游戏循环
function gameLoop(timestamp) {
    if (timestamp - lastUpdateTime >= gameSpeed) {
        update();
        draw();
        lastUpdateTime = timestamp;
    }
    requestAnimationFrame(gameLoop);
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameOver) {
            init();
        } else {
            paused = !paused;
        }
        return;
    }
    
    if (gameOver || paused) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction.y === 0) nextDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction.y === 0) nextDirection = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction.x === 0) nextDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction.x === 0) nextDirection = { x: 1, y: 0 };
            break;
    }
});

// 触摸控制
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (gameOver || paused) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        // 水平滑动
        if (dx > 30 && direction.x === 0) {
            nextDirection = { x: 1, y: 0 };
        } else if (dx < -30 && direction.x === 0) {
            nextDirection = { x: -1, y: 0 };
        }
    } else {
        // 垂直滑动
        if (dy > 30 && direction.y === 0) {
            nextDirection = { x: 0, y: 1 };
        } else if (dy < -30 && direction.y === 0) {
            nextDirection = { x: 0, y: -1 };
        }
    }
});

// 按钮控制
document.getElementById('btnUp')?.addEventListener('click', () => {
    if (!gameOver && !paused && direction.y === 0) {
        nextDirection = { x: 0, y: -1 };
    }
});

document.getElementById('btnDown')?.addEventListener('click', () => {
    if (!gameOver && !paused && direction.y === 0) {
        nextDirection = { x: 0, y: 1 };
    }
});

document.getElementById('btnLeft')?.addEventListener('click', () => {
    if (!gameOver && !paused && direction.x === 0) {
        nextDirection = { x: -1, y: 0 };
    }
});

document.getElementById('btnRight')?.addEventListener('click', () => {
    if (!gameOver && !paused && direction.x === 0) {
        nextDirection = { x: 1, y: 0 };
    }
});

document.getElementById('btnRestart')?.addEventListener('click', () => {
    init();
});

// 启动游戏
init();
requestAnimationFrame(gameLoop);
