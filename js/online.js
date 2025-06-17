// js/online.js (MODIFIED FOR BULLET SYNC & HIT DETECTION)

console.log("online.js loaded");

// --- Online State ---
let socket;
let isOnlineMode = false;
let opponent = {}; // Initialize as empty object
let onlinePlayerId = null;

const SERVER_TICK_RATE_MS = 1000 / 60; 

function initializeOnlineLogic() {
    if (socket && socket.connected) {
        socket.emit('findMatch');
        return;
    }
    if(socket) socket.disconnect();

    socket = io({ reconnection: false });
    
    console.log('[Socket] Attempting to connect and find match.');

    socket.on('connect', () => {
        console.log('[Socket] Connected to server with ID:', socket.id);
        onlinePlayerId = socket.id;
        const statusText = document.getElementById('matchmakingStatusText');
        if(statusText) statusText.textContent = "تم الاتصال، جاري البحث عن خصم...";
    });

    socket.on('waitingForOpponent', () => {
        const statusText = document.getElementById('matchmakingStatusText');
        if (statusText) statusText.textContent = 'في انتظار لاعب آخر...';
    });

    socket.on('matchFound', (data) => {
        console.log('[Socket] Match Found!', data);
        
        if (typeof handleMatchFoundUI === "function") {
            handleMatchFoundUI(() => {
                isOnlineMode = true;
                currentLevel = 9; // Battle Arena
                initGame(); 
        
                const opponentId = Object.keys(data.players).find(id => id !== onlinePlayerId);
                const localPlayerData = data.players[onlinePlayerId];
                const opponentData = data.players[opponentId];
                
                player.x = localPlayerData.x * scaleX;
                player.y = localPlayerData.y * scaleY;
                player.isFacingRight = localPlayerData.isFacingRight;
                MAX_PLAYER_HITS = localPlayerData.maxHealth;
                playerHitCount = MAX_PLAYER_HITS - localPlayerData.health;
                
                opponent = {
                    ...opponentData,
                    id: opponentId,
                    width: basePlayer.width * scaleX,
                    height: basePlayer.height * scaleY,
                    x: opponentData.x * scaleX,
                    y: opponentData.y * scaleY,
                    networkPrevX: opponentData.x * scaleX,
                    networkPrevY: opponentData.y * scaleY,
                    targetX: opponentData.x * scaleX,
                    targetY: opponentData.y * scaleY,
                    lastUpdateTime: Date.now(),
                    currentImage: images.playerNormal.img,
                    animationState: 'idle',
                    isKicking: false, // For collision detection
                    isUsingFinisher: false, // For drawing finisher
                };
            });
        }
    });

    socket.on('gameStateUpdate', (playersState) => {
        if (!isOnlineMode || !opponent || !opponent.id || !onlinePlayerId || !playersState) return;
        
        const opponentId = opponent.id;
        
        if (opponentId && playersState[opponentId]) {
            const opponentState = playersState[opponentId];

            opponent.networkPrevX = opponent.targetX;
            opponent.networkPrevY = opponent.targetY;
            opponent.targetX = opponentState.x * scaleX;
            opponent.targetY = opponentState.y * scaleY;
            opponent.lastUpdateTime = Date.now();
            
            opponent.isFacingRight = opponentState.isFacingRight;
            opponent.isTransformed = opponentState.isTransformed;
            opponent.selectedTransformation = opponentState.selectedTransformation;
            opponent.animationState = opponentState.animationState; // Main animation state from server
            opponent.health = opponentState.health;
            opponent.maxHealth = opponentState.maxHealth;
        }

        if (playersState[onlinePlayerId]) {
            const localPlayerState = playersState[onlinePlayerId];
            MAX_PLAYER_HITS = localPlayerState.maxHealth;
            const newHitCount = localPlayerState.maxHealth - localPlayerState.health;
            
            // Only trigger hit feedback if health decreases
            if (newHitCount > playerHitCount) {
                 player.isHit = true;
                 player.hitTimer = 200; // Flash duration
                 playerInvulnerableTimer = PLAYER_INVULNERABILITY_DURATION / 2; // Short invulnerability
            }
            playerHitCount = newHitCount;
        }
    });

    socket.on('opponentFired', (bulletData) => {
        if (!isOnlineMode) return;
        const bulletW = BULLET_WIDTH_BASE * scaleX;
        const bulletH = BULLET_HEIGHT_BASE * scaleY;
        const bulletSpeed = BULLET_SPEED_BASE * scaleX;
        const newBullet = {
            ...bulletData,
            x: bulletData.x * scaleX,
            y: bulletData.y * scaleY,
            velocityX: bulletSpeed * (bulletData.isFacingRight ? 1 : -1),
            width: bulletW,
            height: bulletH,
            image: images.bulletImage.img,
            isOpponentBullet: true,
            ownerId: opponent.id
        };
        bullets.push(newBullet);
    });
    
    // ### NEW LISTENERS FOR OPPONENT ACTIONS ###
    socket.on('opponentKicked', () => {
        if (!isOnlineMode || !opponent) return;
        opponent.isKicking = true;
        setTimeout(() => { if(opponent) opponent.isKicking = false; }, KICK_DURATION);
    });

    socket.on('opponentUsedFinisher', () => {
        if (!isOnlineMode || !opponent) return;
        opponent.isUsingFinisher = true;
        setTimeout(() => { if(opponent) opponent.isUsingFinisher = false; }, FINISHER_DURATION);
    });

    socket.on('playerWasHit', (data) => {
        if (!isOnlineMode) return;
        // This event confirms a hit and provides the new health value.
        // The actual flashing is handled in gameStateUpdate when health changes.
        console.log(`[Event] Player ${data.victimId} was hit. New health: ${data.newHealth}`);
    });

    socket.on('gameOver', (data) => {
        if (!isOnlineMode) return;
        isOnlineMode = false;
        if (data.winnerId === onlinePlayerId) {
            gameOver("لقد فزت!");
        } else {
            gameOver("لقد هُزمت!");
        }
        if (socket) socket.disconnect();
    });

    socket.on('opponentDisconnected', () => {
        if (!isOnlineMode) return;
        isOnlineMode = false;
        gameOver("لقد انقطع اتصال خصمك. لقد فزت!");
        if (socket) socket.disconnect();
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Disconnected from server.');
        if (isOnlineMode) {
             goToMainMenu(); 
             alert("انقطع الاتصال بالخادم.");
        }
        isOnlineMode = false;
    });
}

