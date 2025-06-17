// js/world.js (MODIFIED FOR CORRECT ONLINE HIT LOGIC)
// يحتوي هذا الملف على منطق العالم، الاصطدامات، وقواعد اللعبة العامة.
console.log("world.js loaded");

// ----- World Elements Definition -----
const powerups = [];
const basePowerup = { radius: 25, animationSpeed: 250 };
let platforms = [];
const portalObject = { x: 0, y: 0, width: 0, height: 0, isActive: true, isOpen: false };
const basePortal = { width: 120, height: 150 };
let worldWidthScaled = WORLD_WIDTH_BASE;
let gravity = BASE_GRAVITY;
const camera = { x: 0, y: 0 };

// ----- Game State Variables -----
let currentLevelStarsEarned = 0;
let winScreenStarsToDisplay = [];
let winScreenLastStarSpawnTime = 0;
let winScreenStarDisplayComplete = false;
let winScreenUIDelayTimer = 0;


// ----- World Logic Functions -----

function resetGameValues() {
    canShoot = true;
    player.isTransformed = false;
    transformationActiveTimer = 0;
    transformationCooldownTimer = 0;

    if (cooldownUpgradePurchased) {
        const reductionAmount = POWERUP_COOLDOWN_REDUCTION;
        currentTransformationCooldown = Math.max(MIN_TRANSFORMATION_COOLDOWN, DEFAULT_TRANSFORMATION_COOLDOWN - reductionAmount);
    } else {
        currentTransformationCooldown = DEFAULT_TRANSFORMATION_COOLDOWN;
    }

    showingTransformationEffect = false;
    transformationEffectTimer = 0;
    transformationEffectType = null;
    gameTime = 0;

    isUsingFinisher = false;
    finisherTimer = 0;
    currentFinisherBeamFrame = 0;
    finisherBeamAnimationTimer = 0;

    isInvisible = false;
    invisibilityDurationTimer = 0;
    invisibilityCooldownTimer = 0;

    isShieldActive = false;
    shieldDurationTimer = 0;
    shieldCooldownTimer = 0;
    shieldAnimationTimer = 0;

    portalObject.isActive = true;
    portalObject.isOpen = false; 

    if (!platforms || platforms.length === 0 || !canvas || canvas.width === 0) {
        setupGameDimensionsAndObjects();
    } else {
        portalObject.x = worldWidthScaled - portalObject.width - (50 * scaleX);
        const groundPlatform = platforms.find(p => p.isGround) || { y: canvas.height };
        portalObject.y = groundPlatform.y - portalObject.height;
        
        platforms.forEach(p => {
            if (p.isMoving) {
                p.x = p.originalX;
                p.y = p.originalY;
                const bpData = levelsData[currentLevel - 1]?.basePlatformsData.find(bp => Math.abs(bp.x * scaleX - p.originalX) < 0.1 && Math.abs((canvas.height - bp.yOffset * scaleY) - p.originalY) < 0.1);
                p.moveDirectionX = bpData?.moveDirectionX || 1;
                p.moveDirectionY = bpData?.moveDirectionY || 1;
            }
        });
    }

    resetPlayerState();

    if (!isOnlineMode) {
        resetEnemyState();
        initFlyingEnemies();
        initChaserEnemy();
        initSwordEnemies();
        initGunnerEnemies();
        initLionEnemies();
        initClownEnemies();
        initPieClownEnemies();
        spawnPowerUps();
    }


    if (canvas && canvas.width > 0) {
        camera.x = Math.max(0, Math.min(player.x - canvas.width / 2, worldWidthScaled - canvas.width));
    } else {
        camera.x = 0;
    }

    enemyLasers.length = 0;
    rockets.length = 0;
    explosions.length = 0;
    gunnerBullets.length = 0;
    clownBalls.length = 0;
    pies.length = 0;
    bullets.length = 0;

    updateInGameUIState();
}

