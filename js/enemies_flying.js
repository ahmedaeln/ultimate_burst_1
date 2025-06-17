// js/enemies_flying.js
// يحتوي هذا الملف على منطق الأعداء الطائرة ومقذوفاتها.
console.log("enemies_flying.js loaded");

// ----- Flying Enemy Definition -----
let flyingEnemies = [];
let rockets = [];
let explosions = [];

function initFlyingEnemies() {
    flyingEnemies = [];
    rockets = [];
    explosions = [];
    const levelConfig = levelsData[currentLevel - 1];
    if (!levelConfig || !levelConfig.hasFlyingEnemies) return;

    const numToSpawn = levelConfig.numFlyingEnemies || 1;
    const flyingHealth = levelConfig.flyingEnemyInitialHealth || 1;
    const groundPlatform = platforms.find(p => p.isGround);
    if (!groundPlatform) return;

    for (let i = 0; i < numToSpawn; i++) {
        const spawnX = groundPlatform.x + (groundPlatform.width / (numToSpawn + 1)) * (i + 1);
        const spawnY = groundPlatform.y - (200 + Math.random() * 100) * scaleY;

        flyingEnemies.push({
            x: spawnX,
            y: spawnY,
            width: flyingEnemyBaseWidth * scaleX,
            height: flyingEnemyBaseHeight * scaleY,
            speed: (flyingEnemyBaseSpeed + (Math.random() * 0.8 - 0.4)) * scaleX,
            isFacingRight: Math.random() < 0.5,
            shootCooldownTimer: FLYING_ENEMY_SHOOT_COOLDOWN * (0.6 + Math.random() * 0.6),
            isShooting: false,
            shootFrameTimer: 0,
            currentImage: images.flyingEnemyImage.img,
            initialHealth: flyingHealth,
            health: flyingHealth,
            isActive: true
        });
    }
}

function updateFlyingEnemies(deltaTime) {
    const playerIsEffectivelyInvisible = isInvisible || isShieldActive || (player.isTransformed && selectedTransformation === 'staron');
    flyingEnemies.forEach(fe => {
        if (!fe.isActive) return;

        if (fe.isShooting) {
            fe.shootFrameTimer -= deltaTime;
            if (fe.shootFrameTimer <= 0) {
                fe.isShooting = false;
                fe.currentImage = images.flyingEnemyImage.img;
            }
        }

        fe.x += (fe.isFacingRight ? fe.speed : -fe.speed) * (deltaTime / FIXED_TIMESTEP);

        if (fe.isFacingRight && fe.x + fe.width > worldWidthScaled) {
            fe.isFacingRight = false;
            fe.x = worldWidthScaled - fe.width - 1;
        } else if (!fe.isFacingRight && fe.x < 0) {
            fe.isFacingRight = true;
            fe.x = 1;
        }

        fe.shootCooldownTimer -= deltaTime;
        if (fe.shootCooldownTimer <= 0 && !fe.isShooting && images.rocketImage.loaded && !playerIsEffectivelyInvisible) {
            fe.isShooting = true;
            fe.shootFrameTimer = FLYING_ENEMY_SHOOT_FRAME_DURATION;
            fe.currentImage = images.flyingEnemyShootImage.img;
            fe.shootCooldownTimer = FLYING_ENEMY_SHOOT_COOLDOWN * (0.8 + Math.random() * 0.4);

            rockets.push({
                x: fe.x + fe.width / 2 - (rocketBaseWidth * scaleX) / 2,
                y: fe.y + fe.height,
                width: rocketBaseWidth * scaleX,
                height: rocketBaseHeight * scaleY,
                velocityY: ROCKET_BASE_SPEED * scaleY,
                image: images.rocketImage.img
            });
        }
    });
}

function updateRockets(deltaTime) {
    for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];
        rocket.y += rocket.velocityY * (deltaTime / FIXED_TIMESTEP);

        let hitPlatform = false;
        for (const platform of platforms) {
            if (checkRectCollision(rocket, platform)) {
                if (images.explosionEffect.loaded && images.explosionEffect.img) {
                    explosions.push({
                        x: rocket.x + rocket.width / 2 - (explosionBaseWidth * scaleX) / 2,
                        y: rocket.y + rocket.height / 2 - (explosionBaseHeight * scaleY) / 2,
                        width: explosionBaseWidth * scaleX,
                        height: explosionBaseHeight * scaleY,
                        timer: EXPLOSION_DURATION,
                        image: images.explosionEffect.img
                    });
                }
                rockets.splice(i, 1);
                hitPlatform = true;
                break;
            }
        }
        if (hitPlatform) continue;

        if (playerInvulnerableTimer <= 0 && !isInvisible && !(player.isTransformed && selectedTransformation === 'staron')) {
            if (isShieldActive && checkRectCollision(player, rocket)) {
                rockets.splice(i, 1);
                if (shieldHitSound && shieldHitSound.HAVE_ENOUGH_DATA) {
                    shieldHitSound.currentTime = 0;
                    shieldHitSound.play().catch(e => console.warn("Shield hit sound error", e));
                }
                explosions.push({
                    x: rocket.x + rocket.width / 2 - (explosionBaseWidth * scaleX) / 2,
                    y: player.y + player.height / 2 - (explosionBaseHeight * scaleY) / 2,
                    width: explosionBaseWidth * scaleX,
                    height: explosionBaseHeight * scaleY,
                    timer: EXPLOSION_DURATION,
                    image: images.explosionEffect.img
                });
                continue;
            } else if (!isShieldActive && checkRectCollision(player, rocket)) {
                rockets.splice(i, 1);
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

        if (canvas && rocket.y > canvas.height + rocket.height) {
            rockets.splice(i, 1);
        }
    }
}

function updateExplosions(deltaTime) {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].timer -= deltaTime;
        if (explosions[i].timer <= 0) {
            explosions.splice(i, 1);
        }
    }
}