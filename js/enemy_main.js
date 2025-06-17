// js/enemy_main.js
// يحتوي هذا الملف على منطق العدو الرئيسي (Hex) وطلقاته.
console.log("enemy_main.js loaded");

// ----- Main Enemy Definition -----
const baseEnemy = {
    width: 100, height: 130, speed: 2.3, verticalSpeed: 2.0,
    jumpStrengthBase: 15.0,
    walkAnimationSpeed: 100,
    laserSpeedBase: 7.5, laserWidthBase: 35, laserHeightBase: 12,
    shootCooldownBase: 1500, shootRangeBase: 700, lowHealthThreshold: 20,
    hoverAmplitude: 4.5, hoverSpeed: 850, rushSpeedMultiplier: 1.9,
    rushDuration: 2300, rushAttackCooldown: 18000,
    groundCheckDistance: 30, burstShotCount: 0, burstShotDelay: 150, burstShotTimer: 0
};
const enemy = {
    x: 0, y: 0, width: 0, height: 0, speed: 0, verticalSpeed: 0,
    health: 0, initialHealth: 0, isActive: false, isFacingRight: false,
    velocityX: 0, velocityY: 0, jumpStrength: 0, isJumping: false,
    isFlying: false, isRushing: false, rushAttackTimer: 0, currentRushDuration: 0,
    walkAnimationTimer: 0,
    currentWalkFrame: 0,
    animationYOffset: 0, shootCooldown: 0, shootRange: 0,
    isRetreating: false, retreatTimer: 0, aiDecisionTimer: 0,
    aiMovementMode: 'patrol_walk', patrolTargetX: 0, patrolTargetY: 0,
    canSeePlayer: false, hoverTimer: 0, baseHoverY:0, stuckJumpTimer: 0,
    onGround: false, lastPlayerX: 0, lastPlayerY: 0,
    isShielded: false, shieldTimer: 0, shieldCooldownTimer: 0
};
const enemyLasers = [];

// ----- Main Enemy Logic Functions -----

function resetEnemyState() {
    const levelConfig = levelsData[currentLevel - 1];
    if (!levelConfig) {
        console.error(`بيانات المستوى ${currentLevel} غير موجودة.`);
        return;
    }
    enemy.initialHealth = levelConfig.enemyInitialHealth;
    enemy.health = enemy.initialHealth;
    enemy.isActive = levelConfig.enemyInitialHealth > 0;
    enemy.isFlying = false;

    if (enemy.isActive) {
        const enemySpawnPlatform = platforms.find(p => p.isEnemySpawnPlatform);
        if (enemySpawnPlatform) {
            enemy.x = enemySpawnPlatform.x + enemySpawnPlatform.width / 2 - enemy.width / 2;
            enemy.y = enemySpawnPlatform.y - enemy.height - (1 * scaleY);
        } else if (platforms.length > 0) {
            const fallbackEnemyPlatform = platforms.find(p => !p.isGround && !p.isPortalPlatform) || platforms[Math.floor(platforms.length * 0.75)] || platforms[0];
            if (fallbackEnemyPlatform) {
                enemy.x = fallbackEnemyPlatform.x + fallbackEnemyPlatform.width / 2 - enemy.width / 2;
                enemy.y = fallbackEnemyPlatform.y - enemy.height - (1 * scaleY);
            } else if (canvas) { enemy.x = canvas.width * 0.7; enemy.y = canvas.height * 0.5; }
        } else if (canvas) {
            enemy.x = canvas.width * 0.7; enemy.y = canvas.height * 0.5;
        }
        enemy.baseHoverY = enemy.y;
        enemy.hoverTimer = Math.random() * baseEnemy.hoverSpeed;
        enemy.isFacingRight = (player.x > enemy.x);
        enemy.velocityX = 0; enemy.velocityY = 0; enemy.isJumping = false;
        enemy.walkAnimationTimer = 0;
        enemy.currentWalkFrame = 0;
        enemy.animationYOffset = 0;
        enemy.shootCooldown = baseEnemy.shootCooldownBase * (0.9 + Math.random() * 0.2);
        enemy.isRetreating = false; enemy.retreatTimer = 0;
        enemy.stuckJumpTimer = 0; enemy.aiDecisionTimer = 1000 + Math.random() * 1500;
        enemy.aiMovementMode = 'patrol_walk';
        enemy.patrolTargetX = enemy.x + (Math.random() < 0.5 ? -150 : 150) * scaleX;
        enemy.canSeePlayer = false; enemy.onGround = true;
        enemy.isRushing = false; enemy.rushAttackTimer = baseEnemy.rushAttackCooldown * (0.5 + Math.random() * 0.5);
        enemy.currentRushDuration = 0; enemy.burstShotCount = 0; enemy.burstShotTimer = 0;
        enemy.lastPlayerX = player.x; enemy.lastPlayerY = player.y;
        enemy.isShielded = false; enemy.shieldTimer = 0; enemy.shieldCooldownTimer = 0;
    }
}

