// js/player.js (MODIFIED FOR ONLINE BULLETS & FINISHER VS SHIELD)

console.log("player.js loaded");

// ----- Player Definition & State -----
const basePlayer = {
    width: 70, height: 90,
    transformedWidth: 90,
    transformedHeight: 105,
    staronWidth: 80, 
    staronHeight: 100,
    speed: 5, jumpStrength: 15,
    initialX: 100,
    normalWalkAnimationSpeed: 60,
    normalJumpAnimationSpeed: 60,
    transformedWalkAnimationSpeed: 70,
    transformedJumpAnimationSpeed: 70,
    staronWalkAnimationSpeed: 80,
};
const player = {
    x: 0, y: 0, width: 0, height: 0, speed: 0,
    velocityX: 0, velocityY: 0, jumpStrength: 0,
    isJumping: false, isFacingRight: true,
    currentImage: null,
    isTransformed: false,
    isHit: false,
    hitTimer: 0,
    isShooting: false,
    shootAnimationTimer: 0,
    onMovingPlatform: null,
    platformDX: 0,
    platformDY: 0,
    currentNormalWalkFrame: 0,
    normalWalkAnimationTimer: 0,
    normalWalkCycle: [],
    currentNormalJumpFrame: 0,
    normalJumpAnimationTimer: 0,
    normalJumpCycle: [],
    isKicking: false,
    kickAnimationTimer: 0,
    currentKickFrame: 0,
    kickCycle: [],
    currentTransformedWalkFrame: 0,
    transformedWalkAnimationTimer: 0,
    transformedWalkCycle: [],
    currentTransformedJumpFrame: 0,
    transformedJumpAnimationTimer: 0,
    transformedJumpCycle: [],
    currentStaronWalkFrame: 0,
    staronWalkAnimationTimer: 0,
    staronWalkCycle: [],
    currentTransformFrame: 0,
    transformFrameAnimationTimer: 0
};

const bullets = [];
let canShoot = true;

// ----- Player State Variables -----
let MAX_PLAYER_HITS = DEFAULT_MAX_PLAYER_HITS;
let playerHitCount = 0;
let playerInvulnerableTimer = 0;
let staronUnlocked = false;
let selectedTransformation = 'default';

let kickCooldownTimer = 0;

let transformationActiveTimer = 0;
let transformationCooldownTimer = 0;
let currentTransformationCooldown = DEFAULT_TRANSFORMATION_COOLDOWN;
let showingTransformationEffect = false;
let transformationEffectTimer = 0;
let transformationEffectType = null;
let finisherAbilityPurchased = false;
let isUsingFinisher = false;
let finisherTimer = 0;
let currentFinisherBeamFrame = 0;
let finisherBeamAnimationTimer = 0;
let finisherBeamCycle = [];
let invisibilityPurchased = false;
let isInvisible = false;
let invisibilityDurationTimer = 0;
let invisibilityCooldownTimer = 0;
let shieldPurchased = false;
let isShieldActive = false;
let shieldDurationTimer = 0;
let shieldCooldownTimer = 0;
let shieldAnimationTimer = 0;
let cooldownUpgradePurchased = false;
let extraLifePurchased = false;

// ----- Player Logic Functions -----

