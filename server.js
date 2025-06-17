// server.js (MODIFIED FOR HEALTH, FASTER TICK RATE, AND HIT DETECTION)

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); // *** ??????? 1: ??????? ????? path ??????? ?? ???????? ***

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// *** ??????? 2: ????? ???? ??????? ??????? ????? ??? ???? 'public' ***
// app.use(express.static(__dirname));  <-- ??? ????? ??????
app.use(express.static(path.join(__dirname, 'public'))); // <-- ??? ????? ?????? ???????

let waitingPlayer = null;
const rooms = {};
// ### MODIFICATION: Increased tick rate for higher responsiveness ###
const gameTickRate = 1000 / 60; // 60 updates per second is standard and good

const DEFAULT_MAX_HITS = 10; // Default health for online players

io.on('connection', (socket) => {
    console.log(`[+] Player connected: ${socket.id}`);

    if (waitingPlayer) {
        const opponentSocket = io.sockets.sockets.get(waitingPlayer);
        if (!opponentSocket) {
            console.log(`[!] Waiting player ${waitingPlayer} disconnected before match.`);
            waitingPlayer = socket.id;
            socket.emit('waitingForOpponent');
            return;
        }

        const roomId = `room_${waitingPlayer}_${socket.id}`;
        console.log(`[OK] Match found! Creating room: ${roomId}`);
        
        opponentSocket.join(roomId);
        socket.join(roomId);
        
        rooms[roomId] = {
            roomId: roomId,
            players: {
                [waitingPlayer]: { id: waitingPlayer, x: 200, y: 400, isFacingRight: true, isTransformed: false, selectedTransformation: 'default', isHit: false, animationState: 'idle', health: DEFAULT_MAX_HITS, maxHealth: DEFAULT_MAX_HITS },
                [socket.id]: { id: socket.id, x: 1000, y: 400, isFacingRight: false, isTransformed: false, selectedTransformation: 'default', isHit: false, animationState: 'idle', health: DEFAULT_MAX_HITS, maxHealth: DEFAULT_MAX_HITS }
            },
            gameInterval: null
        };
        
        io.to(roomId).emit('matchFound', {
            roomId: roomId,
            players: rooms[roomId].players,
            player1: waitingPlayer,
            player2: socket.id
        });
        
        startGameLoop(roomId);
        waitingPlayer = null;

    } else {
        waitingPlayer = socket.id;
        socket.emit('waitingForOpponent');
    }

    // --- Player State Update ---
    socket.on('playerUpdate', (data) => {
        const roomId = Array.from(socket.rooms)[1];
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
            // Update player state, but preserve health as server-authoritative
            const serverState = rooms[roomId].players[socket.id];
            Object.assign(serverState, data);
        }
    });
    
    // --- Bullet Firing ---
    socket.on('fireBullet', (bulletData) => {
        const roomId = Array.from(socket.rooms)[1];
        if (rooms[roomId]) {
            socket.to(roomId).emit('opponentFired', bulletData);
        }
    });

    // ### NEW: Kick Action ###
    socket.on('kick', () => {
        const roomId = Array.from(socket.rooms)[1];
        if(roomId) {
            socket.to(roomId).emit('opponentKicked');
        }
    });

    // ### NEW: Finisher Action ###
    socket.on('finisher', () => {
        const roomId = Array.from(socket.rooms)[1];
        if(roomId) {
            socket.to(roomId).emit('opponentUsedFinisher');
        }
    });

    const handlePlayerHit = (victimSocket, damage = 1) => {
        const roomId = Array.from(victimSocket.rooms)[1];
        const room = rooms[roomId];
        if (room && room.players[victimSocket.id]) {
            const victimId = victimSocket.id;
            const victim = room.players[victimId];
            
            if (victim.health > 0) {
                victim.health -= damage;
                
                // Find hitterId
                const hitterId = Object.keys(room.players).find(id => id !== victimId);
                console.log(`[HIT] Player ${victimId} was hit. New health: ${victim.health}`);

                // Inform both players about the hit immediately for responsive feedback
                io.to(roomId).emit('playerWasHit', { victimId: victimId, newHealth: victim.health });

                if (victim.health <= 0) {
                    console.log(`[KO] Player ${hitterId} defeated Player ${victimId}`);
                    io.to(roomId).emit('gameOver', { winnerId: hitterId, loserId: victimId });
                    
                    if (room.gameInterval) clearInterval(room.gameInterval);
                    delete rooms[roomId];
                    console.log(`[X] Room ${roomId} closed due to game over.`);
                }
            }
        }
    };

    // --- Player Hit by Bullet ---
    socket.on('iGotHitByBullet', () => {
        handlePlayerHit(socket, 1); // Bullet damage = 1
    });

    // --- Player Hit by Kick ---
    socket.on('iGotHitByKick', () => {
        handlePlayerHit(socket, 2); // Kick damage = 2
    });

    // --- Player Hit by Finisher ---
    socket.on('iGotHitByFinisher', () => {
         handlePlayerHit(socket, 3); // Finisher damage = 3
    });

    // --- Disconnection ---
    socket.on('disconnect', () => {
        console.log(`[-] Player disconnected: ${socket.id}`);
        if (waitingPlayer === socket.id) {
            waitingPlayer = null;
            console.log(`[!] Waiting player left.`);
        }
        
        const roomId = Array.from(socket.rooms)[1];
        if (rooms[roomId]) {
            io.to(roomId).emit('opponentDisconnected');
            if (rooms[roomId].gameInterval) clearInterval(rooms[roomId].gameInterval);
            delete rooms[roomId];
            console.log(`[X] Room ${roomId} closed.`);
        }
    });
});

function startGameLoop(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.gameInterval = setInterval(() => {
        io.to(roomId).emit('gameStateUpdate', room.players);
    }, gameTickRate);
}

// *** ??????? 3: ????? '0.0.0.0' ????? ??????? ?? ???? ????????? ***
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));s
