// js/main_render.js (MODIFIED FOR VISUAL EFFECTS & ONLINE UI)
console.log("main_render.js loaded");

// =============================================
// GLOBAL GAME STATE & CORE VARIABLES
// =============================================
let canvas, ctx;
let scaleX = 1, scaleY = 1;

let gameState = 'loading';
let animationFrameId = null;
let gameTime = 0;
let deltaTime = 0; 
let isPaused = false;

let currentLevel = 1;
let highestUnlockedLevel = 1;
let playerScore = 0;

const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, l: false, L: false, k: false, K: false, ' ': false, v: false, V: false, c: false, C: false, j: false, J: false };

let gameTitleTimeoutId = null;

let currentPortalFrame = 0;
let portalAnimationTimer = 0;
const PORTAL_FRAME_DURATION = 150; 

// =============================================
// INITIALIZATION FUNCTIONS
// =============================================

function setupGameDimensionsAndObjects() {
    if (!canvas || !gameContainer) {
        console.error("عنصر الكانفاس أو حاوية اللعبة غير موجود في setupGameDimensionsAndObjects.");
        return;
    }

    canvas.width = gameContainer.clientWidth;
    canvas.height = gameContainer.clientHeight;

    scaleX = canvas.width / BASE_WIDTH;
    scaleY = canvas.height / BASE_HEIGHT;

    if (typeof worldWidthScaled !== 'undefined' && typeof levelsData !== 'undefined' && levelsData[currentLevel - 1]) { 
        const levelConfig = levelsData[currentLevel - 1];
        let currentWorldMultiplier = levelConfig.worldWidthMultiplier || 1;
        const baseWorld = (typeof WORLD_WIDTH_BASE !== 'undefined' && WORLD_WIDTH_BASE > 0) ? WORLD_WIDTH_BASE : (BASE_WIDTH * 5); 
        worldWidthScaled = (baseWorld * currentWorldMultiplier) * scaleX;

    } else if (typeof worldWidthScaled !== 'undefined') {
         worldWidthScaled = ( (typeof WORLD_WIDTH_BASE !== 'undefined' && WORLD_WIDTH_BASE > 0) ? WORLD_WIDTH_BASE : (BASE_WIDTH * 5) ) * scaleX;
    }

    if (typeof gravity !== 'undefined') gravity = BASE_GRAVITY * scaleY;

    if (typeof player !== 'undefined' && images.playerNormalWalk) {
        player.normalWalkCycle = images.playerNormalWalk.map(imgData => imgData.img);
        player.normalJumpCycle = images.playerNormalJump.map(imgData => imgData.img);
        player.kickCycle = images.playerKickFrames.map(imgData => imgData.img);
        player.transformedWalkCycle = images.playerTransformedWalk.map(imgData => imgData.img);
        player.transformedJumpCycle = images.playerTransformedJump.map(imgData => imgData.img);
        player.staronWalkCycle = images.playerStaronWalk.map(imgData => imgData.img);
    }
    if (typeof finisherBeamCycle !== 'undefined' && images.finisherBeamFrames) {
        finisherBeamCycle = images.finisherBeamFrames.map(imgData => imgData.img);
    }

    if (typeof player !== 'undefined') {
        if (player.isTransformed) {
            if (selectedTransformation === 'default') {
                player.width = basePlayer.transformedWidth * scaleX;
                player.height = basePlayer.transformedHeight * scaleY;
                player.currentImage = (images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1] && images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1].loaded) ?
                                    images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT - 1].img : images.playerTransformed.img;
            } else if (selectedTransformation === 'staron') {
                player.width = basePlayer.staronWidth * scaleX;
                player.height = basePlayer.staronHeight * scaleY;
                player.currentImage = images.playerStaronIdle.img;
            }
        } else {
            player.width = basePlayer.width * scaleX;
            player.height = basePlayer.height * scaleY;
            player.currentImage = images.playerNormal.img;
        }
        player.speed = basePlayer.speed * scaleX;
        player.jumpStrength = basePlayer.jumpStrength * scaleY;
    }

    if (typeof enemy !== 'undefined') {
        enemy.width = baseEnemy.width * scaleX;
        enemy.height = baseEnemy.height * scaleY;
        enemy.speed = baseEnemy.speed * scaleX;
        enemy.verticalSpeed = baseEnemy.verticalSpeed * scaleY;
        enemy.jumpStrength = baseEnemy.jumpStrengthBase * scaleY;
        enemy.shootRange = baseEnemy.shootRangeBase * scaleX;
    }

    if (typeof portalObject !== 'undefined') {
        portalObject.width = basePortal.width * scaleX;
        portalObject.height = basePortal.height * scaleY;
    }

    if (typeof platforms !== 'undefined' && typeof levelsData !== 'undefined' && levelsData[currentLevel - 1]) {
        const levelConfig = levelsData[currentLevel - 1];
        const currentBasePlatformsData = levelConfig.basePlatformsData;
        platforms.length = 0;
        currentBasePlatformsData.forEach(bp => {
            let platformHeightScaled;
            let platformWidthScaled;
            if (bp.isGround) {
                platformHeightScaled = bp.height * scaleY;
                platformWidthScaled = bp.width * scaleX;
            } else {
                platformHeightScaled = (bp.tileHeight || PLATFORM_TILE_BASE_HEIGHT_THIN) * scaleY;
                platformWidthScaled = bp.numTiles * PLATFORM_TILE_BASE_WIDTH * scaleX;
            }
            const platform = {
                x: bp.x * scaleX,
                y: canvas.height - (bp.yOffset * scaleY),
                width: platformWidthScaled,
                height: platformHeightScaled,
                numTiles: bp.numTiles || 0,
                isGround: bp.isGround || false,
                color: bp.color,
                isPortalPlatform: false,
                isEnemySpawnPlatform: bp.isEnemySpawnPlatform || false,
                isMoving: bp.isMoving || false,
                originalX: bp.x * scaleX,
                originalY: canvas.height - (bp.yOffset * scaleY)
            };
            if (platform.isMoving) {
                platform.moveAxis = bp.moveAxis;
                platform.moveSpeedX = (bp.moveSpeedX || 0) * scaleX;
                platform.moveMinX = (bp.moveMinX !== undefined ? bp.moveMinX : bp.x) * scaleX;
                let effectiveBpWidthTiles = bp.numTiles * PLATFORM_TILE_BASE_WIDTH;
                platform.moveMaxX = (bp.moveMaxX !== undefined ? bp.moveMaxX : (bp.x + effectiveBpWidthTiles)) * scaleX; 
                platform.moveSpeedY = (bp.moveSpeedY || 0) * scaleY;
                platform.moveMinY = canvas.height - ( (bp.moveMaxY !== undefined ? bp.moveMaxY : bp.yOffset) * scaleY ); 
                platform.moveMaxY = canvas.height - ( (bp.moveMinY !== undefined ? bp.moveMinY : (bp.yOffset - (bp.tileHeight || PLATFORM_TILE_BASE_HEIGHT_THIN) ) )* scaleY );
                if (platform.moveAxis === 'x') platform.x = Math.max(platform.moveMinX, Math.min(platform.x, platform.moveMaxX - platform.width));
                if (platform.moveAxis === 'y') platform.y = Math.max(platform.moveMinY - platform.height, Math.min(platform.y, platform.moveMaxY - platform.height));
            }
            platforms.push(platform);
        });
    }

    if (typeof bullets !== 'undefined') bullets.length = 0;
    if (typeof enemyLasers !== 'undefined') enemyLasers.length = 0;
    if (typeof rockets !== 'undefined') rockets.length = 0;
    if (typeof explosions !== 'undefined') explosions.length = 0;
    if (typeof flyingEnemies !== 'undefined') flyingEnemies.length = 0;
    if (typeof chaserEnemies !== 'undefined') chaserEnemies = [];
    if (typeof swordEnemies !== 'undefined') swordEnemies = [];
    if (typeof gunnerEnemies !== 'undefined') gunnerEnemies = [];
    if (typeof lionEnemies !== 'undefined') lionEnemies = [];
    if (typeof clownEnemies !== 'undefined') clownEnemies = [];
    if (typeof clownBalls !== 'undefined') clownBalls = [];
    if (typeof pieClownEnemies !== 'undefined') pieClownEnemies = [];
    if (typeof pies !== 'undefined') pies = [];

    if (typeof camera !== 'undefined') camera.x = 0;
    if (typeof updateControlButtonsSize === 'function') updateControlButtonsSize();
}

