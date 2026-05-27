class Sudoku {
    constructor() {
        this.board = [];
        this.solution = [];
        this.initialBoard = [];
        this.selectedCell = null;
        this.timer = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.difficulty = 'medium';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.newGame();
    }

    setupEventListeners() {
        document.getElementById('newGame').addEventListener('click', () => this.newGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('newGameWin').addEventListener('click', () => this.newGame());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });

        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const num = parseInt(e.target.dataset.num);
                this.placeNumber(num);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (this.isPaused) return;
            if (e.key >= '1' && e.key <= '9') {
                this.placeNumber(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
                this.placeNumber(0);
            }
        });
    }

    generateSolution() {
        const board = Array(9).fill(0).map(() => Array(9).fill(0));
        this.fillBoard(board);
        return board;
    }

    fillBoard(board) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    this.shuffle(nums);
                    for (let num of nums) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (this.fillBoard(board)) {
                                return true;
                            }
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValid(board, row, col, num) {
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num || board[x][col] === num) {
                return false;
            }
        }

        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    createPuzzle(solution) {
        const puzzle = solution.map(row => [...row]);
        const cellsToRemove = {
            easy: 35,
            medium: 45,
            hard: 55
        };

        const toRemove = cellsToRemove[this.difficulty];
        let removed = 0;

        while (removed < toRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            if (puzzle[row][col] !== 0) {
                puzzle[row][col] = 0;
                removed++;
            }
        }

        return puzzle;
    }

    newGame() {
        this.stopTimer();
        this.timer = 0;
        this.isPaused = false;
        document.getElementById('pauseOverlay').classList.add('hidden');
        document.getElementById('winModal').classList.add('hidden');
        document.getElementById('pauseBtn').textContent = 'Pausar';

        this.solution = this.generateSolution();
        this.board = this.createPuzzle(this.solution);
        this.initialBoard = this.board.map(row => [...row]);
        
        this.renderBoard();
        this.startTimer();
    }

    resetGame() {
        this.board = this.initialBoard.map(row => [...row]);
        this.renderBoard();
    }

    renderBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                if (this.initialBoard[row][col] !== 0) {
                    cell.classList.add('fixed');
                    cell.textContent = this.initialBoard[row][col];
                } else if (this.board[row][col] !== 0) {
                    cell.textContent = this.board[row][col];
                    if (!this.isValidMove(row, col, this.board[row][col])) {
                        cell.classList.add('error');
                    }
                }

                cell.addEventListener('click', () => this.selectCell(row, col));
                boardElement.appendChild(cell);
            }
        }
    }

    selectCell(row, col) {
        if (this.isPaused || this.initialBoard[row][col] !== 0) return;

        this.selectedCell = { row, col };
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected');
        });

        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('selected');
    }

    placeNumber(num) {
        if (!this.selectedCell || this.isPaused) return;

        const { row, col } = this.selectedCell;
        if (this.initialBoard[row][col] !== 0) return;

        this.board[row][col] = num;
        this.renderBoard();

        if (this.checkWin()) {
            this.stopTimer();
            this.showWinModal();
        }
    }

    isValidMove(row, col, num) {
        const temp = this.board[row][col];
        this.board[row][col] = 0;
        const valid = this.isValid(this.board, row, col, num);
        this.board[row][col] = temp;
        return valid;
    }

    checkWin() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0 || this.board[row][col] !== this.solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.timer++;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60).toString().padStart(2, '0');
        const seconds = (this.timer % 60).toString().padStart(2, '0');
        document.getElementById('time').textContent = `${minutes}:${seconds}`;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const overlay = document.getElementById('pauseOverlay');
        const pauseBtn = document.getElementById('pauseBtn');

        if (this.isPaused) {
            overlay.classList.remove('hidden');
            pauseBtn.textContent = 'Continuar';
        } else {
            overlay.classList.add('hidden');
            pauseBtn.textContent = 'Pausar';
        }
    }

    showWinModal() {
        const modal = document.getElementById('winModal');
        const finalTime = document.getElementById('finalTime');
        const minutes = Math.floor(this.timer / 60).toString().padStart(2, '0');
        const seconds = (this.timer % 60).toString().padStart(2, '0');
        finalTime.textContent = `${minutes}:${seconds}`;
        modal.classList.remove('hidden');
    }
}

const game = new Sudoku();