function resetPlayerState() {
    player.isTransformed = false;
    staronUnlocked = localStorage.getItem(STARON_UNLOCKED_KEY) === 'true';
    selectedTransformation = localStorage.getItem(SELECTED_TRANSFORMATION_KEY) || 'default';
    
    player.width = basePlayer.width * scaleX;
    player.height = basePlayer.height * scaleY;
    player.currentImage = images.playerNormal.img;

    player.x = basePlayer.initialX * scaleX;
    const groundPlatform = platforms.find(p => p.isGround && player.x >= p.x && player.x <= p.x + p.width) || platforms.find(p => p.isGround) || platforms[0];
    if (groundPlatform) {
        player.y = groundPlatform.y - player.height - (1 * scaleY);
    } else if (canvas) {
        player.y = canvas.height - player.height - (1 * scaleY);
    } else {
        player.y = BASE_HEIGHT - player.height -1;
    }
    if (canvas) player.y = Math.min(player.y, canvas.height - player.height);

    player.velocityX = 0; player.velocityY = 0; player.isJumping = false; player.isFacingRight = true;
    player.onMovingPlatform = null; player.platformDX = 0; player.platformDY = 0;
    player.currentNormalWalkFrame = 0; player.normalWalkAnimationTimer = 0;
    player.currentNormalJumpFrame = 0; player.normalJumpAnimationTimer = 0;
    player.currentTransformedWalkFrame = 0; player.transformedWalkAnimationTimer = 0;
    player.currentTransformedJumpFrame = 0; player.transformedJumpAnimationTimer = 0;
    player.currentStaronWalkFrame = 0; player.staronWalkAnimationTimer = 0;
    player.currentTransformFrame = 0; player.transformFrameAnimationTimer = 0;
    player.isHit = false; player.hitTimer = 0;
    player.isShooting = false; player.shootAnimationTimer = 0;
    player.isKicking = false;
    player.kickAnimationTimer = 0;
    player.currentKickFrame = 0;
    kickCooldownTimer = 0;

    MAX_PLAYER_HITS = extraLifePurchased ? DEFAULT_MAX_PLAYER_HITS + EXTRA_LIVES_AMOUNT : DEFAULT_MAX_PLAYER_HITS;
    playerHitCount = 0;
    playerInvulnerableTimer = 0;
    isUsingFinisher = false;
    finisherTimer = 0;
    isInvisible = false;
    invisibilityDurationTimer = 0;
    invisibilityCooldownTimer = 0;
    isShieldActive = false;
    shieldDurationTimer = 0;
    shieldCooldownTimer = 0;
}

