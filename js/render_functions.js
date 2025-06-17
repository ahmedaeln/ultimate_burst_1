// --- FILE 2: render_functions.js ---

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
        let currentHaloAlpha = 0;
        let currentHaloExtraSize = 0;
        const haloBaseSize = player.width;

        if (effectProgress < 0.5) {
            currentHaloAlpha = effectProgress * 2;
            currentHaloExtraSize = haloBaseSize * 0.4 * (effectProgress * 2);
        } else {
            currentHaloAlpha = (1 - effectProgress) * 2;
            currentHaloExtraSize = haloBaseSize * 0.4 * ((1 - effectProgress) * 2);
        }
        currentHaloAlpha = Math.min(0.8, Math.max(0, currentHaloAlpha));

        const haloCenterX = player.x - camera.x + player.width / 2;
        const haloCenterY = player.y + player.height / 2;

        const originalGlobalAlphaForHalo = ctx.globalAlpha;
        ctx.globalAlpha = Math.min(playerAlpha, currentHaloAlpha);


        ctx.beginPath();
        ctx.arc(haloCenterX, haloCenterY,
                Math.max(player.width, player.height) / 1.8 + currentHaloExtraSize,
                0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
            haloCenterX, haloCenterY, haloBaseSize * 0.05,
            haloCenterX, haloCenterY, Math.max(player.width, player.height) / 1.8 + currentHaloExtraSize
        );
        const haloAlphaForGradient = ctx.globalAlpha;
        // تعديل لون الوميض لـ Staron
        const haloColor1 = selectedTransformation === 'staron' ? `rgba(255, 230, 100, ${haloAlphaForGradient})` : `rgba(50, 255, 120, ${haloAlphaForGradient})`;
        const haloColor2 = selectedTransformation === 'staron' ? `rgba(255, 200, 50, ${haloAlphaForGradient * 0.6})` : `rgba(0, 220, 80, ${haloAlphaForGradient * 0.6})`;
        const haloColor3 = selectedTransformation === 'staron' ? `rgba(200, 150, 0, 0)` : `rgba(0, 200, 50, 0)`;

        gradient.addColorStop(0, haloColor1);
        gradient.addColorStop(0.5, haloColor2);
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

// ### NEW ###: Draw Pie Clown and Pies
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
            ctx.fillStyle = '#FFC0CB'; // Pink placeholder
            ctx.fillRect(screenX, pieClown.y, pieClown.width, pieClown.height);
        }

        // Health Bar
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
            ctx.fillStyle = '#F5DEB3'; // Wheat color for placeholder
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
    if (!ctx || !portalObject.isActive || !images.portalFrames || images.portalFrames.length === 0) return;
    
    const screenX = portalObject.x - camera.x;
    if (screenX + portalObject.width < 0 || screenX > canvas.width) return;

    let portalImg;
    if (portalObject.isOpen) {
        // If it's open, run the animation.
        portalImg = images.portalFrames[currentPortalFrame]?.img;
    } else {
        // If it's closed, show the first frame statically.
        portalImg = images.portalFrames[0]?.img;
    }
    
    if (!portalImg || !portalImg.complete || portalImg.naturalHeight === 0) return;

    ctx.save();
    if (portalObject.isOpen) {
        const alpha = 0.8 + Math.sin(gameTime / 300) * 0.2;
        ctx.globalAlpha = alpha;
    } else {
        ctx.globalAlpha = 0.7;
        ctx.filter = 'grayscale(80%) brightness(0.9)';
    }
    
    ctx.drawImage(portalImg, screenX, portalObject.y, portalObject.width, portalObject.height);

    ctx.restore(); // This will reset alpha and filter.
}


