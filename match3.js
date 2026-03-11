// 消消乐游戏 - HTML5 Canvas 版本 (优化形状区分)

const GRID_SIZE = 8;
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon']; // 6种形状
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
    
    handleCellClick(x, y) {
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
        
        if (!this.selectedCell) {
            this.selectedCell = {x, y};
            this.draw();
        } else {
            const dx = Math.abs(this.selectedCell.x - x);
            const dy = Math.abs(this.selectedCell.y - y);
            
            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                this.swap(this.selectedCell.x, this.selectedCell.y, x, y);
            }
            
            this.selectedCell = null;
            this.draw();
        }
    }
    
    initGrid() {
        for (let y = 0; y < GRID_SIZE; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                this.grid[y][x] = Math.floor(Math.random() * COLORS.length);
            }
        }
        
        while (this.findMatches().length > 0) {
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    this.grid[y][x] = Math.floor(Math.random() * COLORS.length);
                }
            }
        }
    }
    
    swap(x1, y1, x2, y2) {
        const temp = this.grid[y1][x1];
        this.grid[y1][x1] = this.grid[y2][x2];
        this.grid[y2][x2] = temp;
        
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            this.moves--;
            this.updateScore();
            this.processMatches();
        } else {
            this.grid[y2][x2] = this.grid[y1][x1];
            this.grid[y1][x1] = temp;
        }
        
        if (this.moves <= 0) {
            this.gameOver = true;
        }
        
        this.draw();
    }
    
    findMatches() {
        const matches = [];
        
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const color = this.grid[y][x];
                
                let hCount = 1;
                while (x + hCount < GRID_SIZE && this.grid[y][x + hCount] === color) {
                    hCount++;
                }
                
                if (hCount >= 3) {
                    for (let i = 0; i < hCount; i++) {
                        matches.push({x: x + i, y});
                    }
                }
                
                let vCount = 1;
                while (y + vCount < GRID_SIZE && this.grid[y + vCount][x] === color) {
                    vCount++;
                }
                
                if (vCount >= 3) {
                    for (let i = 0; i < vCount; i++) {
                        matches.push({x, y: y + i});
                    }
                }
            }
        }
        
        const unique = [];
        matches.forEach(match => {
            if (!unique.find(m => m.x === match.x && m.y === match.y)) {
                unique.push(match);
            }
        });
        
        return unique;
    }
    
    processMatches() {
        this.animating = true;
        
        setTimeout(() => {
            const matches = this.findMatches();
            
            if (matches.length > 0) {
                this.score += matches.length * 10;
                this.updateScore();
                
                matches.forEach(match => {
                    this.grid[match.y][match.x] = -1;
                });
                
                this.draw();
                
                setTimeout(() => {
                    this.dropGems();
                    this.draw();
                    
                    setTimeout(() => {
                        this.processMatches();
                    }, 300);
                }, 200);
            } else {
                this.animating = false;
                this.draw();
            }
        }, 100);
    }
    
    dropGems() {
        for (let x = 0; x < GRID_SIZE; x++) {
            let emptySpaces = 0;
            
            for (let y = GRID_SIZE - 1; y >= 0; y--) {
                if (this.grid[y][x] === -1) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    this.grid[y + emptySpaces][x] = this.grid[y][x];
                    this.grid[y][x] = -1;
                }
            }
            
            for (let y = 0; y < emptySpaces; y++) {
                this.grid[y][x] = Math.floor(Math.random() * COLORS.length);
            }
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const color = this.grid[y][x];
                
                if (color >= 0) {
                    const px = x * this.cellSize;
                    const py = y * this.cellSize;
                    const margin = 4;
                    
                    this.ctx.fillStyle = '#34495E';
                    this.ctx.fillRect(px + margin, py + margin, 
                                    this.cellSize - margin * 2, 
                                    this.cellSize - margin * 2);
                    
                    if (this.selectedCell && this.selectedCell.x === x && this.selectedCell.y === y) {
                        this.ctx.strokeStyle = '#FFD700';
                        this.ctx.lineWidth = 3;
                        this.ctx.strokeRect(px + margin, py + margin, 
                                          this.cellSize - margin * 2, 
                                          this.cellSize - margin * 2);
                    }
                    
                    // 绘制形状（不同颜色对应不同形状）
                    const centerX = px + this.cellSize / 2;
                    const centerY = py + this.cellSize / 2;
                    const size = (this.cellSize - margin * 2) * 0.35;
                    
                    this.ctx.fillStyle = COLORS[color];
                    this.drawShape(centerX, centerY, size, SHAPES[color]);
                }
            }
        }
        
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏结束！', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.font = '18px Arial';
            this.ctx.fillText(`得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }
    
    drawShape(x, y, size, shape) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        this.ctx.beginPath();
        
        switch(shape) {
            case 'circle':
                this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                break;
                
            case 'square':
                this.ctx.rect(-size, -size, size * 2, size * 2);
                break;
                
            case 'triangle':
                this.ctx.moveTo(0, -size);
                this.ctx.lineTo(size, size);
                this.ctx.lineTo(-size, size);
                this.ctx.closePath();
                break;
                
            case 'diamond':
                this.ctx.moveTo(0, -size);
                this.ctx.lineTo(size, 0);
                this.ctx.lineTo(0, size);
                this.ctx.lineTo(-size, 0);
                this.ctx.closePath();
                break;
                
            case 'star':
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    const r = i % 2 === 0 ? size : size * 0.4;
                    const px = Math.cos(angle) * r;
                    const py = Math.sin(angle) * r;
                    if (i === 0) {
                        this.ctx.moveTo(px, py);
                    } else {
                        this.ctx.lineTo(px, py);
                    }
                }
                this.ctx.closePath();
                break;
                
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const px = Math.cos(angle) * size;
                    const py = Math.sin(angle) * size;
                    if (i === 0) {
                        this.ctx.moveTo(px, py);
                    } else {
                        this.ctx.lineTo(px, py);
                    }
                }
                this.ctx.closePath();
                break;
        }
        
        this.ctx.fill();
        
        // 高光效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.3, -size * 0.3, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
    }
    
    restart() {
        this.score = 0;
        this.moves = MAX_MOVES;
        this.selectedCell = null;
        this.gameOver = false;
        this.animating = false;
        this.initGrid();
        this.updateScore();
        this.draw();
    }
}

new MatchThree();