function initGame() {
    if (gameState === 'loading' && typeof allGameAssetsLoaded !== 'undefined' && !allGameAssetsLoaded) {
        console.warn("initGame called before all assets loaded.");
    }
    if (!ctx || !canvas) {
        console.error("Canvas context not available in initGame. Cannot start game.");
        return;
    }

    // For offline mode, use the saved unlocked level. For online, it's always the battle arena.
    if (!isOnlineMode) {
      currentLevel = Math.min(Math.max(1, currentLevel), highestUnlockedLevel); 
    }
    
    const MAX_LEVELS_FROM_CONFIG = (typeof levelsData !== 'undefined') ? levelsData.length : 6;
    const levelConfig = (typeof levelsData !== 'undefined' && levelsData[currentLevel - 1]) ? levelsData[currentLevel - 1] : null;

    if (!levelConfig) {
        console.error(`Level data for level ${currentLevel} not found! Resetting to level 1.`);
        currentLevel = 1;
    }

    cooldownUpgradePurchased = localStorage.getItem(COOLDOWN_REDUCTION_KEY) === 'true';
    extraLifePurchased = localStorage.getItem(EXTRA_LIFE_KEY) === 'true';
    invisibilityPurchased = localStorage.getItem(INVISIBILITY_KEY) === 'true';
    shieldPurchased = localStorage.getItem(SHIELD_KEY) === 'true';
    finisherAbilityPurchased = localStorage.getItem(FINISHER_ABILITY_KEY) === 'true';
    staronUnlocked = localStorage.getItem(STARON_UNLOCKED_KEY) === 'true';
    selectedTransformation = localStorage.getItem(SELECTED_TRANSFORMATION_KEY) || 'default';

    setupGameDimensionsAndObjects();
    resetGameValues();

    gameState = 'playing';
    isPaused = false;

    if (typeof pauseScreenOverlay !== 'undefined' && pauseScreenOverlay) pauseScreenOverlay.style.display = 'none';
    if (typeof messageOverlay !== 'undefined' && messageOverlay) messageOverlay.style.display = 'none';
    if (typeof winScreenOverlay !== 'undefined' && winScreenOverlay) winScreenOverlay.style.display = 'none';
    if (typeof gameContainer !== 'undefined' && gameContainer) gameContainer.style.display = 'flex';

    if (typeof startScreenContainer !== 'undefined' && startScreenContainer) startScreenContainer.style.display = 'none';
    if (typeof levelSelectScreenContainer !== 'undefined' && levelSelectScreenContainer) levelSelectScreenContainer.style.display = 'none';
    if (typeof shopOverlayScreenContainer !== 'undefined' && shopOverlayScreenContainer) shopOverlayScreenContainer.style.display = 'none';

    showTemporaryGameTitle();

    if (!animationFrameId) {
        lastLoopTime = performance.now();
        accumulatedFrameTime = 0;
        gameTime = 0;
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    if (typeof setupButtonControls === 'function') setupButtonControls();
    if (typeof updateInGameUIState === 'function') updateInGameUIState();
}


// =============================================
// RENDERING FUNCTIONS
// =============================================
const transformedJumpScaleFactor = 1.1;

function drawBackground() {
    if (!ctx || !canvas) return;
    const currentBgData = (typeof images !== 'undefined' && images.gameBackgrounds && images.gameBackgrounds[currentLevel - 1]) ? images.gameBackgrounds[currentLevel - 1] : null;
    if (currentBgData && currentBgData.loaded && currentBgData.img.complete && currentBgData.img.naturalHeight !== 0) {
        const img = currentBgData.img;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#000020';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawPlatforms() {
    if (!ctx || !platforms ) return;
    platforms.forEach(platform => {
        const screenX = platform.x - camera.x;
        if (screenX + platform.width < 0 || screenX > canvas.width) return;

        if (platform.isGround) {
            ctx.fillStyle = platform.color || '#2E8B57';
            ctx.fillRect(screenX, platform.y, platform.width, platform.height);
        } else {
            if (!images.platformTile.loaded || !images.platformTile.img.complete || images.platformTile.img.naturalHeight === 0) {
                ctx.fillStyle = '#A0522D';
                ctx.fillRect(screenX, platform.y, platform.width, platform.height);
                return;
            }
            const tileImg = images.platformTile.img;
            const singleTileWidthScaled = PLATFORM_TILE_BASE_WIDTH * scaleX;
            for (let i = 0; i < platform.numTiles; i++) {
                const tileScreenX = screenX + (i * singleTileWidthScaled);
                if (tileScreenX + singleTileWidthScaled < 0 || tileScreenX > canvas.width) continue;
                ctx.drawImage(tileImg, tileScreenX, platform.y, singleTileWidthScaled, platform.height);
            }
        }
    });
}

function drawPlayer() {
    if (!ctx || !player.currentImage || !player.currentImage.complete || player.currentImage.naturalHeight === 0) {
        if (typeof player !== 'undefined' && player.isTransformed) {
            if (selectedTransformation === 'default') {
                if (images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT -1] && images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT -1].loaded) {
                    player.currentImage = images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT -1].img;
                } else if (images.playerTransformed.loaded && images.playerTransformed.img.complete) {
                    player.currentImage = images.playerTransformed.img;
                }
            } else if (selectedTransformation === 'staron' && images.playerStaronIdle.loaded) {
                player.currentImage = images.playerStaronIdle.img;
            } else { return; }
        } else if (typeof player !== 'undefined') {
            if (images.playerNormal.loaded && images.playerNormal.img.complete) {
                player.currentImage = images.playerNormal.img;
            } else { return; }
        } else { return; }
    }


    ctx.save();
    let playerAlpha = 1.0;
    if (isInvisible && !isShieldActive) {
        playerAlpha = INVISIBILITY_PLAYER_ALPHA;
    } else if (player.isHit && playerInvulnerableTimer > 0 && !isShieldActive && !isInvisible) {
        if (Math.floor(playerInvulnerableTimer / 100) % 2 === 0) {
            playerAlpha = 0.5;
        }
    }
    ctx.globalAlpha = playerAlpha;


    let currentDrawWidth = player.width;
    let currentDrawHeight = player.height;
    let drawOffsetX = 0;
    let drawOffsetY = 0;
    if (player.isTransformed && selectedTransformation === 'default' && player.isJumping) {
        currentDrawWidth = (basePlayer.transformedWidth * scaleX) * transformedJumpScaleFactor;
        currentDrawHeight = (basePlayer.transformedHeight * scaleY) * transformedJumpScaleFactor;
        drawOffsetX = (player.width - currentDrawWidth) / 2;
        drawOffsetY = (player.height - currentDrawHeight) / 2;
    }
    const drawScreenX = player.x - camera.x + drawOffsetX;
    const drawY = player.y + drawOffsetY;

    if (isShieldActive) {
        drawShieldEffect();
    }
    
    if (showingTransformationEffect && transformationEffectTimer > 0) {
        const effectDuration = (transformationEffectType === 'toAlien') ? TRANSFORM_ANIMATION_TOTAL_DURATION : REVERT_TRANSFORM_GLOW_DURATION;
        const effectProgress = 1 - (transformationEffectTimer / effectDuration);
        
        const haloBaseSize = Math.max(player.width, player.height);
        let currentHaloExtraSize = haloBaseSize * 0.8 * Math.sin(effectProgress * Math.PI);
        let currentHaloAlpha = Math.sin(effectProgress * Math.PI) * 0.9;

        const haloCenterX = player.x - camera.x + player.width / 2;
        const haloCenterY = player.y + player.height / 2;

        const originalGlobalAlphaForHalo = ctx.globalAlpha;
        ctx.globalAlpha = Math.min(playerAlpha, currentHaloAlpha);

        ctx.beginPath();
        ctx.arc(haloCenterX, haloCenterY, haloBaseSize * 0.6 + currentHaloExtraSize, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(
            haloCenterX, haloCenterY, haloBaseSize * 0.1,
            haloCenterX, haloCenterY, haloBaseSize * 0.6 + currentHaloExtraSize
        );
        
        const haloAlphaForGradient = ctx.globalAlpha;
        const haloColor1 = selectedTransformation === 'staron' ? `rgba(255, 230, 100, ${haloAlphaForGradient})` : `rgba(100, 255, 180, ${haloAlphaForGradient})`;
        const haloColor2 = selectedTransformation === 'staron' ? `rgba(255, 200, 50, ${haloAlphaForGradient * 0.5})` : `rgba(0, 220, 100, ${haloAlphaForGradient * 0.5})`;
        const haloColor3 = selectedTransformation === 'staron' ? `rgba(200, 150, 0, 0)` : `rgba(0, 150, 50, 0)`;

        gradient.addColorStop(0, haloColor1);
        gradient.addColorStop(0.6, haloColor2);
        gradient.addColorStop(1, haloColor3);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.globalAlpha = originalGlobalAlphaForHalo;
    }

    if (!player.isFacingRight) {
        ctx.translate(drawScreenX + currentDrawWidth, drawY);
        ctx.scale(-1, 1);
        ctx.drawImage(player.currentImage, 0, 0, currentDrawWidth, currentDrawHeight);
    } else {
        ctx.drawImage(player.currentImage, drawScreenX, drawY, currentDrawWidth, currentDrawHeight);
    }
    ctx.restore();

    if (isUsingFinisher && finisherBeamCycle.length > 0 && finisherBeamCycle[currentFinisherBeamFrame] && finisherBeamCycle[currentFinisherBeamFrame].complete) {
        const beamImg = finisherBeamCycle[currentFinisherBeamFrame];
        const beamActualWidth = 450 * scaleX;
        const beamActualHeight = player.height * 0.8;
        let beamX, beamY;
        beamY = player.y + player.height * 0.1;

        ctx.save();
        if (player.isFacingRight) {
            beamX = (player.x + player.width * 0.7) - camera.x;
            ctx.drawImage(beamImg, beamX, beamY, beamActualWidth, beamActualHeight);
        } else {
            beamX = (player.x + player.width * 0.3 - beamActualWidth) - camera.x;
            ctx.translate(beamX + beamActualWidth, beamY);
            ctx.scale(-1, 1);
            ctx.drawImage(beamImg, 0, 0, beamActualWidth, beamActualHeight);
        }
        ctx.restore();
    }
}