function updatePlayerPosition(deltaTime) {
    checkAndHandleTransformationEnd(deltaTime);
    updateInvisibilityStatus(deltaTime);
    updateShieldStatus(deltaTime);
    if(kickCooldownTimer > 0) kickCooldownTimer -= deltaTime;

    if (player.isKicking) {
        updateKickAnimationAndCollision(deltaTime);
        return; 
    }

    if (isUsingFinisher) {
        updateFinisherMove(deltaTime);
        if (images.playerTransformedShoot.loaded && images.playerTransformedShoot.img.complete) {
            player.currentImage = images.playerTransformedShoot.img;
        }
        return;
    }

    if (playerInvulnerableTimer > 0) {
        playerInvulnerableTimer -= deltaTime;
        if (playerInvulnerableTimer < 0) playerInvulnerableTimer = 0;
    }
    if (player.isHit) {
        player.hitTimer -= deltaTime;
        if (player.hitTimer <= 0) { player.isHit = false; player.hitTimer = 0; }
    }
    if (player.isShooting && player.isTransformed) {
        player.shootAnimationTimer -= deltaTime;
        if (player.shootAnimationTimer <= 0) {
            player.isShooting = false;
            player.shootAnimationTimer = 0;
        }
    } else if (player.isShooting && !player.isTransformed) {
        player.isShooting = false;
    }

    const canPlayerMove = gameState === 'playing' && !showingTransformationEffect && !isUsingFinisher;

    if (canPlayerMove) {
        let isMoving = false;
        if (keys.ArrowLeft) { player.velocityX = -player.speed; player.isFacingRight = false; isMoving = true;}
        else if (keys.ArrowRight) { player.velocityX = player.speed; player.isFacingRight = true; isMoving = true;}
        else { player.velocityX = 0; }
        
        if (player.isTransformed && selectedTransformation === 'staron') {
            player.velocityY = 0;
            if (keys.ArrowUp) {
                player.velocityY = -player.speed * 0.9;
            } else if (keys.ArrowDown) {
                player.velocityY = player.speed * 0.9;
            }
            player.y += player.velocityY * (FIXED_TIMESTEP / (1000/60));
            if(canvas) player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
            
            applyHorizontalCollisions(player);
            updateStaronWalkAnimation(deltaTime, isMoving || keys.ArrowUp || keys.ArrowDown);

        } else {
            if (keys.ArrowUp && !player.isJumping && player.velocityY === 0) {
                player.velocityY = -player.jumpStrength;
                player.isJumping = true;
                player.onMovingPlatform = null;
                if (player.isTransformed) {
                    player.currentTransformedJumpFrame = 0;
                    player.transformedJumpAnimationTimer = 0;
                    if (player.transformedJumpCycle.length > 0 && player.transformedJumpCycle[0] && player.transformedJumpCycle[0].complete) {
                        player.currentImage = player.transformedJumpCycle[0];
                    }
                } else {
                    player.currentNormalJumpFrame = 0;
                    player.normalJumpAnimationTimer = 0;
                    if (player.normalJumpCycle.length > 0 && player.normalJumpCycle[0] && player.normalJumpCycle[0].complete) {
                        player.currentImage = player.normalJumpCycle[0];
                    }
                }
            }
            applyCollisions(player);

            if (player.isTransformed) {
                if (player.isShooting && images.playerTransformedShoot.loaded && images.playerTransformedShoot.img.complete) {
                    player.currentImage = images.playerTransformedShoot.img;
                } else if (player.isJumping && player.transformedJumpCycle.length > 0) {
                    updateTransformedPlayerJumpAnimation(deltaTime);
                } else if (isMoving && !player.isJumping && player.transformedWalkCycle.length > 0) {
                    updateTransformedPlayerWalkAnimation(deltaTime);
                } else {
                    if (images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1] && images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1].loaded) {
                        player.currentImage = images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1].img;
                    } else if (images.playerTransformed.loaded && images.playerTransformed.img.complete) {
                        player.currentImage = images.playerTransformed.img;
                    }
                    player.transformedWalkAnimationTimer = 0;
                    player.currentTransformedJumpFrame = 0;
                }
            } else {
                if (player.isJumping && player.normalJumpCycle.length > 0) {
                    updateNormalPlayerJumpAnimation(deltaTime);
                } else if (isMoving && !player.isJumping && player.normalWalkCycle.length > 0) {
                    updateNormalPlayerWalkAnimation(deltaTime);
                } else {
                    if (images.playerNormal.loaded && images.playerNormal.img.complete) {
                        player.currentImage = images.playerNormal.img;
                    }
                    player.normalWalkAnimationTimer = 0;
                    player.currentNormalJumpFrame = 0;
                }
            }
        }

    } else {
        player.velocityX = 0;
        if (!showingTransformationEffect || player.velocityY !== 0) {
             if (player.isTransformed && selectedTransformation === 'staron') {
                applyHorizontalCollisions(player);
             } else {
                applyCollisions(player);
             }
        }
        if (!showingTransformationEffect && gameState !== 'playing' && !isInvisible && !isShieldActive) {
            if (player.isTransformed) {
                if(selectedTransformation === 'default') {
                    player.currentImage = (images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1]?.loaded) ?
                                        images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1].img : images.playerTransformed.img;
                } else if (selectedTransformation === 'staron') {
                     player.currentImage = images.playerStaronIdle.img;
                }
            } else {
                player.currentImage = images.playerNormal.img;
            }
        }
    }
    updateCamera();
}

function updateNormalPlayerWalkAnimation(deltaTime) {
    if (player.isTransformed || player.isKicking || player.normalWalkCycle.length === 0) return;
    player.normalWalkAnimationTimer += deltaTime;
    if (player.normalWalkAnimationTimer >= basePlayer.normalWalkAnimationSpeed) {
        player.normalWalkAnimationTimer = 0;
        player.currentNormalWalkFrame = (player.currentNormalWalkFrame + 1) % player.normalWalkCycle.length;
        player.currentImage = player.normalWalkCycle[player.currentNormalWalkFrame];
    }
}

function updateNormalPlayerJumpAnimation(deltaTime) {
    if (player.isTransformed || player.isKicking || !player.isJumping || player.normalJumpCycle.length === 0) {
        player.currentNormalJumpFrame = 0;
        player.normalJumpAnimationTimer = 0;
        return;
    }
    player.normalJumpAnimationTimer += deltaTime;
    if (player.normalJumpAnimationTimer >= basePlayer.normalJumpAnimationSpeed) {
        player.normalJumpAnimationTimer = 0;
        if (player.velocityY < -player.jumpStrength * 0.6) {
            player.currentNormalJumpFrame = 0;
        } else if (player.velocityY < -player.jumpStrength * 0.2) {
            player.currentNormalJumpFrame = 1;
        } else if (player.velocityY < player.jumpStrength * 0.2) {
            player.currentNormalJumpFrame = 2;
        } else if (player.velocityY < player.jumpStrength * 0.7) {
            player.currentNormalJumpFrame = 3;
        } else {
            player.currentNormalJumpFrame = 4;
        }
        player.currentNormalJumpFrame = Math.min(player.currentNormalJumpFrame, player.normalJumpCycle.length - 1);
        if (player.normalJumpCycle[player.currentNormalJumpFrame]) {
            player.currentImage = player.normalJumpCycle[player.currentNormalJumpFrame];
        }
    }
}

