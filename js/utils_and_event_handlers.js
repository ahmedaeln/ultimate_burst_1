// --- FILE 4: utils_and_event_handlers.js ---

// =============================================
// UTILITY & MISC FUNCTIONS
// =============================================
function showTemporaryGameTitle() {
    if (gameTitleTimeoutId) {
        clearTimeout(gameTitleTimeoutId);
    }
    const gameTitleElement = document.getElementById('gameTitle');
    if (gameTitleElement && typeof levelsData !== 'undefined' && levelsData[currentLevel - 1]) {
        gameTitleElement.textContent = levelsData[currentLevel - 1].gameTitleText || `المستوى ${currentLevel}`;
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