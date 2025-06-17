// js/game_loop.js
console.log("game_loop.js loaded");

// =============================================
// GAME LOOP
// =============================================
let lastLoopTime = 0;
let accumulatedFrameTime = 0;

function gameLoop(currentTime) {
    // --- Loop Termination Condition ---
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
        console.error("Game loop stopped: Canvas or Context not found.");
        return;
    }

    // --- DeltaTime Calculation ---
    if (!lastLoopTime) lastLoopTime = currentTime;
    let deltaTime = currentTime - lastLoopTime;
    lastLoopTime = currentTime;
    if (deltaTime > 100) deltaTime = 100; // Prevent large jumps on tab-out

    accumulatedFrameTime += deltaTime;
    gameTime += deltaTime;

    const levelConfigForLoop = levelsData[currentLevel - 1];

    // --- Fixed Timestep for Logic/Physics Updates ---
    if (gameState === 'playing') {
        let updatesCount = 0;
        while (accumulatedFrameTime >= FIXED_TIMESTEP && updatesCount < 5) {
            
            // --- Update Game Objects ---
            updatePlayerPosition(FIXED_TIMESTEP);
            updatePortalState();
            updateMovingPlatforms(FIXED_TIMESTEP);
            updateItems(FIXED_TIMESTEP);
            
            // --- Update All Enemies ---
            if (enemy.isActive) updateEnemy(FIXED_TIMESTEP);
            if (levelConfigForLoop?.hasFlyingEnemies) updateFlyingEnemies(FIXED_TIMESTEP);
            if (levelConfigForLoop?.hasNewChaserEnemy) chaserEnemies.forEach(e => e.isActive && updateChaserEnemy(e, FIXED_TIMESTEP));
            if (levelConfigForLoop?.hasSwordEnemy) swordEnemies.forEach(e => e.isActive && updateSwordEnemy(e, FIXED_TIMESTEP));
            if (levelConfigForLoop?.hasGunnerEnemy) gunnerEnemies.forEach(e => e.isActive && updateGunnerEnemy(e, FIXED_TIMESTEP));
            if (levelConfigForLoop?.hasLionEnemy) lionEnemies.forEach(e => e.isActive && updateLionEnemy(e, FIXED_TIMESTEP));
            if (levelConfigForLoop?.hasClownEnemy) clownEnemies.forEach(e => e.isActive && updateClownEnemy(e, FIXED_TIMESTEP));
            if (levelConfigForLoop?.hasPieClownEnemy) pieClownEnemies.forEach(e => e.isActive && updatePieClownEnemy(e, FIXED_TIMESTEP));
            
            // --- Update All Projectiles ---
            updateBullets(FIXED_TIMESTEP);
            updateRockets(FIXED_TIMESTEP);
            updateEnemyLasers(FIXED_TIMESTEP);
            updateGunnerBullets(FIXED_TIMESTEP);
            updateClownBalls(FIXED_TIMESTEP);
            updatePies(FIXED_TIMESTEP);
            updateExplosions(FIXED_TIMESTEP);

            // --- Check Collisions ---
            checkAllCollisions();

            // --- Online Sync ---
            if (isOnlineMode) {
                sendPlayerUpdateToServer();
            }
            
            accumulatedFrameTime -= FIXED_TIMESTEP;
            updatesCount++;
        }
    } else if (gameState === 'levelComplete') {
        // --- Handle Win Screen Animation ---
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
                showWinScreenButtons();
            }
        }
    }

    // --- Rendering Stage (Called Once Per Frame) ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    if (gameState === 'playing' || gameState === 'levelComplete') {
        drawPlatforms();
        drawItems();
        drawPortal();

        // Draw all projectiles
        drawProjectiles(bullets);
        drawProjectiles(rockets);
        drawEnemyLasers(); // Specific style
        drawProjectiles(gunnerBullets);
        drawClownBalls();
        drawProjectiles(pies);
        
        drawExplosions();

        // Draw all enemies
        if (enemy.isActive) drawEnemy();
        drawGroundEnemies(flyingEnemies); // Uses generic ground enemy renderer
        drawGroundEnemies(chaserEnemies);
        drawGroundEnemies(swordEnemies);
        drawGroundEnemies(gunnerEnemies);
        drawGroundEnemies(lionEnemies);
        drawClownEnemies(); // Has a specific renderer
        drawGroundEnemies(pieClownEnemies);

        // Draw players
        drawPlayer();
        if (isOnlineMode) {
            drawOpponent();
        }
        
        // Draw UI on top
        if (gameState === 'levelComplete') {
            drawWinScreenStarsAnimation(currentTime);
        }
        drawPlayerUI();
    }
    
    updateInGameUIState();
    
    // --- Request Next Frame ---
    animationFrameId = requestAnimationFrame(gameLoop);
}