function checkAllEnemiesDefeated() {
    if (isOnlineMode) {
        return false;
    }
    const config = levelsData[currentLevel - 1];
    if (!config) return true;

    if (enemy.isActive) return false;
    if (config.hasNewChaserEnemy && chaserEnemies.some(e => e.isActive)) return false;
    if (config.hasSwordEnemy && swordEnemies.some(e => e.isActive)) return false;
    if (config.hasGunnerEnemy && gunnerEnemies.some(e => e.isActive)) return false;
    if (config.hasLionEnemy && lionEnemies.some(e => e.isActive)) return false;
    if (config.hasFlyingEnemies && flyingEnemies.some(e => e.isActive)) return false;
    if (config.hasClownEnemy && clownEnemies.some(e => e.isActive)) return false;
    if (config.hasPieClownEnemy && pieClownEnemies.some(e => e.isActive)) return false;
    
    return true;
}

function updatePortalState() {
    if (!portalObject.isActive || isOnlineMode) return;

    if (!portalObject.isOpen && checkAllEnemiesDefeated()) {
        portalObject.isOpen = true;
    }
}

function calculateStarsForLevel() {
    let stars = 1;
    if ((player.isTransformed && selectedTransformation === 'staron') || playerHitCount <= Math.floor(MAX_PLAYER_HITS / 2)) {
        stars++;
    }
    if ((player.isTransformed && selectedTransformation === 'staron') || playerHitCount === 0) {
        stars++;
    }
    return Math.min(stars, 3);
}

function checkAllCollisions() {
    // Return early if player is busy with non-collidable actions
    if (gameState !== 'playing' || showingTransformationEffect) return;

    if (isOnlineMode) {
        // In online mode, we only check our actions against the opponent,
        // and the opponent's actions against us.
        checkOnlineCollisions();
    } else {
        // Don't check offline collisions if we are using the finisher
        if(isUsingFinisher) return;
        checkOfflineCollisions();
    }
}