function drawShieldEffect() {
    if (!ctx || !isShieldActive) return;

    const shieldRadius = Math.max(player.width, player.height) * 0.75;
    const centerX = player.x - camera.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    const pulseSpeed = 800;
    const baseAlpha = 0.4;
    const pulseMagnitude = 0.3;
    const currentPulseAlpha = baseAlpha + Math.sin(shieldAnimationTimer / pulseSpeed * Math.PI * 2) * pulseMagnitude;

    ctx.save();
    ctx.globalAlpha = Math.max(0.1, currentPulseAlpha);

    const gradient = ctx.createRadialGradient(centerX, centerY, shieldRadius * 0.2, centerX, centerY, shieldRadius);
    gradient.addColorStop(0, `rgba(210, 230, 255, ${0.8 * ctx.globalAlpha})`);
    gradient.addColorStop(0.6, `rgba(100, 150, 255, ${0.6 * ctx.globalAlpha})`);
    gradient.addColorStop(1, `rgba(0, 50, 150, ${0.2 * ctx.globalAlpha})`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, shieldRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(200, 225, 255, ${Math.max(0.2, 0.4 + currentPulseAlpha * 0.3)})`;
    ctx.lineWidth = (2 + Math.sin(shieldAnimationTimer / (pulseSpeed/2) * Math.PI*2) * 1) * Math.min(scaleX, scaleY);
    ctx.stroke();

    ctx.restore();
}

function drawItems() {
    if (!ctx) return;
    powerups.forEach(powerup => {
        if (powerup.isActive && powerup.image && powerup.image.complete && powerup.image.naturalHeight !== 0) {
            const screenX = powerup.x - camera.x;
            if (screenX + powerup.width < 0 || screenX > canvas.width) return;
            const actualY = powerup.baseY + powerup.animationYOffset;
            ctx.drawImage(powerup.image, screenX, actualY, powerup.width, powerup.height);
        }
    });
}

function drawBullets() {
    if (!ctx) return;
    bullets.forEach(bullet => {
        const screenX = bullet.x - camera.x;
        if (screenX + bullet.width < 0 || screenX > canvas.width) return;
        if (bullet.image && bullet.image.complete && bullet.image.naturalHeight !== 0) {
            ctx.save();
            if (!bullet.isFacingRight) {
                ctx.translate(screenX + bullet.width, bullet.y);
                ctx.scale(-1, 1);
                ctx.drawImage(bullet.image, 0, 0, bullet.width, bullet.height);
            } else {
                ctx.drawImage(bullet.image, screenX, bullet.y, bullet.width, bullet.height);
            }
            ctx.restore();
        }
    });
}

function drawEnemy() {
    if (!ctx || !enemy.isActive) return;
    const enemyImg = images.enemyWalkFrames[enemy.currentWalkFrame]?.img || images.enemyWalkFrames[0]?.img;
    if (!enemyImg || !enemyImg.complete || enemyImg.naturalHeight === 0) return;
    
    const screenX = enemy.x - camera.x;
    if (screenX + enemy.width < 0 || screenX > canvas.width) return;

    ctx.save();
    let drawY;
    if (enemy.isFlying) {
        drawY = enemy.baseHoverY + enemy.animationYOffset;
    } else {
        drawY = enemy.y; 
    }

    if (enemy.isRushing) {
            ctx.globalAlpha = 0.6 + Math.sin(gameTime / 100) * 0.4;
    }

    if (!enemy.isFacingRight) {
        ctx.translate(screenX + enemy.width, drawY);
        ctx.scale(-1, 1);
        ctx.drawImage(enemyImg, 0, 0, enemy.width, enemy.height);
    } else {
        ctx.drawImage(enemyImg, screenX, drawY, enemy.width, enemy.height);
    }
    ctx.restore();

    if (enemy.isShielded) {
        ctx.save();
        const shieldRadius = Math.max(enemy.width, enemy.height) * 0.65;
        const enemyCenterX = screenX + enemy.width / 2;
        const enemyCenterY = drawY + enemy.height / 2;
        const shieldAlpha = 0.3 + Math.sin(gameTime / 200) * 0.2;

        if (images.enemyShieldEffect && images.enemyShieldEffect.loaded && images.enemyShieldEffect.img.complete) {
            ctx.globalAlpha = shieldAlpha * 1.5;
            ctx.drawImage(images.enemyShieldEffect.img,
                enemyCenterX - shieldRadius,
                enemyCenterY - shieldRadius,
                shieldRadius * 2,
                shieldRadius * 2);
        } else {
            ctx.globalAlpha = shieldAlpha;
            ctx.fillStyle = "rgba(255, 0, 0, " + (0.4 + Math.sin(gameTime / 150) * 0.15) + ")";
            ctx.beginPath();
            ctx.arc(enemyCenterX, enemyCenterY, shieldRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(200, 0, 0, 0.8)";
            ctx.lineWidth = 2 * Math.min(scaleX, scaleY);
            ctx.stroke();
        }
        ctx.restore();
    }
}


function drawEnemyLasers() {
    if (!ctx) return;
    enemyLasers.forEach(laser => {
        const screenX = laser.x - camera.x;
        if (screenX + laser.width < 0 || screenX > canvas.width) return;

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, ${Math.random() * 100}, ${Math.random() * 50}, 0.9)`;
        ctx.lineWidth = Math.max(2, 4 * Math.min(scaleX, scaleY)) * (0.7 + Math.random() * 0.6) ;
        ctx.shadowColor = 'rgba(255,0,0,0.7)';
        ctx.shadowBlur = 8 * Math.min(scaleX, scaleY);

        let currentScreenX = screenX;
        let currentY = laser.y + laser.height / 2;
        ctx.moveTo(currentScreenX, currentY);
        const segmentLength = laser.width / 5;
        const lightningAmplitude = laser.height * 0.6;

        for (let i = 1; i <= 5; i++) {
            const nextScreenX = screenX + (i * segmentLength * (laser.isFacingRight ? 1 : -1));
            const nextY = laser.y + laser.height / 2 + (Math.random() - 0.5) * 2 * lightningAmplitude * (i % 2 === 0 ? 1 : -1.2);
            ctx.lineTo(nextScreenX, nextY);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 200, 150, 0.95)`;
        ctx.lineWidth = Math.max(1, 2 * Math.min(scaleX, scaleY)) * (0.8 + Math.random() * 0.4);
        ctx.shadowBlur = 3 * Math.min(scaleX, scaleY);
        ctx.moveTo(currentScreenX, currentY + (Math.random()-0.5) * 2 * scaleY);
        for (let i = 1; i <= 5; i++) {
            const nextScreenX = screenX + (i * segmentLength * (laser.isFacingRight ? 1 : -1));
            const nextY = laser.y + laser.height / 2 + (Math.random() - 0.5) * lightningAmplitude * (i % 2 === 0 ? 0.8 : -1);
            ctx.lineTo(nextScreenX, nextY);
        }
        ctx.stroke();
        ctx.restore();
    });
}

function drawFlyingEnemies() {
    if (!ctx) return;
    flyingEnemies.forEach(fe => {
        if (!fe.isActive || !fe.currentImage || !fe.currentImage.complete || fe.currentImage.naturalHeight === 0) return;
        const screenX = fe.x - camera.x;
        if (screenX + fe.width < 0 || screenX > canvas.width) return;

        ctx.save();
        if (!fe.isFacingRight) {
            ctx.translate(screenX + fe.width, fe.y);
            ctx.scale(-1, 1);
            ctx.drawImage(fe.currentImage, 0, 0, fe.width, fe.height);
        } else {
            ctx.drawImage(fe.currentImage, screenX, fe.y, fe.width, fe.height);
        }
        ctx.restore();
    });
}

function drawRockets() {
    if (!ctx) return;
    rockets.forEach(rocket => {
        if (!rocket.image || !rocket.image.complete || rocket.image.naturalHeight === 0) return;
        const screenX = rocket.x - camera.x;
        if (screenX + rocket.width < 0 || screenX > canvas.width) return;
        ctx.drawImage(rocket.image, screenX, rocket.y, rocket.width, rocket.height);
    });
}

function drawExplosions() {
    if (!ctx) return;
    explosions.forEach(exp => {
        if (exp.image && exp.image.complete && exp.image.naturalHeight !== 0) {
            const screenX = exp.x - camera.x;
            if (screenX + exp.width < 0 || screenX > canvas.width) return;
            ctx.drawImage(exp.image, screenX, exp.y, exp.width, exp.height);
        }
    });
}

function drawChaserEnemies() {
    if (!ctx || !chaserEnemies || chaserEnemies.length === 0) return;

    chaserEnemies.forEach(chaser => {
        if (!chaser.isActive) return;

        const screenX = chaser.x - camera.x;
        if (screenX + chaser.width < 0 || screenX > canvas.width) return;

        if (chaser.image && chaser.image.complete && chaser.image.naturalHeight !== 0) {
            ctx.save();
            if (!chaser.isFacingRight) {
                ctx.translate(screenX + chaser.width, chaser.y);
                ctx.scale(-1, 1);
                ctx.drawImage(chaser.image, 0, 0, chaser.width, chaser.height);
            } else {
                ctx.drawImage(chaser.image, screenX, chaser.y, chaser.width, chaser.height);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = 'purple';
            ctx.fillRect(screenX, chaser.y, chaser.width, chaser.height);
        }
        
        if (chaser.isConfused && images.questionMark.loaded) {
            const qMarkWidth = 40 * scaleX;
            const qMarkHeight = 40 * scaleY;
            const qMarkX = screenX + (chaser.width / 2) - (qMarkWidth / 2);
            const qMarkY = chaser.y - qMarkHeight - (10 * scaleY);
            ctx.drawImage(images.questionMark.img, qMarkX, qMarkY, qMarkWidth, qMarkHeight);
        }

        if (chaser.health > 0 && chaser.health < chaser.initialHealth) {
            const healthBarWidth = chaser.width * 0.8;
            const healthBarHeight = 8 * Math.min(scaleX, scaleY);
            const healthBarX = screenX + (chaser.width - healthBarWidth) / 2;
            const healthBarY = chaser.y - healthBarHeight - (5 * scaleY);

            ctx.fillStyle = 'rgba(100, 0, 0, 0.7)';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

            const healthPercentage = chaser.health / chaser.initialHealth;
            ctx.fillStyle = healthPercentage > 0.5 ? 'rgba(0, 200, 0, 0.9)' : 'rgba(200, 0, 0, 0.9)';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1 * Math.min(scaleX, scaleY);
            ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        }
    });
}

function drawSwordEnemies() {
    if (!ctx || !swordEnemies || swordEnemies.length === 0) return;

    swordEnemies.forEach(sEnemy => {
        if (!sEnemy.isActive) return;

        const screenX = sEnemy.x - camera.x;
        if (screenX + sEnemy.width < 0 || screenX > canvas.width) return;

        if (!sEnemy.currentImage || !sEnemy.currentImage.complete || sEnemy.currentImage.naturalHeight === 0) {
            ctx.fillStyle = 'darkred';
            ctx.fillRect(screenX, sEnemy.y, sEnemy.width, sEnemy.height);
            return;
        }

        ctx.save();
        if (!sEnemy.isFacingRight) {
            ctx.translate(screenX + sEnemy.width, sEnemy.y);
            ctx.scale(-1, 1);
            ctx.drawImage(sEnemy.currentImage, 0, 0, sEnemy.width, sEnemy.height);
        } else {
            ctx.drawImage(sEnemy.currentImage, screenX, sEnemy.y, sEnemy.width, sEnemy.height);
        }
        ctx.restore();

        if (sEnemy.health > 0 && sEnemy.health < sEnemy.initialHealth) {
            const healthBarActualWidth = sEnemy.width * 0.8;
            const healthBarHeight = 7 * Math.min(scaleX, scaleY);
            const healthBarScreenX = screenX + (sEnemy.width - healthBarActualWidth) / 2;
            const healthBarScreenY = sEnemy.y - healthBarHeight - (4 * scaleY);

            ctx.fillStyle = 'rgba(60,0,0,0.7)';
            ctx.fillRect(healthBarScreenX, healthBarScreenY, healthBarActualWidth, healthBarHeight);
            const currentHealthPercentage = sEnemy.health / sEnemy.initialHealth;
            ctx.fillStyle = currentHealthPercentage > 0.4 ? 'rgba(0,180,0,0.85)' : 'rgba(180,0,0,0.85)';
            ctx.fillRect(healthBarScreenX, healthBarScreenY, healthBarActualWidth * currentHealthPercentage, healthBarHeight);
            ctx.strokeStyle = 'rgba(200,200,200,0.5)';
            ctx.lineWidth = 1 * Math.min(scaleX, scaleY);
            ctx.strokeRect(healthBarScreenX, healthBarScreenY, healthBarActualWidth, healthBarHeight);
        }
    });
}

function drawGunnerEnemies() {
    if (!ctx || !gunnerEnemies || gunnerEnemies.length === 0) return;

    gunnerEnemies.forEach(gEnemy => {
        if (!gEnemy.isActive) return;

        const screenX = gEnemy.x - camera.x;
        if (screenX + gEnemy.width < 0 || screenX > canvas.width) return;

        if (gEnemy.currentImage && gEnemy.currentImage.complete && gEnemy.currentImage.naturalHeight !== 0) {
            ctx.save();
            if (gEnemy.state === 'aiming') {
                ctx.filter = 'sepia(50%) brightness(1.1)';
            }
            if (!gEnemy.isFacingRight) {
                ctx.translate(screenX + gEnemy.width, gEnemy.y);
                ctx.scale(-1, 1);
                ctx.drawImage(gEnemy.currentImage, 0, 0, gEnemy.width, gEnemy.height);
            } else {
                ctx.drawImage(gEnemy.currentImage, screenX, gEnemy.y, gEnemy.width, gEnemy.height);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = '#A9A9A9';
            ctx.fillRect(screenX, gEnemy.y, gEnemy.width, gEnemy.height);
        }

        if (gEnemy.health > 0 && gEnemy.health < gEnemy.initialHealth) {
            const healthBarWidth = gEnemy.width * 0.8;
            const healthBarHeight = 7 * Math.min(scaleX, scaleY);
            const healthBarX = screenX + (gEnemy.width - healthBarWidth) / 2;
            const healthBarY = gEnemy.y - healthBarHeight - (5 * scaleY);

            ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            const healthPercentage = gEnemy.health / gEnemy.initialHealth;
            ctx.fillStyle = healthPercentage > 0.4 ? '#40E0D0' : '#FF4500';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1 * Math.min(scaleX, scaleY);
            ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        }
    });
}

function drawLionEnemies() {
    if (!ctx || !lionEnemies || lionEnemies.length === 0) return;

    lionEnemies.forEach(lion => {
        if (!lion.isActive) return;

        const screenX = lion.x - camera.x;
        if (screenX + lion.width < 0 || screenX > canvas.width) return;

        if (lion.currentImage && lion.currentImage.complete && lion.currentImage.naturalHeight !== 0) {
            ctx.save();
            if (!lion.isFacingRight) {
                ctx.translate(screenX + lion.width, lion.y);
                ctx.scale(-1, 1);
                ctx.drawImage(lion.currentImage, 0, 0, lion.width, lion.height);
            } else {
                ctx.drawImage(lion.currentImage, screenX, lion.y, lion.width, lion.height);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = 'orange';
            ctx.fillRect(screenX, lion.y, lion.width, lion.height);
        }

        // Health Bar
        if (lion.health > 0 && lion.health < lion.initialHealth) {
            const healthBarWidth = lion.width * 0.9;
            const healthBarHeight = 10 * Math.min(scaleX, scaleY);
            const healthBarX = screenX + (lion.width - healthBarWidth) / 2;
            const healthBarY = lion.y - healthBarHeight - (8 * scaleY);

            ctx.fillStyle = 'rgba(80, 0, 0, 0.8)';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            const healthPercentage = lion.health / lion.initialHealth;
            ctx.fillStyle = healthPercentage > 0.5 ? '#FFD700' : '#FF4500';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1.5 * Math.min(scaleX, scaleY);
            ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        }
    });
}

function drawClownEnemies() {
    if (!ctx || !clownEnemies || clownEnemies.length === 0) return;

    clownEnemies.forEach(clown => {
        if (!clown.isActive) return;

        const screenX = clown.x - camera.x;
        if (screenX + clown.width < 0 || screenX > canvas.width) return;

        if (clown.currentImage && clown.currentImage.complete && clown.currentImage.naturalHeight !== 0) {
            ctx.save();
            if (!clown.isFacingRight) {
                ctx.translate(screenX + clown.width, clown.y);
                ctx.scale(-1, 1);
                ctx.drawImage(clown.currentImage, 0, 0, clown.width, clown.height);
            } else {
                ctx.drawImage(clown.currentImage, screenX, clown.y, clown.width, clown.height);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = '#e6007e'; // Bright pink for placeholder
            ctx.fillRect(screenX, clown.y, clown.width, clown.height);
        }

        // Health Bar
        if (clown.health > 0 && clown.health < clown.initialHealth) {
            const healthBarWidth = clown.width * 0.8;
            const healthBarHeight = 8 * Math.min(scaleX, scaleY);
            const healthBarX = screenX + (clown.width - healthBarWidth) / 2;
            const healthBarY = clown.y - healthBarHeight - (6 * scaleY);

            ctx.fillStyle = 'rgba(50, 0, 50, 0.7)';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            const healthPercentage = clown.health / clown.initialHealth;
            ctx.fillStyle = healthPercentage > 0.4 ? '#ff00ff' : '#ff4500';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1 * Math.min(scaleX, scaleY);
            ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        }
    });
}

function drawClownBalls() {
    if (!ctx || !clownBalls) return;
    clownBalls.forEach(ball => {
        const screenX = ball.x - camera.x;
        if (screenX + ball.width < 0 || screenX > canvas.width) return;
        const img = ball.images[ball.currentFrame];
        if (img && img.complete && img.naturalHeight !== 0) {
             ctx.drawImage(img, screenX, ball.y, ball.width, ball.height);
        } else {
            ctx.fillStyle = '#ff69b4'; // Hot pink
            ctx.beginPath();
            ctx.arc(screenX + ball.width / 2, ball.y + ball.height / 2, ball.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawPieClownEnemies() {
    if (!ctx || !pieClownEnemies || pieClownEnemies.length === 0) return;

    pieClownEnemies.forEach(pieClown => {
        if (!pieClown.isActive) return;

        const screenX = pieClown.x - camera.x;
        if (screenX + pieClown.width < 0 || screenX > canvas.width) return;

        if (pieClown.currentImage && pieClown.currentImage.complete && pieClown.currentImage.naturalHeight !== 0) {
            ctx.save();
            if (!pieClown.isFacingRight) {
                ctx.translate(screenX + pieClown.width, pieClown.y);
                ctx.scale(-1, 1);
                ctx.drawImage(pieClown.currentImage, 0, 0, pieClown.width, pieClown.height);
            } else {
                ctx.drawImage(pieClown.currentImage, screenX, pieClown.y, pieClown.width, pieClown.height);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = '#FFC0CB';
            ctx.fillRect(screenX, pieClown.y, pieClown.width, pieClown.height);
        }

        if (pieClown.health > 0 && pieClown.health < pieClown.initialHealth) {
            const healthBarWidth = pieClown.width * 0.8;
            const healthBarHeight = 8 * Math.min(scaleX, scaleY);
            const healthBarX = screenX + (pieClown.width - healthBarWidth) / 2;
            const healthBarY = pieClown.y - healthBarHeight - (6 * scaleY);

            ctx.fillStyle = 'rgba(80, 40, 0, 0.7)';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            const healthPercentage = pieClown.health / pieClown.initialHealth;
            ctx.fillStyle = healthPercentage > 0.4 ? '#FFD700' : '#CD853F';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1 * Math.min(scaleX, scaleY);
            ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        }
    });
}

function drawPies() {
    if (!ctx || !pies) return;
    pies.forEach(pie => {
        const screenX = pie.x - camera.x;
        if (screenX + pie.width < 0 || screenX > canvas.width) return;
        if (pie.image && pie.image.complete && pie.image.naturalHeight !== 0) {
             ctx.drawImage(pie.image, screenX, pie.y, pie.width, pie.height);
        } else {
            ctx.fillStyle = '#F5DEB3';
            ctx.beginPath();
            ctx.arc(screenX + pie.width / 2, pie.y + pie.height / 2, pie.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}


function drawGunnerBullets() {
    if (!ctx || !gunnerBullets) return;
    gunnerBullets.forEach(bullet => {
        const screenX = bullet.x - camera.x;
        if (screenX + bullet.width < 0 || screenX > canvas.width) return;
        if (bullet.image && bullet.image.complete && bullet.image.naturalHeight !== 0) {
             ctx.save();
             if (!bullet.isFacingRight) {
                ctx.translate(screenX + bullet.width, bullet.y);
                ctx.scale(-1, 1);
                ctx.drawImage(bullet.image, 0, 0, bullet.width, bullet.height);
             } else {
                ctx.drawImage(bullet.image, screenX, bullet.y, bullet.width, bullet.height);
             }
             ctx.restore();
        } else {
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(screenX, bullet.y, bullet.width, bullet.height);
        }
    });
}

function drawPortal() {
    if (!ctx || !portalObject.isActive || !images.portalFrames || images.portalFrames.length === 0 || isOnlineMode) return;
    
    const screenX = portalObject.x - camera.x;
    if (screenX + portalObject.width < 0 || screenX > canvas.width) return;

    let portalImg = images.portalFrames[portalObject.isOpen ? currentPortalFrame : 0]?.img;
    
    if (!portalImg || !portalImg.complete || portalImg.naturalHeight === 0) return;

    ctx.save();
    if (portalObject.isOpen) {
        ctx.globalAlpha = 0.8 + Math.sin(gameTime / 300) * 0.2;
    } else {
        ctx.globalAlpha = 0.7;
        ctx.filter = 'grayscale(80%) brightness(0.9)';
    }
    
    ctx.drawImage(portalImg, screenX, portalObject.y, portalObject.width, portalObject.height);
    ctx.restore();
}

// ### MODIFIED for Online Mode ###
function drawPlayerUI() {
    if (!ctx || !canvas) return;
    const responsiveScale = Math.min(1.5, Math.max(0.7, canvas.height / BASE_HEIGHT));
    const topOffset = 20 * responsiveScale;
    const uiPadding = 15 * responsiveScale;
    const barHeight = 28 * responsiveScale;
    const uiFontSize = Math.max(12, 16 * responsiveScale);
    
    if (isOnlineMode) {
        // --- Online UI (Player and Opponent health bars) ---
        const barWidth = 220 * scaleX;

        // Player Health Bar (Left Side)
        const playerHealth = Math.max(0, MAX_PLAYER_HITS - playerHitCount);
        const playerHealthPercent = MAX_PLAYER_HITS > 0 ? playerHealth / MAX_PLAYER_HITS : 0;
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(uiPadding, topOffset, barWidth, barHeight);
        ctx.fillStyle = "#00dd00";
        ctx.fillRect(uiPadding, topOffset, barWidth * playerHealthPercent, barHeight);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5 * responsiveScale;
        ctx.strokeRect(uiPadding, topOffset, barWidth, barHeight);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = `${uiFontSize * 0.9}px Tajawal`;
        ctx.textBaseline = "middle";
        ctx.fillText(`أنت: ${playerHealth}`, uiPadding + barWidth / 2, topOffset + barHeight / 2);

        // Opponent Health Bar (Right Side)
        if (opponent && opponent.health !== undefined) {
            const opponentHealthPercent = opponent.maxHealth > 0 ? opponent.health / opponent.maxHealth : 0;
            const opponentBarX = canvas.width - barWidth - uiPadding;
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(opponentBarX, topOffset, barWidth, barHeight);
            ctx.fillStyle = "red";
            ctx.fillRect(opponentBarX, topOffset, barWidth * opponentHealthPercent, barHeight);
            ctx.strokeStyle = "white";
            ctx.strokeRect(opponentBarX, topOffset, barWidth, barHeight);
            ctx.fillStyle = "white";
            ctx.fillText(`الخصم: ${opponent.health}`, opponentBarX + barWidth / 2, topOffset + barHeight / 2);
        }

    } else {
        // --- Offline UI (Hearts, Transformation, Enemy Health) ---
        const heartSize = 30 * responsiveScale;
        const transformBarWidth = 180 * scaleX;
        
        // Player Hearts
        if (images.heartImage.loaded) {
            for (let i = 0; i < MAX_PLAYER_HITS; i++) {
                ctx.globalAlpha = (i < MAX_PLAYER_HITS - playerHitCount) ? 1.0 : 0.35;
                ctx.drawImage(images.heartImage.img, uiPadding + (i * (heartSize + 5 * scaleX)), topOffset, heartSize, heartSize);
            }
            ctx.globalAlpha = 1.0;
        }

        // Enemy Health Bar
        if (enemy.isActive) {
            const enemyBarWidth = 160 * scaleX;
            const enemyBarHeight = 20 * responsiveScale;
            const enemyBarX = canvas.width / 2 - (enemyBarWidth / 2);
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(enemyBarX, topOffset, enemyBarWidth, enemyBarHeight);
            ctx.fillStyle = "red";
            ctx.fillRect(enemyBarX, topOffset, (enemyBarWidth) * (enemy.health / enemy.initialHealth), enemyBarHeight);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 1.5 * responsiveScale;
            ctx.strokeRect(enemyBarX, topOffset, enemyBarWidth, enemyBarHeight);
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.font = `${uiFontSize * 0.7}px Tajawal`;
            ctx.textBaseline = "middle";
            ctx.fillText(`صحة العدو: ${enemy.health}`, enemyBarX + enemyBarWidth/2, topOffset + enemyBarHeight/2);
        }

        // Transformation Bar
        let barColor = "#00aa00";
        let fillPercentage = 1;
        let timerText = "التحول جاهز!";
        if (player.isTransformed && transformationActiveTimer > 0) {
            fillPercentage = transformationActiveTimer / TRANSFORMATION_DURATION;
            timerText = `التحول: ${(transformationActiveTimer / 1000).toFixed(1)} ث`;
            barColor = "#00dd00";
        } else if (transformationCooldownTimer > 0) {
            fillPercentage = 1 - (transformationCooldownTimer / currentTransformationCooldown);
            timerText = `انتظار: ${(transformationCooldownTimer / 1000).toFixed(1)} ث`;
            barColor = "#ff8c00";
        }
        const transformBarX = canvas.width - transformBarWidth - uiPadding;
        ctx.fillStyle = "rgba(50, 50, 50, 0.6)";
        ctx.fillRect(transformBarX, topOffset, transformBarWidth, barHeight);
        ctx.fillStyle = barColor;
        ctx.fillRect(transformBarX, topOffset, transformBarWidth * fillPercentage, barHeight);
        ctx.strokeStyle = "#f0f0f0";
        ctx.strokeRect(transformBarX, topOffset, transformBarWidth, barHeight);
        ctx.fillStyle = "#ffffff";
        ctx.font = `${uiFontSize * 0.8}px Tajawal`;
        ctx.textAlign = "center";
        ctx.fillText(timerText, transformBarX + transformBarWidth / 2, topOffset + barHeight / 2);
    }
}


function drawWinScreenStarsAnimation(currentTime) {
    if (!ctx || !canvas || !images.winStarImage.loaded) return;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0,0, canvas.width, canvas.height);


    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 50 * scaleY;
    const starImageSize = 50 * Math.min(scaleX, scaleY);

    const winText = (typeof winScreenMessage !== 'undefined' && winScreenMessage && winScreenMessage.textContent) ? winScreenMessage.textContent : "لقد فزت!";
    const gradient = ctx.createLinearGradient(centerX - 100 * scaleX, centerY - 40 * scaleY, centerX + 100 * scaleX, centerY + 40 * scaleY);
    gradient.addColorStop(0, '#fff6b7');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#ffcc00');

    ctx.font = `bold ${60 * Math.min(scaleX, scaleY)}px Tajawal`;
    ctx.fillStyle = gradient;
    ctx.textAlign = 'center';

    const pulse = Math.sin(currentTime / WIN_SCREEN_TEXT_PULSE_SPEED) * 5 * scaleY;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = (25 + pulse) * Math.min(scaleX, scaleY);
    ctx.fillText(winText, centerX, centerY);
    ctx.shadowBlur = 0;

    winScreenStarsToDisplay.forEach(star => {
        const life = (currentTime - star.createdAt) / WIN_SCREEN_STAR_ANIMATION_DURATION;
        const currentScale = Math.min(1, life * 2);
        const currentOpacity = Math.min(1, life * 2);

        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.rotate(star.angle);
        ctx.scale(currentScale, currentScale);
        ctx.globalAlpha = currentOpacity;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15 * Math.min(scaleX, scaleY);
        ctx.drawImage(images.winStarImage.img, -starImageSize / 2, -starImageSize / 2, starImageSize, starImageSize);
        ctx.restore();
    });
}

function spawnWinScreenStar(index, totalStarsToSpawn) {
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerYText = canvas.height / 2 - 50 * scaleY;
    const radius = 120 * scaleX; 
    const starsYOffset = 80 * scaleY;

    const angleSpread = Math.PI * 1.2;
    const angleStart = (Math.PI / 2) - (angleSpread / 2);
    
    let angle;
    if (totalStarsToSpawn === 1) {
        angle = Math.PI / 2; 
    } else {
        angle = angleStart + (index * (angleSpread / (totalStarsToSpawn - 1)));
    }

    const x = centerX + radius * Math.cos(angle);
    const y = centerYText + starsYOffset + radius * Math.sin(angle);

    winScreenStarsToDisplay.push({
        x: x, y: y,
        scale: 0, opacity: 0,
        createdAt: performance.now(),
        angle: angle - Math.PI / 2
    });

    if (starAppearSound && starAppearSound.HAVE_ENOUGH_DATA && Math.random() < 0.3) {
        starAppearSound.currentTime = 0;
        starAppearSound.volume = 0.5;
        starAppearSound.play().catch(e => {});
    }
}


// =============================================
// GAME LOOP
// =============================================
let lastLoopTime = 0;
let accumulatedFrameTime = 0;

function gameLoop(currentTime) {
    if (isPaused || (gameState !== 'playing' && gameState !== 'levelComplete')) {
        if (animationFrameId && !isPaused && gameState !== 'levelComplete') {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        return;
    }
    if (!canvas || !ctx) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }
    if (!lastLoopTime) lastLoopTime = currentTime;
    
    deltaTime = currentTime - lastLoopTime;
    lastLoopTime = currentTime;
    if (deltaTime > 100) deltaTime = 100;

    accumulatedFrameTime += deltaTime;
    gameTime += deltaTime;

    if (gameState === 'gameOver' || gameState === 'won') {
        if(ctx && canvas){
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBackground();
            drawPlatforms();
            if (isOnlineMode) drawOpponent();
            drawPlayer();
            drawPlayerUI();
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        return;
    }
    
    // In online mode, update opponent interpolation for smooth movement
    if (isOnlineMode && typeof updateOpponentInterpolation === 'function') {
        updateOpponentInterpolation(deltaTime);
    }
    
    let updatesCount = 0;
    const levelConfigForLoop = (typeof levelsData !== 'undefined' && levelsData[currentLevel - 1]) ? levelsData[currentLevel - 1] : null;

    if (gameState === 'playing') {
        if (portalObject.isOpen) {
            portalAnimationTimer += deltaTime;
            if (portalAnimationTimer >= PORTAL_FRAME_DURATION) {
                portalAnimationTimer = 0;
                if (images.portalFrames && images.portalFrames.length > 0) {
                    currentPortalFrame = (currentPortalFrame + 1) % images.portalFrames.length;
                }
            }
        } else {
            currentPortalFrame = 0; portalAnimationTimer = 0;
        }

        if (typeof updateMovingPlatforms === 'function') updateMovingPlatforms(deltaTime);

        while (accumulatedFrameTime >= FIXED_TIMESTEP && updatesCount < 5) {
            if (typeof updatePlayerPosition === 'function') updatePlayerPosition(FIXED_TIMESTEP);

            if (isOnlineMode && typeof sendPlayerUpdateToServer === 'function') {
                sendPlayerUpdateToServer();
            }

            if (typeof updatePortalState === 'function') updatePortalState();
            
            if (!isOnlineMode) {
                if (chaserEnemies.length > 0) chaserEnemies.forEach(chaser => chaser.isActive && updateChaserEnemy(chaser, FIXED_TIMESTEP));
                if (swordEnemies.length > 0) swordEnemies.forEach(sEnemy => sEnemy.isActive && updateSwordEnemy(sEnemy, FIXED_TIMESTEP));
                if (gunnerEnemies.length > 0) gunnerEnemies.forEach(gEnemy => gEnemy.isActive && updateGunnerEnemy(gEnemy, FIXED_TIMESTEP));
                if (lionEnemies.length > 0) lionEnemies.forEach(lion => lion.isActive && updateLionEnemy(lion, FIXED_TIMESTEP));
                if (clownEnemies.length > 0) clownEnemies.forEach(clown => clown.isActive && updateClownEnemy(clown, FIXED_TIMESTEP));
                if (pieClownEnemies.length > 0) pieClownEnemies.forEach(pieClown => pieClown.isActive && updatePieClownEnemy(pieClown, FIXED_TIMESTEP));
                if (typeof updateEnemy === 'function') updateEnemy(FIXED_TIMESTEP);
                if (typeof updateEnemyLasers === 'function') updateEnemyLasers(FIXED_TIMESTEP);
                 if (levelConfigForLoop?.hasFlyingEnemies) {
                    if (typeof updateFlyingEnemies === 'function') updateFlyingEnemies(FIXED_TIMESTEP);
                    if (typeof updateRockets === 'function') updateRockets(FIXED_TIMESTEP);
                }
            }
            
            if (typeof updateGunnerBullets === 'function') updateGunnerBullets(FIXED_TIMESTEP);
            if (typeof updateClownBalls === 'function') updateClownBalls(FIXED_TIMESTEP);
            if (typeof updatePies === 'function') updatePies(FIXED_TIMESTEP); 
            if (typeof updateBullets === 'function') updateBullets(FIXED_TIMESTEP);
            if (typeof updateExplosions === 'function') updateExplosions(FIXED_TIMESTEP);
            if (typeof updateItems === 'function') updateItems(FIXED_TIMESTEP);
            if (typeof checkAllCollisions === 'function') checkAllCollisions();

            accumulatedFrameTime -= FIXED_TIMESTEP;
            updatesCount++;
        }
    } else if (gameState === 'levelComplete') {
        if (winScreenStarsToDisplay.length < currentLevelStarsEarned && performance.now() - winScreenLastStarSpawnTime > WIN_SCREEN_STAR_DELAY) {
            spawnWinScreenStar(winScreenStarsToDisplay.length, currentLevelStarsEarned);
            winScreenLastStarSpawnTime = performance.now();
        }
        
        if (!winScreenStarDisplayComplete) {
            if (winScreenStarsToDisplay.length === currentLevelStarsEarned) {
                 const lastSpawnedStar = winScreenStarsToDisplay[winScreenStarsToDisplay.length - 1];
                 if(lastSpawnedStar && performance.now() - lastSpawnedStar.createdAt > WIN_SCREEN_STAR_ANIMATION_DURATION) {
                     winScreenStarDisplayComplete = true;
                 }
            } else if (currentLevelStarsEarned === 0) {
                 winScreenStarDisplayComplete = true;
            }
        }

        if(winScreenStarDisplayComplete && winScreenUIDelayTimer > 0) {
            winScreenUIDelayTimer -= deltaTime;
            if(winScreenUIDelayTimer <= 0) {
                if(typeof showWinScreenButtons === 'function') showWinScreenButtons();
            }
        }
        accumulatedFrameTime = 0;
    }


    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    if (gameState === 'playing' || gameState === 'levelComplete') {
        drawPlatforms();
        drawItems();
        drawGunnerBullets();
        drawClownBalls();
        drawPies(); 
        drawExplosions();
        drawBullets();
        drawPortal();
        
        if (!isOnlineMode) {
             drawEnemyLasers();
             if (levelConfigForLoop?.hasFlyingEnemies) {
                drawFlyingEnemies();
                drawRockets();
            }
            drawEnemy();
            if (levelConfigForLoop?.hasNewChaserEnemy) drawChaserEnemies();
            if (levelConfigForLoop?.hasSwordEnemy) drawSwordEnemies();
            if (levelConfigForLoop?.hasGunnerEnemy) drawGunnerEnemies();
            if (levelConfigForLoop?.hasLionEnemy) drawLionEnemies();
            if (levelConfigForLoop?.hasClownEnemy) drawClownEnemies();
            if (levelConfigForLoop?.hasPieClownEnemy) drawPieClownEnemies();
        }

        drawPlayer();
        
        if (isOnlineMode) {
            drawOpponent();
        }
        
        if (gameState === 'levelComplete') {
            drawWinScreenStarsAnimation(performance.now());
        }
        drawPlayerUI();
    }


    if (typeof updateInGameUIState === 'function') updateInGameUIState();

    if (gameState === 'playing' || gameState === 'levelComplete') {
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
    }
}

// =============================================
// UTILITY & MISC FUNCTIONS
// =============================================
function showTemporaryGameTitle() {
    if (gameTitleTimeoutId) {
        clearTimeout(gameTitleTimeoutId);
    }
    const gameTitleElement = document.getElementById('gameTitle');
    if (gameTitleElement && typeof levelsData !== 'undefined' && levelsData[currentLevel - 1]) {
        let titleText = levelsData[currentLevel - 1].gameTitleText || `المستوى ${currentLevel}`;
        if(isOnlineMode) {
            titleText = "ساحة المعركة";
        }
        gameTitleElement.textContent = titleText;
        gameTitleElement.style.display = 'block';
        requestAnimationFrame(() => {
            gameTitleElement.style.opacity = '1';
        });

        gameTitleTimeoutId = setTimeout(() => {
            gameTitleElement.style.opacity = '0';
            setTimeout(() => {
                if (gameTitleElement.style.opacity === '0') {
                    gameTitleElement.style.display = 'none';
                }
            }, 500);
        }, 2500);
    }
}

function requestAppFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {});
    } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen().catch(err => {});
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen().catch(err => {});
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen().catch(err => {});
    }
}


// =============================================
// DOM CONTENT LOADED & WINDOW RESIZE
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
    } else {
        console.error("Canvas element not found!");
        const loadingScreenTextEl = document.getElementById('loadingScreenText');
        if (loadingScreenTextEl) {
             loadingScreenTextEl.textContent = "خطأ: لم يتم العثور على الكانفاس!";
             loadingScreenTextEl.style.color = "red";
        }
        return;
    }

    if (typeof initializeUIElements === 'function') initializeUIElements();
    if (typeof setupUIEventListeners === 'function') setupUIEventListeners();


    const savedHighestLevel = localStorage.getItem(MAX_UNLOCKED_LEVEL_KEY);
    const MAX_LEVELS_FROM_CONFIG_ONLOAD = (typeof levelsData !== 'undefined') ? levelsData.length : 6;
    if (savedHighestLevel && !isNaN(savedHighestLevel)) {
        highestUnlockedLevel = parseInt(savedHighestLevel);
        highestUnlockedLevel = Math.min(Math.max(1, highestUnlockedLevel), MAX_LEVELS_FROM_CONFIG_ONLOAD);
    } else {
        highestUnlockedLevel = 1;
    }
    currentLevel = highestUnlockedLevel;

    const savedScore = localStorage.getItem(SCORE_STORAGE_KEY);
    if (savedScore && !isNaN(savedScore)) {
        playerScore = parseInt(savedScore);
    } else {
        playerScore = 0;
    }
    if (typeof updateScoreDisplay === 'function') updateScoreDisplay();

    cooldownUpgradePurchased = localStorage.getItem(COOLDOWN_REDUCTION_KEY) === 'true';
    extraLifePurchased = localStorage.getItem(EXTRA_LIFE_KEY) === 'true';
    invisibilityPurchased = localStorage.getItem(INVISIBILITY_KEY) === 'true';
    shieldPurchased = localStorage.getItem(SHIELD_KEY) === 'true';
    finisherAbilityPurchased = localStorage.getItem(FINISHER_ABILITY_KEY) === 'true';
    staronUnlocked = localStorage.getItem(STARON_UNLOCKED_KEY) === 'true';
    selectedTransformation = localStorage.getItem(SELECTED_TRANSFORMATION_KEY) || 'default';


    if (extraLifePurchased && typeof MAX_PLAYER_HITS !== 'undefined') MAX_PLAYER_HITS = DEFAULT_MAX_PLAYER_HITS + EXTRA_LIVES_AMOUNT;
    if (cooldownUpgradePurchased && typeof currentTransformationCooldown !== 'undefined') {
        const reductionAmount = typeof POWERUP_COOLDOWN_REDUCTION !== 'undefined' ? POWERUP_COOLDOWN_REDUCTION : 4000;
        currentTransformationCooldown = Math.max(MIN_TRANSFORMATION_COOLDOWN, DEFAULT_TRANSFORMATION_COOLDOWN - reductionAmount);
    }


    let simulatedProgress = 0;
    const loadingInterval = setInterval(() => {
        if (allGameAssetsLoaded) {
            simulatedProgress = 100;
        } else {
            simulatedProgress = Math.min(simulatedProgress + 5, 99);
        }
        const progressFillEl = document.getElementById('progressFill');
        const loadingScreenTextEl = document.getElementById('loadingScreenText');


        const actualPercentage = (typeof imagesToLoad !== 'undefined' && imagesToLoad > 0 && typeof imagesLoadedCount !== 'undefined')
                                ? (imagesLoadedCount / imagesToLoad) * 100
                                : (allGameAssetsLoaded ? 100 : simulatedProgress);

        const displayPercentage = Math.max(simulatedProgress, actualPercentage);

        if (progressFillEl) progressFillEl.style.width = displayPercentage + '%';
        if (loadingScreenTextEl && typeof imagesToLoad !== 'undefined' && typeof imagesLoadedCount !== 'undefined') {
             loadingScreenTextEl.textContent = `جاري تحميل اللعبة... (${imagesLoadedCount}/${calculateImagesToLoad()})`;
        }


        if (displayPercentage >= 100 && allGameAssetsLoaded) {
            clearInterval(loadingInterval);
            setTimeout(() => {
                const loadingScreenEl = document.getElementById('loadingScreen');
                const startScreenContainerEl = document.getElementById('startScreenContainer');
                if (loadingScreenEl) loadingScreenEl.style.display = 'none';
                if (startScreenContainerEl) startScreenContainerEl.style.display = 'flex';
                gameState = 'startScreen';
                if (typeof updateLevelSelectScreen === 'function') updateLevelSelectScreen();
                setupGameDimensionsAndObjects(); 
                if (typeof updateControlButtonsSize === 'function') updateControlButtonsSize();
                if (typeof updateInGameUIState === 'function') updateInGameUIState();
            }, 500);
        }
    }, 100);

    if (typeof loadAllImages === 'function') {
        loadAllImages(() => {});
    } else {
        console.error("loadAllImages function not found!");
        allGameAssetsLoaded = true;
    }


    const mainGameTitleElement = document.getElementById('mainGameTitle');
    if (mainGameTitleElement) mainGameTitleElement.textContent = "Ultimate Burst";

});


window.addEventListener('resize', debounce(() => {
    if (gameState === 'playing' || gameState === 'paused' || gameState === 'gameOver' || gameState === 'won' || gameState === 'levelComplete') {
        const wasPaused = isPaused;
        isPaused = true; 
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }

        const previousGameState = gameState;
        const wasPlayerTransformed = typeof player !== 'undefined' ? player.isTransformed : false;
        const wasPlayerInvisible = typeof isInvisible !== 'undefined' ? isInvisible : false;
        const invisibilityTimeLeft = typeof invisibilityDurationTimer !== 'undefined' ? invisibilityDurationTimer : 0;
        const invisibilityCooldownLeft = typeof invisibilityCooldownTimer !== 'undefined' ? invisibilityCooldownTimer : 0;
        const wasShieldActive = typeof isShieldActive !== 'undefined' ? isShieldActive : false;
        const shieldTimeLeft = typeof shieldDurationTimer !== 'undefined' ? shieldDurationTimer : 0;
        const shieldCooldownLeft = typeof shieldCooldownTimer !== 'undefined' ? shieldCooldownTimer : 0;
        const wasFinisherActive = typeof isUsingFinisher !== 'undefined' ? isUsingFinisher : false;
        const finisherTimeLeft = typeof finisherTimer !== 'undefined' ? finisherTimer : 0;


        const playerXPercent = (worldWidthScaled > 0 && typeof player !== 'undefined' && player.x >= 0) ? player.x / worldWidthScaled : 0.1;
        const playerYOffsetFromCanvasBottom = (canvas && canvas.height > 0 && typeof player !== 'undefined' && player.y >= 0) ? canvas.height - (player.y + player.height) : 10;

        const enemyXPercent = (worldWidthScaled > 0 && typeof enemy !== 'undefined' && enemy.x >= 0) ? enemy.x / worldWidthScaled : 0.8;
        const enemyYValue = typeof enemy !== 'undefined' ? (enemy.isFlying ? enemy.baseHoverY : enemy.y) : 0;
        const enemyYPercent = (canvas && canvas.height > 0 && enemyYValue >= 0) ? enemyYValue / canvas.height : 0.4;
        const enemyWasFlying = typeof enemy !== 'undefined' ? enemy.isFlying : false;
        const enemyHealthCurrent = typeof enemy !== 'undefined' ? enemy.health : 0;
        const enemyWasShielded = typeof enemy !== 'undefined' ? enemy.isShielded : false;
        const enemyShieldTimeLeft = typeof enemy !== 'undefined' ? enemy.shieldTimer : 0;
        const enemyShieldCooldownLeft = typeof enemy !== 'undefined' ? enemy.shieldCooldownTimer : 0;


        let flyingEnemiesData = [];
        if (typeof flyingEnemies !== 'undefined' && worldWidthScaled > 0) {
            flyingEnemiesData = flyingEnemies.filter(fe => fe.isActive).map(fe => ({ xPercent: fe.x / worldWidthScaled, yPercent: (canvas && canvas.height > 0) ? fe.y / canvas.height : 0.1, isFacingRight: fe.isFacingRight, shootCooldownTimer: fe.shootCooldownTimer, health: fe.health }));
        }
        let chaserEnemiesData = [];
        if (typeof chaserEnemies !== 'undefined' && worldWidthScaled > 0 && canvas && canvas.height > 0) {
             chaserEnemiesData = chaserEnemies.filter(ce => ce.isActive).map(ce => ({
                xPercent: ce.x / worldWidthScaled, yPercent: ce.y / canvas.height,
                isFacingRight: ce.isFacingRight, health: ce.health, isActive: ce.isActive
             }));
        }
        
        let swordEnemiesData = [];
        if (typeof swordEnemies !== 'undefined' && swordEnemies.length > 0 && worldWidthScaled > 0 && canvas && canvas.height > 0) {
            swordEnemiesData = swordEnemies.filter(se => se.isActive).map(se => ({
                xPercent: se.x / worldWidthScaled, yPercent: se.y / canvas.height,
                isFacingRight: se.isFacingRight, health: se.health, state: se.state,
                attackCooldownTimer: se.attackCooldownTimer, patrolTargetXPercent: se.patrolTargetX / worldWidthScaled,
                originalXPercent: se.originalX / worldWidthScaled
            }));
        }
        
        let gunnerEnemiesData = [];
        if (typeof gunnerEnemies !== 'undefined' && gunnerEnemies.length > 0 && worldWidthScaled > 0 && canvas && canvas.height > 0) {
            gunnerEnemiesData = gunnerEnemies.filter(ge => ge.isActive).map(ge => ({
                xPercent: ge.x / worldWidthScaled, yPercent: ge.y / canvas.height,
                isFacingRight: ge.isFacingRight, health: ge.health, state: ge.state,
                shootCooldownTimer: ge.shootCooldownTimer, patrolTargetXPercent: ge.patrolTargetX / worldWidthScaled,
                originalXPercent: ge.originalX / worldWidthScaled
            }));
        }
        
        let lionEnemiesData = [];
        if (typeof lionEnemies !== 'undefined' && worldWidthScaled > 0 && canvas && canvas.height > 0) {
             lionEnemiesData = lionEnemies.filter(le => le.isActive).map(le => ({
                xPercent: le.x / worldWidthScaled, yPercent: le.y / canvas.height,
                isFacingRight: le.isFacingRight, health: le.health, state: le.state, stateTimer: le.stateTimer
             }));
        }
        
        let clownEnemiesData = [];
        if (typeof clownEnemies !== 'undefined' && worldWidthScaled > 0 && canvas && canvas.height > 0) {
             clownEnemiesData = clownEnemies.filter(ce => ce.isActive).map(ce => ({
                xPercent: ce.x / worldWidthScaled, yPercent: ce.y / canvas.height,
                isFacingRight: ce.isFacingRight, health: ce.health, state: ce.state,
                shootCooldownTimer: ce.shootCooldownTimer, patrolTargetXPercent: ce.patrolTargetX / worldWidthScaled,
                originalXPercent: ce.originalX / worldWidthScaled
             }));
        }
        
        let pieClownEnemiesData = [];
        if (typeof pieClownEnemies !== 'undefined' && worldWidthScaled > 0 && canvas && canvas.height > 0) {
             pieClownEnemiesData = pieClownEnemies.filter(pce => pce.isActive).map(pce => ({
                xPercent: pce.x / worldWidthScaled, yPercent: pce.y / canvas.height,
                isFacingRight: pce.isFacingRight, health: pce.health, state: pce.state,
                shootCooldownTimer: pce.shootCooldownTimer, patrolTargetXPercent: pce.patrolTargetX / worldWidthScaled,
                originalXPercent: pce.originalX / worldWidthScaled
             }));
        }

        if (typeof showingTransformationEffect !== 'undefined') showingTransformationEffect = false;
        if (finisherBeamSound && typeof finisherBeamSound.pause === 'function') { finisherBeamSound.pause(); finisherBeamSound.loop = false;}
        if (transformSound && typeof transformSound.pause === 'function' && !transformSound.paused) { transformSound.pause(); transformSound.currentTime = 0; }

        const gameTitleElementResize = document.getElementById('gameTitle');
        if (gameTitleElementResize) gameTitleElementResize.style.display = 'none';

        const tempGameStateForResize = gameState;
        gameState = 'loading';

        setupGameDimensionsAndObjects();

        gameState = tempGameStateForResize;

        if (typeof player !== 'undefined') {
            player.isTransformed = wasPlayerTransformed;
            if (player.isTransformed) {
                if (selectedTransformation === 'default') {
                    player.width = basePlayer.transformedWidth * scaleX;
                    player.height = basePlayer.transformedHeight * scaleY;
                    player.currentImage = (images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT -1]?.loaded) ?
                                        images.playerTransformFrames[TRANSFORM_ANIMATION_FRAMES_COUNT -1].img : images.playerTransformed.img;
                } else if (selectedTransformation === 'staron') {
                     player.width = basePlayer.staronWidth * scaleX;
                     player.height = basePlayer.staronHeight * scaleY;
                     player.currentImage = images.playerStaronIdle.img;
                }
            } else {
                player.width = basePlayer.width * scaleX;
                player.height = basePlayer.height * scaleY;
                player.currentImage = images.playerNormal.img;
            }
            player.x = playerXPercent * worldWidthScaled;
            player.y = canvas.height - playerYOffsetFromCanvasBottom - player.height;
            if(typeof applyCollisions === 'function') applyCollisions(player);
        }
        if (typeof isInvisible !== 'undefined') isInvisible = wasPlayerInvisible;
        if (typeof invisibilityDurationTimer !== 'undefined') invisibilityDurationTimer = invisibilityTimeLeft;
        if (typeof invisibilityCooldownTimer !== 'undefined') invisibilityCooldownTimer = invisibilityCooldownLeft;
        if (typeof isShieldActive !== 'undefined') isShieldActive = wasShieldActive;
        if (typeof shieldDurationTimer !== 'undefined') shieldDurationTimer = shieldTimeLeft;
        if (typeof shieldCooldownTimer !== 'undefined') shieldCooldownTimer = shieldCooldownLeft;
        if (typeof isUsingFinisher !== 'undefined') isUsingFinisher = wasFinisherActive;
        if (typeof finisherTimer !== 'undefined') finisherTimer = finisherTimeLeft;


        if (typeof enemy !== 'undefined') {
            enemy.x = enemyXPercent * worldWidthScaled;
            enemy.isFlying = enemyWasFlying;
            enemy.health = enemyHealthCurrent;
            enemy.isShielded = enemyWasShielded;
            enemy.shieldTimer = enemyShieldTimeLeft;
            enemy.shieldCooldownTimer = enemyShieldCooldownLeft;
            if (enemy.isFlying) {
                enemy.baseHoverY = enemyYPercent * canvas.height;
                enemy.y = enemy.baseHoverY;
            } else {
                enemy.y = enemyYPercent * canvas.height;
            }
            if(typeof applyCollisions === 'function') applyCollisions(enemy);
        }
        if (typeof flyingEnemies !== 'undefined' && typeof initFlyingEnemies === 'function') {
            flyingEnemies.length = 0;
            const feLevelConfig = (typeof levelsData !== 'undefined' && levelsData[currentLevel-1]) ? levelsData[currentLevel-1] : null;
            flyingEnemiesData.forEach(fed => {
                flyingEnemies.push({
                    x: fed.xPercent * worldWidthScaled, y: fed.yPercent * canvas.height,
                    width: flyingEnemyBaseWidth * scaleX, height: flyingEnemyBaseHeight * scaleY,
                    speed: flyingEnemyBaseSpeed * scaleX, isFacingRight: fed.isFacingRight,
                    shootCooldownTimer: fed.shootCooldownTimer, isShooting: false, shootFrameTimer: 0,
                    currentImage: images.flyingEnemyImage.img, isActive: true, health: fed.health,
                    initialHealth: feLevelConfig?.flyingEnemyInitialHealth || 1
                });
            });
        }
        if (typeof chaserEnemies !== 'undefined' && typeof initChaserEnemy === 'function' && canvas) {
            chaserEnemies = [];
            const chaserLevelConfig = (typeof levelsData !== 'undefined' && levelsData[currentLevel-1]) ? levelsData[currentLevel-1] : null;
            chaserEnemiesData.forEach(ced => {
                if (!ced.isActive) return;
                const newChaser = {
                    ...chaserEnemy,
                    x: ced.xPercent * worldWidthScaled, y: ced.yPercent * canvas.height,
                    width: baseChaserEnemy.width * scaleX, height: baseChaserEnemy.height * scaleY,
                    speed: baseChaserEnemy.speed * scaleX, health: ced.health,
                    initialHealth: chaserLevelConfig?.chaserInitialHealth || baseChaserEnemy.initialHealth,
                    isActive: true, isFacingRight: ced.isFacingRight, image: images.chaserEnemyIdleImage.img,
                    runCycle: images.chaserEnemyRunFrames ? images.chaserEnemyRunFrames.map(fd => fd.img) : [],
                };
                if(typeof applyCollisions === 'function') applyCollisions(newChaser);
                chaserEnemies.push(newChaser);
            });
        }
        
        if (typeof swordEnemies !== 'undefined' && typeof initSwordEnemies === 'function' && canvas) {
            swordEnemies = [];
            const swordLevelConfig = (typeof levelsData !== 'undefined' && levelsData[currentLevel-1]) ? levelsData[currentLevel-1] : null;
            let walkCycleResize = (images.swordEnemyWalkFrames && images.swordEnemyWalkFrames.every(f => f.loaded)) ? images.swordEnemyWalkFrames.map(f => f.img) : [];
            let attackCycleResize = (images.swordEnemyAttackFrames && images.swordEnemyAttackFrames.every(f => f.loaded)) ? images.swordEnemyAttackFrames.map(f => f.img) : [];

            swordEnemiesData.forEach(sed => {
                const newSE = {
                    x: sed.xPercent * worldWidthScaled, y: sed.yPercent * canvas.height,
                    originalX: sed.originalXPercent * worldWidthScaled,
                    originalY: sed.yPercent * canvas.height,
                    width: baseSwordEnemy.width * scaleX, height: baseSwordEnemy.height * scaleY,
                    speed: baseSwordEnemy.speed * scaleX,
                    initialHealth: swordLevelConfig?.swordEnemyInitialHealth || baseSwordEnemy.initialHealth,
                    health: sed.health, isActive: true, isFacingRight: sed.isFacingRight,
                    velocityX: 0, velocityY: 0, onGround: false,
                    currentImage: walkCycleResize.length > 0 ? walkCycleResize[0] : null,
                    walkFrames: walkCycleResize, attackFrames: attackCycleResize,
                    currentWalkFrame: 0, walkAnimationTimer: 0,
                    currentAttackFrame: 0, attackAnimationTimer: 0,
                    state: sed.state || 'patrolling', attackRangeScaled: baseSwordEnemy.attackRange * scaleX,
                    attackDamage: baseSwordEnemy.attackDamage,
                    attackWindUpTimer: 0, attackActiveTimer: 0, attackCooldownTimer: sed.attackCooldownTimer || 0,
                    patrolTargetX: sed.patrolTargetXPercent * worldWidthScaled,
                    patrolDistanceScaled: baseSwordEnemy.patrolDistance * scaleX,
                };
                if(typeof applyCollisions === 'function') applyCollisions(newSE);
                swordEnemies.push(newSE);
            });
        }
        
        if (typeof gunnerEnemies !== 'undefined' && typeof initGunnerEnemies === 'function' && canvas) {
            gunnerEnemies = [];
             const gunnerLevelConfig = levelsData[currentLevel-1];
             let walkFramesResize = (images.gunnerEnemyWalkFrames || []).map(f => f.img).filter(img => img.complete);
             let shootFramesResize = (images.gunnerEnemyShootFrames || []).map(f => f.img).filter(img => img.complete);
            gunnerEnemiesData.forEach(ged => {
                const newGE = {
                    x: ged.xPercent * worldWidthScaled, y: ged.yPercent * canvas.height,
                    originalX: ged.originalXPercent * worldWidthScaled,
                    width: baseGunnerEnemy.width * scaleX, height: baseGunnerEnemy.height * scaleY,
                    speed: baseGunnerEnemy.speed * scaleX,
                    initialHealth: gunnerLevelConfig?.gunnerEnemyInitialHealth || baseGunnerEnemy.initialHealth,
                    health: ged.health, isActive: true, isFacingRight: ged.isFacingRight,
                    velocityX: 0, velocityY: 0, onGround: false,
                    currentImage: walkFramesResize[0] || null,
                    walkFrames: walkFramesResize, shootFrames: shootFramesResize,
                    currentWalkFrame: 0, walkAnimationTimer: 0,
                    currentShootFrame: 0, shootAnimationTimer: 0,
                    state: ged.state || 'patrolling',
                    shootRangeScaled: baseGunnerEnemy.shootRange * scaleX,
                    aimTimer: 0, shootCooldownTimer: ged.shootCooldownTimer || 0,
                    patrolTargetX: ged.patrolTargetXPercent * worldWidthScaled,
                    patrolDistanceScaled: baseGunnerEnemy.patrolDistance * scaleX
                };
                if(typeof applyCollisions === 'function') applyCollisions(newGE);
                gunnerEnemies.push(newGE);
            });
        }

        if (typeof lionEnemies !== 'undefined' && typeof initLionEnemies === 'function' && canvas) {
            lionEnemies = [];
            const lionLevelConfig = (typeof levelsData !== 'undefined' && levelsData[currentLevel-1]) ? levelsData[currentLevel-1] : null;
            let shoutFramesResize = (images.lionShoutFrames || []).map(f => f.img).filter(img => img.complete);
            let runFramesResize = (images.lionRunFrames || []).map(f => f.img).filter(img => img.complete);

            lionEnemiesData.forEach(led => {
                const newLE = {
                    x: led.xPercent * worldWidthScaled, y: led.yPercent * canvas.height,
                    width: baseLionEnemy.width * scaleX, height: baseLionEnemy.height * scaleY,
                    speed: baseLionEnemy.speed * scaleX,
                    initialHealth: lionLevelConfig?.lionInitialHealth || baseLionEnemy.initialHealth,
                    health: led.health, isActive: true, isFacingRight: led.isFacingRight,
                    velocityX: 0, velocityY: 0, onGround: false,
                    currentImage: shoutFramesResize[0] || null,
                    shoutFrames: shoutFramesResize, runFrames: runFramesResize,
                    currentFrame: 0, animationTimer: 0,
                    state: led.state || 'idle', stateTimer: led.stateTimer || 0
                };
                if(typeof applyCollisions === 'function') applyCollisions(newLE);
                lionEnemies.push(newLE);
            });
        }
        
        if (typeof clownEnemies !== 'undefined' && typeof initClownEnemies === 'function' && canvas) {
            clownEnemies = [];
            const clownLevelConfig = (typeof levelsData !== 'undefined' && levelsData[currentLevel-1]) ? levelsData[currentLevel-1] : null;
            let walkFramesResize = (images.clownWalkFrames || []).map(f => f.img).filter(img => img.complete);
            let idleFramesResize = (images.clownIdleFrames || []).map(f => f.img).filter(img => img.complete);
            let shootFramesResize = (images.clownShootFrames || []).map(f => f.img).filter(img => img.complete);
            let ballFramesResize = (images.clownBallFrames || []).map(f => f.img).filter(img => img.complete);

            clownEnemiesData.forEach(ced => {
                const newCE = {
                    x: ced.xPercent * worldWidthScaled, y: ced.yPercent * canvas.height,
                    originalX: ced.originalXPercent * worldWidthScaled,
                    width: baseClownEnemy.width * scaleX, height: baseClownEnemy.height * scaleY,
                    speed: baseClownEnemy.speed * scaleX,
                    initialHealth: clownLevelConfig?.clownInitialHealth || baseClownEnemy.initialHealth,
                    health: ced.health, isActive: true, isFacingRight: ced.isFacingRight,
                    velocityX: 0, velocityY: 0, onGround: false,
                    currentImage: walkFramesResize[0] || null,
                    walkFrames: walkFramesResize, idleFrames: idleFramesResize, shootFrames: shootFramesResize, ballFrames: ballFramesResize,
                    currentFrame: 0, animationTimer: 0,
                    state: ced.state || 'patrolling',
                    shootRangeScaled: baseClownEnemy.shootRange * scaleX,
                    aimTimer: 0, shootCooldownTimer: ced.shootCooldownTimer || 0,
                    patrolTargetX: ced.patrolTargetXPercent * worldWidthScaled,
                    patrolDistanceScaled: baseClownEnemy.patrolDistance * scaleX
                };
                if(typeof applyCollisions === 'function') applyCollisions(newCE);
                clownEnemies.push(newCE);
            });
        }
        
        
        if (typeof pieClownEnemies !== 'undefined' && typeof initPieClownEnemies === 'function' && canvas) {
            pieClownEnemies = [];
            const pieClownLevelConfig = (typeof levelsData !== 'undefined' && levelsData[currentLevel-1]) ? levelsData[currentLevel-1] : null;
            let walkFramesResize = (images.pieClownWalkFrames || []).map(f => f.img).filter(img => img.complete);
            let shootFramesResize = (images.pieClownShootFrames || []).map(f => f.img).filter(img => img.complete);

            pieClownEnemiesData.forEach(pced => {
                const newPCE = {
                    x: pced.xPercent * worldWidthScaled, y: pced.yPercent * canvas.height,
                    originalX: pced.originalXPercent * worldWidthScaled,
                    width: basePieClownEnemy.width * scaleX, height: basePieClownEnemy.height * scaleY,
                    speed: basePieClownEnemy.speed * scaleX,
                    initialHealth: pieClownLevelConfig?.pieClownInitialHealth || basePieClownEnemy.initialHealth,
                    health: pced.health, isActive: true, isFacingRight: pced.isFacingRight,
                    velocityX: 0, velocityY: 0, onGround: false,
                    currentImage: walkFramesResize[0] || null,
                    walkFrames: walkFramesResize, shootFrames: shootFramesResize,
                    currentFrame: 0, animationTimer: 0,
                    state: pced.state || 'patrolling',
                    shootRangeScaled: basePieClownEnemy.shootRange * scaleX,
                    aimTimer: 0, shootCooldownTimer: pced.shootCooldownTimer || 0,
                    patrolTargetX: pced.patrolTargetXPercent * worldWidthScaled,
                    patrolDistanceScaled: basePieClownEnemy.patrolDistance * scaleX
                };
                if(typeof applyCollisions === 'function') applyCollisions(newPCE);
                pieClownEnemies.push(newPCE);
            });
        }

        if (typeof rockets !== 'undefined') rockets.length = 0;
        if (typeof explosions !== 'undefined') explosions.length = 0;
        if (typeof gunnerBullets !== 'undefined') gunnerBullets.length = 0;
        if (typeof clownBalls !== 'undefined') clownBalls.length = 0;
        if (typeof pies !== 'undefined') pies.length = 0;

        if (typeof updateCamera === 'function') updateCamera();

        isPaused = wasPaused;

        if ((gameState === 'playing' || gameState === 'levelComplete') && !isPaused && !animationFrameId) {
            lastLoopTime = performance.now();
            accumulatedFrameTime = 0;
            animationFrameId = requestAnimationFrame(gameLoop);
        }
        if (typeof updateInGameUIState === 'function') updateInGameUIState();

    } else if (gameState === 'startScreen' || gameState === 'levelSelect' || gameState === 'shop') {
        if(canvas) setupGameDimensionsAndObjects();
        if (typeof updateControlButtonsSize === 'function') updateControlButtonsSize();
    }
}, 250));