function updateEnemy(deltaTime) {
    if (gameState !== 'playing' || !enemy.isActive || showingTransformationEffect || isUsingFinisher) {
        if (enemy.isActive && enemy.isFlying && (!showingTransformationEffect && !isUsingFinisher)) {
            enemy.hoverTimer += deltaTime;
            enemy.animationYOffset = Math.sin(enemy.hoverTimer / baseEnemy.hoverSpeed * Math.PI * 2) * baseEnemy.hoverAmplitude * scaleY;
        } else if (enemy.isActive && !enemy.isFlying) {
            applyCollisions(enemy);
        }
        return;
    }
    const playerIsEffectivelyInvisibleToEnemy = isInvisible || isShieldActive || (player.isTransformed && selectedTransformation === 'staron');

    if (enemy.isShielded) {
        enemy.shieldTimer -= deltaTime;
        if (enemy.shieldTimer <= 0) {
            enemy.isShielded = false;
            enemy.shieldCooldownTimer = ENEMY_SHIELD_COOLDOWN;
        }
    } else if (enemy.shieldCooldownTimer > 0) {
        enemy.shieldCooldownTimer -= deltaTime;
        if (enemy.shieldCooldownTimer < 0) enemy.shieldCooldownTimer = 0;
    } else {
        if (enemy.health / enemy.initialHealth < ENEMY_SHIELD_HEALTH_THRESHOLD) {
            activateEnemyShield();
        }
    }

    const playerCenterX = player.x + player.width / 2;
    const enemyCenterX = enemy.x + enemy.width / 2;
    const distanceToPlayerX = playerCenterX - enemyCenterX;
    const distanceToPlayerY = (player.y + player.height / 2) - (enemy.y + enemy.height / 2);

    enemy.canSeePlayer = !playerIsEffectivelyInvisibleToEnemy && Math.abs(distanceToPlayerX) < enemy.shootRange && Math.abs(distanceToPlayerY) < enemy.shootRange * 0.8;

    if (!playerIsEffectivelyInvisibleToEnemy && Math.abs(distanceToPlayerX) > player.width * 0.1) {
        enemy.isFacingRight = distanceToPlayerX > 0;
    }

    if (enemy.burstShotCount > 0 && enemy.burstShotTimer <= 0 && !playerIsEffectivelyInvisibleToEnemy && !enemy.isShielded) {
        enemyShootLaser(0.2);
        enemy.burstShotCount--;
        enemy.burstShotTimer = baseEnemy.burstShotDelay;
    } else if (enemy.burstShotTimer > 0) {
        enemy.burstShotTimer -= deltaTime;
    }

    enemy.shootCooldown -= deltaTime;
    if (enemy.shootCooldown <= 0 && enemy.canSeePlayer && !enemy.isRetreating && !enemy.isRushing && enemy.burstShotCount === 0 && !playerIsEffectivelyInvisibleToEnemy && !enemy.isShielded) {
        if (enemy.isFacingRight === (distanceToPlayerX > 0)) {
            const enemyCurrentY = enemy.isFlying ? (enemy.baseHoverY + enemy.animationYOffset) : enemy.y;
            if (Math.abs((player.y + player.height / 2) - (enemyCurrentY + enemy.height / 2)) < enemy.height * 2.5) {
                const shootProbability = (player.velocityX === 0) ? 0.85 : 0.7;
                if (Math.random() < shootProbability) {
                    if (Math.random() < 0.4) {
                        enemy.burstShotCount = Math.floor(Math.random() * 2) + 2;
                        enemy.burstShotTimer = 0;
                    } else {
                        enemyShootLaser(0.3);
                    }
                    enemy.shootCooldown = baseEnemy.shootCooldownBase + (Math.random() * 400 - 200);
                } else {
                    enemy.shootCooldown = 300 + Math.random() * 200;
                }
            }
        }
    }

    const previousEnemyX = enemy.x;
    if (!enemy.isRushing && !playerIsEffectivelyInvisibleToEnemy) {
        enemy.rushAttackTimer -= deltaTime;
        if (enemy.rushAttackTimer <= 0 && enemy.canSeePlayer && enemy.health > baseEnemy.lowHealthThreshold * 1.5 && !enemy.isShielded) {
            enemy.isRushing = true;
            enemy.currentRushDuration = baseEnemy.rushDuration;
            enemy.rushAttackTimer = baseEnemy.rushAttackCooldown * (0.8 + Math.random() * 0.4);
            enemy.aiMovementMode = 'rush_attack';
            enemy.shootCooldown = baseEnemy.rushDuration + 500;
        }
    } else if ((playerIsEffectivelyInvisibleToEnemy || enemy.isShielded) && enemy.isRushing) {
        enemy.isRushing = false;
        enemy.aiMovementMode = enemy.isFlying ? 'hover_track' : 'patrol_walk';
        enemy.aiDecisionTimer = 0;
    }

    if (enemy.isRushing) {
        enemy.currentRushDuration -= deltaTime;
        if (enemy.currentRushDuration <= 0) {
            enemy.isRushing = false;
            enemy.aiMovementMode = enemy.isFlying ? 'hover_track' : 'patrol_walk';
            enemy.aiDecisionTimer = 0;
        }
    }

    if (!enemy.isRushing) {
        enemy.aiDecisionTimer -= deltaTime;
        if (enemy.aiDecisionTimer <= 0) {
            enemy.aiDecisionTimer = 1500 + Math.random() * 2500;
            const playerIsHigh = player.y < enemy.y - enemy.height * 1.5;

            if (playerIsEffectivelyInvisibleToEnemy || enemy.isShielded) {
                enemy.aiMovementMode = 'patrol_walk';
                enemy.patrolTargetX = enemy.x + (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 180) * scaleX;
                enemy.patrolTargetX = Math.max(0, Math.min(enemy.patrolTargetX, worldWidthScaled - enemy.width));
                if (enemy.isFlying && Math.random() < 0.1) enemy.isFlying = false;
            } else {
                if (enemy.isFlying) {
                    if (Math.random() < 0.25 && !playerIsHigh) {
                        enemy.isFlying = false;
                        enemy.velocityY = 0;
                        let targetPlatform = platforms.find(p => p.x < player.x + player.width && p.x + p.width > player.x && p.y > enemy.y);
                        if (!targetPlatform) targetPlatform = platforms.find(p => p.isGround && p.x <= enemy.x && p.x + p.width >= enemy.x);
                        if (targetPlatform) enemy.patrolTargetY = targetPlatform.y - enemy.height; else if (canvas) enemy.patrolTargetY = canvas.height - enemy.height;
                        enemy.aiMovementMode = 'patrol_walk';
                    } else {
                        enemy.aiMovementMode = 'hover_track';
                    }
                } else {
                    if (playerIsHigh && Math.random() < 0.7) {
                        enemy.isFlying = true;
                        enemy.baseHoverY = enemy.y;
                        enemy.hoverTimer = 0;
                        enemy.velocityY = 0;
                        enemy.aiMovementMode = 'hover_track';
                    } else if (enemy.canSeePlayer) {
                        enemy.aiMovementMode = (Math.random() < 0.6) ? 'approach_walk' : 'maintain_distance_walk';
                    } else {
                        enemy.aiMovementMode = 'patrol_walk';
                        if (enemy.lastPlayerX && Math.abs(enemy.x - enemy.lastPlayerX) > 50 * scaleX) {
                            enemy.patrolTargetX = enemy.lastPlayerX + (Math.random() - 0.5) * 200 * scaleX;
                        } else { 
                            enemy.patrolTargetX = enemy.x + (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * 180) * scaleX;
                        }
                        enemy.patrolTargetX = Math.max(0, Math.min(enemy.patrolTargetX, worldWidthScaled - enemy.width));
                    }
                }
            }
        }
    }

    let currentSpeed = enemy.isRushing ? enemy.speed * baseEnemy.rushSpeedMultiplier : enemy.speed;
    let currentVerticalSpeed = enemy.isRushing ? enemy.verticalSpeed * baseEnemy.rushSpeedMultiplier : enemy.verticalSpeed;
    enemy.velocityX = 0;

    if (enemy.isFlying) {
        enemy.hoverTimer += deltaTime;
        enemy.animationYOffset = Math.sin(enemy.hoverTimer / baseEnemy.hoverSpeed * Math.PI * 2) * baseEnemy.hoverAmplitude * scaleY;
        let desiredVelocityYFly = 0;

        if (enemy.aiMovementMode === 'rush_attack' && !playerIsEffectivelyInvisibleToEnemy && !enemy.isShielded) {
            enemy.velocityX = distanceToPlayerX > 0 ? currentSpeed : -currentSpeed;
            desiredVelocityYFly = distanceToPlayerY > 0 ? currentVerticalSpeed : -currentVerticalSpeed;
        } else if (enemy.aiMovementMode === 'hover_track' && !playerIsEffectivelyInvisibleToEnemy && !enemy.isShielded) {
            const targetDistX = 180 * scaleX;
            if (Math.abs(distanceToPlayerX) > targetDistX + 40 * scaleX) {
                enemy.velocityX = distanceToPlayerX > 0 ? currentSpeed : -currentSpeed;
            } else if (Math.abs(distanceToPlayerX) < targetDistX - 40 * scaleX) {
                enemy.velocityX = distanceToPlayerX > 0 ? -currentSpeed * 0.7 : currentSpeed * 0.7;
            }

            const targetDistY = 30 * scaleY;
            if (Math.abs(distanceToPlayerY) > targetDistY + 25 * scaleY) {
                desiredVelocityYFly = distanceToPlayerY > 0 ? currentVerticalSpeed : -currentVerticalSpeed;
            }
        } else if ((playerIsEffectivelyInvisibleToEnemy || enemy.isShielded) && enemy.aiMovementMode !== 'patrol_walk') {
            enemy.aiMovementMode = 'patrol_walk';
            enemy.patrolTargetX = enemy.x + (Math.random() < 0.5 ? -1 : 1) * (100 + Math.random() * 100) * scaleX;
        }

        if (enemy.aiMovementMode === 'patrol_walk') {
            if (Math.abs(enemy.x - enemy.patrolTargetX) > currentSpeed * 0.5) {
                enemy.velocityX = (enemy.patrolTargetX > enemy.x) ? currentSpeed * 0.4 : -currentSpeed * 0.4;
            } else {
                enemy.aiDecisionTimer = 0;
            }
            if (Math.random() < 0.02) desiredVelocityYFly = (Math.random() < 0.5 ? currentVerticalSpeed * 0.3 : -currentVerticalSpeed * 0.3);
        }

        enemy.baseHoverY += desiredVelocityYFly * (deltaTime / FIXED_TIMESTEP);
        enemy.y = enemy.baseHoverY;
        if (canvas) enemy.baseHoverY = Math.max(10 * scaleY, Math.min(enemy.baseHoverY, canvas.height - enemy.height - (10 * scaleY)));
    } else {
        if (!enemy.isRushing) {
            if (enemy.health <= baseEnemy.lowHealthThreshold && !enemy.isRetreating && enemy.retreatTimer <= 0 && enemy.canSeePlayer && !playerIsEffectivelyInvisibleToEnemy && !enemy.isShielded) {
                enemy.isRetreating = true;
                enemy.retreatTimer = 1800 + Math.random() * 1200;
                enemy.aiMovementMode = 'retreat_walk';
            }
            if (enemy.isRetreating && enemy.retreatTimer > 0) {
                enemy.retreatTimer -= deltaTime;
                if (enemy.retreatTimer <= 0 || playerIsEffectivelyInvisibleToEnemy || enemy.isShielded) {
                    enemy.isRetreating = false;
                    enemy.aiMovementMode = 'patrol_walk';
                    enemy.aiDecisionTimer = 0;
                }
            }
        }

        if (enemy.aiMovementMode === 'rush_attack' && !playerIsEffectivelyInvisibleToEnemy && !enemy.isShielded) {
            enemy.velocityX = distanceToPlayerX > 0 ? currentSpeed : -currentSpeed;
            if (enemy.onGround && player.y < enemy.y - enemy.height * 0.3 && enemy.stuckJumpTimer <= 0) {
                enemy.velocityY = -enemy.jumpStrength * 1.1;
                enemy.isJumping = true;
                enemy.onGround = false;
                enemy.stuckJumpTimer = 800;
            }
        } else if (enemy.aiMovementMode === 'approach_walk' && !playerIsEffectivelyInvisibleToEnemy && !enemy.isShielded) {
            if (Math.abs(distanceToPlayerX) > player.width * 0.7) {
                enemy.velocityX = distanceToPlayerX > 0 ? currentSpeed * 0.9 : -currentSpeed * 0.9;
            }
        } else if (enemy.aiMovementMode === 'maintain_distance_walk' && !playerIsEffectivelyInvisibleToEnemy && !enemy.isShielded) {
            const idealDistance = 200 * scaleX;
            if (Math.abs(distanceToPlayerX) > idealDistance + 30 * scaleX) {
                enemy.velocityX = distanceToPlayerX > 0 ? currentSpeed * 0.7 : -currentSpeed * 0.7;
            } else if (Math.abs(distanceToPlayerX) < idealDistance - 30 * scaleX) {
                enemy.velocityX = distanceToPlayerX > 0 ? -currentSpeed * 0.7 : currentSpeed * 0.7;
            }
        } else if (enemy.aiMovementMode === 'retreat_walk' && !playerIsEffectivelyInvisibleToEnemy && !enemy.isShielded) {
            enemy.velocityX = distanceToPlayerX < 0 ? currentSpeed * 1.1 : -currentSpeed * 1.1;
        } else if (enemy.aiMovementMode === 'patrol_walk' || playerIsEffectivelyInvisibleToEnemy || enemy.isShielded) {
            if (Math.abs(enemy.x - enemy.patrolTargetX) > currentSpeed * 0.5) {
                enemy.velocityX = (enemy.patrolTargetX > enemy.x) ? currentSpeed * 0.6 : -currentSpeed * 0.6;
            } else {
                enemy.aiDecisionTimer = 0;
            }
        }

        if (enemy.onGround && !enemy.isRushing && enemy.velocityX !== 0) {
            let checkX = enemy.x + (enemy.isFacingRight ? enemy.width + baseEnemy.groundCheckDistance * scaleX : -baseEnemy.groundCheckDistance * scaleX);
            let checkY = enemy.y + enemy.height;
            if (!isGroundAt(checkX - (enemy.isFacingRight ? 0 : enemy.width), checkY, enemy.width)) {
                enemy.velocityX = 0;
                enemy.isFacingRight = !enemy.isFacingRight;
                enemy.patrolTargetX = enemy.x + (enemy.isFacingRight ? 1 : -1) * 100 * scaleX;
                enemy.patrolTargetX = Math.max(0, Math.min(enemy.patrolTargetX, worldWidthScaled - enemy.width));
                enemy.aiDecisionTimer = 500 + Math.random() * 500;
            }
        }
    }

    applyCollisions(enemy);

    if (enemy.isFlying) {
        enemy.currentWalkFrame = 0;
    } else {
        if (enemy.velocityX !== 0 && enemy.onGround) {
            enemy.walkAnimationTimer += deltaTime;
            if (enemy.walkAnimationTimer >= baseEnemy.walkAnimationSpeed) {
                enemy.walkAnimationTimer = 0;
                if (images.enemyWalkFrames && images.enemyWalkFrames.length > 0) {
                    enemy.currentWalkFrame = (enemy.currentWalkFrame + 1) % images.enemyWalkFrames.length;
                }
            }
        } else {
            enemy.currentWalkFrame = 0;
        }
    }
    
    if (enemy.stuckJumpTimer > 0) enemy.stuckJumpTimer -= deltaTime;
    if (!enemy.isFlying && !enemy.isRushing && enemy.onGround && enemy.canSeePlayer && player.y + player.height < enemy.y - enemy.height * 0.5 && enemy.stuckJumpTimer <= 0 && !playerIsEffectivelyInvisibleToEnemy && !enemy.isShielded) {
        const targetPlatform = platforms.find(p => !p.isGround &&
            player.x + player.width > p.x && player.x < p.x + p.width &&
            p.y < enemy.y && p.y > enemy.y - (enemy.jumpStrength * enemy.jumpStrength) / (2 * (gravity || BASE_GRAVITY)) * 0.9);
        if (targetPlatform || (Math.abs(enemy.x - previousEnemyX) < 0.5 * scaleX && Math.abs(distanceToPlayerX) < enemy.width * 2)) {
            enemy.velocityY = -enemy.jumpStrength * (1.0 + Math.random() * 0.25);
            enemy.isJumping = true;
            enemy.onGround = false;
            enemy.stuckJumpTimer = 1200 + Math.random() * 500;
        }
    }
    if (!playerIsEffectivelyInvisibleToEnemy) {
        enemy.lastPlayerX = player.x;
        enemy.lastPlayerY = player.y;
    }
}