function updateTransformedPlayerWalkAnimation(deltaTime) {
    if (!player.isTransformed || player.transformedWalkCycle.length === 0) return;
    player.transformedWalkAnimationTimer += deltaTime;
    if (player.transformedWalkAnimationTimer >= basePlayer.transformedWalkAnimationSpeed) {
        player.transformedWalkAnimationTimer = 0;
        player.currentTransformedWalkFrame = (player.currentTransformedWalkFrame + 1) % player.transformedWalkCycle.length;
        player.currentImage = player.transformedWalkCycle[player.currentTransformedWalkFrame];
    }
}

function updateTransformedPlayerJumpAnimation(deltaTime) {
    if (!player.isTransformed || !player.isJumping || player.transformedJumpCycle.length === 0) {
        player.currentTransformedJumpFrame = 0;
        player.transformedJumpAnimationTimer = 0;
        return;
    }
    player.transformedJumpAnimationTimer += deltaTime;
    if (player.transformedJumpAnimationTimer >= basePlayer.transformedJumpAnimationSpeed) {
        player.transformedJumpAnimationTimer = 0;
        if (player.velocityY < -player.jumpStrength * 0.5) {
            player.currentTransformedJumpFrame = 0;
        } else if (player.velocityY < 0) {
            player.currentTransformedJumpFrame = 1;
        } else if (player.velocityY < player.jumpStrength * 0.5) {
            player.currentTransformedJumpFrame = 2;
        } else {
            player.currentTransformedJumpFrame = 3;
        }
        player.currentTransformedJumpFrame = Math.min(player.currentTransformedJumpFrame, player.transformedJumpCycle.length - 1);
        if (player.transformedJumpCycle[player.currentTransformedJumpFrame]) {
            player.currentImage = player.transformedJumpCycle[player.currentTransformedJumpFrame];
        }
    }
}

function updateStaronWalkAnimation(deltaTime, isMoving) {
    if (!player.isTransformed || selectedTransformation !== 'staron' || player.staronWalkCycle.length === 0) return;
    if (isMoving) {
        player.staronWalkAnimationTimer += deltaTime;
        if (player.staronWalkAnimationTimer >= basePlayer.staronWalkAnimationSpeed) {
            player.staronWalkAnimationTimer = 0;
            player.currentStaronWalkFrame = (player.currentStaronWalkFrame + 1) % player.staronWalkCycle.length;
            player.currentImage = player.staronWalkCycle[player.currentStaronWalkFrame];
        }
    } else {
        if (images.playerStaronIdle.loaded) {
            player.currentImage = images.playerStaronIdle.img;
        }
        player.staronWalkAnimationTimer = 0;
        player.currentStaronWalkFrame = 0;
    }
}

function activateKick() {
    if (player.isTransformed || player.isKicking || kickCooldownTimer > 0 || gameState !== 'playing') {
        return;
    }
    player.isKicking = true;
    player.kickAnimationTimer = KICK_DURATION;
    player.currentKickFrame = 0;
    player.velocityX = 0; 
    kickCooldownTimer = KICK_COOLDOWN;

    if (playerKickSound && typeof playerKickSound.play === 'function') {
        playerKickSound.currentTime = 0;
        playerKickSound.play().catch(e => console.warn("Failed to play kick sound", e));
    }

    // ### NEW: Send kick event if online ###
    if (isOnlineMode && typeof sendKickToServer === 'function') {
        sendKickToServer();
    }
}

