﻿// js/enemies_ground.js (MODIFIED FOR SOUNDS)
// يحتوي هذا الملف على منطق جميع الأعداء الأرضية الإضافية (Minions).
console.log("enemies_ground.js loaded");


// ----- Chaser Enemy Definition -----
const baseChaserEnemy = {
    width: 80, height: 80, speed: 3.7, initialHealth: 8, health: 8,
    contactDamageDuration: 7000, transformedDamageAmount: 3, runAnimationSpeed: 50
};
const chaserEnemy = {
    x: 0, y: 0, width: 0, height: 0, speed: 0, health: 0, initialHealth: 0,
    isActive: false, isFacingRight: true, velocityX: 0, velocityY: 0,
    onGround: false, playerContactTimer: 0, image: null,
    currentRunFrame: 0, runAnimationTimer: 0, runCycle: [],
    isConfused: false, confusedTimer: 0, confusedDirection: 1
};
let chaserEnemies = [];

// ----- Sword Enemy Definition -----
const baseSwordEnemy = {
    width: 85, height: 105, speed: 1.9, initialHealth: 12,
    attackRange: 130, attackDamage: 2, attackWindUpTime: 450,
    attackActiveTime: 300, attackCooldownTime: 2600,
    walkAnimationSpeed: 130, attackAnimationSpeed: 100, patrolDistance: 120
};
let swordEnemies = [];

// ----- Gunner Enemy Definition -----
const baseGunnerEnemy = {
    width: 95, height: 115, speed: 1.2, initialHealth: 18,
    shootRange: 900, shootCooldownTime: 3300, aimTime: 500,
    walkAnimationSpeed: 120, shootAnimationSpeed: 180, patrolDistance: 150
};
const baseGunnerBullet = { width: 25, height: 25, speed: 8.2 };
let gunnerEnemies = [];
let gunnerBullets = [];

// ----- Lion Enemy Definition -----
const baseLionEnemy = {
    width: 120, height: 90, speed: 4.2, initialHealth: 22,
    chargeRange: 800, chargeCooldownTime: 5000,
    shoutAnimationSpeed: 150, runAnimationSpeed: 80,
    shoutDuration: 150 * 5, // 5 frames * 150ms
    chargeDuration: 4000
};
let lionEnemies = [];

// Clown Enemy Definition
const baseClownEnemy = {
    width: 90, height: 120, speed: 1.6, initialHealth: 25,
    shootRange: 850, shootCooldownTime: 4500, aimTime: 1000,
    walkAnimationSpeed: 110, idleAnimationSpeed: 130, shootAnimationSpeed: 80,
    patrolDistance: 250,
    fireFrame: 5 // The frame in the shoot animation when the ball is fired
};
const baseClownBall = {
    width: 35, height: 35,
    horizontalSpeed: 7.5,
    initialVerticalSpeed: -13.0,
    animationSpeed: 150
};
let clownEnemies = [];
let clownBalls = [];

// Pie Clown Enemy Definition
const basePieClownEnemy = {
    width: 90, height: 120, speed: 1.4, initialHealth: 22,
    shootRange: 800, shootCooldownTime: 4000, aimTime: 800,
    walkAnimationSpeed: 120, shootAnimationSpeed: 100,
    patrolDistance: 200,
    fireFrame: 3 // The frame in the shoot animation when the pie is fired
};
const basePie = {
    width: 40, height: 30,
    horizontalSpeed: 8.0 // No vertical speed for straight flight
};
let pieClownEnemies = [];
let pies = [];


// ----- Chaser Enemy Functions -----
function initChaserEnemy() {
    chaserEnemies = [];
    const levelConfig = levelsData[currentLevel - 1];
    if (!levelConfig || !levelConfig.hasNewChaserEnemy || !levelConfig.numChaserEnemies) return;

    const numToSpawn = levelConfig.numChaserEnemies;
    const chaserHealth = levelConfig.chaserInitialHealth || baseChaserEnemy.initialHealth;
    const groundPlatform = platforms.find(p => p.isGround);
    if (!groundPlatform) return;

    for (let i = 0; i < numToSpawn; i++) {
        // Spawn on the ground platform at spaced intervals
        const spawnX = groundPlatform.x + (groundPlatform.width * 0.2) + (i * (groundPlatform.width * 0.6 / Math.max(1, numToSpawn - 1)));
        const spawnY = groundPlatform.y - baseChaserEnemy.height * scaleY - (2 * scaleY);

        let chaserRunCycleImages = (images.chaserEnemyRunFrames || []).map(frameData => frameData.img);
        chaserEnemies.push({
            ...chaserEnemy, x: spawnX, y: spawnY,
            width: baseChaserEnemy.width * scaleX, height: baseChaserEnemy.height * scaleY,
            speed: baseChaserEnemy.speed * scaleX, initialHealth: chaserHealth, health: chaserHealth,
            isActive: true, image: images.chaserEnemyIdleImage.img, runCycle: chaserRunCycleImages
        });
    }
}

