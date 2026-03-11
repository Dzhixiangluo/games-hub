// 五子棋游戏 - HTML5 Canvas 版本 (移动端优化)

const BOARD_SIZE = 15;

class Gobang {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 动态计算格子大小
        const maxSize = Math.min(window.innerWidth - 40, window.innerHeight - 300);
        this.cellSize = Math.floor(maxSize / BOARD_SIZE);
        
        this.canvas.width = BOARD_SIZE * this.cellSize;
        this.canvas.height = BOARD_SIZE * this.cellSize;
        
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        this.currentPlayer = 1; // 1:黑棋(玩家), 2:白棋(AI)
        this.gameOver = false;
        this.winner = null;
        
        this.setupControls();
        this.draw();
    }
    
    setupControls() {
        // 点击事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // 触摸事件
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
        
        // 按钮
        document.getElementById('btnRestart')?.addEventListener('click', () => {
            this.restart();
        });
    }
    
    handleClick(e) {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // 修正：计算棋盘交叉点坐标，而不是格子坐标
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;
        
        // 找到最近的交叉点
        const x = Math.round(clickX / this.cellSize - 0.5);
        const y = Math.round(clickY / this.cellSize - 0.5);
        
        this.makeMove(x, y);
    }
    
    handleTouch(e) {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // 修正：计算棋盘交叉点坐标
        const clickX = (touch.clientX - rect.left) * scaleX;
        const clickY = (touch.clientY - rect.top) * scaleY;
        
        // 找到最近的交叉点
        const x = Math.round(clickX / this.cellSize - 0.5);
        const y = Math.round(clickY / this.cellSize - 0.5);
        
        this.makeMove(x, y);
    }
    
    makeMove(x, y) {
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return;
        if (this.board[y][x] !== 0) return;
        
        // 玩家落子
        this.board[y][x] = this.currentPlayer;
        this.draw();
        
        // 检查胜负
        if (this.checkWin(x, y, this.currentPlayer)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this.draw();
            return;
        }
        
        // 切换玩家
        this.currentPlayer = 2;
        
        // AI 落子
        setTimeout(() => {
            this.aiMove();
        }, 300);
    }
    
    aiMove() {
        if (this.gameOver) return;
        
        // 简单 AI：找到最佳位置
        let bestMove = this.findBestMove();
        
        if (bestMove) {
            this.board[bestMove.y][bestMove.x] = 2;
            this.draw();
            
            // 检查胜负
            if (this.checkWin(bestMove.x, bestMove.y, 2)) {
                this.gameOver = true;
                this.winner = 2;
                this.draw();
                return;
            }
            
            // 切换回玩家
            this.currentPlayer = 1;
        }
    }
    
    findBestMove() {
        // 1. 检查AI是否能赢
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (this.board[y][x] === 0) {
                    this.board[y][x] = 2;
                    if (this.checkWin(x, y, 2)) {
                        this.board[y][x] = 0;
                        return {x, y};
                    }
                    this.board[y][x] = 0;
                }
            }
        }
        
        // 2. 检查是否需要阻止玩家
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (this.board[y][x] === 0) {
                    this.board[y][x] = 1;
                    if (this.checkWin(x, y, 1)) {
                        this.board[y][x] = 0;
                        return {x, y};
                    }
                    this.board[y][x] = 0;
                }
            }
        }
        
        // 3. 找到评分最高的位置
        let bestScore = -1;
        let bestMoves = [];
        
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (this.board[y][x] === 0) {
                    const score = this.evaluatePosition(x, y);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMoves = [{x, y}];
                    } else if (score === bestScore) {
                        bestMoves.push({x, y});
                    }
                }
            }
        }
        
        // 随机选择一个最佳位置
        if (bestMoves.length > 0) {
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }
        
        return null;
    }
    
    evaluatePosition(x, y) {
        let score = 0;
        
        // 中心位置加分
        const centerX = Math.floor(BOARD_SIZE / 2);
        const centerY = Math.floor(BOARD_SIZE / 2);
        const distanceToCenter = Math.abs(x - centerX) + Math.abs(y - centerY);
        score += (BOARD_SIZE - distanceToCenter) * 2;
        
        // 靠近已有棋子加分
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                    if (this.board[ny][nx] !== 0) {
                        score += 10;
                    }
                }
            }
        }
        
        return score;
    }
    
    checkWin(x, y, player) {
        const directions = [
            [{dx: 1, dy: 0}, {dx: -1, dy: 0}],  // 横
            [{dx: 0, dy: 1}, {dx: 0, dy: -1}],  // 竖
            [{dx: 1, dy: 1}, {dx: -1, dy: -1}], // 主对角
            [{dx: 1, dy: -1}, {dx: -1, dy: 1}]  // 副对角
        ];
        
        for (let direction of directions) {
            let count = 1; // 当前位置
            
            for (let {dx, dy} of direction) {
                let nx = x + dx;
                let ny = y + dy;
                
                while (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                    if (this.board[ny][nx] === player) {
                        count++;
                        nx += dx;
                        ny += dy;
                    } else {
                        break;
                    }
                }
            }
            
            if (count >= 5) return true;
        }
        
        return false;
    }
    
    draw() {
        // 背景
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 网格线
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < BOARD_SIZE; i++) {
            // 横线
            this.ctx.beginPath();
            this.ctx.moveTo(this.cellSize / 2, (i + 0.5) * this.cellSize);
            this.ctx.lineTo(this.canvas.width - this.cellSize / 2, (i + 0.5) * this.cellSize);
            this.ctx.stroke();
            
            // 竖线
            this.ctx.beginPath();
            this.ctx.moveTo((i + 0.5) * this.cellSize, this.cellSize / 2);
            this.ctx.lineTo((i + 0.5) * this.cellSize, this.canvas.height - this.cellSize / 2);
            this.ctx.stroke();
        }
        
        // 天元和星位
        const stars = [
            {x: 3, y: 3}, {x: 11, y: 3},
            {x: 7, y: 7},
            {x: 3, y: 11}, {x: 11, y: 11}
        ];
        
        stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(
                (star.x + 0.5) * this.cellSize,
                (star.y + 0.5) * this.cellSize,
                Math.max(2, this.cellSize * 0.1),
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = '#000000';
            this.ctx.fill();
        });
        
        // 棋子
        const pieceRadius = Math.max(3, this.cellSize * 0.4);
        
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                if (this.board[y][x] !== 0) {
                    const px = (x + 0.5) * this.cellSize;
                    const py = (y + 0.5) * this.cellSize;
                    
                    // 阴影
                    this.ctx.beginPath();
                    this.ctx.arc(px + 2, py + 2, pieceRadius, 0, Math.PI * 2);
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.fill();
                    
                    // 棋子
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, pieceRadius, 0, Math.PI * 2);
                    
                    if (this.board[y][x] === 1) {
                        // 黑棋
                        this.ctx.fillStyle = '#000000';
                        this.ctx.fill();
                        
                        // 高光
                        this.ctx.beginPath();
                        this.ctx.arc(px - pieceRadius * 0.3, py - pieceRadius * 0.3, pieceRadius * 0.3, 0, Math.PI * 2);
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        this.ctx.fill();
                    } else {
                        // 白棋
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.fill();
                        this.ctx.strokeStyle = '#000000';
                        this.ctx.lineWidth = 1;
                        this.ctx.stroke();
                        
                        // 高光
                        this.ctx.beginPath();
                        this.ctx.arc(px - pieceRadius * 0.3, py - pieceRadius * 0.3, pieceRadius * 0.3, 0, Math.PI * 2);
                        this.ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
                        this.ctx.fill();
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
            
            if (this.winner === 1) {
                this.ctx.fillText('你赢了！', this.canvas.width / 2, this.canvas.height / 2);
            } else {
                this.ctx.fillText('AI 获胜！', this.canvas.width / 2, this.canvas.height / 2);
            }
        }
        
        // AI思考提示
        if (!this.gameOver && this.currentPlayer === 2) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, 40);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('AI 思考中...', this.canvas.width / 2, 25);
        }
    }
    
    restart() {
        this.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null;
        this.draw();
    }
}

// 启动游戏
new Gobang();