function checkOfflineCollisions() {
    if (player.isTransformed && selectedTransformation === 'staron') {
        if (enemy.isActive && checkRectCollision(player, enemy)) {
             const pushBackAmount = 8 * scaleX;
             enemy.x += (player.x < enemy.x + enemy.width / 2) ? pushBackAmount : -pushBackAmount;
        }
    } else if (enemy.isActive && playerInvulnerableTimer <= 0 && !isInvisible && !isShieldActive && checkRectCollision(player, enemy)) {
        if (!player.isTransformed) {
            gameOver("لقد اصطدمت بالعدو!");
            return;
        } else {
            playerHitCount++;
            playerInvulnerableTimer = PLAYER_INVULNERABILITY_DURATION;
            player.isHit = true;
            player.hitTimer = 200;
            if (playerHitCount >= MAX_PLAYER_HITS) {
                gameOver("لقد تلقيت الكثير من الضربات!");
                return;
            }
            const pushBackDistance = 30 * scaleX;
            player.velocityX = (player.x < enemy.x + enemy.width / 2) ? -player.speed * 0.5 : player.speed * 0.5;
            player.x += (player.x < enemy.x + enemy.width / 2) ? -pushBackDistance : pushBackDistance;
            player.x = Math.max(0, Math.min(player.x, worldWidthScaled - player.width));
        }
    } else if (enemy.isActive && isShieldActive && checkRectCollision(player, enemy)) {
        if (shieldHitSound) shieldHitSound.play();
        const pushBackAmount = 15 * scaleX;
        enemy.x += (player.x < enemy.x + enemy.width / 2) ? pushBackAmount : -pushBackAmount;
    }
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet) continue;
        let bulletRemoved = false;
        const checkHit = (target, score) => {
            if (target.isActive && checkRectCollision(bullet, target)) {
                if (!bulletRemoved) { bullets.splice(i, 1); bulletRemoved = true; }
                target.health--;
                if (target.health <= 0) {
                    target.isActive = false;
                    addScore(score);
                }
                return true;
            }
            return false;
        };
        if (enemy.isActive && enemy.isShielded && checkRectCollision(bullet, enemy)) {
             if (!bulletRemoved) { bullets.splice(i, 1); bulletRemoved = true; }
             if (shieldHitSound) shieldHitSound.play();
        } else if (checkHit(enemy, 10)) {}
        else if (chaserEnemies.some(e => checkHit(e, 25))) {}
        else if (swordEnemies.some(e => checkHit(e, 20))) {}
        else if (gunnerEnemies.some(e => checkHit(e, 25))) {}
        else if (lionEnemies.some(e => checkHit(e, 35))) {}
        else if (clownEnemies.some(e => checkHit(e, 30))) {}
        else if (pieClownEnemies.some(e => checkHit(e, 28))) {}
        else if (flyingEnemies.some(fe => {
            if(checkHit(fe, 15)) {
                 if (images.explosionEffect.loaded) {
                    explosions.push({
                        x: fe.x + fe.width / 2 - (explosionBaseWidth * scaleX) / 2,
                        y: fe.y + fe.height / 2 - (explosionBaseHeight * scaleY) / 2,
                        width: explosionBaseWidth * scaleX, height: explosionBaseHeight * scaleY,
                        timer: EXPLOSION_DURATION, image: images.explosionEffect.img
                    });
                } return true;
            } return false;
        })) {}
    }

    if (portalObject.isActive && portalObject.isOpen && checkRectCollision(player, portalObject)) {
        gameWon();
    }

    chaserEnemies.forEach(chaser => {
        if (chaser.isActive && checkRectCollision(player, chaser)) {
             if (isShieldActive) { if (shieldHitSound) shieldHitSound.play(); } 
             else if (player.isTransformed && playerInvulnerableTimer <= 0) {
                playerHitCount += baseChaserEnemy.transformedDamageAmount;
                playerInvulnerableTimer = PLAYER_INVULNERABILITY_DURATION;
                player.isHit = true; player.hitTimer = 200;
                player.velocityX = (player.x < chaser.x + chaser.width / 2) ? -player.speed * 0.8 : player.speed * 0.8;
                if (playerHitCount >= MAX_PLAYER_HITS) gameOver("لقد تلقيت الكثير من الضربات!");
            }
        }
    });
    clownEnemies.forEach(clown => {
        if (clown.isActive && checkRectCollision(player, clown) && playerInvulnerableTimer <= 0) {
            if (isShieldActive) { if (shieldHitSound) shieldHitSound.play(); clown.velocityX = (player.x < clown.x + clown.width / 2) ? clown.speed * 1.5 : -clown.speed * 1.5; }
            else { playerHitCount++; playerInvulnerableTimer = PLAYER_INVULNERABILITY_DURATION; player.isHit = true; player.hitTimer = 200; if (playerHitCount >= MAX_PLAYER_HITS) gameOver("لقد اصطدمت بالمهرج!"); }
        }
    });
    pieClownEnemies.forEach(pieClown => {
        if (pieClown.isActive && checkRectCollision(player, pieClown) && playerInvulnerableTimer <= 0) {
            if (isShieldActive) { if (shieldHitSound) shieldHitSound.play(); pieClown.velocityX = (player.x < pieClown.x + pieClown.width / 2) ? pieClown.speed * 1.5 : -pieClown.speed * 1.5; }
            else { playerHitCount++; playerInvulnerableTimer = PLAYER_INVULNERABILITY_DURATION; player.isHit = true; player.hitTimer = 200; if (playerHitCount >= MAX_PLAYER_HITS) gameOver("لقد اصطدمت بمهرج الفطائر!");}
        }
    });
}