function updateChaserEnemy(chaser, deltaTime) {
    if (!chaser.isActive || gameState !== 'playing' || showingTransformationEffect || isUsingFinisher) {
        if (chaser.isActive) {
            applyCollisions(chaser);
            if (chaser.image !== images.chaserEnemyIdleImage.img) chaser.image = images.chaserEnemyIdleImage.img;
        }
        return;
    }

    let isMoving = false;
    const playerIsEffectivelyInvisible = isInvisible || (player.isTransformed && selectedTransformation === 'staron');
    
    if (playerIsEffectivelyInvisible) {
        if (!chaser.isConfused) { // بدء الارتباك
            chaser.isConfused = true;
            chaser.confusedTimer = 1500 + Math.random() * 2000;
            chaser.confusedDirection = (Math.random() < 0.5 ? -1 : 1);
        }
        
        // سلوك الارتباك: التحرك يميناً ويساراً
        chaser.confusedTimer -= deltaTime;
        if (chaser.confusedTimer <= 0) {
            chaser.confusedDirection *= -1; // عكس الاتجاه
            chaser.confusedTimer = 1500 + Math.random() * 2000; // وقت جديد للتحرك في هذا الاتجاه
        }
        chaser.velocityX = chaser.speed * 0.4 * chaser.confusedDirection;
        chaser.isFacingRight = chaser.velocityX > 0;
        isMoving = true;
    } else {
        if (chaser.isConfused) { // إنهاء الارتباك
            chaser.isConfused = false;
        }
        // السلوك الطبيعي: مطاردة اللاعب
        const playerCenterX = player.x + player.width / 2;
        const chaserCenterX = chaser.x + chaser.width / 2;
        const distanceToPlayerX = playerCenterX - chaserCenterX;
        const stopChasingDueToShield = isShieldActive && Math.abs(distanceToPlayerX) < chaser.width * 1.5;

        if (Math.abs(distanceToPlayerX) > chaser.width * 0.1 && !stopChasingDueToShield) {
            chaser.velocityX = distanceToPlayerX > 0 ? chaser.speed : -chaser.speed;
            chaser.isFacingRight = distanceToPlayerX > 0;
            isMoving = true;
        } else {
            chaser.velocityX = 0;
            isMoving = false;
        }
    }

    applyCollisions(chaser);

    if (isMoving && chaser.runCycle.length > 0) {
        chaser.runAnimationTimer += deltaTime;
        if (chaser.runAnimationTimer >= baseChaserEnemy.runAnimationSpeed) {
            chaser.runAnimationTimer = 0;
            chaser.currentRunFrame = (chaser.currentRunFrame + 1) % chaser.runCycle.length;
            if (chaser.runCycle[chaser.currentRunFrame] && chaser.runCycle[chaser.currentRunFrame].complete) {
                chaser.image = chaser.runCycle[chaser.currentRunFrame];
            }
        }
    } else {
        if (images.chaserEnemyIdleImage.loaded) chaser.image = images.chaserEnemyIdleImage.img;
        chaser.currentRunFrame = 0;
        chaser.runAnimationTimer = 0;
    }

    if (checkRectCollision(player, chaser)) {
        if (isShieldActive) {
            chaser.playerContactTimer = 0;
            const pushBackSpeed = chaser.speed * 0.8;
            chaser.velocityX = (player.x + player.width / 2 < chaser.x + chaser.width / 2) ? pushBackSpeed : -pushBackSpeed;
            if (shieldHitSound) shieldHitSound.play();
        } else if (!playerIsEffectivelyInvisible) {
            chaser.playerContactTimer += deltaTime;
            if (chaser.playerContactTimer >= baseChaserEnemy.contactDamageDuration) {
                if (!player.isTransformed) gameOver("تم الإمساك بك من قبل العدو المطارد!");
                chaser.playerContactTimer = 0;
            }
        }
    } else {
        chaser.playerContactTimer = 0;
    }
}


// ----- Sword Enemy Functions -----
function initSwordEnemies() {
    swordEnemies = [];
    const levelConfig = levelsData[currentLevel - 1];
    if (!levelConfig || !levelConfig.hasSwordEnemy || !levelConfig.numSwordEnemies) return;

    const numToSpawn = levelConfig.numSwordEnemies;
    const enemyHealth = levelConfig.swordEnemyInitialHealth || baseSwordEnemy.initialHealth;
    const groundPlatform = platforms.find(p => p.isGround);
    if (!groundPlatform) return;

    for (let i = 0; i < numToSpawn; i++) {
        const spawnX = groundPlatform.x + (groundPlatform.width * 0.3) + (i * (groundPlatform.width * 0.5 / Math.max(1, numToSpawn - 1)));
        const spawnY = groundPlatform.y - baseSwordEnemy.height * scaleY - (1 * scaleY);

        let walkCycle = (images.swordEnemyWalkFrames || []).map(f => f.img).filter(img => img.complete);
        let attackCycle = (images.swordEnemyAttackFrames || []).map(f => f.img).filter(img => img.complete);

        swordEnemies.push({
            x: spawnX, y: spawnY, originalX: spawnX, originalY: spawnY,
            width: baseSwordEnemy.width * scaleX, height: baseSwordEnemy.height * scaleY,
            speed: baseSwordEnemy.speed * scaleX, initialHealth: enemyHealth, health: enemyHealth,
            isActive: true, isFacingRight: false,
            velocityX: 0, velocityY: 0, onGround: false,
            currentImage: walkCycle[0] || null, walkFrames: walkCycle, attackFrames: attackCycle,
            currentWalkFrame: 0, walkAnimationTimer: 0,
            currentAttackFrame: 0, attackAnimationTimer: 0,
            state: 'patrolling', attackRangeScaled: baseSwordEnemy.attackRange * scaleX,
            attackDamage: baseSwordEnemy.attackDamage, attackWindUpTimer: 0,
            attackActiveTimer: 0, attackCooldownTimer: 0,
            patrolTargetX: spawnX, patrolDistanceScaled: baseSwordEnemy.patrolDistance * scaleX
        });
    }
}