function updateKickAnimationAndCollision(deltaTime) {
    if (!player.isKicking) return;

    player.kickAnimationTimer -= deltaTime;
    
    const frameDuration = KICK_DURATION / player.kickCycle.length;
    const currentFrameIndex = Math.floor((KICK_DURATION - player.kickAnimationTimer) / frameDuration);
    player.currentKickFrame = Math.min(currentFrameIndex, player.kickCycle.length - 1);
    if(player.kickCycle[player.currentKickFrame]) {
        player.currentImage = player.kickCycle[player.currentKickFrame];
    }
    
    // In offline mode, deal damage to enemies
    if (!isOnlineMode && player.currentKickFrame === 1 && !player.kickHitApplied) {
        const kickHitbox = {
            x: player.x + (player.isFacingRight ? player.width * 0.5 : -KICK_RANGE * scaleX),
            y: player.y,
            width: KICK_RANGE * scaleX,
            height: player.height
        };

        const allEnemies = [enemy, ...chaserEnemies, ...swordEnemies, ...gunnerEnemies, ...lionEnemies, ...clownEnemies, ...pieClownEnemies];
        allEnemies.forEach(e => {
            if (e.isActive && checkRectCollision(kickHitbox, e)) {
                e.health -= KICK_DAMAGE;
                const pushDirection = player.isFacingRight ? 1 : -1;
                e.velocityX = pushDirection * KICK_PUSHBACK * scaleX;
                e.velocityY = -2 * scaleY; 
                if (e.health <= 0) {
                    e.isActive = false;
                    addScore(5);
                }
            }
        });
        player.kickHitApplied = true;
    }

    if (player.kickAnimationTimer <= 0) {
        player.isKicking = false;
        player.kickHitApplied = false;
        if (images.playerNormal.loaded) {
            player.currentImage = images.playerNormal.img;
        }
    }
}


function activateSpecialAbilitySequence() {
    if (player.isTransformed || player.isKicking || transformationActiveTimer > 0 || transformationCooldownTimer > 0 || showingTransformationEffect || gameState !== 'playing' || isUsingFinisher || isInvisible || isShieldActive) {
        return;
    }
    if (typeof showTransformationSelectMenu === 'function') {
        showTransformationSelectMenu();
    }
}

function initiateTransformation(transformType) {
    if (player.isTransformed || transformationActiveTimer > 0 || transformationCooldownTimer > 0 || showingTransformationEffect) {
        return;
    }

    selectedTransformation = transformType;

    showingTransformationEffect = true;
    transformationEffectType = 'toAlien';
    
    if (selectedTransformation === 'default') {
        transformationEffectTimer = TRANSFORM_ANIMATION_TOTAL_DURATION;
        player.currentTransformFrame = 0;
        player.transformFrameAnimationTimer = 0;
        if (images.playerTransformFrames.length > 0 && images.playerTransformFrames[0].img && images.playerTransformFrames[0].loaded) {
            player.currentImage = images.playerTransformFrames[0].img;
        }
    } else if (selectedTransformation === 'staron') {
        transformationEffectTimer = REVERT_TRANSFORM_GLOW_DURATION / 2;
    }

    if (transformSound && typeof transformSound.play === 'function') {
        transformSound.currentTime = 0;
        transformSound.play().catch(error => console.warn("Error playing transform sound:", error));
    }
    if (typeof updateInGameUIState === 'function') updateInGameUIState();
}

function completeTransformation() {
    if (!player.isTransformed) {
        const oldHeight = player.height;

        if (selectedTransformation === 'default') {
             if (images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1] && images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1].loaded) {
                player.currentImage = images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1].img;
            } else {
                player.currentImage = images.playerTransformed.img;
            }
            player.width = basePlayer.transformedWidth * scaleX;
            player.height = basePlayer.transformedHeight * scaleY;
        } else if (selectedTransformation === 'staron') {
            player.currentImage = images.playerStaronIdle.img;
            player.width = basePlayer.staronWidth * scaleX;
            player.height = basePlayer.staronHeight * scaleY;
        }

        player.isTransformed = true;
        const heightDifference = player.height - oldHeight;
        player.y -= heightDifference;
        if (selectedTransformation === 'staron') {
            applyHorizontalCollisions(player);
        } else {
            applyCollisions(player);
        }

        if (enemy.isActive && !enemy.isShielded && enemy.shieldCooldownTimer <= 0) {
            const distanceToEnemy = Math.sqrt(Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2));
            if (distanceToEnemy < ENEMY_SHIELD_PLAYER_TRANSFORM_RANGE * Math.min(scaleX, scaleY)) {
                activateEnemyShield();
            }
        }
    }
    transformationActiveTimer = TRANSFORMATION_DURATION;
    if (typeof updateInGameUIState === 'function') updateInGameUIState();
}