// ### MODIFIED: Updated online collision logic ###
function checkOnlineCollisions() {
    if (playerInvulnerableTimer > 0) return; // Can't be hit if invulnerable

    // --- 1. Check if OPPONENT's bullets hit ME ---
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (bullet.isOpponentBullet && checkRectCollision(bullet, player)) {
            if (typeof reportBulletHitToServer === 'function') {
                reportBulletHitToServer();
            }
            // The bullet is removed locally for immediate feedback.
            // The server will confirm the health change.
            bullets.splice(i, 1);
            return; // Exit after one hit to avoid multiple reports in one frame
        }
    }

    // --- 2. Check if OPPONENT's kick hits ME ---
    // opponent.isKicking is a flag set by an event from the server
    if (opponent && opponent.isKicking) {
        // Create a hitbox for the opponent's kick
        const kickHitbox = {
            x: opponent.x + (opponent.isFacingRight ? opponent.width * 0.5 : -KICK_RANGE * scaleX),
            y: opponent.y,
            width: KICK_RANGE * scaleX,
            height: opponent.height
        };
        if (checkRectCollision(kickHitbox, player)) {
            if (typeof reportKickHitToServer === 'function') {
                reportKickHitToServer();
            }
            return; // Exit to avoid multiple reports
        }
    }

    // --- 3. Check if OPPONENT's finisher hits ME ---
    // opponent.isUsingFinisher is a flag set by an event from the server
    if (opponent && opponent.isUsingFinisher) {
        // Create a hitbox for the opponent's finisher beam
        const beamLength = 400 * scaleX;
        const beamHeight = opponent.height * 0.7;
        const beamY = opponent.y + opponent.height * 0.1;
        const finisherHitbox = {
            x: opponent.isFacingRight ? opponent.x + opponent.width * 0.7 : opponent.x + opponent.width * 0.3 - beamLength,
            y: beamY,
            width: beamLength,
            height: beamHeight
        };
        if (checkRectCollision(finisherHitbox, player)) {
            if (typeof reportFinisherHitToServer === 'function') {
                reportFinisherHitToServer();
            }
            return; // Exit to avoid multiple reports
        }
    }

    // --- 4. Check direct player vs opponent collision for pushback ---
    if (opponent && opponent.health > 0 && checkRectCollision(player, opponent)) {
        const pushbackSpeed = 2 * scaleX;
        player.velocityX = (player.x < opponent.x) ? -pushbackSpeed : pushbackSpeed;
    }
}


function spawnPowerUps() {
    powerups.length = 0;
    if (platforms.length <= 1 || !images.powerupImage.loaded || isOnlineMode) return;
    const levelConfig = levelsData[currentLevel - 1];
    if (!levelConfig) return;
    const powerupScaleFactor = Math.min(scaleX, scaleY);
    const powerupWidth = basePowerup.radius * 2 * powerupScaleFactor;
    const powerupHeight = basePowerup.radius * 2 * powerupScaleFactor;
    const powerupOffsetY = powerupHeight + (10 * scaleY);
    const spawnablePlatforms = platforms.filter(p => !p.isGround && !p.isPortalPlatform && !p.isEnemySpawnPlatform && !p.isMoving && p.numTiles >= 2 && !p.chaserSpawnPoint && !p.swordEnemySpawnPoint && !p.gunnerEnemySpawnPoint);
    const indicesToUse = levelConfig.powerupPlatformIndices && levelConfig.powerupPlatformIndices.length > 0 ?
        levelConfig.powerupPlatformIndices.map(idx => {
            if (idx >= 0 && idx < platforms.length && platforms[idx] &&
                !platforms[idx].isGround &&
                !platforms[idx].isPortalPlatform && !platforms[idx].isEnemySpawnPlatform &&
                !platforms[idx].isMoving && !platforms[idx].chaserSpawnPoint && !platforms[idx].swordEnemySpawnPoint && !platforms[idx].gunnerEnemySpawnPoint) {
                return platforms[idx];
            }
            return null;
        }).filter(p => p) :
        spawnablePlatforms.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(WORLD_WIDTH_BASE / 1200)));
    indicesToUse.forEach(platform => {
        if (platform && platform.width > powerupWidth * 1.1) {
            powerups.push({
                x: platform.x + (platform.width / 2) - (powerupWidth / 2) + (Math.random() * (platform.width * 0.3) - platform.width * 0.15),
                y: platform.y - powerupOffsetY,
                width: powerupWidth, height: powerupHeight, isActive: true,
                animationTimer: Math.random() * basePowerup.animationSpeed,
                baseY: platform.y - powerupOffsetY,
                animationYOffset: 0,
                image: images.powerupImage.img
            });
        }
    });
}