function updateSwordEnemy(se, deltaTime) {
    if (!se.isActive || gameState !== 'playing' || showingTransformationEffect || isUsingFinisher) {
        if (se.isActive) applyCollisions(se);
        return;
    }

    const playerCenterX = player.x + player.width / 2;
    const seCenterX = se.x + se.width / 2;
    const distanceToPlayerXAbs = Math.abs(playerCenterX - seCenterX);
    const distanceToPlayerYAbs = Math.abs((player.y + player.height / 2) - (se.y + se.height / 2));
    const playerIsVisuallyInRange = distanceToPlayerXAbs < se.attackRangeScaled && distanceToPlayerYAbs < se.height * 1.2;
    const canEngagePlayer = !isInvisible && !(player.isTransformed && selectedTransformation === 'staron');

    if (se.attackWindUpTimer > 0) se.attackWindUpTimer -= deltaTime;
    if (se.attackActiveTimer > 0) se.attackActiveTimer -= deltaTime;
    if (se.attackCooldownTimer > 0) se.attackCooldownTimer -= deltaTime;

    switch (se.state) {
        case 'patrolling':
            if (Math.abs(se.x - se.patrolTargetX) > se.speed * 0.5) {
                se.velocityX = (se.patrolTargetX > se.x) ? se.speed : -se.speed;
                se.isFacingRight = (se.patrolTargetX > se.x);
            } else {
                se.velocityX = 0;
                const direction = Math.random() < 0.5 ? -1 : 1;
                se.patrolTargetX = se.originalX + direction * (Math.random() * se.patrolDistanceScaled);
            }

            if (playerIsVisuallyInRange && canEngagePlayer && se.attackCooldownTimer <= 0) {
                se.state = 'preparing_attack';
                se.velocityX = 0;
                se.isFacingRight = (playerCenterX > seCenterX);
                se.attackWindUpTimer = baseSwordEnemy.attackWindUpTime;
                se.currentAttackFrame = 0;
                se.attackAnimationTimer = 0;
            }
            break;

        case 'preparing_attack':
            se.velocityX = 0;
            if (se.attackWindUpTimer <= 0) {
                se.state = 'attacking';
                se.attackActiveTimer = baseSwordEnemy.attackActiveTime;
                // ### NEW: Play sword cut sound ###
                if (swordCutSound && typeof swordCutSound.play === 'function') {
                    swordCutSound.currentTime = 0;
                    swordCutSound.play().catch(e => console.warn("Failed to play sword sound", e));
                }
            }
            break;

        case 'attacking':
            se.velocityX = 0;
            if (se.attackActiveTimer > 0) {
                const swordHitboxW = se.width * 0.7;
                const swordHitboxH = se.height * 0.8;
                const swordOffsetX = se.isFacingRight ? se.width * 0.4 : -swordHitboxW + se.width * 0.6;
                const swordHitbox = {
                    x: se.x + swordOffsetX,
                    y: se.y + se.height * 0.1,
                    width: swordHitboxW,
                    height: swordHitboxH
                };

                if (canEngagePlayer && checkRectCollision(player, swordHitbox) && playerInvulnerableTimer <= 0) {
                    if (isShieldActive) {
                        if (shieldHitSound) shieldHitSound.play();
                        se.velocityX = (player.x < se.x ? 1 : -1) * se.speed * 0.5;
                        se.state = 'cooldown';
                        se.attackCooldownTimer = baseSwordEnemy.attackCooldownTime / 2;
                    } else {
                        playerHitCount += se.attackDamage;
                        playerInvulnerableTimer = PLAYER_INVULNERABILITY_DURATION;
                        player.isHit = true;
                        player.hitTimer = 200;
                        if (playerHitCount >= MAX_PLAYER_HITS) gameOver("لقد قُطعت بسيف العدو!");
                    }
                    se.attackActiveTimer = 0;
                }
            }
            if (se.attackActiveTimer <= 0 && se.currentAttackFrame >= se.attackFrames.length - 1) {
                se.state = 'cooldown';
                se.attackCooldownTimer = baseSwordEnemy.attackCooldownTime;
            }
            break;

        case 'cooldown':
            se.velocityX = 0;
            if (se.attackCooldownTimer <= 0) {
                se.state = 'patrolling';
            }
            break;
    }

    if (se.state === 'attacking' || se.state === 'preparing_attack') {
        if (se.attackFrames.length > 0) {
            se.attackAnimationTimer += deltaTime;
            if (se.attackAnimationTimer >= baseSwordEnemy.attackAnimationSpeed) {
                se.attackAnimationTimer = 0;
                se.currentAttackFrame = Math.min(se.currentAttackFrame + 1, se.attackFrames.length - 1);
            }
            se.currentImage = se.attackFrames[se.currentAttackFrame];
        }
    } else {
        if (se.walkFrames.length > 0) {
            if (se.velocityX !== 0) {
                se.walkAnimationTimer += deltaTime;
                if (se.walkAnimationTimer >= baseSwordEnemy.walkAnimationSpeed) {
                    se.walkAnimationTimer = 0;
                    se.currentWalkFrame = (se.currentWalkFrame + 1) % se.walkFrames.length;
                }
            } else {
                se.currentWalkFrame = 0;
            }
            se.currentImage = se.walkFrames[se.currentWalkFrame];
        }
        se.currentAttackFrame = 0;
    }

    if (se.onGround && se.state === 'patrolling' && se.velocityX !== 0) {
        let checkEdgeX = se.x + (se.isFacingRight ? se.width + 5 * scaleX : -5 * scaleX);
        let checkEdgeY = se.y + se.height + 1;
        if (!isGroundAt(checkEdgeX, checkEdgeY, 1)) {
            se.velocityX *= -1;
            se.patrolTargetX = se.x + (se.velocityX > 0 ? 50 : -50);
        }
    }

    applyCollisions(se);
    se.x = Math.max(0, Math.min(se.x, worldWidthScaled - se.width));
}


// ----- Gunner Enemy Functions -----
function initGunnerEnemies() {
    gunnerEnemies = [];
    gunnerBullets = [];
    const levelConfig = levelsData[currentLevel - 1];
    if (!levelConfig || !levelConfig.hasGunnerEnemy || !levelConfig.numGunnerEnemies) return;

    const numToSpawn = levelConfig.numGunnerEnemies;
    const enemyHealth = levelConfig.gunnerEnemyInitialHealth || baseGunnerEnemy.initialHealth;
    const groundPlatform = platforms.find(p => p.isGround);
    if (!groundPlatform) return;

    for (let i = 0; i < numToSpawn; i++) {
        const spawnX = groundPlatform.x + (groundPlatform.width * 0.4) + (i * (groundPlatform.width * 0.4 / Math.max(1, numToSpawn - 1)));
        const spawnY = groundPlatform.y - baseGunnerEnemy.height * scaleY - (1 * scaleY);

        let walkFrames = (images.gunnerEnemyWalkFrames || []).map(f => f.img).filter(img => img.complete);
        let shootFrames = (images.gunnerEnemyShootFrames || []).map(f => f.img).filter(img => img.complete);

        gunnerEnemies.push({
            x: spawnX, y: spawnY, originalX: spawnX,
            width: baseGunnerEnemy.width * scaleX, height: baseGunnerEnemy.height * scaleY,
            speed: baseGunnerEnemy.speed * scaleX, initialHealth: enemyHealth, health: enemyHealth,
            isActive: true, isFacingRight: Math.random() < 0.5,
            velocityX: 0, velocityY: 0, onGround: false,
            currentImage: walkFrames[0] || null, walkFrames, shootFrames,
            currentWalkFrame: 0, walkAnimationTimer: 0,
            currentShootFrame: 0, shootAnimationTimer: 0,
            state: 'patrolling', shootRangeScaled: baseGunnerEnemy.shootRange * scaleX,
            aimTimer: 0, shootCooldownTimer: baseGunnerEnemy.shootCooldownTime * (0.8 + Math.random() * 0.4),
            patrolTargetX: spawnX, patrolDistanceScaled: baseGunnerEnemy.patrolDistance * scaleX
        });
    }
}