function checkAndHandleTransformationEnd(deltaTime) {
    if (showingTransformationEffect && transformationEffectTimer > 0) {
        transformationEffectTimer -= deltaTime;
        
        if (transformationEffectType === 'toAlien' && selectedTransformation === 'default') {
            player.transformFrameAnimationTimer += deltaTime;
            if (player.transformFrameAnimationTimer >= TRANSFORM_FRAME_DURATION) {
                player.transformFrameAnimationTimer -= TRANSFORM_FRAME_DURATION;
                player.currentTransformFrame++;
                if (player.currentTransformFrame >= TRANSFORM_ANIMATION_FRAMES_COUNT) {
                    player.currentTransformFrame = TRANSFORM_ANIMATION_FRAMES_COUNT - 1;
                }
                if (images.playerTransformFrames[player.currentTransformFrame] && images.playerTransformFrames[player.currentTransformFrame].img.complete) {
                    player.currentImage = images.playerTransformFrames[player.currentTransformFrame].img;
                }
            }
        }

        if (transformationEffectTimer <= 0) {
            showingTransformationEffect = false;
            transformationEffectTimer = 0;
            if (transformSound && !transformSound.paused) {
                transformSound.pause();
                transformSound.currentTime = 0;
            }

            if (transformationEffectType === 'toAlien') {
                completeTransformation();
            } else if (transformationEffectType === 'toNormal') {
                player.isTransformed = false;
                transformationCooldownTimer = currentTransformationCooldown;
                const oldHeight = player.height;
                player.currentImage = images.playerNormal.img;
                player.width = basePlayer.width * scaleX;
                player.height = basePlayer.height * scaleY;
                const heightDifference = player.height - oldHeight;
                player.y -= heightDifference;
                applyCollisions(player);
            }
            transformationEffectType = null;
            if (typeof updateInGameUIState === 'function') updateInGameUIState();
        }
    }

    if (!showingTransformationEffect && player.isTransformed && transformationActiveTimer > 0) {
        transformationActiveTimer -= deltaTime;
        if (transformationActiveTimer <= 0) {
            transformationActiveTimer = 0;

            showingTransformationEffect = true;
            transformationEffectType = 'toNormal';
            if (selectedTransformation === 'default') {
                transformationEffectTimer = REVERT_TRANSFORM_GLOW_DURATION;
                 if (images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1] && images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1].loaded) {
                    player.currentImage = images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1].img;
                } else if (images.playerTransformed.loaded && images.playerTransformed.img.complete) {
                    player.currentImage = images.playerTransformed.img;
                }
            } else if (selectedTransformation === 'staron') {
                transformationEffectTimer = REVERT_TRANSFORM_GLOW_DURATION / 2;
                player.currentImage = images.playerStaronIdle.img;
            }

            if (transformSound && typeof transformSound.play === 'function') {
                transformSound.currentTime = 0;
                transformSound.play().catch(error => console.warn("Error playing transform (revert) sound:", error));
            }
        }
    } else if (!showingTransformationEffect && !player.isTransformed && transformationCooldownTimer > 0) {
        transformationCooldownTimer -= deltaTime;
        if (transformationCooldownTimer < 0) transformationCooldownTimer = 0;
    }
}

function activateInvisibility() {
    if (!invisibilityPurchased || isInvisible || invisibilityCooldownTimer > 0 || showingTransformationEffect || isUsingFinisher || gameState !== 'playing' || isShieldActive) return;
    isInvisible = true;
    invisibilityDurationTimer = INVISIBILITY_DURATION;
    invisibilityCooldownTimer = INVISIBILITY_COOLDOWN;
    player.velocityX = 0;
    if (invisibilitySound && typeof invisibilitySound.play === 'function') {
        invisibilitySound.currentTime = 0;
        invisibilitySound.play().catch(e => console.warn("Failed to play invisibility sound", e));
    }
    if (typeof updateInGameUIState === 'function') updateInGameUIState();
}

