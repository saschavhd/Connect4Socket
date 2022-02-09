const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { Connect4 } = require('./Connect4.js');

// Server-Client init
const app = express();
const clientPath = `${__dirname}/../Client`;
console.log(`Server static from ${clientPath}`);
app.use(express.static(clientPath));
const server = http.createServer(app);
const io = socketio(server);


const rooms = {};

const roomData = {};
const socketRoomConns = {};

for (let i = 1; i < 7; i++) {
    game = new Connect4(io, i);
    rooms[i] = game;
}

// io handlers
io.on('error', (err) => {
    console.log(err);
});

io.of('/').on('connection', (socket) => connect(socket));

// io handler functions
function connect(socket) {
    // Send live games data
    socket.emit('init');
    // Connection logging
    console.log(`Socket (${socket.id}) connected`);
    socket.on("disconnect", () => {
        console.log(`Socket (${socket.id}) disconnect`);
        const roomId = socketRoomConns[socket.id];
        const room = rooms[roomId];
        if (room) {
            room.leave(socket.id);
            socket.leave(roomId);
        }
    });
    socket.on('reconnect', () => {
        console.log(`Socket (${socket.id}) reconnect`)
    });

    // room connections
    socket.on('create-room', (roomId, cb) => {
        if (rooms[roomId]) cb(false);

        const room = new Connect4(io, roomId);
        room.join(socket.id);
        rooms[roomId] = room;
        socket.join(roomId);
        socketRoomConns[socket.id] = roomId;
        cb(true);
    });

    socket.on('join-room', (roomId, cb) => {
        if (socketRoomConns[socket.id]) {
            cb(false);
        }
        const room = rooms[roomId];
        if (room) {
            if (room.join(socket.id)) {
                socketRoomConns[socket.id] = roomId;
                socket.join(roomId);
                // console.log(room);
                cb(true);
            }
        }
        cb(false);
    });

    socket.on('leave-room', (cb) => {
        const roomId = socketRoomConns[socket.id]
        if (roomId) {
            const room = rooms[roomId];
            if (room) {
                room.leave(socket.id);
                socket.leave(roomId);
                delete socketRoomConns[socket.id];
                cb(true);
            }
        }
        cb(false);
    });


    // game connections
    socket.on('play-turn', (colNum) => {
        const roomId = socketRoomConns[socket.id];
        if (roomId) {
            const room = rooms[roomId];
            if (room) {
                room.play(socket.id, colNum);
            }
        }
    });

    socket.on('restart-game', () => {
        const room = getRoomBySocketId(socket.id);
        if (room) {
            room.restart(socket.id);
        }
    });
}

function getRoomBySocketId(socketId) {
    const roomId = socketRoomConns[socketId];
    if (roomId) {
        const room = rooms[roomId];
        return room ?? roomId;
    }
    return null;
}

const port = 8080;
// Listener
server.listen(port, () => {
    console.log(`started on ${port}`);
});