function updateGunnerEnemy(ge, deltaTime) {
    if (!ge.isActive || gameState !== 'playing' || showingTransformationEffect || isUsingFinisher) {
        if (ge.isActive) applyCollisions(ge);
        return;
    }

    const playerCenterX = player.x + player.width / 2;
    const geCenterX = ge.x + ge.width / 2;
    const distanceToPlayerXAbs = Math.abs(playerCenterX - geCenterX);
    const distanceToPlayerYAbs = Math.abs((player.y + player.height / 2) - (ge.y + ge.height / 2));
    const playerIsInSight = distanceToPlayerXAbs < ge.shootRangeScaled && distanceToPlayerYAbs < ge.height * 3;
    const canEngagePlayer = !isInvisible && !isShieldActive && !(player.isTransformed && selectedTransformation === 'staron');

    if (ge.aimTimer > 0) ge.aimTimer -= deltaTime;
    if (ge.shootCooldownTimer > 0) ge.shootCooldownTimer -= deltaTime;
    
    switch(ge.state) {
        case 'patrolling':
            if (Math.abs(ge.x - ge.patrolTargetX) > ge.speed * 0.5) {
                ge.velocityX = (ge.patrolTargetX > ge.x) ? ge.speed : -ge.speed;
                ge.isFacingRight = ge.velocityX > 0;
            } else {
                ge.velocityX = 0;
                const direction = Math.random() < 0.5 ? -1 : 1;
                ge.patrolTargetX = ge.originalX + direction * (Math.random() * ge.patrolDistanceScaled);
            }

            if (playerIsInSight && canEngagePlayer && ge.shootCooldownTimer <= 0) {
                ge.state = 'aiming';
                ge.aimTimer = baseGunnerEnemy.aimTime;
                ge.velocityX = 0;
            }
            break;

        case 'aiming':
            ge.velocityX = 0;
            ge.isFacingRight = (playerCenterX > geCenterX);
            if (ge.aimTimer <= 0) {
                ge.state = 'shooting';
                ge.shootAnimationTimer = 0;
                ge.currentShootFrame = 0;
                gunnerFireBullet(ge);
            }
            break;

        case 'shooting':
            ge.velocityX = 0;
            if (ge.currentShootFrame >= ge.shootFrames.length -1 && ge.shootAnimationTimer >= baseGunnerEnemy.shootAnimationSpeed) {
                ge.state = 'cooldown';
                ge.shootCooldownTimer = baseGunnerEnemy.shootCooldownTime;
            }
            break;
            
        case 'cooldown':
            ge.velocityX = 0;
            if (ge.shootCooldownTimer <= 0) {
                ge.state = 'patrolling';
            }
            break;
    }
    
    if (ge.state === 'shooting' || ge.state === 'aiming') {
        if (ge.shootFrames.length > 0) {
            ge.shootAnimationTimer += deltaTime;
            if (ge.shootAnimationTimer >= baseGunnerEnemy.shootAnimationSpeed) {
                ge.shootAnimationTimer = 0;
                ge.currentShootFrame = Math.min(ge.currentShootFrame + 1, ge.shootFrames.length - 1);
            }
            if(ge.shootFrames[ge.currentShootFrame]) ge.currentImage = ge.shootFrames[ge.currentShootFrame];
        }
    } else { 
        ge.shootAnimationTimer = 0;
        ge.currentShootFrame = 0;
        if (ge.walkFrames.length > 0) {
            if (ge.velocityX !== 0) {
                ge.walkAnimationTimer += deltaTime;
                if (ge.walkAnimationTimer >= baseGunnerEnemy.walkAnimationSpeed) {
                    ge.walkAnimationTimer = 0;
                    ge.currentWalkFrame = (ge.currentWalkFrame + 1) % ge.walkFrames.length;
                }
            } else {
                 ge.currentWalkFrame = 0;
            }
            if(ge.walkFrames[ge.currentWalkFrame]) ge.currentImage = ge.walkFrames[ge.currentWalkFrame];
        }
    }


    if (ge.onGround && ge.state === 'patrolling' && ge.velocityX !== 0) {
         let checkEdgeX = ge.x + (ge.isFacingRight ? ge.width + 5 * scaleX : -5 * scaleX);
         let checkEdgeY = ge.y + ge.height + 1;
         if (!isGroundAt(checkEdgeX, checkEdgeY, 1)) {
            ge.velocityX *= -1;
            ge.patrolTargetX = ge.x + ge.velocityX * 50;
         }
    }
    
    applyCollisions(ge);
}

function gunnerFireBullet(ge) {
    if (!images.gunnerBulletImage.loaded) return;

    const bulletW = baseGunnerBullet.width * scaleX;
    const bulletH = baseGunnerBullet.height * scaleY;
    const bulletSpeed = baseGunnerBullet.speed * scaleX;
    
    const bulletXOffset = ge.isFacingRight ? ge.width * 0.8 : -bulletW + ge.width * 0.2;
    const bulletX = ge.x + bulletXOffset;
    const bulletY = ge.y + ge.height * 0.45 - bulletH / 2;

    gunnerBullets.push({
        x: bulletX, y: bulletY,
        width: bulletW, height: bulletH,
        velocityX: bulletSpeed * (ge.isFacingRight ? 1 : -1),
        image: images.gunnerBulletImage.img,
        isFacingRight: ge.isFacingRight
    });
}

function updateGunnerBullets(deltaTime) {
    const stepFactor = deltaTime / FIXED_TIMESTEP;
    for (let i = gunnerBullets.length - 1; i >= 0; i--) {
        const bullet = gunnerBullets[i];
        bullet.x += bullet.velocityX * stepFactor;

        if (playerInvulnerableTimer <= 0 && !isInvisible && !(player.isTransformed && selectedTransformation === 'staron')) {
             if (isShieldActive && checkRectCollision(player, bullet)) {
                gunnerBullets.splice(i, 1);
                if (shieldHitSound) shieldHitSound.play();
                continue;
            } else if (!isShieldActive && checkRectCollision(player, bullet)) {
                gunnerBullets.splice(i, 1);
                playerHitCount++;
                playerInvulnerableTimer = PLAYER_INVULNERABILITY_DURATION;
                player.isHit = true;
                player.hitTimer = 200;
                if (playerHitCount >= MAX_PLAYER_HITS) {
                    gameOver("لقد أصابتك طلقة العدو!");
                }
                continue;
            }
        }
        
        const bulletScreenX = bullet.x - camera.x;
        if (canvas && (bulletScreenX + bullet.width < 0 || bulletScreenX > canvas.width)) {
            gunnerBullets.splice(i, 1);
        }
    }
}


