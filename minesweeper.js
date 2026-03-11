// 扫雷游戏 - HTML5 Canvas 版本 (修复移动端)

const GRID_SIZE = 16;
const MINE_COUNT = 40;

class Minesweeper {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 动态计算格子大小
        const maxSize = Math.min(window.innerWidth - 40, window.innerHeight - 300);
        this.cellSize = Math.floor(maxSize / GRID_SIZE);
        
        this.canvas.width = GRID_SIZE * this.cellSize;
        this.canvas.height = GRID_SIZE * this.cellSize;
        
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.won = false;
        this.flagCount = 0;
        
        this.longPressTimer = null;
        this.longPressDelay = 500;
        
        this.setupControls();
        this.initGrid();
        this.draw();
    }
    
    setupControls() {
        // 鼠标点击
        this.canvas.addEventListener('click', (e) => this.handleClick(e, false));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleClick(e, true);
        });
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const {x, y} = this.getTouchCoords(touch);
            
            // 长按检测
            this.longPressTimer = setTimeout(() => {
                if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                    this.handleCellAction(x, y, true);
                }
                this.longPressTimer = null;
            }, this.longPressDelay);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            // 移动时取消长按
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
                
                // 短按
                const touch = e.changedTouches[0];
                const {x, y} = this.getTouchCoords(touch);
                if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                    this.handleCellAction(x, y, false);
                }
            }
        });
        
        // 键盘
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameOver) {
                this.restart();
            }
        });
        
        // 重启按钮
        document.getElementById('btnRestart')?.addEventListener('click', () => {
            this.restart();
        });
    }
    
    handleClick(e, isRightClick) {
        if (this.gameOver) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = Math.floor((e.clientX - rect.left) * scaleX / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) * scaleY / this.cellSize);
        
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            this.handleCellAction(x, y, isRightClick);
        }
    }
    
    getTouchCoords(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = Math.floor((touch.clientX - rect.left) * scaleX / this.cellSize);
        const y = Math.floor((touch.clientY - rect.top) * scaleY / this.cellSize);
        
        return {x, y};
    }
    
    handleCellAction(x, y, isFlag) {
        if (isFlag) {
            // 标记/取消标记
            this.toggleFlag(x, y);
        } else {
            // 揭开
            this.revealCell(x, y);
        }
    }
    
    initGrid() {
        // 初始化网格
        for (let y = 0; y < GRID_SIZE; y++) {
            this.grid[y] = [];
            this.revealed[y] = [];
            this.flagged[y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                this.grid[y][x] = 0;
                this.revealed[y][x] = false;
                this.flagged[y][x] = false;
            }
        }
        
        // 放置地雷
        let minesPlaced = 0;
        while (minesPlaced < MINE_COUNT) {
            const x = Math.floor(Math.random() * GRID_SIZE);
            const y = Math.floor(Math.random() * GRID_SIZE);
            
            if (this.grid[y][x] !== -1) {
                this.grid[y][x] = -1;
                minesPlaced++;
            }
        }
        
        // 计算数字
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x] === -1) continue;
                
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                            if (this.grid[ny][nx] === -1) count++;
                        }
                    }
                }
                this.grid[y][x] = count;
            }
        }
        
        this.updateFlagCount();
    }
    
    revealCell(x, y) {
        if (this.gameOver || this.revealed[y][x] || this.flagged[y][x]) return;
        
        this.revealed[y][x] = true;
        
        if (this.grid[y][x] === -1) {
            // 踩到地雷
            this.gameOver = true;
            this.revealAll();
            this.draw();
            return;
        }
        
        // 自动展开空白区域
        if (this.grid[y][x] === 0) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                        if (!this.revealed[ny][nx]) {
                            this.revealCell(nx, ny);
                        }
                    }
                }
            }
        }
        
        this.draw();
        this.checkWin();
    }
    
    toggleFlag(x, y) {
        if (this.gameOver || this.revealed[y][x]) return;
        
        this.flagged[y][x] = !this.flagged[y][x];
        this.flagCount += this.flagged[y][x] ? 1 : -1;
        this.updateFlagCount();
        this.draw();
    }
    
    revealAll() {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                this.revealed[y][x] = true;
            }
        }
    }
    
    checkWin() {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x] !== -1 && !this.revealed[y][x]) {
                    return;
                }
            }
        }
        
        this.gameOver = true;
        this.won = true;
        this.draw();
    }
    
    draw() {
        // 背景
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制格子
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const px = x * this.cellSize;
                const py = y * this.cellSize;
                
                if (this.revealed[y][x]) {
                    // 已揭开
                    this.ctx.fillStyle = '#e0e0e0';
                    this.ctx.fillRect(px + 1, py + 1, this.cellSize - 2, this.cellSize - 2);
                    
                    if (this.grid[y][x] === -1) {
                        // 地雷
                        this.drawMine(px, py);
                    } else if (this.grid[y][x] > 0) {
                        // 数字
                        this.drawNumber(px, py, this.grid[y][x]);
                    }
                } else {
                    // 未揭开
                    this.ctx.fillStyle = '#4a4a6a';
                    this.ctx.fillRect(px + 1, py + 1, this.cellSize - 2, this.cellSize - 2);
                    
                    // 高光效果
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    this.ctx.fillRect(px + 1, py + 1, this.cellSize - 2, this.cellSize / 3);
                    
                    if (this.flagged[y][x]) {
                        this.drawFlag(px, py);
                    }
                }
            }
        }
        
        // 网格线
        this.ctx.strokeStyle = '#2a2a3e';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.canvas.width, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // 游戏结束提示
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            
            if (this.won) {
                this.ctx.fillText('恭喜获胜！', this.canvas.width / 2, this.canvas.height / 2);
            } else {
                this.ctx.fillText('游戏失败！', this.canvas.width / 2, this.canvas.height / 2);
            }
        }
    }
    
    drawMine(px, py) {
        const centerX = px + this.cellSize / 2;
        const centerY = py + this.cellSize / 2;
        const radius = Math.max(3, this.cellSize * 0.25);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawFlag(px, py) {
        const centerX = px + this.cellSize / 2;
        const centerY = py + this.cellSize / 2;
        const size = Math.max(4, this.cellSize * 0.4);
        
        this.ctx.fillStyle = '#F44336';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - size / 2, centerY - size / 3);
        this.ctx.lineTo(centerX + size / 2, centerY);
        this.ctx.lineTo(centerX - size / 2, centerY + size / 3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 旗杆
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = Math.max(1, this.cellSize * 0.05);
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - size / 2, centerY - size / 3);
        this.ctx.lineTo(centerX - size / 2, centerY + size / 2);
        this.ctx.stroke();
    }
    
    drawNumber(px, py, num) {
        const colors = ['', '#0000FF', '#008000', '#FF0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
        
        this.ctx.fillStyle = colors[num];
        this.ctx.font = `bold ${Math.max(10, this.cellSize * 0.5)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(num, px + this.cellSize / 2, py + this.cellSize / 2);
    }
    
    updateFlagCount() {
        document.getElementById('flags').textContent = `${this.flagCount} / ${MINE_COUNT}`;
    }
    
    restart() {
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.won = false;
        this.flagCount = 0;
        this.initGrid();
        this.draw();
    }
}

// 启动游戏
new Minesweeper();
