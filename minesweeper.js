// 扫雷游戏 - HTML5 Canvas 版本 (优化版)

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
        this.longPressTriggered = false;
        this.longPressDelay = 500;
        
        this.setupControls();
        this.initGrid();
        this.draw();
    }
    
    setupControls() {
        // 鼠标左键 - 翻开
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver) return;
            const {x, y} = this.getMouseCoords(e);
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                this.revealCell(x, y);
            }
        });
        
        // 鼠标右键 - 标记
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.gameOver) return;
            const {x, y} = this.getMouseCoords(e);
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                this.toggleFlag(x, y);
            }
        });
        
        // 触摸事件
        let touchStartX, touchStartY;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameOver) return;
            
            const touch = e.touches[0];
            const {x, y} = this.getTouchCoords(touch);
            touchStartX = x;
            touchStartY = y;
            
            this.longPressTriggered = false;
            
            // 长按检测 - 标记
            this.longPressTimer = setTimeout(() => {
                if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                    this.longPressTriggered = true;
                    this.toggleFlag(x, y);
                    
                    // 震动反馈（如果支持）
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }
            }, this.longPressDelay);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            // 移动超过一定距离取消长按
            const touch = e.touches[0];
            const {x, y} = this.getTouchCoords(touch);
            
            if (Math.abs(x - touchStartX) > 1 || Math.abs(y - touchStartY) > 1) {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // 取消长按定时器
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
            
            // 如果是短按（非长按触发），则翻开格子
            if (!this.longPressTriggered) {
                const touch = e.changedTouches[0];
                const {x, y} = this.getTouchCoords(touch);
                if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
                    this.revealCell(x, y);
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
    
    getMouseCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = Math.floor((e.clientX - rect.left) * scaleX / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) * scaleY / this.cellSize);
        
        return {x, y};
    }
    
    getTouchCoords(touch) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = Math.floor((touch.clientX - rect.left) * scaleX / this.cellSize);
        const y = Math.floor((touch.clientY - rect.top) * scaleY / this.cellSize);
        
        return {x, y};
    }
    
    toggleFlag(x, y) {
        if (this.revealed[y][x]) return;
        
        if (this.flagged[y][x]) {
            this.flagged[y][x] = false;
            this.flagCount--;
        } else {
            this.flagged[y][x] = true;
            this.flagCount++;
        }
        
        this.updateUI();
        this.draw();
    }
    
    revealCell(x, y) {
        if (this.revealed[y][x] || this.flagged[y][x]) return;
        
        this.revealed[y][x] = true;
        
        if (this.grid[y][x] === -1) {
            this.gameOver = true;
            this.revealAllMines();
        } else if (this.grid[y][x] === 0) {
            this.revealAdjacent(x, y);
        }
        
        this.checkWin();
        this.draw();
    }
    
    revealAdjacent(x, y) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    if (!this.revealed[ny][nx] && !this.flagged[ny][nx]) {
                        this.revealed[ny][nx] = true;
                        
                        if (this.grid[ny][nx] === 0) {
                            this.revealAdjacent(nx, ny);
                        }
                    }
                }
            }
        }
    }
    
    initGrid() {
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
        
        let minesPlaced = 0;
        while (minesPlaced < MINE_COUNT) {
            const x = Math.floor(Math.random() * GRID_SIZE);
            const y = Math.floor(Math.random() * GRID_SIZE);
            
            if (this.grid[y][x] !== -1) {
                this.grid[y][x] = -1;
                minesPlaced++;
            }
        }
        
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x] !== -1) {
                    let count = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                                if (this.grid[ny][nx] === -1) {
                                    count++;
                                }
                            }
                        }
                    }
                    this.grid[y][x] = count;
                }
            }
        }
        
        this.updateUI();
    }
    
    revealAllMines() {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x] === -1) {
                    this.revealed[y][x] = true;
                }
            }
        }
    }
    
    checkWin() {
        let revealedCount = 0;
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.revealed[y][x]) {
                    revealedCount++;
                }
            }
        }
        
        if (revealedCount === GRID_SIZE * GRID_SIZE - MINE_COUNT) {
            this.gameOver = true;
            this.won = true;
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#34495E';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const px = x * this.cellSize;
                const py = y * this.cellSize;
                const margin = 1;
                
                if (this.revealed[y][x]) {
                    this.ctx.fillStyle = '#ECF0F1';
                    this.ctx.fillRect(px + margin, py + margin, 
                                    this.cellSize - margin * 2, 
                                    this.cellSize - margin * 2);
                    
                    if (this.grid[y][x] === -1) {
                        this.ctx.fillStyle = '#E74C3C';
                        this.ctx.beginPath();
                        this.ctx.arc(px + this.cellSize / 2, py + this.cellSize / 2, 
                                   this.cellSize * 0.3, 0, Math.PI * 2);
                        this.ctx.fill();
                    } else if (this.grid[y][x] > 0) {
                        this.ctx.fillStyle = this.getNumberColor(this.grid[y][x]);
                        this.ctx.font = `bold ${this.cellSize * 0.5}px Arial`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(this.grid[y][x], 
                                        px + this.cellSize / 2, 
                                        py + this.cellSize / 2);
                    }
                } else {
                    this.ctx.fillStyle = '#7F8C8D';
                    this.ctx.fillRect(px + margin, py + margin, 
                                    this.cellSize - margin * 2, 
                                    this.cellSize - margin * 2);
                    
                    if (this.flagged[y][x]) {
                        this.ctx.fillStyle = '#E74C3C';
                        this.ctx.font = `bold ${this.cellSize * 0.6}px Arial`;
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText('🚩', px + this.cellSize / 2, py + this.cellSize / 2);
                    }
                }
            }
        }
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            if (this.won) {
                this.ctx.fillText('恭喜过关！', this.canvas.width / 2, this.canvas.height / 2);
            } else {
                this.ctx.fillText('游戏失败！', this.canvas.width / 2, this.canvas.height / 2);
            }
        }
    }
    
    getNumberColor(num) {
        const colors = ['', '#3498DB', '#27AE60', '#E74C3C', '#8E44AD', '#E67E22', '#16A085', '#C0392B', '#2C3E50'];
        return colors[num] || '#000';
    }
    
    updateUI() {
        document.getElementById('flagCount').textContent = `${this.flagCount} / ${MINE_COUNT}`;
    }
    
    restart() {
        this.gameOver = false;
        this.won = false;
        this.flagCount = 0;
        this.initGrid();
        this.draw();
    }
}

new Minesweeper();