function updateItems(deltaTime) {
    powerups.forEach(powerup => {
        if (powerup.isActive) {
            powerup.animationTimer += deltaTime;
            if (powerup.animationTimer > basePowerup.animationSpeed) powerup.animationTimer = 0;
            const yOffsetScale = Math.min(scaleX, scaleY);
            powerup.animationYOffset = Math.sin(powerup.animationTimer / basePowerup.animationSpeed * Math.PI * 2) * 3 * yOffsetScale;
            const powerupRect = {
                x: powerup.x,
                y: powerup.baseY + powerup.animationYOffset,
                width: powerup.width, height: powerup.height
            };
            if (checkRectCollision(player, powerupRect)) {
                transformationCooldownTimer = Math.max(0, transformationCooldownTimer - POWERUP_COOLDOWN_REDUCTION);
                powerup.isActive = false;
                if (typeof addScore === 'function') addScore(5);
            }
        }
    });
}

function updateMovingPlatforms(deltaTime) {
    platforms.forEach(platform => {
        if (platform.isMoving) {
            const prevPlatformX = platform.x;
            const prevPlatformY = platform.y;

            if (platform.moveAxis === 'x') {
                platform.x += platform.moveSpeedX * platform.moveDirectionX * (deltaTime / FIXED_TIMESTEP);
                if (platform.moveDirectionX > 0 && platform.x >= platform.moveMaxX) {
                    platform.x = platform.moveMaxX;
                    platform.moveDirectionX = -1;
                } else if (platform.moveDirectionX < 0 && platform.x <= platform.moveMinX) {
                    platform.x = platform.moveMinX;
                    platform.moveDirectionX = 1;
                }
            } else if (platform.moveAxis === 'y') {
                platform.y += platform.moveSpeedY * platform.moveDirectionY * (deltaTime / FIXED_TIMESTEP);
                if (platform.moveDirectionY > 0 && platform.y >= platform.moveMaxY) {
                    platform.y = platform.moveMaxY;
                    platform.moveDirectionY = -1;
                } else if (platform.moveDirectionY < 0 && platform.y <= platform.moveMinY) {
                    platform.y = platform.moveMinY;
                    platform.moveDirectionY = 1;
                }
            }
            if (player.onMovingPlatform === platform) {
                player.platformDX = platform.x - prevPlatformX;
                player.platformDY = platform.y - prevPlatformY;
            }
        }
    });
}

