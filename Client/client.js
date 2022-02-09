// Listener
const socket = io.connect("host_adress");

// music w& sounds
const gameInfoSound = new Audio('Sounds/drop.wav');
gameInfoSound.autoplay = true;

// Rooms & Connection DOM
const mainCntr = document.getElementById('main-cntr');
const roomIdInput = document.getElementById('room-id-input');
const connectionCntr = document.getElementById('connection-cntr');
const roomConnectionCntr = document.getElementById('room-connection-cntr');
const leaveRoomCntr = document.getElementById('leave-room-cntr');
const gameCntr = document.getElementById('game-cntr');
const gameInfoCntr = document.getElementById('game-info-cntr');
const gameMsgCntr = document.getElementById('game-msg-cntr');

// Game DOM
const board = document.getElementById('board');


// Connection
const joinRoomBtn = document.getElementById('join-room-btn');
joinRoomBtn.addEventListener('click', () => {
    gameInfoSound.play();
    if (roomIdInput.value) {
        socket.emit('join-room', roomIdInput.value, (success) => {
            if (success) {
                setup();
            }
        });
    }
});

const createRoomBtn = document.getElementById('create-room-btn');
createRoomBtn.addEventListener('click', () => {
    gameInfoSound.play();
    if (roomIdInput.value) {
        socket.emit('create-room', roomIdInput.value, (success, roomId) => {
            if (success) {
                setup();
            }
        });
    }
});

const leaveRoomBtn = document.getElementById('leave-room-btn');
leaveRoomBtn.addEventListener('click', () => {
    socket.emit('leave-room', (success) => {
        if (success) mainMenu();
    });
});


// Game
BOARD_WIDTH = 7; BOARD_HEIGHT = 6;
function makeBoard() {
    board.id = 'board';
    for (let i = 0; i <= BOARD_HEIGHT-1; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        for (let j = 0; j <= BOARD_WIDTH-1; j++) {
            const field = document.createElement('div');
            field.className = 'field white';
            field.id = `field${i}${j}`;
            // Event listeners
            field.addEventListener('click', () => {
                socket.emit('play-turn', j);
            });

            field.addEventListener('mouseover', () => {
                for (let i = BOARD_HEIGHT-1; i >= 0; i--) {
                    const checkField = document.getElementById(`field${i}${j}`);
                    if (checkField.classList.contains('white')) {
                        checkField.classList.replace('white', 'gray');
                        return;
                    }
                }
            });

            field.addEventListener('mouseleave', () => {
                for (let i = BOARD_HEIGHT-1; i >= 0; i--) {
                    const checkField = document.getElementById(`field${i}${j}`);
                    if (checkField.classList.contains('gray')) {
                        checkField.classList.replace('gray', 'white')
                        return;
                    }
                }
            });
            row.appendChild(field);
        }
        board.appendChild(row);
    }
    mainCntr.appendChild(board);
}

function resetBoard() {
    for (const row of board.childNodes) {
        for (const field of row.childNodes) {
            field.className = 'field white';
        }
    }
}

const restartGameBtn = document.getElementById('restart-game-btn');
restartGameBtn.addEventListener('click', () => {
    socket.emit('restart-game');
});


// Set uppers
function mainMenu() {
    board.style.display = 'none';
    roomConnectionCntr.style.display = 'block';
    gameInfoCntr.style.display = 'none';
    resetBoard();
}

function setup() {
    roomConnectionCntr.style.display = 'none';
    gameInfoCntr.style.display = 'block';
    board.style.display = 'block';
    resetBoard();
    // backgroundMusic = new Audio('Sounds/background.wav');
    // if (typeof backgroundMusic.loop == 'boolean')
    // {
    //     backgroundMusic.loop = true;
    // }
    // else
    // {
    //     backgroundMusic.addEventListener('ended', function() {
    //         this.currentTime = 0;
    //         this.play();
    //     }, false);
    // }
    // backgroundMusic.play();
}


// Server to client emits
socket.on('reset-board', () => {
    resetBoard();
});

socket.on('turn-played', (color, row, col) => {
    const field = document.getElementById(`field${row}${col}`);
    field.className = `field ${color}`;
});

socket.on('game-info', (info) => {
    gameInfoSound.play();
    gameMsgCntr.innerText = `${info}`;
});

socket.on('game-won', (locations) => {
    for (const coord of locations) {
        let row, col;
        [row, col] = coord;
        const field = document.getElementById(`field${row}${col}`);
        field.className = "field green";
    }
});

socket.on('game-error', (error) => {
    gameMsgCntr.innerText = `${error}`;
    board.classList.add('shake');
    setTimeout(() => {
        board.classList.remove('shake');
    }, 500);
});



// MAIN
makeBoard();

function checkWin(player) {
    // horizontal
    for (let i = 0; i < this.BOARD_HEIGHT; i++) {
        for (let j = 0; j < this.BOARD_WIDTH-3; j++) {
            if (this.board[i][j] === player && this.board[i][j+1] === player && this.board[i][j+2] === player && this.board[i][j+3] === player)
                return true;
        }
    }

    // vertical
    for (let i = 0; i < this.BOARD_WIDTH; i++) {
        for (let j = 0; j < this.BOARD_HEIGHT-3; j++) {
            if (this.board[j][i] === player && this.board[j+1][i] === player && this.board[j+2][i] === player && this.board[j+3][i] === player)
                return true;
        }
    }

    // diagonal ascending
    for (let i = 0; i < this.BOARD_HEIGHT-3; i++) {
        for (let j = 0; j < this.BOARD_WIDTH-3; j++) {
            if (this.board[i][j] == player && this.board[i+1][j+1] == player && this.board[i+2][j+2] == player && this.board[i+3][j+3] == player)
                return true;
        }
    }

    // diagonal descendening
    for (let i = 0; i < this.BOARD_HEIGHT-3; i++) {
        for (let j = 3; j < this.BOARD_WIDTH; j++) {
            if (this.board[i][j] == player && this.board[i+1][j-1] == player && this.board[i+2][j-2] == player && this.board[i+3][j-3] == player)
                return true;
        }
    }

    return false;
}
