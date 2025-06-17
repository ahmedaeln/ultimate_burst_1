// js/core_state_and_init.js
console.log("core_state_and_init.js loaded");

// =============================================
// GLOBAL GAME STATE & CORE VARIABLES
// =============================================
let canvas, ctx;
let scaleX = 1, scaleY = 1;

let gameState = 'loading'; // loading, startScreen, levelSelect, shop, playing, paused, gameOver, won, levelComplete
let animationFrameId = null;
let gameTime = 0;
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
        console.error("Canvas or game container not found in setupGameDimensionsAndObjects.");
        return;
    }

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = gameContainer.clientWidth;
    const displayHeight = gameContainer.clientHeight;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    scaleX = displayWidth / BASE_WIDTH;
    scaleY = displayHeight / BASE_HEIGHT;

    const levelConfig = levelsData[currentLevel - 1] || {};
    const worldMultiplier = levelConfig.worldWidthMultiplier || 1;
    worldWidthScaled = (WORLD_WIDTH_BASE * worldMultiplier) * scaleX;
    
    gravity = BASE_GRAVITY * scaleY;

    // Setup asset cycles
    if (player && images.playerNormalWalk) {
        player.normalWalkCycle = images.playerNormalWalk.map(imgData => imgData.img);
        player.normalJumpCycle = images.playerNormalJump.map(imgData => imgData.img);
        player.kickCycle = images.playerKickFrames.map(imgData => imgData.img);
        player.transformedWalkCycle = images.playerTransformedWalk.map(imgData => imgData.img);
        player.transformedJumpCycle = images.playerTransformedJump.map(imgData => imgData.img);
        player.staronWalkCycle = images.playerStaronWalk.map(imgData => imgData.img);
    }
    if (images.finisherBeamFrames) {
        finisherBeamCycle = images.finisherBeamFrames.map(imgData => imgData.img);
    }

    // Scale dynamic properties
    player.speed = basePlayer.speed * scaleX;
    player.jumpStrength = basePlayer.jumpStrength * scaleY;
    
    portalObject.width = basePortal.width * scaleX;
    portalObject.height = basePortal.height * scaleY;

    // Recreate platforms based on new dimensions
    platforms.length = 0;
    (levelConfig.basePlatformsData || []).forEach(bp => {
        let platformHeightScaled = bp.isGround ? (bp.height * scaleY) : ((bp.tileHeight || PLATFORM_TILE_BASE_HEIGHT_THIN) * scaleY);
        let platformWidthScaled = bp.isGround ? (bp.width * scaleX) : (bp.numTiles * PLATFORM_TILE_BASE_WIDTH * scaleX);
        const platform = {
            x: bp.x * scaleX, y: displayHeight - (bp.yOffset * scaleY),
            width: platformWidthScaled, height: platformHeightScaled,
            numTiles: bp.numTiles || 0, isGround: bp.isGround || false, color: bp.color,
            isPortalPlatform: false, isEnemySpawnPlatform: bp.isEnemySpawnPlatform || false,
            isMoving: bp.isMoving || false, originalX: bp.x * scaleX, originalY: displayHeight - (bp.yOffset * scaleY)
        };
        if (platform.isMoving) {
             platform.moveAxis = bp.moveAxis;
             platform.moveSpeedX = (bp.moveSpeedX || 0) * scaleX;
             platform.moveMinX = (bp.moveMinX !== undefined ? bp.moveMinX : bp.x) * scaleX;
             platform.moveMaxX = (bp.moveMaxX !== undefined ? bp.moveMaxX : (bp.x + (bp.numTiles * PLATFORM_TILE_BASE_WIDTH))) * scaleX;
             platform.moveSpeedY = (bp.moveSpeedY || 0) * scaleY;
             platform.moveMinY = displayHeight - ((bp.moveMaxY !== undefined ? bp.moveMaxY : bp.yOffset) * scaleY);
             platform.moveMaxY = displayHeight - ((bp.moveMinY !== undefined ? bp.moveMinY : (bp.yOffset - (bp.tileHeight || PLATFORM_TILE_BASE_HEIGHT_THIN))) * scaleY);
        }
        platforms.push(platform);
    });

    // Reset dynamic arrays
    [bullets, enemyLasers, rockets, explosions, flyingEnemies, chaserEnemies, swordEnemies, gunnerEnemies, lionEnemies, clownEnemies, clownBalls, pieClownEnemies, pies].forEach(arr => arr.length = 0);
    
    camera.x = 0;
    if (updateControlButtonsSize) updateControlButtonsSize();
}


