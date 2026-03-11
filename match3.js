// 消消乐游戏 - HTML5 Canvas 版本 (修复移动端)

const GRID_SIZE = 8;
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
const MAX_MOVES = 30;

class MatchThree {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 动态计算格子大小以适配移动端
        const maxSize = Math.min(window.innerWidth - 40, window.innerHeight - 350);
        this.cellSize = Math.floor(maxSize / GRID_SIZE);
        
        this.canvas.width = GRID_SIZE * this.cellSize;
        this.canvas.height = GRID_SIZE * this.cellSize;
        
        this.grid = [];
        this.score = 0;
        this.moves = MAX_MOVES;
        this.selectedCell = null;
        this.gameOver = false;
        this.animating = false;
        
        this.setupControls();
        this.initGrid();
        this.draw();
    }
    
    setupControls() {
        // 鼠标点击
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleTouch(e);
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
    
    handleClick(e) {
        if (this.gameOver || this.animating) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = Math.floor((e.clientX - rect.left) * scaleX / this.cellSize);
        const y = Math.floor((e.clientY - rect.top) * scaleY / this.cellSize);
        
        this.handleCellClick(x, y);
    }
    
    handleTouch(e) {
        if (this.gameOver || this.animating) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = Math.floor((touch.clientX - rect.left) * scaleX / this.cellSize);
        const y = Math.floor((touch.clientY - rect.top) * scaleY / this.cellSize);
        
        this.handleCellClick(x, y);
    }
    
    initGrid() {
        // 生成初始网格
        for (let y = 0; y < GRID_SIZE; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                this.grid[y][x] = this.getRandomColor();
            }
        }
        
        // 确保初始没有匹配
        while (this.findMatches().length > 0) {
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    this.grid[y][x] = this.getRandomColor();
                }
            }
        }
        
        this.updateScore();
    }
    
    getRandomColor() {
        return COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    
    handleCellClick(x, y) {
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
        
        if (!this.selectedCell) {
            // 第一次选择
            this.selectedCell = {x, y};
            this.draw();
        } else {
            // 第二次选择
            const dx = Math.abs(x - this.selectedCell.x);
            const dy = Math.abs(y - this.selectedCell.y);
            
            if (x === this.selectedCell.x && y === this.selectedCell.y) {
                // 点击同一个格子，取消选择
                this.selectedCell = null;
                this.draw();
            } else if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                // 相邻格子，交换
                this.swapCells(this.selectedCell.x, this.selectedCell.y, x, y);
            } else {
                // 不相邻，重新选择
                this.selectedCell = {x, y};
                this.draw();
            }
        }
    }
    
    swapCells(x1, y1, x2, y2) {
        const temp = this.grid[y1][x1];
        this.grid[y1][x1] = this.grid[y2][x2];
        this.grid[y2][x2] = temp;
        
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            // 有效交换
            this.moves--;
            this.selectedCell = null;
            this.processMatches();
        } else {
            // 无效交换，换回来
            this.grid[y2][x2] = this.grid[y1][x1];
            this.grid[y1][x1] = temp;
            this.selectedCell = null;
        }
        
        this.draw();
    }
    
    findMatches() {
        const matches = [];
        
        // 横向匹配
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE - 2; x++) {
                const color = this.grid[y][x];
                if (color && this.grid[y][x + 1] === color && this.grid[y][x + 2] === color) {
                    for (let i = 0; i < 3; i++) {
                        if (!matches.some(m => m.x === x + i && m.y === y)) {
                            matches.push({x: x + i, y: y});
                        }
                    }
                }
            }
        }
        
        // 纵向匹配
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE - 2; y++) {
                const color = this.grid[y][x];
                if (color && this.grid[y + 1][x] === color && this.grid[y + 2][x] === color) {
                    for (let i = 0; i < 3; i++) {
                        if (!matches.some(m => m.x === x && m.y === y + i)) {
                            matches.push({x: x, y: y + i});
                        }
                    }
                }
            }
        }
        
        return matches;
    }
    
    async processMatches() {
        this.animating = true;
        
        while (true) {
            const matches = this.findMatches();
            if (matches.length === 0) break;
            
            // 清除匹配
            matches.forEach(m => {
                this.grid[m.y][m.x] = null;
                this.score += 10;
            });
            
            this.updateScore();
            this.draw();
            await this.sleep(200);
            
            // 下落
            for (let x = 0; x < GRID_SIZE; x++) {
                let emptySpaces = 0;
                for (let y = GRID_SIZE - 1; y >= 0; y--) {
                    if (this.grid[y][x] === null) {
                        emptySpaces++;
                    } else if (emptySpaces > 0) {
                        this.grid[y + emptySpaces][x] = this.grid[y][x];
                        this.grid[y][x] = null;
                    }
                }
            }
            
            // 填充新宝石
            for (let x = 0; x < GRID_SIZE; x++) {
                for (let y = 0; y < GRID_SIZE; y++) {
                    if (this.grid[y][x] === null) {
                        this.grid[y][x] = this.getRandomColor();
                    }
                }
            }
            
            this.draw();
            await this.sleep(300);
        }
        
        this.animating = false;
        
        // 检查游戏结束
        if (this.moves <= 0) {
            this.gameOver = true;
            this.draw();
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const color = this.grid[y][x];
                if (!color) continue;
                
                const px = x * this.cellSize;
                const py = y * this.cellSize;
                
                // 选中高亮
                if (this.selectedCell && this.selectedCell.x === x && this.selectedCell.y === y) {
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
                }
                
                // 宝石
                const margin = 4;
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(
                    px + this.cellSize / 2,
                    py + this.cellSize / 2,
                    this.cellSize / 2 - margin,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
                
                // 高光
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(
                    px + this.cellSize / 2 - this.cellSize * 0.15,
                    py + this.cellSize / 2 - this.cellSize * 0.15,
                    this.cellSize * 0.15,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
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
        
        // 游戏结束
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏结束！', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.font = '18px Arial';
            this.ctx.fillText(`最终得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
    }
    
    restart() {
        this.grid = [];
        this.score = 0;
        this.moves = MAX_MOVES;
        this.selectedCell = null;
        this.gameOver = false;
        this.animating = false;
        this.initGrid();
        this.draw();
    }
}

// 启动游戏
new MatchThree();
