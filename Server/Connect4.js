class Connect4 {
    // State & Data
    io;
    roomId;
    board = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0]
    ];
    admin;
    players = [];
    maxPlayers = 2;
    turn = 1;
    colors = ["red", "yellow"];
    running = false;
    BOARD_WIDTH = 7; BOARD_HEIGHT = 6;

    // Constructor
    constructor(io, roomId) {
        this.io = io;
        this.roomId = roomId;
    }


    // Properties
    currentPlayer() {
        return this.players[this.turn-1];
    }

    otherPlayers() {
        return this.players.filter(player => player != this.currentPlayer());
    }

    playerColor(player) {
        return this.colors[player-1];
    }


    // player join room
    join(playerSocket) {
        if (this.players.length >= this.maxPlayers) {
            return false;
        }
        this.players.push(playerSocket);
        if (this.players.length == this.maxPlayers) {
            this.start();
        } else { this.io.to(playerSocket).emit('game-info', "Awaiting more players"); }

        this.io.to(this.roomId).emit('player-join-room', playerSocket);
        return true;
    }

    // player leave room
    leave(playerSocket) {
        const playerInd = this.players.indexOf(playerSocket);
        this.players.splice(playerInd, playerInd+1);

        this.io.to(this.roomId).emit('game-info', `Player ${playerInd+1} left the room`);
        this.default();
    }


    // Reset board
    resetBoard() {
        for (let i = 0; i < this.BOARD_HEIGHT; i++) {
            for (let j = 0; j < this.BOARD_WIDTH; j++) {
                this.board[i][j] = 0;
            }
        }
        this.io.to(this.roomId).emit('reset-board');
    }

    default() {
        this.running = false;
        this.turn = 1;
        this.resetBoard();
    }

    start() {
        this.running = true;
        this.resetBoard();
        this.emitTurnInfo();
    }

    // Restart the game
    restart(playerSocket) {
        // cannot restart game if running
        if (this.running === true) {
            this.io.to(playerSocket).emit('game-error', "Game still in progress");
            return false;
        }
        else if (this.players.length !== this.maxPlayers) {
            this.io.to(playerSocket).emit('game-error', "Not enough players");
            return false
        }
        this.start();
        return true;
    }

    // Set turn to next player
    next() {
        if (this.turn === this.maxPlayers) this.turn = 1;
        else this.turn++;
    }

    // Simple turn information emitter
    emitTurnInfo() {
        this.io.to(this.currentPlayer()).emit('game-info', "Your turn");
        this.io.to(this.otherPlayers()).emit('game-info', "Ememy turn");
    }

    play(playerSocket, colNum) {
        // check if game is running
        if (!this.running)  {
            this.io.to(playerSocket).emit('game-error', "Game not running")
            return false;
        }
        // check if it's the players turn
        if (playerSocket !== this.currentPlayer()) {
            this.io.to(playerSocket).emit('game-error', "Not your turn");
            return false
        }

        for (let i = this.BOARD_HEIGHT-1; i >= 0; i--) {
            if (this.board[i][colNum] === 0) {
                // set field to player number
                this.board[i][colNum] = this.turn;
                // emit the turn to the room
                this.io.to(this.roomId).emit('turn-played', this.playerColor(this.turn), i, colNum);
                // check for winning combination
                const win = this.checkWin(this.turn);
                if (win) {
                    this.io.to(this.roomId).emit('game-won', win);
                    this.io.to(this.roomId).emit('game-info', `Player ${this.turn} won`);
                    this.running = false;
                    return true;
                }
                this.next();
                this.emitTurnInfo();

                // return that move is valid
                return true;
            }
        }
        this.io.to(this.currentPlayer()).emit('game-error', "Invalid move")
        // return that move is invalid
        return false;
    }


    checkWin(player) {
        // horizontal
        for (let i = 0; i < this.BOARD_HEIGHT; i++) {
            for (let j = 0; j < this.BOARD_WIDTH-3; j++) {
                if (this.board[i][j] === player && this.board[i][j+1] === player && this.board[i][j+2] === player && this.board[i][j+3] === player)
                    return [[i, j], [i, j+1], [i, j+2], [i, j+3]];
            }
        }

        // vertical
        for (let i = 0; i < this.BOARD_WIDTH; i++) {
            for (let j = 0; j < this.BOARD_HEIGHT-3; j++) {
                if (this.board[j][i] === player && this.board[j+1][i] === player && this.board[j+2][i] === player && this.board[j+3][i] === player)
                    return [[j, i], [j+1, i], [j+2, i], [j+3, i]];
            }
        }

        // diagonal ascending
        for (let i = 0; i < this.BOARD_HEIGHT-3; i++) {
            for (let j = 0; j < this.BOARD_WIDTH-3; j++) {
                if (this.board[i][j] == player && this.board[i+1][j+1] == player && this.board[i+2][j+2] == player && this.board[i+3][j+3] == player)
                    return [[i, j], [i+1, j+1], [i+2, j+2], [i+3, j+3]];
            }
        }

        // diagonal descendening
        for (let i = 0; i < this.BOARD_HEIGHT-3; i++) {
            for (let j = 3; j < this.BOARD_WIDTH; j++) {
                if (this.board[i][j] == player && this.board[i+1][j-1] == player && this.board[i+2][j-2] == player && this.board[i+3][j-3] == player)
                    return [[i, j], [i+1, j-1], [i+2, j-2], [i+3, j-3]];
            }
        }

        return false;
    }
}

module.exports = { Connect4 };