function applyCollisions(object) {
    if (!canvas) return;
    const prevY = object.y;
    const prevVelocityY = object.velocityY;

    if (object === player && player.onMovingPlatform && player.onMovingPlatform.isMoving) {
        object.x += player.platformDX;
        object.y += player.platformDY;
        player.platformDX = 0;
        player.platformDY = 0;
    }
    if (object === player) player.onMovingPlatform = null;

    const isMinion = chaserEnemies.includes(object) || swordEnemies.includes(object) || gunnerEnemies.includes(object) || lionEnemies.includes(object) || clownEnemies.includes(object) || pieClownEnemies.includes(object);

    if (object === player || (object === enemy && !enemy.isFlying) || (isMinion && !(object.isFlying === true))) {
        object.velocityY += gravity;
        object.y += object.velocityY * (FIXED_TIMESTEP / (1000 / 60));
    } else if (object === enemy && enemy.isFlying) {
        object.velocityY = 0;
    }

    let onPlatform = false;
    for (const platform of platforms) {
        const objectHitboxX = object.x + object.width * 0.1;
        const objectHitboxWidth = object.width * 0.8;

        if (objectHitboxX + objectHitboxWidth > platform.x &&
            objectHitboxX < platform.x + platform.width) {

            const objectBottom = object.y + object.height;
            const objectOldBottom = prevY + object.height + (object === player && player.platformDY !== undefined ? player.platformDY : 0);

            if (object.velocityY >= 0 && objectBottom >= platform.y && objectOldBottom <= platform.y + Math.max(5 * scaleY, Math.abs(prevVelocityY * 0.5) * (FIXED_TIMESTEP / (1000 / 60)))) {
                object.y = platform.y - object.height;
                object.velocityY = 0;
                onPlatform = true;
                if (object === player) {
                    player.isJumping = false;
                    if (platform.isMoving) {
                        player.onMovingPlatform = platform;
                    }
                }
                if (object === enemy || isMinion) { object.isJumping = false; object.onGround = true; }
            }
            if (!platform.isGround) {
                const objectTop = object.y;
                const objectOldTop = prevY + (object === player && player.platformDY !== undefined ? player.platformDY : 0);
                if (object.velocityY < 0 && objectTop <= platform.y + platform.height && objectOldTop >= platform.y + platform.height - Math.abs(prevVelocityY * 0.5) * (FIXED_TIMESTEP / (1000 / 60))) {
                    object.y = platform.y + platform.height + (1 * scaleY);
                    object.velocityY = 0;
                    if (object === enemy || isMinion) object.onGround = false;
                }
            }
        }
    }
    
    applyHorizontalCollisions(object);

    if (!onPlatform && ((object === enemy && !enemy.isFlying) || (isMinion && !(object.isFlying === true)))) {
        object.onGround = false;
    }

    if (canvas && object.y + object.height > canvas.height + object.height * 0.2) {
        if (object === player && gameState === 'playing' && !showingTransformationEffect && !isInvisible && !isShieldActive && !(player.isTransformed && selectedTransformation === 'staron')) {
            if (typeof gameOver === 'function') gameOver("لقد سقطت!");
        } else if (object === player && player.isTransformed && selectedTransformation === 'staron') {
            object.y = canvas.height - object.height;
            object.velocityY = 0;
        } else if ((object === enemy && !enemy.isFlying) || (isMinion && !(object.isFlying === true))) {
            object.y = canvas.height - object.height;
            object.velocityY = 0;
            object.onGround = true;
        }
    } else if (canvas && !onPlatform && object.y + object.height >= canvas.height && object.velocityY >= 0) {
        object.y = canvas.height - object.height;
        object.velocityY = 0;
        if (object === player) {
            player.isJumping = false;
            const groundPlatformUnderPlayer = platforms.find(p => p.isGround &&
                object.x + object.width * 0.8 > p.x &&
                object.x + object.width * 0.2 < p.x + p.width);
            if (groundPlatformUnderPlayer && groundPlatformUnderPlayer.isMoving) player.onMovingPlatform = groundPlatformUnderPlayer;
        }
        if (object === enemy || isMinion) { object.isJumping = false; object.onGround = true; }
        onPlatform = true;
    }
}

function isGroundAt(x, y, objectWidth) {
    const checkY = y + 1 * scaleY;
    const checkXMid = x + objectWidth / 2;
    for (const platform of platforms) {
        if (checkXMid >= platform.x && checkXMid <= platform.x + platform.width &&
            checkY >= platform.y && checkY <= platform.y + platform.height) {
            return true;
        }
    }
    return false;
}