// ----- Lion Enemy Functions -----
function initLionEnemies() {
    lionEnemies = [];
    const levelConfig = levelsData[currentLevel - 1];
    if (!levelConfig || !levelConfig.hasLionEnemy || !levelConfig.numLionEnemies) return;

    const numToSpawn = levelConfig.numLionEnemies;
    const enemyHealth = levelConfig.lionInitialHealth || baseLionEnemy.initialHealth;
    const groundPlatform = platforms.find(p => p.isGround);
    if (!groundPlatform) return;

    for (let i = 0; i < numToSpawn; i++) {
        const spawnX = groundPlatform.x + (groundPlatform.width * 0.25) + (i * (groundPlatform.width * 0.5 / Math.max(1, numToSpawn)));
        const spawnY = groundPlatform.y - baseLionEnemy.height * scaleY - (2 * scaleY);

        let shoutFrames = (images.lionShoutFrames || []).map(f => f.img).filter(img => img.complete);
        let runFrames = (images.lionRunFrames || []).map(f => f.img).filter(img => img.complete);

        lionEnemies.push({
            x: spawnX, y: spawnY,
            width: baseLionEnemy.width * scaleX, height: baseLionEnemy.height * scaleY,
            speed: baseLionEnemy.speed * scaleX,
            initialHealth: enemyHealth, health: enemyHealth,
            isActive: true, isFacingRight: false,
            velocityX: 0, velocityY: 0, onGround: false,
            currentImage: shoutFrames[0] || null,
            shoutFrames, runFrames,
            currentFrame: 0, animationTimer: 0,
            state: 'idle', // states: idle, shouting, charging, cooldown
            stateTimer: 0, // used for cooldown or charge duration
            chargeTargetX: 0
        });
    }
}

function updateLionEnemy(lion, deltaTime) {
    if (!lion.isActive || gameState !== 'playing' || showingTransformationEffect || isUsingFinisher) {
        if (lion.isActive) applyCollisions(lion);
        return;
    }
    
    const playerCenterX = player.x + player.width / 2;
    const lionCenterX = lion.x + lion.width / 2;
    const distanceToPlayerXAbs = Math.abs(playerCenterX - lionCenterX);
    const distanceToPlayerYAbs = Math.abs((player.y + player.height / 2) - (lion.y + lion.height / 2));
    const canEngagePlayer = !isInvisible && !isShieldActive && !(player.isTransformed && selectedTransformation === 'staron');
    
    if(lion.stateTimer > 0) lion.stateTimer -= deltaTime;
    
    switch (lion.state) {
        case 'idle':
            lion.velocityX = 0;
            if (lion.stateTimer <= 0 && distanceToPlayerXAbs < baseLionEnemy.chargeRange * scaleX && distanceToPlayerYAbs < lion.height * 2 && canEngagePlayer) {
                lion.state = 'shouting';
                // ### NEW: Play lion roar sound ###
                if (lionRoarSound && typeof lionRoarSound.play === 'function') {
                    lionRoarSound.currentTime = 0;
                    lionRoarSound.play().catch(e => console.warn("Failed to play lion roar sound", e));
                }
                lion.stateTimer = baseLionEnemy.shoutDuration;
                lion.animationTimer = 0;
                lion.currentFrame = 0;
                lion.isFacingRight = (playerCenterX > lionCenterX);
            }
            break;
            
        case 'shouting':
            lion.velocityX = 0;
            lion.animationTimer += deltaTime;
            if(lion.animationTimer >= baseLionEnemy.shoutAnimationSpeed) {
                lion.animationTimer = 0;
                lion.currentFrame = Math.min(lion.currentFrame + 1, lion.shoutFrames.length - 1);
            }
            lion.currentImage = lion.shoutFrames[lion.currentFrame];

            if (lion.stateTimer <= 0) {
                lion.state = 'charging';
                lion.stateTimer = baseLionEnemy.chargeDuration;
                lion.animationTimer = 0;
                lion.currentFrame = 0;
            }
            break;
            
        case 'charging':
            lion.velocityX = (lion.isFacingRight ? 1 : -1) * lion.speed;
            
            lion.animationTimer += deltaTime;
            if(lion.animationTimer >= baseLionEnemy.runAnimationSpeed) {
                lion.animationTimer = 0;
                lion.currentFrame = (lion.currentFrame + 1) % lion.runFrames.length;
            }
            lion.currentImage = lion.runFrames[lion.currentFrame];

            if (lion.stateTimer <= 0 || (lion.isFacingRight && lion.x + lion.width >= worldWidthScaled) || (!lion.isFacingRight && lion.x <= 0)) {
                lion.state = 'cooldown';
                lion.stateTimer = baseLionEnemy.chargeCooldownTime;
                lion.velocityX = 0;
            }
            break;

        case 'cooldown':
            lion.velocityX = 0;
            lion.currentImage = lion.shoutFrames[0];
            if (lion.stateTimer <= 0) {
                lion.state = 'idle';
            }
            break;
    }

    applyCollisions(lion);

    if (lion.state === 'charging' && checkRectCollision(player, lion)) {
        if (isShieldActive || (player.isTransformed && selectedTransformation === 'staron')) {
            if (shieldHitSound && isShieldActive) shieldHitSound.play();
            lion.state = 'cooldown';
            lion.stateTimer = baseLionEnemy.chargeCooldownTime;
            lion.velocityX = (player.x < lion.x ? 1 : -1) * lion.speed * 0.5;
        } else if (playerInvulnerableTimer <= 0) {
            if (player.isTransformed) {
                playerHitCount += 2;
                playerInvulnerableTimer = PLAYER_INVULNERABILITY_DURATION * 1.2;
                player.isHit = true;
                player.hitTimer = 200;
                if (playerHitCount >= MAX_PLAYER_HITS) gameOver("سحقك الأسد!");
            } else {
                gameOver("سحقك الأسد!");
            }
        }
    }
}