function updateOpponentInterpolation(deltaTime) {
    if (!isOnlineMode || !opponent.lastUpdateTime) return;

    const now = Date.now();
    const timeSinceUpdate = now - opponent.lastUpdateTime;
    const interpolationFactor = Math.min(1.0, timeSinceUpdate / SERVER_TICK_RATE_MS);

    opponent.x = opponent.networkPrevX + (opponent.targetX - opponent.networkPrevX) * interpolationFactor;
    opponent.y = opponent.networkPrevY + (opponent.targetY - opponent.networkPrevY) * interpolationFactor;
}

// ### MODIFIED: Functions to report different types of hits to the server ###
function reportBulletHitToServer() {
    if (!isOnlineMode || !socket || !socket.connected) return;
    socket.emit('iGotHitByBullet');
}

function reportKickHitToServer() {
    if (!isOnlineMode || !socket || !socket.connected) return;
    socket.emit('iGotHitByKick');
}

function reportFinisherHitToServer() {
    if (!isOnlineMode || !socket || !socket.connected) return;
    socket.emit('iGotHitByFinisher');
}

function sendPlayerUpdateToServer() {
    if (!isOnlineMode || !socket || !socket.connected) return;
    
    let currentAnimationState = 'idle';
    if (isUsingFinisher) currentAnimationState = 'finisher';
    else if (player.isShooting) currentAnimationState = 'shooting';
    else if (player.isJumping) currentAnimationState = 'jumping';
    else if (player.isKicking) currentAnimationState = 'kicking';
    else if (player.velocityX !== 0 || (selectedTransformation === 'staron' && player.velocityY !== 0)) currentAnimationState = 'walking';
    
    const playerData = {
        x: player.x / scaleX,
        y: player.y / scaleY,
        isFacingRight: player.isFacingRight,
        isTransformed: player.isTransformed,
        selectedTransformation: selectedTransformation,
        animationState: currentAnimationState,
    };
    socket.emit('playerUpdate', playerData);
}

function sendBulletToServer(bullet) {
    if (!isOnlineMode || !socket || !socket.connected) return;
    const bulletData = {
        x: bullet.x / scaleX, y: bullet.y / scaleY,
        isFacingRight: bullet.isFacingRight
    };
    socket.emit('fireBullet', bulletData);
}

// ### NEW: Functions to send attack events to server ###
function sendKickToServer() {
    if (!isOnlineMode || !socket || !socket.connected) return;
    socket.emit('kick');
}

function sendFinisherToServer() {
    if (!isOnlineMode || !socket || !socket.connected) return;
    socket.emit('finisher');
}