function drawPlayerUI() {
    if (!ctx || !canvas) return;
    const responsiveScale = Math.min(1.5, Math.max(0.7, canvas.height / BASE_HEIGHT));

    const topOffset = 20 * responsiveScale;
    const uiPadding = 15 * responsiveScale;
    const heartSize = 30 * responsiveScale;
    const barHeight = 28 * responsiveScale;
    const transformBarWidth = 180 * scaleX;
    const abilityBarWidth = 150 * scaleX;
    const uiFontSize = Math.max(12, 16 * responsiveScale);
    let currentBarY = topOffset;

    // --- تعديل لعرض الصحة ---
    if (player.isTransformed && selectedTransformation === 'staron') {
        // عرض رمز اللانهاية
        if (images.infinitySymbol.loaded && images.infinitySymbol.img.complete && images.infinitySymbol.img.naturalHeight > 0) {
            const infinitySize = 40 * responsiveScale;
            ctx.drawImage(images.infinitySymbol.img, uiPadding, currentBarY, infinitySize, infinitySize);
        }
    } else {
        // عرض القلوب كالعادة
        if (images.heartImage.loaded && images.heartImage.img.complete && images.heartImage.img.naturalHeight > 0) {
            for (let i = 0; i < MAX_PLAYER_HITS; i++) {
                ctx.globalAlpha = (i < MAX_PLAYER_HITS - playerHitCount) ? 1.0 : 0.35;
                ctx.drawImage(images.heartImage.img, uiPadding + (i * (heartSize + 5 * scaleX)), currentBarY, heartSize, heartSize);
            }
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = "red";
            ctx.font = `${uiFontSize}px Tajawal`;
            ctx.textAlign = "left";
            ctx.fillText(`الصحة: ${MAX_PLAYER_HITS - playerHitCount}/${MAX_PLAYER_HITS}`, uiPadding, currentBarY + heartSize * 0.7);
        }
    }
    // --- نهاية التعديل ---

    let barColor = "#00aa00";
    let fillPercentage = 1;
    let timerText = "التحول جاهز!";
    if (player.isTransformed && transformationActiveTimer > 0) {
        fillPercentage = transformationActiveTimer / TRANSFORMATION_DURATION;
        timerText = (selectedTransformation === 'staron' ? "Staron" : "التحول") + `: ${(transformationActiveTimer / 1000).toFixed(1)} ث`;
        barColor = (selectedTransformation === 'staron' ? "#FFD700" : "#00dd00");
    } else if (transformationCooldownTimer > 0) {
        fillPercentage = 1 - (transformationCooldownTimer / currentTransformationCooldown);
        timerText = `انتظار: ${(transformationCooldownTimer / 1000).toFixed(1)} ث`;
        barColor = "#ff8c00";
    } else if (showingTransformationEffect) {
            const effectDuration = (transformationEffectType === 'toAlien') ? TRANSFORM_ANIMATION_TOTAL_DURATION : REVERT_TRANSFORM_GLOW_DURATION;
            fillPercentage = transformationEffectTimer / effectDuration;
            timerText = `يتحول...!`;
            barColor = "#33cc33";
    }
    const transformBarX = canvas.width - transformBarWidth - uiPadding;
    ctx.fillStyle = "rgba(50, 50, 50, 0.6)";
    ctx.fillRect(transformBarX, currentBarY, transformBarWidth, barHeight);
    ctx.fillStyle = barColor;
    ctx.fillRect(transformBarX, currentBarY, transformBarWidth * fillPercentage, barHeight);
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 2 * responsiveScale;
    ctx.strokeRect(transformBarX, currentBarY, transformBarWidth, barHeight);
    ctx.fillStyle = "#ffffff";
    ctx.font = `${uiFontSize * 0.8}px Tajawal`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(timerText, transformBarX + transformBarWidth / 2, currentBarY + barHeight / 2);
    currentBarY += barHeight + (10 * responsiveScale);


    if (invisibilityPurchased) {
        let invBarColor = "#8a2be2";
        let invFillPercentage = 1;
        let invTimerText = "الاختفاء جاهز!";
        if (isInvisible && invisibilityDurationTimer > 0) {
            invFillPercentage = invisibilityDurationTimer / INVISIBILITY_DURATION;
            invTimerText = `مختفي: ${(invisibilityDurationTimer / 1000).toFixed(1)} ث`;
        } else if (invisibilityCooldownTimer > 0) {
            invFillPercentage = 1 - (invisibilityCooldownTimer / INVISIBILITY_COOLDOWN);
            invTimerText = `تهدئة: ${(invisibilityCooldownTimer / 1000).toFixed(1)} ث`;
            invBarColor = "#DA70D6";
        }
        ctx.fillStyle = "rgba(50, 50, 50, 0.6)";
        ctx.fillRect(transformBarX, currentBarY, abilityBarWidth, barHeight);
        ctx.fillStyle = invBarColor;
        ctx.fillRect(transformBarX, currentBarY, abilityBarWidth * invFillPercentage, barHeight);
        ctx.strokeStyle = "#f0f0f0";
        ctx.strokeRect(transformBarX, currentBarY, abilityBarWidth, barHeight);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(invTimerText, transformBarX + abilityBarWidth / 2, currentBarY + barHeight / 2);
        currentBarY += barHeight + (10 * responsiveScale);
    }

    if (shieldPurchased) {
        let shieldBarColor = "#0099FF";
        let shieldFillPercentage = 1;
        let shieldTimerText = "الدرع جاهز!";
        if (isShieldActive && shieldDurationTimer > 0) {
            shieldFillPercentage = shieldDurationTimer / SHIELD_DURATION;
            shieldTimerText = `درع: ${(shieldDurationTimer / 1000).toFixed(1)} ث`;
        } else if (shieldCooldownTimer > 0) {
            shieldFillPercentage = 1 - (shieldCooldownTimer / SHIELD_COOLDOWN);
            shieldTimerText = `تهدئة: ${(shieldCooldownTimer / 1000).toFixed(1)} ث`;
            shieldBarColor = "#6495ED";
        }
        ctx.fillStyle = "rgba(50, 50, 50, 0.6)";
        ctx.fillRect(transformBarX, currentBarY, abilityBarWidth, barHeight);
        ctx.fillStyle = shieldBarColor;
        ctx.fillRect(transformBarX, currentBarY, abilityBarWidth * shieldFillPercentage, barHeight);
        ctx.strokeStyle = "#f0f0f0";
        ctx.strokeRect(transformBarX, currentBarY, abilityBarWidth, barHeight);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(shieldTimerText, transformBarX + abilityBarWidth / 2, currentBarY + barHeight / 2);
    }


    if (typeof pauseButton !== 'undefined' && pauseButton.style) {
        const pauseButtonSize = parseFloat(pauseButton.style.width) || (45 * responsiveScale);
        const pauseButtonMargin = 10 * responsiveScale;
        pauseButton.style.top = `${topOffset}px`;
        pauseButton.style.left = `${transformBarX - pauseButtonSize - pauseButtonMargin}px`;
    }

    if (enemy.isActive) {
        const enemyBarWidth = 160 * scaleX;
        const enemyBarHeight = 20 * responsiveScale;
        const enemyBarX = canvas.width / 2 - (enemyBarWidth / 2);
        const enemyBarY = topOffset;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(enemyBarX, enemyBarY, enemyBarWidth, enemyBarHeight);
        ctx.fillStyle = "red";
        ctx.fillRect(enemyBarX, enemyBarY, (enemyBarWidth) * (enemy.health / enemy.initialHealth), enemyBarHeight);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5 * responsiveScale;
        ctx.strokeRect(enemyBarX, enemyBarY, enemyBarWidth, enemyBarHeight);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = `${uiFontSize * 0.7}px Tajawal`;
        ctx.textBaseline = "middle";
        ctx.fillText(`صحة العدو: ${enemy.health}`, enemyBarX + enemyBarWidth/2, enemyBarY + enemyBarHeight/2);
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