// ----- Clown Enemy Functions -----
function initClownEnemies() {
    clownEnemies = [];
    clownBalls = [];
    const levelConfig = levelsData[currentLevel - 1];
    if (!levelConfig || !levelConfig.hasClownEnemy || !levelConfig.numClownEnemies) return;

    const numToSpawn = levelConfig.numClownEnemies;
    const enemyHealth = levelConfig.clownInitialHealth || baseClownEnemy.initialHealth;
    const groundPlatform = platforms.find(p => p.isGround);
    if (!groundPlatform) return;

    const walkFrames = (images.clownWalkFrames || []).map(f => f.img).filter(img => img.complete);
    const idleFrames = (images.clownIdleFrames || []).map(f => f.img).filter(img => img.complete);
    const shootFrames = (images.clownShootFrames || []).map(f => f.img).filter(img => img.complete);
    const ballFrames = (images.clownBallFrames || []).map(f => f.img).filter(img => img.complete);

    for (let i = 0; i < numToSpawn; i++) {
        const spawnX = groundPlatform.x + (groundPlatform.width * 0.35) + (i * (groundPlatform.width * 0.4 / Math.max(1, numToSpawn - 1)));
        const spawnY = groundPlatform.y - baseClownEnemy.height * scaleY - (1 * scaleY);

        clownEnemies.push({
            x: spawnX, y: spawnY, originalX: spawnX,
            width: baseClownEnemy.width * scaleX, height: baseClownEnemy.height * scaleY,
            speed: baseClownEnemy.speed * scaleX, initialHealth: enemyHealth, health: enemyHealth,
            isActive: true, isFacingRight: Math.random() < 0.5,
            velocityX: 0, velocityY: 0, onGround: false,
            currentImage: walkFrames[0] || null, walkFrames, idleFrames, shootFrames, ballFrames,
            currentFrame: 0, animationTimer: 0,
            state: 'patrolling', shootRangeScaled: baseClownEnemy.shootRange * scaleX,
            aimTimer: 0, shootCooldownTimer: baseClownEnemy.shootCooldownTime * (0.8 + Math.random() * 0.4),
            patrolTargetX: spawnX, patrolDistanceScaled: baseClownEnemy.patrolDistance * scaleX
        });
    }
}

function updateClownEnemy(clown, deltaTime) {
    if (!clown.isActive || gameState !== 'playing' || showingTransformationEffect || isUsingFinisher) {
        if (clown.isActive) applyCollisions(clown);
        return;
    }

    const playerCenterX = player.x + player.width / 2;
    const clownCenterX = clown.x + clown.width / 2;
    const distanceToPlayerXAbs = Math.abs(playerCenterX - clownCenterX);
    const distanceToPlayerYAbs = Math.abs((player.y + player.height / 2) - (clown.y + clown.height / 2));
    const playerIsInSight = distanceToPlayerXAbs < clown.shootRangeScaled && distanceToPlayerYAbs < clown.height * 4;
    const canEngagePlayer = !isInvisible && !isShieldActive && !(player.isTransformed && selectedTransformation === 'staron');

    if (clown.aimTimer > 0) clown.aimTimer -= deltaTime;
    if (clown.shootCooldownTimer > 0) clown.shootCooldownTimer -= deltaTime;

    switch(clown.state) {
        case 'patrolling':
            if (Math.abs(clown.x - clown.patrolTargetX) > clown.speed * 0.5) {
                clown.velocityX = (clown.patrolTargetX > clown.x) ? clown.speed : -clown.speed;
                clown.isFacingRight = clown.velocityX > 0;
            } else {
                clown.velocityX = 0;
                const direction = Math.random() < 0.5 ? -1 : 1;
                clown.patrolTargetX = clown.originalX + direction * (Math.random() * clown.patrolDistanceScaled);
            }

            if (playerIsInSight && canEngagePlayer && clown.shootCooldownTimer <= 0) {
                clown.state = 'aiming';
                clown.aimTimer = baseClownEnemy.aimTime;
                clown.velocityX = 0;
                clown.animationTimer = 0;
                clown.currentFrame = 0;
            }
            break;

        case 'aiming':
            clown.velocityX = 0;
            clown.isFacingRight = (playerCenterX > clownCenterX);
            if (clown.aimTimer <= 0) {
                clown.state = 'shooting';
                clown.animationTimer = 0;
                clown.currentFrame = 0;
            }
            break;

        case 'shooting':
            clown.velocityX = 0;
            // Fire the ball at the specified frame
            if (clown.currentFrame === baseClownEnemy.fireFrame && !clown.hasFiredThisShot) {
                clownFireBall(clown);
                clown.hasFiredThisShot = true;
            }

            if (clown.currentFrame >= clown.shootFrames.length - 1 && clown.animationTimer >= baseClownEnemy.shootAnimationSpeed) {
                clown.state = 'cooldown';
                clown.shootCooldownTimer = baseClownEnemy.shootCooldownTime;
                clown.hasFiredThisShot = false; // Reset for next shot
            }
            break;
            
        case 'cooldown':
            clown.velocityX = 0;
            if (clown.shootCooldownTimer <= 0) {
                clown.state = 'patrolling';
                clown.animationTimer = 0;
                clown.currentFrame = 0;
            }
            break;
    }

    // Animation logic
    let currentAnimSpeed = 0;
    let currentFrames = [];

    if (clown.state === 'patrolling') {
        currentAnimSpeed = baseClownEnemy.walkAnimationSpeed;
        currentFrames = clown.walkFrames;
        if (clown.velocityX === 0) clown.currentFrame = 0; // Reset to first frame if stopped
    } else if (clown.state === 'aiming') {
        currentAnimSpeed = baseClownEnemy.idleAnimationSpeed;
        currentFrames = clown.idleFrames;
    } else if (clown.state === 'shooting') {
        currentAnimSpeed = baseClownEnemy.shootAnimationSpeed;
        currentFrames = clown.shootFrames;
    } else { // Cooldown
        currentFrames = clown.idleFrames;
        clown.currentFrame = 0; // Show first idle frame during cooldown
    }

    if (currentFrames.length > 0) {
        if (clown.state === 'patrolling' && clown.velocityX === 0) {
             clown.currentImage = currentFrames[0];
        } else {
            clown.animationTimer += deltaTime;
            if (clown.animationTimer >= currentAnimSpeed) {
                clown.animationTimer = 0;
                clown.currentFrame = (clown.currentFrame + 1) % currentFrames.length;
            }
        }
        if (clown.currentFrame < currentFrames.length && currentFrames[clown.currentFrame]) {
            clown.currentImage = currentFrames[clown.currentFrame];
        }
    }
    
    // Prevent falling off edges while patrolling
    if (clown.onGround && clown.state === 'patrolling' && clown.velocityX !== 0) {
         let checkEdgeX = clown.x + (clown.isFacingRight ? clown.width + 5 * scaleX : -5 * scaleX);
         let checkEdgeY = clown.y + clown.height + 1;
         if (!isGroundAt(checkEdgeX, checkEdgeY, 1)) {
            clown.velocityX *= -1;
            clown.isFacingRight = !clown.isFacingRight;
            clown.patrolTargetX = clown.x + clown.velocityX * 50;
         }
    }
    
    applyCollisions(clown);
}