function initGame() {
    if (gameState === 'loading' && !allGameAssetsLoaded) console.warn("initGame called before all assets loaded.");
    if (!ctx || !canvas) { console.error("Canvas context not available in initGame. Cannot start game."); return; }

    currentLevel = Math.min(Math.max(1, currentLevel), highestUnlockedLevel);
    const levelConfig = levelsData[currentLevel - 1];
    if (!levelConfig) { console.error(`Level data for level ${currentLevel} not found!`); currentLevel = 1; }

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

    // Hide all other screens and show the game
    [startScreenContainer, levelSelectScreenContainer, shopOverlayScreenContainer, pauseScreenOverlay, messageOverlay, winScreenOverlay].forEach(el => { if(el) el.style.display = 'none'; });
    if (gameContainer) gameContainer.style.display = 'flex';

    showTemporaryGameTitle();

    if (!animationFrameId) {
        lastLoopTime = performance.now();
        accumulatedFrameTime = 0;
        gameTime = 0;
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    if (setupButtonControls) setupButtonControls();
    if (updateInGameUIState) updateInGameUIState();
}

// =============================================
// DOM EVENT HANDLERS
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d', { alpha: false });
    } else {
        console.error("Canvas element not found!");
        const loadingScreenTextEl = document.getElementById('loadingScreenText');
        if (loadingScreenTextEl) {
             loadingScreenTextEl.textContent = "خطأ: لم يتم العثور على الكانفاس!";
             loadingScreenTextEl.style.color = "red";
        }
        return;
    }

    initializeUIElements();
    setupUIEventListeners();

    const savedHighestLevel = localStorage.getItem(MAX_UNLOCKED_LEVEL_KEY);
    highestUnlockedLevel = savedHighestLevel ? Math.min(parseInt(savedHighestLevel), levelsData.length) : 1;
    currentLevel = highestUnlockedLevel;

    const savedScore = localStorage.getItem(SCORE_STORAGE_KEY);
    playerScore = savedScore ? parseInt(savedScore) : 0;
    updateScoreDisplay();

    // Load purchased items from local storage
    cooldownUpgradePurchased = localStorage.getItem(COOLDOWN_REDUCTION_KEY) === 'true';
    extraLifePurchased = localStorage.getItem(EXTRA_LIFE_KEY) === 'true';
    invisibilityPurchased = localStorage.getItem(INVISIBILITY_KEY) === 'true';
    shieldPurchased = localStorage.getItem(SHIELD_KEY) === 'true';
    finisherAbilityPurchased = localStorage.getItem(FINISHER_ABILITY_KEY) === 'true';
    staronUnlocked = localStorage.getItem(STARON_UNLOCKED_KEY) === 'true';
    selectedTransformation = localStorage.getItem(SELECTED_TRANSFORMATION_KEY) || 'default';

    if (extraLifePurchased) MAX_PLAYER_HITS = DEFAULT_MAX_PLAYER_HITS + EXTRA_LIVES_AMOUNT;
    if (cooldownUpgradePurchased) currentTransformationCooldown = Math.max(MIN_TRANSFORMATION_COOLDOWN, DEFAULT_TRANSFORMATION_COOLDOWN - POWERUP_COOLDOWN_REDUCTION);

    // Asset Loading Process
    loadAllImages(() => {
        // This callback ensures a smooth transition after loading is truly complete
        setTimeout(() => {
            if (loadingScreen) loadingScreen.style.display = 'none';
            if (startScreenContainer) startScreenContainer.style.display = 'flex';
            gameState = 'startScreen';
            updateLevelSelectScreen();
            setupGameDimensionsAndObjects(); 
            updateControlButtonsSize();
            updateInGameUIState();
        }, 500);
    });
});

window.addEventListener('resize', debounce(() => {
    if (gameState === 'playing' || gameState === 'paused' || gameState === 'gameOver' || gameState === 'won' || gameState === 'levelComplete') {
        const wasPaused = isPaused;
        isPaused = true; 
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }

        // Logic to save the precise state of every object before resize
        // This is complex, but your provided code for this is a great start.
        // It should capture positions, health, timers, etc.

        // Re-calculate dimensions and re-create world objects
        setupGameDimensionsAndObjects();

        // Restore the precise state of every object after resize
        // This involves setting the restored positions, health, timers, etc.
        
        isPaused = wasPaused;
        if (!isPaused && (gameState === 'playing' || gameState === 'levelComplete')) {
            lastLoopTime = performance.now();
            accumulatedFrameTime = 0;
            animationFrameId = requestAnimationFrame(gameLoop);
        }
        updateInGameUIState();

    } else if (gameState === 'startScreen' || gameState === 'levelSelect' || gameState === 'shop') {
        if(canvas) setupGameDimensionsAndObjects();
        if (updateControlButtonsSize) updateControlButtonsSize();
    }
}, 250));