function drawOpponent() {
    if (!ctx || !isOnlineMode || !opponent.id) return;

    ctx.save();
    let opponentAlpha = 1.0;
    if (opponent.health < opponent.maxHealth && Math.floor(Date.now() / 100) % 2 === 0) {
        // Simple flashing effect if the opponent has been hit at all
        // A dedicated "isHit" flag could be used for more precise timing
    }
    ctx.globalAlpha = opponentAlpha;
    
    let opponentImage = images.playerNormal.img;
    let walkCycle, jumpImage, shootImage, kickImage, idleImage;
    
    if (opponent.isTransformed) {
        if (opponent.selectedTransformation === 'staron') {
            walkCycle = images.playerStaronWalk.map(f => f.img);
            idleImage = images.playerStaronIdle.img;
            jumpImage = idleImage; shootImage = idleImage; kickImage = idleImage;
        } else {
            walkCycle = images.playerTransformedWalk.map(f => f.img);
            idleImage = images.playerTransformFrames[10]?.img;
            jumpImage = images.playerTransformedJump[2]?.img || idleImage;
            shootImage = images.playerTransformedShoot.img;
            kickImage = idleImage; // No specific kick image for transformed
        }
    } else {
        walkCycle = images.playerNormalWalk.map(f => f.img);
        idleImage = images.playerNormal.img;
        jumpImage = images.playerNormalJump[2]?.img || idleImage;
        shootImage = idleImage;
        kickImage = images.playerKickFrames[1]?.img || idleImage;
    }

    switch (opponent.animationState) {
        case 'walking':
            const frameIndex = Math.floor(gameTime / basePlayer.normalWalkAnimationSpeed) % walkCycle.length;
            opponentImage = walkCycle[frameIndex] || idleImage;
            break;
        case 'jumping': opponentImage = jumpImage; break;
        case 'shooting': opponentImage = shootImage; break;
        case 'finisher': opponentImage = images.playerTransformedShoot.img; break; // Use shoot image for finisher
        case 'kicking': opponentImage = kickImage; break;
        case 'idle': default: opponentImage = idleImage; break;
    }
    
    if (!opponentImage) opponentImage = images.playerNormal.img; // Fallback

    const drawScreenX = opponent.x - camera.x;
    
    if (!opponent.width) opponent.width = basePlayer.width * scaleX;
    if (!opponent.height) opponent.height = basePlayer.height * scaleY;

    if (opponentImage && opponentImage.complete) {
        if (!opponent.isFacingRight) {
            ctx.translate(drawScreenX + opponent.width, opponent.y); ctx.scale(-1, 1);
            ctx.drawImage(opponentImage, 0, 0, opponent.width, opponent.height);
        } else {
            ctx.drawImage(opponentImage, drawScreenX, opponent.y, opponent.width, opponent.height);
        }
    }
    ctx.restore();

    // Draw opponent's finisher beam
    if (opponent.isUsingFinisher) {
        const beamImg = finisherBeamCycle[currentFinisherBeamFrame] || finisherBeamCycle[0];
        if (beamImg && beamImg.complete) {
            const beamActualWidth = 450 * scaleX;
            const beamActualHeight = opponent.height * 0.8;
            let beamY = opponent.y + opponent.height * 0.1;
            ctx.save();
            if (opponent.isFacingRight) {
                let beamX = (opponent.x + opponent.width * 0.7) - camera.x;
                ctx.drawImage(beamImg, beamX, beamY, beamActualWidth, beamActualHeight);
            } else {
                let beamX = (opponent.x + opponent.width * 0.3 - beamActualWidth) - camera.x;
                ctx.translate(beamX + beamActualWidth, beamY); ctx.scale(-1, 1);
                ctx.drawImage(beamImg, 0, 0, beamActualWidth, beamActualHeight);
            }
            ctx.restore();
        }
    }


    if (opponent.health > 0) {
        const healthBarWidth = opponent.width * 0.9;
        const healthBarHeight = 10 * Math.min(scaleX, scaleY);
        const healthBarX = drawScreenX + (opponent.width - healthBarWidth) / 2;
        const healthBarY = opponent.y - healthBarHeight - (8 * scaleY);

        ctx.fillStyle = 'rgba(80, 0, 0, 0.8)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        const healthPercentage = Math.max(0, opponent.health / opponent.maxHealth);
        ctx.fillStyle = healthPercentage > 0.5 ? 'rgba(0, 200, 0, 0.9)' : 'rgba(255, 0, 0, 0.9)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5 * Math.min(scaleX, scaleY);
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    }
}