function clownFireBall(clown) {
    if (clown.ballFrames.length === 0) return;

    const ballW = baseClownBall.width * scaleX;
    const ballH = baseClownBall.height * scaleY;
    
    const ballXOffset = clown.isFacingRight ? clown.width * 0.7 : -ballW + clown.width * 0.3;
    const ballX = clown.x + ballXOffset;
    const ballY = clown.y + clown.height * 0.4 - ballH / 2;

    clownBalls.push({
        x: ballX, y: ballY,
        width: ballW, height: ballH,
        velocityX: baseClownBall.horizontalSpeed * scaleX * (clown.isFacingRight ? 1 : -1),
        velocityY: baseClownBall.initialVerticalSpeed * scaleY,
        images: clown.ballFrames,
        currentFrame: 0,
        animationTimer: 0,
        isFacingRight: clown.isFacingRight
    });
}

function updateClownBalls(deltaTime) {
    const stepFactor = deltaTime / FIXED_TIMESTEP;
    for (let i = clownBalls.length - 1; i >= 0; i--) {
        const ball = clownBalls[i];

        // Apply gravity
        ball.velocityY += gravity;
        ball.x += ball.velocityX * stepFactor;
        ball.y += ball.velocityY * stepFactor;
        
        // Animate the ball
        ball.animationTimer += deltaTime;
        if (ball.animationTimer >= baseClownBall.animationSpeed) {
            ball.animationTimer = 0;
            ball.currentFrame = (ball.currentFrame + 1) % ball.images.length;
        }

        // Check for player collision
        if (playerInvulnerableTimer <= 0 && !isInvisible && !(player.isTransformed && selectedTransformation === 'staron')) {
            if (isShieldActive && checkRectCollision(player, ball)) {
                clownBalls.splice(i, 1);
                if (shieldHitSound) shieldHitSound.play();
                continue;
            } else if (!isShieldActive && checkRectCollision(player, ball)) {
                clownBalls.splice(i, 1);
                playerHitCount++;
                playerInvulnerableTimer = PLAYER_INVULNERABILITY_DURATION;
                player.isHit = true;
                player.hitTimer = 200;
                if (playerHitCount >= MAX_PLAYER_HITS) gameOver("أصابتك كرة المهرج!");
                continue;
            }
        }
        
        // Check for platform collision
        let hitPlatform = false;
        for (const platform of platforms) {
            if (checkRectCollision(ball, platform)) {
                hitPlatform = true;
                break;
            }
        }
        if (hitPlatform) {
            clownBalls.splice(i, 1);
            continue;
        }

        // Remove if off-screen
        const ballScreenY = ball.y - camera.y;
        if (canvas && ballScreenY > canvas.height) {
            clownBalls.splice(i, 1);
        }
    }
}


// ----- Pie Clown Enemy Functions -----
function initPieClownEnemies() {
    pieClownEnemies = [];
    pies = [];
    const levelConfig = levelsData[currentLevel - 1];
    if (!levelConfig || !levelConfig.hasPieClownEnemy || !levelConfig.numPieClownEnemies) return;

    const numToSpawn = levelConfig.numPieClownEnemies;
    const enemyHealth = levelConfig.pieClownInitialHealth || basePieClownEnemy.initialHealth;
    const groundPlatform = platforms.find(p => p.isGround);
    if (!groundPlatform) return;

    const walkFrames = (images.pieClownWalkFrames || []).map(f => f.img).filter(img => img.complete);
    const shootFrames = (images.pieClownShootFrames || []).map(f => f.img).filter(img => img.complete);
    
    for (let i = 0; i < numToSpawn; i++) {
        const spawnX = groundPlatform.x + (groundPlatform.width * 0.65) - (i * (groundPlatform.width * 0.4 / Math.max(1, numToSpawn - 1)));
        const spawnY = groundPlatform.y - basePieClownEnemy.height * scaleY - (1 * scaleY);

        pieClownEnemies.push({
            x: spawnX, y: spawnY, originalX: spawnX,
            width: basePieClownEnemy.width * scaleX, height: basePieClownEnemy.height * scaleY,
            speed: basePieClownEnemy.speed * scaleX, initialHealth: enemyHealth, health: enemyHealth,
            isActive: true, isFacingRight: Math.random() < 0.5,
            velocityX: 0, velocityY: 0, onGround: false,
            currentImage: walkFrames[0] || null, walkFrames, shootFrames,
            currentFrame: 0, animationTimer: 0,
            state: 'patrolling', shootRangeScaled: basePieClownEnemy.shootRange * scaleX,
            aimTimer: 0, shootCooldownTimer: basePieClownEnemy.shootCooldownTime * (0.8 + Math.random() * 0.4),
            patrolTargetX: spawnX, patrolDistanceScaled: basePieClownEnemy.patrolDistance * scaleX
        });
    }
}