function enemyShootLaser(predictiveFactor = 0) {
    if (!enemy.isActive || enemy.isRushing || showingTransformationEffect || isInvisible || enemy.isShielded || (player.isTransformed && selectedTransformation === 'staron')) return;
    const laserW = baseEnemy.laserWidthBase * scaleX;
    const laserH = baseEnemy.laserHeightBase * scaleY;
    const laserSpeed = baseEnemy.laserSpeedBase * scaleX;
    const laserXOffset = enemy.isFacingRight ? enemy.width * 0.75 : -laserW + enemy.width * 0.25;
    const laserX = enemy.x + laserXOffset;
    let targetY = (player.y + player.height / 2);
    if (predictiveFactor > 0 && FIXED_TIMESTEP > 0) {
        const playerYSpeed = (player.y - enemy.lastPlayerY) / (FIXED_TIMESTEP / 1000);
        targetY += playerYSpeed * predictiveFactor * 0.1;
    }
    const laserOriginY = (enemy.isFlying ? enemy.baseHoverY + enemy.animationYOffset : enemy.y) + enemy.height * 0.4;
    let laserY = laserOriginY - laserH / 2;
    const directionX = enemy.isFacingRight ? 1 : -1;
    enemyLasers.push({
        x: laserX, y: laserY, width: laserW, height: laserH,
        velocityX: laserSpeed * directionX,
        isFacingRight: enemy.isFacingRight,
    });
}