function updateInvisibilityStatus(deltaTime) {
    if (isInvisible) {
        invisibilityDurationTimer -= deltaTime;
        if (invisibilityDurationTimer <= 0) {
            isInvisible = false;
            invisibilityDurationTimer = 0;
            if (typeof updateInGameUIState === 'function') updateInGameUIState();
        }
    } else if (invisibilityCooldownTimer > 0) {
        invisibilityCooldownTimer -= deltaTime;
        if (invisibilityCooldownTimer < 0) {
            invisibilityCooldownTimer = 0;
            if (typeof updateInGameUIState === 'function') updateInGameUIState();
        }
    }
}

function activateShield() {
    if (!shieldPurchased || isShieldActive || shieldCooldownTimer > 0 || showingTransformationEffect || isUsingFinisher || gameState !== 'playing' || isInvisible) return;
    isShieldActive = true;
    shieldDurationTimer = SHIELD_DURATION;
    shieldCooldownTimer = SHIELD_COOLDOWN;
    shieldAnimationTimer = 0;
    if (shieldActivateSound && typeof shieldActivateSound.play === 'function') {
        shieldActivateSound.currentTime = 0;
        shieldActivateSound.play().catch(e => console.warn("Failed to play shield activate sound", e));
    }
    if (typeof updateInGameUIState === 'function') updateInGameUIState();
}

function updateShieldStatus(deltaTime) {
    if (isShieldActive) {
        shieldDurationTimer -= deltaTime;
        shieldAnimationTimer += deltaTime;
        if (shieldDurationTimer <= 0) {
            isShieldActive = false;
            shieldDurationTimer = 0;
            if (typeof updateInGameUIState === 'function') updateInGameUIState();
        }
    } else if (shieldCooldownTimer > 0) {
        shieldCooldownTimer -= deltaTime;
        if (shieldCooldownTimer < 0) {
            shieldCooldownTimer = 0;
            if (typeof updateInGameUIState === 'function') updateInGameUIState();
        }
    }
}

function activateFinisherMove() {
    if (!finisherAbilityPurchased || isUsingFinisher || !player.isTransformed || selectedTransformation !== 'default' || isInvisible || isShieldActive) return;
    isUsingFinisher = true;
    finisherTimer = FINISHER_DURATION;
    player.velocityX = 0;
    currentFinisherBeamFrame = 0;
    finisherBeamAnimationTimer = 0;
    if (finisherActivateSound && typeof finisherActivateSound.play === 'function') {
        finisherActivateSound.currentTime = 0;
        finisherActivateSound.play().catch(e => console.warn("Failed to play finisher activate sound", e));
    }
    if (finisherBeamSound && typeof finisherBeamSound.play === 'function') {
        finisherBeamSound.currentTime = 0;
        finisherBeamSound.loop = true;
        finisherBeamSound.play().catch(e => console.warn("Failed to play finisher beam sound", e));
    }
    if (typeof updateInGameUIState === 'function') updateInGameUIState();

    // ### NEW: Send finisher event if online ###
    if (isOnlineMode && typeof sendFinisherToServer === 'function') {
        sendFinisherToServer();
    }
}

function updateFinisherMove(deltaTime) {
    if (!isUsingFinisher) return;
    finisherTimer -= deltaTime;
    finisherBeamAnimationTimer += deltaTime;
    if (finisherBeamAnimationTimer >= FINISHER_BEAM_FRAME_DURATION) {
        finisherBeamAnimationTimer = 0;
        currentFinisherBeamFrame = (currentFinisherBeamFrame + 1) % finisherBeamCycle.length;
    }
    if (finisherTimer <= 0) {
        isUsingFinisher = false;
        finisherTimer = 0;
        if (finisherBeamSound) {
            finisherBeamSound.loop = false;
            finisherBeamSound.pause();
        }
        if (typeof updateInGameUIState === 'function') updateInGameUIState();
        return;
    }

    const beamLength = 400 * scaleX;
    const beamHeight = player.height * 0.7;
    let beamY = player.y + player.height * 0.1;
    let beamRect = { 
        x: player.isFacingRight ? player.x + player.width * 0.7 : player.x + player.width * 0.3 - beamLength,
        y: beamY, 
        width: beamLength, 
        height: beamHeight
    };

    if (isOnlineMode) {
        // In online mode, the local client reports if it hits the opponent
        if (opponent && opponent.health > 0 && checkRectCollision(beamRect, opponent)) {
            if (typeof reportFinisherHitToServer === 'function') {
                reportFinisherHitToServer();
            }
        }
    } else {
        // Offline mode damage logic
        const allEnemies = [enemy, ...chaserEnemies, ...flyingEnemies, ...swordEnemies, ...gunnerEnemies, ...lionEnemies, ...clownEnemies, ...pieClownEnemies];
        allEnemies.forEach(e => {
            if (e.isActive && checkRectCollision(beamRect, e)) {
                if (e.isShielded) {
                    e.isShielded = false; e.shieldTimer = 0; e.shieldCooldownTimer = ENEMY_SHIELD_COOLDOWN;
                    if (shieldHitSound) shieldHitSound.play();
                } else {
                    e.health = 0; e.isActive = false;
                    addScore(e === enemy ? 50 : 20);
                }
            }
        });
    }
}