function updatePieClownEnemy(pieClown, deltaTime) {
    if (!pieClown.isActive || gameState !== 'playing' || showingTransformationEffect || isUsingFinisher) {
        if (pieClown.isActive) applyCollisions(pieClown);
        return;
    }

    const playerCenterX = player.x + player.width / 2;
    const clownCenterX = pieClown.x + pieClown.width / 2;
    const distanceToPlayerXAbs = Math.abs(playerCenterX - clownCenterX);
    const distanceToPlayerYAbs = Math.abs((player.y + player.height / 2) - (pieClown.y + pieClown.height / 2));
    const playerIsInSight = distanceToPlayerXAbs < pieClown.shootRangeScaled && distanceToPlayerYAbs < pieClown.height * 2;
    const canEngagePlayer = !isInvisible && !isShieldActive && !(player.isTransformed && selectedTransformation === 'staron');

    if (pieClown.aimTimer > 0) pieClown.aimTimer -= deltaTime;
    if (pieClown.shootCooldownTimer > 0) pieClown.shootCooldownTimer -= deltaTime;

    switch(pieClown.state) {
        case 'patrolling':
            if (Math.abs(pieClown.x - pieClown.patrolTargetX) > pieClown.speed * 0.5) {
                pieClown.velocityX = (pieClown.patrolTargetX > pieClown.x) ? pieClown.speed : -pieClown.speed;
                pieClown.isFacingRight = pieClown.velocityX > 0;
            } else {
                pieClown.velocityX = 0;
                const direction = Math.random() < 0.5 ? -1 : 1;
                pieClown.patrolTargetX = pieClown.originalX + direction * (Math.random() * pieClown.patrolDistanceScaled);
            }

            if (playerIsInSight && canEngagePlayer && pieClown.shootCooldownTimer <= 0) {
                pieClown.state = 'aiming';
                pieClown.aimTimer = basePieClownEnemy.aimTime;
                pieClown.velocityX = 0;
            }
            break;

        case 'aiming':
            pieClown.velocityX = 0;
            pieClown.isFacingRight = (playerCenterX > clownCenterX);
            if (pieClown.aimTimer <= 0) {
                pieClown.state = 'shooting';
                pieClown.animationTimer = 0;
                pieClown.currentFrame = 0;
            }
            break;

        case 'shooting':
            pieClown.velocityX = 0;
            if (pieClown.currentFrame === basePieClownEnemy.fireFrame && !pieClown.hasFiredThisShot) {
                pieClownFirePie(pieClown);
                pieClown.hasFiredThisShot = true;
            }

            if (pieClown.currentFrame >= pieClown.shootFrames.length - 1 && pieClown.animationTimer >= basePieClownEnemy.shootAnimationSpeed) {
                pieClown.state = 'cooldown';
                pieClown.shootCooldownTimer = basePieClownEnemy.shootCooldownTime;
                pieClown.hasFiredThisShot = false;
            }
            break;
            
        case 'cooldown':
            pieClown.velocityX = 0;
            if (pieClown.shootCooldownTimer <= 0) {
                pieClown.state = 'patrolling';
                pieClown.animationTimer = 0;
                pieClown.currentFrame = 0;
            }
            break;
    }

    // Animation
    let currentAnimSpeed = basePieClownEnemy.walkAnimationSpeed;
    let currentFrames = pieClown.walkFrames;

    if (pieClown.state === 'shooting' || pieClown.state === 'aiming') {
        currentAnimSpeed = basePieClownEnemy.shootAnimationSpeed;
        currentFrames = pieClown.shootFrames;
    } else if (pieClown.velocityX === 0) {
        pieClown.currentFrame = 0;
    }

    if (currentFrames.length > 0) {
        if (pieClown.velocityX !== 0 || pieClown.state === 'shooting') {
            pieClown.animationTimer += deltaTime;
            if (pieClown.animationTimer >= currentAnimSpeed) {
                pieClown.animationTimer = 0;
                pieClown.currentFrame = (pieClown.currentFrame + 1) % currentFrames.length;
            }
        }
        if (pieClown.currentFrame < currentFrames.length && currentFrames[pieClown.currentFrame]) {
            pieClown.currentImage = currentFrames[pieClown.currentFrame];
        }
    }
    
    if (pieClown.onGround && pieClown.state === 'patrolling' && pieClown.velocityX !== 0) {
         let checkEdgeX = pieClown.x + (pieClown.isFacingRight ? pieClown.width + 5 * scaleX : -5 * scaleX);
         let checkEdgeY = pieClown.y + pieClown.height + 1;
         if (!isGroundAt(checkEdgeX, checkEdgeY, 1)) {
            pieClown.velocityX *= -1;
            pieClown.isFacingRight = !pieClown.isFacingRight;
            pieClown.patrolTargetX = pieClown.x + pieClown.velocityX * 50;
         }
    }
    
    applyCollisions(pieClown);
}

function pieClownFirePie(pieClown) {
    if (!images.pieImage.loaded) return;

    const pieW = basePie.width * scaleX;
    const pieH = basePie.height * scaleY;
    
    const pieXOffset = pieClown.isFacingRight ? pieClown.width * 0.7 : -pieW + pieClown.width * 0.3;
    const pieX = pieClown.x + pieXOffset;
    const pieY = pieClown.y + pieClown.height * 0.3 - pieH / 2;

    pies.push({
        x: pieX, y: pieY,
        width: pieW, height: pieH,
        velocityX: basePie.horizontalSpeed * scaleX * (pieClown.isFacingRight ? 1 : -1),
        image: images.pieImage.img
    });
}

function updatePies(deltaTime) {
    const stepFactor = deltaTime / FIXED_TIMESTEP;
    for (let i = pies.length - 1; i >= 0; i--) {
        const pie = pies[i];
        pie.x += pie.velocityX * stepFactor;

        // Player collision
        if (playerInvulnerableTimer <= 0 && !isInvisible && !(player.isTransformed && selectedTransformation === 'staron')) {
            if (isShieldActive && checkRectCollision(player, pie)) {
                pies.splice(i, 1);
                if (shieldHitSound) shieldHitSound.play();
                continue;
            } else if (!isShieldActive && checkRectCollision(player, pie)) {
                pies.splice(i, 1);
                playerHitCount++;
                playerInvulnerableTimer = PLAYER_INVULNERABILITY_DURATION;
                player.isHit = true;
                player.hitTimer = 200;
                if (playerHitCount >= MAX_PLAYER_HITS) gameOver("أصابتك فطيرة!");
                continue;
            }
        }
        
        // Platform collision
        let hitPlatform = false;
        for (const platform of platforms) {
            if (checkRectCollision(pie, platform)) {
                hitPlatform = true;
                break;
            }
        }
        if (hitPlatform) {
            pies.splice(i, 1);
            continue;
        }

        // Off-screen removal
        const pieScreenX = pie.x - camera.x;
        if (canvas && (pieScreenX + pie.width < 0 || pieScreenX > canvas.width)) {
            pies.splice(i, 1);
        }
    }
}
