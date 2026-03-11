// 俄罗斯方块游戏 - HTML5 Canvas 版本 (修复移动端)

const COLS = 10;
const ROWS = 20;

// 方块形状
const SHAPES = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[1,1,0],[0,1,1]], // S
    [[0,1,1],[1,1,0]], // Z
    [[1,0,0],[1,1,1]], // J
    [[0,0,1],[1,1,1]]  // L
];

const COLORS = [
    '#00f0f0', // I - 青色
    '#f0f000', // O - 黄色
    '#a000f0', // T - 紫色
    '#00f000', // S - 绿色
    '#f00000', // Z - 红色
    '#0000f0', // J - 蓝色
    '#f0a000'  // L - 橙色
];

class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 动态计算格子大小以适配移动端
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 400;
        this.cellSize = Math.min(
            Math.floor(maxWidth / COLS),
            Math.floor(maxHeight / ROWS),
            30
        );
        
        this.canvas.width = COLS * this.cellSize;
        this.canvas.height = ROWS * this.cellSize;
        
        this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        
        this.currentPiece = null;
        this.currentX = 0;
        this.currentY = 0;
        this.currentColor = 0;
        
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.setupControls();
        this.newPiece();
        this.updateScore();
        this.gameLoop(0);
    }
    
    setupControls() {
        // 键盘
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) {
                if (e.code === 'Space') this.restart();
                return;
            }
            
            if (e.key === 'p' || e.key === 'P') {
                this.paused = !this.paused;
                this.draw();
                return;
            }
            
            if (this.paused) return;
            
            switch(e.key) {
                case 'ArrowLeft': this.move(-1); break;
                case 'ArrowRight': this.move(1); break;
                case 'ArrowDown': this.drop(); break;
                case 'ArrowUp':
                case 'w':
                case 'W': this.rotate(); break;
                case ' ': this.hardDrop(); break;
            }
        });
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.gameOver || this.paused) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - this.touchStartX;
            const dy = touchEndY - this.touchStartY;
            
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            
            if (absDx > 50 || absDy > 50) {
                if (absDx > absDy) {
                    // 水平滑动
                    if (dx > 0) {
                        this.move(1); // 右
                    } else {
                        this.move(-1); // 左
                    }
                } else {
                    // 垂直滑动
                    if (dy > 0) {
                        this.drop(); // 下
                    } else {
                        this.rotate(); // 上旋转
                    }
                }
            }
        });
        
        // 按钮
        document.getElementById('btnLeft')?.addEventListener('click', () => {
            if (!this.gameOver && !this.paused) this.move(-1);
        });
        
        document.getElementById('btnRight')?.addEventListener('click', () => {
            if (!this.gameOver && !this.paused) this.move(1);
        });
        
        document.getElementById('btnRotate')?.addEventListener('click', () => {
            if (!this.gameOver && !this.paused) this.rotate();
        });
        
        document.getElementById('btnDrop')?.addEventListener('click', () => {
            if (!this.gameOver && !this.paused) this.drop();
        });
        
        document.getElementById('btnPause')?.addEventListener('click', () => {
            if (!this.gameOver) {
                this.paused = !this.paused;
                this.draw();
            }
        });
        
        document.getElementById('btnRestart')?.addEventListener('click', () => {
            this.restart();
        });
    }
    
    newPiece() {
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        this.currentPiece = SHAPES[shapeIndex];
        this.currentColor = COLORS[shapeIndex];
        this.currentX = Math.floor(COLS / 2) - Math.floor(this.currentPiece[0].length / 2);
        this.currentY = 0;
        
        if (this.collides()) {
            this.gameOver = true;
        }
    }
    
    collides(offsetX = 0, offsetY = 0, piece = this.currentPiece) {
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) {
                    const newX = this.currentX + x + offsetX;
                    const newY = this.currentY + y + offsetY;
                    
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.grid[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    move(dir) {
        if (!this.collides(dir, 0)) {
            this.currentX += dir;
            this.draw();
        }
    }
    
    drop() {
        if (!this.collides(0, 1)) {
            this.currentY++;
            this.draw();
        } else {
            this.merge();
            this.clearLines();
            this.newPiece();
            this.draw();
        }
    }
    
    hardDrop() {
        while (!this.collides(0, 1)) {
            this.currentY++;
        }
        this.merge();
        this.clearLines();
        this.newPiece();
        this.draw();
    }
    
    rotate() {
        const rotated = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[i]).reverse()
        );
        
        if (!this.collides(0, 0, rotated)) {
            this.currentPiece = rotated;
            this.draw();
        }
    }
    
    merge() {
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x]) {
                    const gridY = this.currentY + y;
                    const gridX = this.currentX + x;
                    if (gridY >= 0) {
                        this.grid[gridY][gridX] = this.currentColor;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            const points = [0, 100, 300, 500, 800][linesCleared];
            this.score += points * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateScore();
        }
    }
    
    draw() {
        // 背景
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 网格
        this.ctx.strokeStyle = '#2a2a3e';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= COLS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= ROWS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // 已固定的方块
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.grid[y][x]) {
                    this.drawCell(x, y, this.grid[y][x]);
                }
            }
        }
        
        // 当前方块
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.length; y++) {
                for (let x = 0; x < this.currentPiece[y].length; x++) {
                    if (this.currentPiece[y][x]) {
                        this.drawCell(this.currentX + x, this.currentY + y, this.currentColor);
                    }
                }
            }
        }
        
        // 游戏结束
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏结束！', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
        
        // 暂停
        if (this.paused && !this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('暂停中', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawCell(x, y, color) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const margin = 1;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(px + margin, py + margin, this.cellSize - margin * 2, this.cellSize - margin * 2);
        
        // 高光
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(px + margin, py + margin, this.cellSize - margin * 2, this.cellSize * 0.3);
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    gameLoop(time) {
        if (!this.gameOver && !this.paused) {
            const deltaTime = time - this.lastTime;
            this.dropCounter += deltaTime;
            
            if (this.dropCounter > this.dropInterval) {
                this.drop();
                this.dropCounter = 0;
            }
        }
        
        this.lastTime = time;
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    restart() {
        this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.dropInterval = 1000;
        this.newPiece();
        this.updateScore();
        this.draw();
    }
}

// 启动游戏
new Tetris();