function checkRectCollision(rect1, rect2) {
    if (!rect1 || !rect2 || rect1.width === 0 || rect2.width === 0) return false;

    let r1IsActive = true;
    let r2IsActive = true;

    if (rect1 === opponent || rect2 === opponent) { // Opponent is always "active" if they exist
         r1IsActive = rect1.hasOwnProperty('isActive') ? rect1.isActive : true;
         r2IsActive = rect2.hasOwnProperty('isActive') ? rect2.isActive : true;
    } else {
        if (flyingEnemies.includes(rect1)) r1IsActive = rect1.isActive;
        if (flyingEnemies.includes(rect2)) r2IsActive = rect2.isActive;
        if (chaserEnemies.includes(rect1)) r1IsActive = rect1.isActive;
        if (chaserEnemies.includes(rect2)) r2IsActive = rect2.isActive;
        if (swordEnemies.includes(rect1)) r1IsActive = rect1.isActive;
        if (swordEnemies.includes(rect2)) r2IsActive = rect2.isActive;
        if (gunnerEnemies.includes(rect1)) r1IsActive = rect1.isActive;
        if (gunnerEnemies.includes(rect2)) r2IsActive = rect2.isActive;
        if (lionEnemies.includes(rect1)) r1IsActive = rect1.isActive;
        if (lionEnemies.includes(rect2)) r2IsActive = rect2.isActive;
        if (clownEnemies.includes(rect1)) r1IsActive = rect1.isActive;
        if (clownEnemies.includes(rect2)) r2IsActive = rect2.isActive;
        if (pieClownEnemies.includes(rect1)) r1IsActive = rect1.isActive;
        if (pieClownEnemies.includes(rect2)) r2IsActive = rect2.isActive;
        if (rect1 === enemy) r1IsActive = enemy.isActive;
        if (rect2 === enemy) r2IsActive = enemy.isActive;
        if (rect1 === portalObject) r1IsActive = portalObject.isActive;
        if (rect2 === portalObject) r2IsActive = portalObject.isActive;
    }


    if (!r1IsActive || !r2IsActive) return false;

    // Use a simpler, more generous hitbox for gameplay feel
    const rect1Hitbox = {
        x: rect1.x + rect1.width * 0.15, y: rect1.y + rect1.height * 0.1,
        width: rect1.width * 0.7, height: rect1.height * 0.8
    };

    let rect2Y = rect2.y;
    if (rect2 === enemy && enemy.isFlying) {
        rect2Y = enemy.baseHoverY + enemy.animationYOffset;
    }
    
    // Default hitbox for rect2
    let rect2Hitbox = {
        x: rect2.x + rect2.width * 0.15, y: rect2Y + rect2.height * 0.1,
        width: rect2.width * 0.7, height: rect2.height * 0.8
    };

    // If rect2 is a projectile, platform, or portal, use its full dimensions
    if (bullets.includes(rect2) || enemyLasers.includes(rect2) || rockets.includes(rect2) || gunnerBullets.includes(rect2) || clownBalls.includes(rect2) || pies.includes(rect2) || platforms.includes(rect2) || rect2 === portalObject) {
        rect2Hitbox = { x: rect2.x, y: rect2.y, width: rect2.width, height: rect2.height };
    }
    
    // If rect1 is a projectile, platform, or portal, use its full dimensions
    let rect1FinalHitbox = rect1Hitbox;
     if (bullets.includes(rect1) || enemyLasers.includes(rect1) || rockets.includes(rect1) || gunnerBullets.includes(rect1) || clownBalls.includes(rect1) || pies.includes(rect1) || platforms.includes(rect1) || rect1 === portalObject) {
        rect1FinalHitbox = { x: rect1.x, y: rect1.y, width: rect1.width, height: rect1.height };
    }


    return rect1FinalHitbox.x < rect2Hitbox.x + rect2Hitbox.width &&
           rect1FinalHitbox.x + rect1FinalHitbox.width > rect2Hitbox.x &&
           rect1FinalHitbox.y < rect2Hitbox.y + rect2Hitbox.height &&
           rect1FinalHitbox.y + rect1FinalHitbox.height > rect2Hitbox.y;
}

function updateCamera() {
    if (!canvas || canvas.width === 0) return;
    const targetX = player.x - canvas.width / 2 + player.width / 2;
    camera.x += (targetX - camera.x) * 0.1;
    camera.x = Math.max(0, Math.min(camera.x, worldWidthScaled - canvas.width));
}