function updateEnemyLasers(deltaTime) {
    const stepFactor = deltaTime / FIXED_TIMESTEP;
    for (let i = enemyLasers.length - 1; i >= 0; i--) {
        const laser = enemyLasers[i];
        laser.x += laser.velocityX * stepFactor;
        if (playerInvulnerableTimer <= 0 && !isInvisible && !(player.isTransformed && selectedTransformation === 'staron')) {
            if (isShieldActive && checkRectCollision(player, laser)) {
                enemyLasers.splice(i, 1);
                if (shieldHitSound && shieldHitSound.HAVE_ENOUGH_DATA) {
                    shieldHitSound.currentTime = 0;
                    shieldHitSound.play().catch(e => console.warn("Shield hit sound error", e));
                }
                continue;
            } else if (!isShieldActive && checkRectCollision(player, laser)) {
                enemyLasers.splice(i, 1);
                playerHitCount++;
                playerInvulnerableTimer = PLAYER_INVULNERABILITY_DURATION;
                player.isHit = true;
                player.hitTimer = 200;
                if (playerHitCount >= MAX_PLAYER_HITS) {
                    if (typeof gameOver === 'function') gameOver("لقد تلقيت الكثير من الضربات!");
                }
                continue;
            }
        }
        const laserScreenX = laser.x - camera.x;
        if (canvas && (laserScreenX + laser.width < 0 || laserScreenX > canvas.width)) {
            enemyLasers.splice(i, 1);
        }
    }
}

function activateEnemyShield() {
    if (!enemy.isActive || enemy.isShielded || enemy.shieldCooldownTimer > 0) return;
    enemy.isShielded = true;
    enemy.shieldTimer = ENEMY_SHIELD_DURATION;
    enemy.isRushing = false;
    if (enemyShieldActivateSound && enemyShieldActivateSound.HAVE_ENOUGH_DATA) {
        enemyShieldActivateSound.currentTime = 0;
        enemyShieldActivateSound.play().catch(e => console.warn("Enemy shield activate sound error", e));
    }
}