function fireActualBullet() {
    if (selectedTransformation === 'staron' || !images.bulletImage.loaded || !player.isTransformed || !canShoot || bullets.length >= MAX_BULLETS || isInvisible) {
        if (!canShoot) return;
        return;
    }
    player.isShooting = true;
    player.shootAnimationTimer = 150;
    const bulletW = BULLET_WIDTH_BASE * scaleX;
    const bulletH = BULLET_HEIGHT_BASE * scaleY;
    const bulletSpeed = BULLET_SPEED_BASE * scaleX;
    const bulletXOffset = player.isFacingRight ? player.width : -bulletW;
    const bulletX = player.x + bulletXOffset;
    const bulletY = player.y + player.height * 0.4 - bulletH / 2;
    const directionX = player.isFacingRight ? 1 : -1;
    
    const newBullet = {
        x: bulletX, y: bulletY,
        width: bulletW, height: bulletH,
        velocityX: bulletSpeed * directionX,
        image: images.bulletImage.img,
        isFacingRight: player.isFacingRight,
        ownerId: isOnlineMode ? onlinePlayerId : null,
        isOpponentBullet: false
    };

    bullets.push(newBullet);
    
    // ### MODIFIED: Send bullet to server if online ###
    if (isOnlineMode && typeof sendBulletToServer === 'function') {
        sendBulletToServer(newBullet);
    }

    if (shootSound && typeof shootSound.play === 'function') {
        shootSound.currentTime = 0;
        shootSound.play().catch(e => console.warn("Failed to play shoot sound", e));
    }
    canShoot = false;
    setTimeout(() => { canShoot = true; if (typeof updateInGameUIState === 'function') updateInGameUIState(); }, SHOOT_COOLDOWN);
}

function updateBullets(deltaTime) {
    const stepFactor = deltaTime / FIXED_TIMESTEP;
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].velocityX * stepFactor;
        const bulletScreenX = bullets[i].x - camera.x;
        if (canvas && (bulletScreenX + bullets[i].width < 0 || bulletScreenX > canvas.width)) {
            bullets.splice(i, 1);
        }
    }
}

function applyHorizontalCollisions(object) {
    const nextX = object.x + (object.velocityX * (FIXED_TIMESTEP / (1000 / 60)));
    const objectVerticalCenter = object.y + object.height / 2;
    const collisionMarginY = object.height * 0.45;

    for (const platform of platforms) {
        if (objectVerticalCenter + collisionMarginY > platform.y &&
            objectVerticalCenter - collisionMarginY < platform.y + platform.height) {
            
            if (object.velocityX > 0) {
                if (nextX + object.width > platform.x && object.x + object.width <= platform.x + Math.abs(object.velocityX * 0.5)) {
                    object.x = platform.x - object.width - (1 * scaleX);
                    object.velocityX = 0;
                }
            } else if (object.velocityX < 0) {
                if (nextX < platform.x + platform.width && object.x >= platform.x + platform.width - Math.abs(object.velocityX * 0.5)) {
                    object.x = platform.x + platform.width + (1 * scaleX);
                    object.velocityX = 0;
                }
            }
        }
    }
    object.x += object.velocityX * (FIXED_TIMESTEP / (1000 / 60));

    if (object.x < 0) object.x = 0;
    if (object.x + object.width > worldWidthScaled) object.x = worldWidthScaled - object.width;
}