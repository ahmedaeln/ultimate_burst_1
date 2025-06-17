// js/ui_interface.js (MODIFIED)
console.log("ui_interface.js loaded");

// =============================================
// UI ELEMENT VARIABLES
// =============================================
let loadingScreen, progressFill, loadingScreenText;
let startScreenContainer, levelSelectScreenContainer, shopOverlayScreenContainer, gameContainer, messageOverlay;
let showLevelSelectBtnFromStart, startGameFromLevelSelectBtn, openShopBtnStartScreen, closeShopBtn, closeShopBtnTop;
let levelButtons = [];
let settingsBtnStart, helpBtnStart, scoreCounterStart;
let shopItemsContainer, focusedItemIndexShop = -1;

let onlineModeBtn;
let matchmakingScreenContainer, cancelMatchmakingBtn, matchmakingStatusText;

let gameTitleElement, messageText, retryButton;
let pauseButton, pauseScreenOverlay, resumeButton, backToMainButton;

// ### MODIFIED: Added variables for win screen
let winScreenOverlay, winScreenMessage, winScreenStarsContainer, winScreenNextLevelBtn, winScreenReplayBtn, winScreenMainMenuBtn;

let transformationSelectOverlay, cancelTransformButton;

let btnUp, btnLeft, btnRight, btnSpecial, btnShoot, btnFinisher, btnInvisibility, btnShield, btnDown, btnKick;

const controlButtonBaseStyles = {
    padding: 15, fontSizeEm: 1.1, minWH: 70, gap: 12, marginBottom: 5
};
const onScreenControlsBaseStyles = { padding: 15 };


// =============================================
// UI INITIALIZATION & EVENT LISTENERS
// =============================================

function initializeUIElements() {
    loadingScreen = document.getElementById('loadingScreen');
    progressFill = document.getElementById('progressFill');
    loadingScreenText = document.getElementById('loadingScreenText');

    startScreenContainer = document.getElementById('startScreenContainer');
    levelSelectScreenContainer = document.getElementById('levelSelectScreenContainer');
    shopOverlayScreenContainer = document.getElementById('shopOverlayScreenContainer');
    gameContainer = document.getElementById('gameContainer');
    messageOverlay = document.getElementById('messageOverlay');

    onlineModeBtn = document.getElementById('onlineModeBtn');
    matchmakingScreenContainer = document.getElementById('matchmakingScreenContainer');
    cancelMatchmakingBtn = document.getElementById('cancelMatchmakingBtn');
    matchmakingStatusText = document.getElementById('matchmakingStatusText');

    showLevelSelectBtnFromStart = document.getElementById('showLevelSelectBtnFromStart');
    startGameFromLevelSelectBtn = document.getElementById('startGameFromLevelSelectBtn');
    openShopBtnStartScreen = document.getElementById('openShopBtnStartScreen');
    closeShopBtnTop = document.getElementById('closeShopBtnTop');
    
    levelButtons = document.querySelectorAll('.level-button');
    settingsBtnStart = document.getElementById('settingsBtnStart');
    helpBtnStart = document.getElementById('helpBtnStart');
    scoreCounterStart = document.getElementById('scoreCounterStart');

    shopItemsContainer = document.querySelector('#shopOverlayScreenContainer .shop-items');

    gameTitleElement = document.getElementById('gameTitle');
    messageText = document.getElementById('messageText');
    retryButton = document.getElementById('retryButton');

    pauseButton = document.getElementById('pauseButton');
    pauseScreenOverlay = document.getElementById('pauseScreenOverlay');
    resumeButton = document.getElementById('resumeButton');
    backToMainButton = document.getElementById('backToMainButton');

    // ### NEW: Get Win Screen Elements ###
    winScreenOverlay = document.getElementById('winScreenOverlay');
    winScreenMessage = document.getElementById('winScreenMessage');
    winScreenStarsContainer = document.getElementById('winScreenStarsContainer');
    winScreenNextLevelBtn = document.getElementById('winScreenNextLevelBtn');
    winScreenReplayBtn = document.getElementById('winScreenReplayBtn');
    winScreenMainMenuBtn = document.getElementById('winScreenMainMenuBtn');

    btnUp = document.getElementById('btnUp');
    btnLeft = document.getElementById('btnLeft');
    btnRight = document.getElementById('btnRight');
    btnSpecial = document.getElementById('btnSpecial');
    btnShoot = document.getElementById('btnShoot');
    btnKick = document.getElementById('btnKick');
    btnFinisher = document.getElementById('btnFinisher');
    btnInvisibility = document.getElementById('btnInvisibility');
    btnShield = document.getElementById('btnShield');
    btnDown = document.getElementById('btnDown');
    
    transformationSelectOverlay = document.getElementById('transformationSelectOverlay');
    cancelTransformButton = document.getElementById('cancelTransformButton');

    if (typeof initializeAudioElements === 'function') {
        initializeAudioElements();
    }
}

function setupUIEventListeners() {
    if (!startScreenContainer) {
        console.warn("UI elements not ready for event listeners yet.");
        return;
    }

    // --- Online Mode ---
    if (onlineModeBtn) {
        onlineModeBtn.addEventListener('click', () => {
            if (startScreenContainer) startScreenContainer.style.display = 'none';
            if (matchmakingScreenContainer) {
                matchmakingScreenContainer.style.display = 'flex';
                if(matchmakingStatusText) matchmakingStatusText.textContent = 'جاري الاتصال بالخادم...';
                if(cancelMatchmakingBtn) cancelMatchmakingBtn.style.display = 'block';
            }
            if (typeof initializeOnlineLogic === 'function') {
                initializeOnlineLogic();
            }
        });
    }

    if (cancelMatchmakingBtn) {
        cancelMatchmakingBtn.addEventListener('click', () => {
            if (typeof socket !== 'undefined' && socket && socket.connected) {
                socket.disconnect();
                console.log('[Socket] Disconnected by user.');
            }
            if (matchmakingScreenContainer) matchmakingScreenContainer.style.display = 'none';
            if (startScreenContainer) startScreenContainer.style.display = 'flex';
            if (typeof isOnlineMode !== 'undefined') isOnlineMode = false;
        });
    }

    // --- Main Menu ---
    if (showLevelSelectBtnFromStart) {
        showLevelSelectBtnFromStart.addEventListener('click', () => {
            if (startScreenContainer) startScreenContainer.style.display = 'none';
            if (levelSelectScreenContainer) levelSelectScreenContainer.style.display = 'flex';
            if (typeof gameState !== 'undefined') gameState = 'levelSelect';
            updateLevelSelectScreen();
        });
    }
    
    if (settingsBtnStart) settingsBtnStart.addEventListener('click', () => alert("لا توجد إعدادات متاحة حالياً."));
    if (helpBtnStart) helpBtnStart.addEventListener('click', () => alert("الأسهم للحركة. (L) للتحول. (K) للإطلاق. (Space) للقاضية. (V) للاختفاء. (C) للدرع. (J) للركل."));

    // --- Level Select ---
    levelButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const levelNum = parseInt(btn.dataset.level);
            if (btn.classList.contains('unlocked') && levelNum <= highestUnlockedLevel) {
                levelButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                if (typeof currentLevel !== 'undefined') currentLevel = levelNum;
            }
        });
    });

    if (startGameFromLevelSelectBtn) {
        startGameFromLevelSelectBtn.addEventListener('click', () => {
            const selectedBtn = document.querySelector('.level-button.selected');
            if (selectedBtn) {
                const selectedLevelNum = parseInt(selectedBtn.dataset.level);
                if (selectedBtn.classList.contains('unlocked') && selectedLevelNum <= highestUnlockedLevel) {
                    if (typeof currentLevel !== 'undefined') currentLevel = selectedLevelNum;
                    if (levelSelectScreenContainer) levelSelectScreenContainer.style.display = 'none';
                    if (gameContainer) gameContainer.style.display = 'flex';
                    if (typeof requestAppFullscreen === 'function') requestAppFullscreen();
                    if (typeof gameState !== 'undefined') gameState = 'loading';
                    if (typeof initGame === 'function') initGame();
                } else {
                    alert("الرجاء اختيار مستوى مفتوح للبدء.");
                }
            } else {
                alert("الرجاء اختيار مستوى للبدء.");
            }
        });
    }

    // --- Shop ---
    if (openShopBtnStartScreen && shopOverlayScreenContainer) {
        openShopBtnStartScreen.addEventListener('click', () => {
            if(startScreenContainer) startScreenContainer.style.display = 'none';
            if(shopOverlayScreenContainer) shopOverlayScreenContainer.style.display = 'flex';
            if (typeof gameState !== 'undefined') gameState = 'shop';
            updateShopItemStates();
        });
        const closeShopFunction = () => {
            if(shopOverlayScreenContainer) shopOverlayScreenContainer.style.display = 'none';
            if(startScreenContainer) startScreenContainer.style.display = 'flex';
            if (typeof gameState !== 'undefined') gameState = 'startScreen';
            focusedItemIndexShop = -1;
        };
        if (closeShopBtnTop) closeShopBtnTop.addEventListener('click', closeShopFunction);

        // ### NEW: Shop purchase logic ###
        if (shopItemsContainer) {
            shopItemsContainer.addEventListener('click', (e) => {
                const button = e.target.closest('.buy-button, .select-button');
                if (!button || button.disabled) return;

                const itemElement = button.closest('.shop-item');
                const itemId = itemElement.dataset.itemId;
                const priceElement = itemElement.querySelector('.price');
                const price = parseInt(priceElement.dataset.price);

                // Handle select actions
                if (button.classList.contains('select-button')) {
                    if (itemId === 'select_staron' && !staronUnlocked) {
                        if (playerScore >= price) {
                            playerScore -= price;
                            staronUnlocked = true;
                            localStorage.setItem(STARON_UNLOCKED_KEY, 'true');
                            localStorage.setItem(SCORE_STORAGE_KEY, playerScore);
                            updateScoreDisplay();
                            updateShopItemStates();
                        }
                    } else {
                        selectedTransformation = itemId.replace('select_', '');
                        localStorage.setItem(SELECTED_TRANSFORMATION_KEY, selectedTransformation);
                        updateShopItemStates();
                    }
                    return;
                }

                // Handle buy actions
                if (playerScore >= price) {
                    playerScore -= price;
                    localStorage.setItem(SCORE_STORAGE_KEY, playerScore);

                    let storageKey = '';
                    switch (itemId) {
                        case 'invisibility':        storageKey = INVISIBILITY_KEY; invisibilityPurchased = true; break;
                        case 'shield':              storageKey = SHIELD_KEY; shieldPurchased = true; break;
                        case 'extra_life':          storageKey = EXTRA_LIFE_KEY; extraLifePurchased = true; break;
                        case 'cooldown_reduction':  storageKey = COOLDOWN_REDUCTION_KEY; cooldownUpgradePurchased = true; break;
                        case 'finisher_ability':    storageKey = FINISHER_ABILITY_KEY; finisherAbilityPurchased = true; break;
                        // Add other buyable items here
                    }

                    if (storageKey) {
                        localStorage.setItem(storageKey, 'true');
                    }
                    
                    updateScoreDisplay();
                    updateShopItemStates();
                }
            });
        }
    }
    
    // --- In-Game Overlays ---
    if (retryButton) retryButton.addEventListener('click', () => { if (messageOverlay) messageOverlay.style.display = 'none'; if (typeof initGame === 'function') initGame(); });
    
    // ### NEW: Win Screen Buttons ###
    if (winScreenNextLevelBtn) {
        winScreenNextLevelBtn.addEventListener('click', () => {
            if (winScreenOverlay) winScreenOverlay.style.display = 'none';
            const MAX_LEVELS_IN_DATA = (typeof levelsData !== 'undefined') ? levelsData.length : 9;
            if (currentLevel < MAX_LEVELS_IN_DATA) {
                currentLevel++;
                initGame();
            } else {
                goToMainMenu();
            }
        });
    }
    if (winScreenReplayBtn) {
        winScreenReplayBtn.addEventListener('click', () => {
            if (winScreenOverlay) winScreenOverlay.style.display = 'none';
            initGame();
        });
    }
    if (winScreenMainMenuBtn) {
        winScreenMainMenuBtn.addEventListener('click', goToMainMenu);
    }


    if (pauseButton) pauseButton.addEventListener('click', togglePauseGame);
    if (resumeButton) resumeButton.addEventListener('click', () => { if (typeof isPaused !== 'undefined' && isPaused) togglePauseGame(); });
    if (backToMainButton) backToMainButton.addEventListener('click', goToMainMenu);

    if (cancelTransformButton) {
        cancelTransformButton.addEventListener('click', () => {
            if (typeof hideTransformationSelectMenu === 'function') {
                hideTransformationSelectMenu();
            }
        });
    }

    // --- Controls Setup ---
    setupButtonControls();
    document.addEventListener('keydown', (e) => {
        if (typeof isPaused !== 'undefined' && isPaused && e.key !== 'Escape' && e.key !== 'p' && e.key !== 'P') return;
        if (gameState === 'shop' || (transformationSelectOverlay && transformationSelectOverlay.style.display === 'flex')) return;
        if (gameState === 'levelComplete' && winScreenOverlay && winScreenOverlay.style.display === 'flex') { if (e.key === 'Enter') { if (winScreenNextLevelBtn && winScreenNextLevelBtn.style.display !== 'none') winScreenNextLevelBtn.click(); else if (winScreenMainMenuBtn) winScreenMainMenuBtn.click(); } return; }
        if (typeof gameState !== 'undefined' && gameState !== 'playing' && gameState !== 'paused') { if (e.key === 'Enter' && retryButton && messageOverlay.style.display === 'flex') retryButton.click(); return; }
        const isPlayerActionRestricted = typeof showingTransformationEffect !== 'undefined' && (showingTransformationEffect || isUsingFinisher || player.isKicking);
        const isPlayerActionRestrictedByInvis = typeof isInvisible !== 'undefined' && isInvisible && (e.key === 'k' || e.key === 'K' || e.key === 'l' || e.key === 'L' || e.key === ' ' || e.key === 'c' || e.key === 'C');
        const isPlayerActionRestrictedByShield = typeof isShieldActive !== 'undefined' && isShieldActive && (e.key === 'l' || e.key === 'L' || e.key === 'v' || e.key === 'V' || e.key === ' ');
        if (isPlayerActionRestricted || isPlayerActionRestrictedByInvis || isPlayerActionRestrictedByShield) { if (typeof keys !== 'undefined' && keys.hasOwnProperty(e.key) && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && (isShieldActive || isInvisible || (player.isTransformed && selectedTransformation === 'staron')) && !isPlayerActionRestricted) {} else return; }
        if (typeof keys !== 'undefined' && (keys.hasOwnProperty(e.key) || e.key === 'ArrowDown')) { keys[e.key] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'v', 'V', 'c', 'C', 'j', 'J'].includes(e.key)) e.preventDefault(); }
        if ((e.key === 'k' || e.key === 'K') && typeof fireActualBullet === 'function') fireActualBullet();
        if ((e.key === 'j' || e.key === 'J') && typeof activateKick === 'function') activateKick();
        if ((e.key === 'l' || e.key === 'L') && typeof activateSpecialAbilitySequence === 'function') activateSpecialAbilitySequence();
        if (e.key === ' ' && typeof activateFinisherMove === 'function') activateFinisherMove();
        if ((e.key === 'v' || e.key === 'V') && typeof activateInvisibility === 'function') activateInvisibility();
        if ((e.key === 'c' || e.key === 'C') && typeof activateShield === 'function') activateShield();
    });

    document.addEventListener('keyup', (e) => {
        if (typeof isPaused !== 'undefined' && isPaused) return;
        if (typeof gameState !== 'undefined' && gameState !== 'playing' && gameState !== 'paused') return;
        if (typeof keys !== 'undefined' && (keys.hasOwnProperty(e.key) || e.key === 'ArrowDown')) { keys[e.key] = false; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'v', 'V', 'c', 'C', 'j', 'J'].includes(e.key)) e.preventDefault(); }
    });
}

// =============================================
// UI UPDATE & STATE MANAGEMENT FUNCTIONS
// =============================================

function handleMatchFoundUI(startGameCallback) {
    if (!matchmakingScreenContainer) return;
    
    if(matchmakingStatusText) matchmakingStatusText.textContent = 'تم العثور على خصم! جاري بدء اللعبة...';
    if(cancelMatchmakingBtn) cancelMatchmakingBtn.style.display = 'none';

    setTimeout(() => {
        matchmakingScreenContainer.style.display = 'none';
        if (gameContainer) gameContainer.style.display = 'flex';
        if (typeof startGameCallback === "function") {
            startGameCallback();
        }
    }, 2500);
}

function updateScoreDisplay() {
    if (scoreCounterStart) scoreCounterStart.textContent = `النقاط: ${playerScore}`;
}

function addScore(amount) {
    if (typeof playerScore !== 'undefined') {
        playerScore += amount;
        localStorage.setItem(SCORE_STORAGE_KEY, playerScore.toString());
        updateScoreDisplay();
    }
}

function updateLevelSelectScreen() {
    let firstUnlockedButton = null;
    levelButtons.forEach(btn => {
        const levelNum = parseInt(btn.dataset.level);
        if (levelNum <= highestUnlockedLevel) {
            btn.classList.add('unlocked');
            btn.disabled = false;
            if (!firstUnlockedButton) firstUnlockedButton = btn;
        } else {
            btn.classList.remove('unlocked');
            btn.disabled = true;
        }
        btn.classList.remove('selected');
        const starsSpan = btn.querySelector('.level-stars-display') || document.createElement('span');
        if (!starsSpan.classList.contains('level-stars-display')) {
            starsSpan.className = 'level-stars-display';
            starsSpan.style.cssText = 'display: block; font-size: 0.8em; margin-top: 5px;';
            btn.appendChild(starsSpan);
        }
        starsSpan.textContent = '⭐'.repeat(parseInt(localStorage.getItem(LEVEL_STARS_KEY_PREFIX + levelNum) || 0));
    });

    if (typeof currentLevel !== 'undefined') currentLevel = Math.min(currentLevel, highestUnlockedLevel);
    const currentLevelButton = document.querySelector(`.level-button[data-level="${currentLevel}"]`);
    if (currentLevelButton && currentLevelButton.classList.contains('unlocked')) {
        currentLevelButton.classList.add('selected');
    } else if (firstUnlockedButton) {
        firstUnlockedButton.classList.add('selected');
        if (typeof currentLevel !== 'undefined') currentLevel = parseInt(firstUnlockedButton.dataset.level);
    }
}

function updateShopItemStates() {
    if (!shopItemsContainer) return;
    const items = shopItemsContainer.querySelectorAll('.shop-item');
    items.forEach((item) => {
        const itemId = item.dataset.itemId;
        const button = item.querySelector('.buy-button, .select-button');
        const priceElement = item.querySelector('.price');
        if (!button) return;

        if (button.classList.contains('select-button')) {
            if (itemId === 'select_default') {
                button.disabled = selectedTransformation === 'default';
                button.textContent = selectedTransformation === 'default' ? 'مُجهّز' : 'تجهيز';
            } else if (itemId === 'select_staron') {
                if (staronUnlocked) {
                    button.disabled = selectedTransformation === 'staron';
                    button.textContent = selectedTransformation === 'staron' ? 'مُجهّز' : 'تجهيز';
                    if (priceElement) priceElement.textContent = 'تم الفتح';
                } else {
                    button.disabled = playerScore < STARON_UNLOCK_PRICE;
                    button.textContent = `فتح`;
                    if(priceElement) priceElement.textContent = `السعر: ${STARON_UNLOCK_PRICE} نقطة`;
                }
            }
        } else {
            let isPurchasedQuery = false;
            let price = parseInt(priceElement.dataset.price);
            let isAffordable = playerScore >= price;
            
            switch(itemId) {
                case 'cooldown_reduction': isPurchasedQuery = cooldownUpgradePurchased; break;
                case 'extra_life': isPurchasedQuery = extraLifePurchased; break;
                case 'invisibility': isPurchasedQuery = invisibilityPurchased; break;
                case 'shield': isPurchasedQuery = shieldPurchased; break;
                case 'finisher_ability': isPurchasedQuery = finisherAbilityPurchased; break;
                // Add other buyable items here
            }
            button.disabled = isPurchasedQuery || !isAffordable;
            if(isPurchasedQuery && priceElement) {
                priceElement.textContent = "تم الشراء";
            }
        }
    });
}

function updateInGameUIState() {
    if (typeof gameState === 'undefined' || !btnKick) return;

    const gameIsActuallyPlaying = gameState === 'playing' && !isPaused;
    const isPlayerBusy = showingTransformationEffect || isUsingFinisher || player.isKicking;

    if (player.isTransformed) {
        const canUseFinisher = finisherAbilityPurchased && selectedTransformation === 'default' && gameIsActuallyPlaying && !isPlayerBusy && !isInvisible && !isShieldActive;
        const canShootNow = selectedTransformation === 'default' && canShoot && bullets.length < MAX_BULLETS && gameIsActuallyPlaying && !isPlayerBusy && !isInvisible;

        btnSpecial.style.display = 'none';
        btnKick.style.display = 'none';
        btnShoot.style.display = (selectedTransformation === 'default') ? 'flex' : 'none';
        btnFinisher.style.display = canUseFinisher ? 'flex' : 'none';

        btnShoot.disabled = !canShootNow;
        btnFinisher.disabled = !canUseFinisher;
    } else {
        const canUseSpecial = !player.isTransformed && transformationCooldownTimer <= 0 && transformationActiveTimer <= 0 && gameIsActuallyPlaying && !isPlayerBusy && !isInvisible && !isShieldActive;
        const canKick = !player.isTransformed && kickCooldownTimer <= 0 && gameIsActuallyPlaying && !isPlayerBusy;
        
        btnSpecial.style.display = 'flex';
        btnKick.style.display = 'flex';
        btnShoot.style.display = 'none';
        btnFinisher.style.display = 'none';

        btnSpecial.disabled = !canUseSpecial;
        btnKick.disabled = !canKick;
    }

    const canUseInvisibility = invisibilityPurchased && !isInvisible && invisibilityCooldownTimer <= 0 && gameIsActuallyPlaying && !isPlayerBusy && !isShieldActive;
    const canUseShield = shieldPurchased && !isShieldActive && shieldCooldownTimer <= 0 && gameIsActuallyPlaying && !isPlayerBusy && !isInvisible;

    btnInvisibility.style.display = invisibilityPurchased ? 'flex' : 'none';
    btnShield.style.display = shieldPurchased ? 'flex' : 'none';
    
    btnInvisibility.disabled = !canUseInvisibility;
    btnShield.disabled = !canUseShield;

    [btnUp, btnLeft, btnRight].forEach(btn => {
        if (btn) {
            const canMove = gameIsActuallyPlaying && !isPlayerBusy;
            btn.disabled = !canMove;
        }
    });

    if (btnDown) {
        const showDownButton = player.isTransformed && selectedTransformation === 'staron' && gameIsActuallyPlaying && !isPlayerBusy;
        btnDown.style.display = showDownButton ? 'block' : 'none';
        btnDown.disabled = !showDownButton;
    }

    if(pauseButton) {
        pauseButton.style.display = (gameState === 'playing' || gameState === 'paused' || gameState === 'levelComplete') ? 'block' : 'none';
        pauseButton.disabled = !(gameState === 'playing' || gameState === 'paused' || gameState === 'levelComplete');
    }
    
    updateControlButtonsSize();
}

function updateControlButtonsSize() {
    if (!canvas || !btnUp) return;
    const responsiveScale = Math.min(1.5, Math.max(0.7, canvas.height / BASE_HEIGHT));
    const buttonsToScale = [btnUp, btnLeft, btnRight, btnDown, btnSpecial, btnShoot, btnFinisher, btnInvisibility, btnShield, btnKick];
    buttonsToScale.forEach(el => {
        if (el) {
            el.style.minWidth = `${controlButtonBaseStyles.minWH * responsiveScale}px`;
            el.style.minHeight = `${controlButtonBaseStyles.minWH * responsiveScale}px`;
        }
    });
    const onScreenControlsContainer = document.getElementById('onScreenControls');
    if (onScreenControlsContainer) onScreenControlsContainer.style.padding = `${onScreenControlsBaseStyles.padding * responsiveScale}px`;
    const movementControls = document.getElementById('movementControlsContainer');
    const actionControls = document.getElementById('actionControlsContainer');
    if (movementControls) movementControls.style.gap = `${controlButtonBaseStyles.gap * responsiveScale}px`;
    if (actionControls) actionControls.style.gap = `${controlButtonBaseStyles.gap * responsiveScale}px`;
}

function setupButtonControls() {
    const actionButtons = [
        { el: btnSpecial, action: activateSpecialAbilitySequence },
        { el: btnShoot, action: fireActualBullet },
        { el: btnKick, action: activateKick },
        { el: btnFinisher, action: activateFinisherMove },
        { el: btnInvisibility, action: activateInvisibility },
        { el: btnShield, action: activateShield }
    ];
    actionButtons.forEach(btnConfig => { if (btnConfig.el) { const handlePress = (e) => { e.preventDefault(); if (!btnConfig.el.disabled) { btnConfig.action(); btnConfig.el.classList.add('active-touch'); } }; const handleRelease = (e) => { e.preventDefault(); btnConfig.el.classList.remove('active-touch'); }; btnConfig.el.addEventListener('mousedown', handlePress); btnConfig.el.addEventListener('mouseup', handleRelease); btnConfig.el.addEventListener('mouseleave', handleRelease); btnConfig.el.addEventListener('touchstart', handlePress, { passive: false }); btnConfig.el.addEventListener('touchend', handleRelease, { passive: false }); } });
    
    const movementButtons = [{ el: btnLeft, key: 'ArrowLeft' }, { el: btnRight, key: 'ArrowRight' }, { el: btnUp, key: 'ArrowUp' }, { el: btnDown, key: 'ArrowDown' }];
    movementButtons.forEach(btnConfig => { if (btnConfig.el) { const handlePress = (e) => { e.preventDefault(); let canPress = !isPaused && gameState === 'playing' && !showingTransformationEffect && !isUsingFinisher && !player.isKicking; if (btnConfig.key === 'ArrowDown' && !(player.isTransformed && selectedTransformation === 'staron')) canPress = false; if (!canPress) return; keys[btnConfig.key] = true; btnConfig.el.classList.add('active-touch'); }; const handleRelease = (e) => { e.preventDefault(); keys[btnConfig.key] = false; btnConfig.el.classList.remove('active-touch'); }; btnConfig.el.addEventListener('mousedown', handlePress); btnConfig.el.addEventListener('mouseup', handleRelease); btnConfig.el.addEventListener('mouseleave', handleRelease); btnConfig.el.addEventListener('touchstart', handlePress, { passive: false }); btnConfig.el.addEventListener('touchend', handleRelease, { passive: false }); } });
}

function goToMainMenu() {
    if (typeof isPaused !== 'undefined') isPaused = false;
    if (typeof animationFrameId !== 'undefined' && animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    if (typeof gameState !== 'undefined') gameState = 'startScreen';
    if (pauseScreenOverlay) pauseScreenOverlay.style.display = 'none';
    if (winScreenOverlay) winScreenOverlay.style.display = 'none';
    if (messageOverlay) messageOverlay.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'none';
    if (startScreenContainer) startScreenContainer.style.display = 'flex';
    if (shopOverlayScreenContainer) shopOverlayScreenContainer.style.display = 'none';
    if (matchmakingScreenContainer) matchmakingScreenContainer.style.display = 'none';
    if (document.fullscreenElement) document.exitFullscreen().catch(err => {});
    updateInGameUIState();
    updateLevelSelectScreen();
    updateScoreDisplay();
}

function gameOver(message) {
    if (gameState === 'gameOver' || gameState === 'won' || gameState === 'levelComplete') return;
    gameState = 'gameOver';
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    updateInGameUIState();
    if (loseSound && loseSound.HAVE_ENOUGH_DATA) { loseSound.currentTime = 0; loseSound.play().catch(e => {}); }
    if (messageText) messageText.textContent = message;
    if (retryButton) retryButton.textContent = "إعادة المحاولة";
    if (messageOverlay) messageOverlay.style.display = 'flex';
}

function gameWon() {
    if (gameState === 'gameOver' || gameState === 'won' || gameState === 'levelComplete') return;
    gameState = 'levelComplete';
    updateInGameUIState();
    currentLevelStarsEarned = calculateStarsForLevel();
    const prevStars = parseInt(localStorage.getItem(LEVEL_STARS_KEY_PREFIX + currentLevel) || "0");
    if (currentLevelStarsEarned > prevStars) localStorage.setItem(LEVEL_STARS_KEY_PREFIX + currentLevel, currentLevelStarsEarned.toString());
    const levelConfig = levelsData[currentLevel - 1];
    if (levelConfig && levelConfig.pointsForCompletion) addScore(levelConfig.pointsForCompletion);
    const MAX_LEVELS = (typeof levelsData !== 'undefined') ? levelsData.length : 6;
    if (currentLevel < MAX_LEVELS && currentLevel + 1 > highestUnlockedLevel) { highestUnlockedLevel = currentLevel + 1; localStorage.setItem(MAX_UNLOCKED_LEVEL_KEY, highestUnlockedLevel.toString()); }
    if (winSound && winSound.HAVE_ENOUGH_DATA) { winSound.currentTime = 0; winSound.play().catch(e => {}); }
    
    // ### MODIFIED: Show the new win screen overlay ###
    if(winScreenOverlay) winScreenOverlay.style.display = 'flex';
    if(winScreenMessage && levelConfig) winScreenMessage.textContent = `أحسنت! لقد أكملت: ${levelConfig.gameTitleText}`;
    if(winScreenStarsContainer) winScreenStarsContainer.innerHTML = '⭐'.repeat(currentLevelStarsEarned);

    const buttonContainer = document.getElementById('winScreenButtonContainer');
    if(buttonContainer) {
        buttonContainer.style.display = 'block';
    }
    if (winScreenNextLevelBtn) {
        const MAX_LEVELS_IN_DATA = (typeof levelsData !== 'undefined') ? levelsData.length : 9;
        winScreenNextLevelBtn.style.display = (currentLevel < MAX_LEVELS_IN_DATA && !isOnlineMode) ? 'block' : 'none';
    }

    if (!animationFrameId && typeof gameLoop === 'function') { 
        lastLoopTime = performance.now();
        accumulatedFrameTime = 0;
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}


function showWinScreenButtons() {
    const buttonContainer = document.getElementById('winScreenButtonContainer');
    if(buttonContainer) buttonContainer.style.display = 'block';
    if (winScreenNextLevelBtn) { const MAX_LEVELS = (typeof levelsData !== 'undefined') ? levelsData.length : 6; winScreenNextLevelBtn.style.display = (currentLevel < MAX_LEVELS) ? 'block' : 'none'; }
}

function togglePauseGame() {
    if (typeof gameState === 'undefined' || (gameState !== 'playing' && gameState !== 'paused' && gameState !== 'levelComplete')) return;
    isPaused = !isPaused;
    if (isPaused) {
        if (typeof animationFrameId !== 'undefined' && animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
        if (pauseScreenOverlay) pauseScreenOverlay.style.display = 'flex';
        if (finisherBeamSound && !finisherBeamSound.paused) finisherBeamSound.pause();
    } else {
        if (pauseScreenOverlay) pauseScreenOverlay.style.display = 'none';
        if (typeof animationFrameId !== 'undefined' && !animationFrameId && typeof gameLoop === 'function') { lastLoopTime = performance.now(); accumulatedFrameTime = 0; animationFrameId = requestAnimationFrame(gameLoop); }
        if (typeof isUsingFinisher !== 'undefined' && isUsingFinisher && finisherBeamSound && finisherBeamSound.paused) finisherBeamSound.play().catch(e => {});
    }
    updateInGameUIState();
}

function showTransformationSelectMenu() {
    if (!transformationSelectOverlay || gameState !== 'playing') return;

    isPaused = true;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (finisherBeamSound && !finisherBeamSound.paused) finisherBeamSound.pause();

    const buttonContainer = transformationSelectOverlay.querySelector('.transform-selection-buttons');
    buttonContainer.innerHTML = '';

    const defaultBtn = document.createElement('button');
    defaultBtn.className = 'transform-select-btn';
    defaultBtn.dataset.transform = 'default';
    defaultBtn.innerHTML = `<img src="images/transform/transform11.png" alt="Burst"><span class="name">🚀 Burst</span>`;
    defaultBtn.onclick = () => {
        hideTransformationSelectMenu();
        if (typeof initiateTransformation === 'function') {
            initiateTransformation('default');
        }
    };
    buttonContainer.appendChild(defaultBtn);

    if (staronUnlocked) {
        const staronBtn = document.createElement('button');
        staronBtn.className = 'transform-select-btn';
        staronBtn.dataset.transform = 'staron';
        staronBtn.innerHTML = `<img src="images/staron/staronup.png" alt="Staron"><span class="name">🌟 Staron</span>`;
        staronBtn.onclick = () => {
            hideTransformationSelectMenu();
            if (typeof initiateTransformation === 'function') {
                initiateTransformation('staron');
            }
        };
        buttonContainer.appendChild(staronBtn);
    }
    
    transformationSelectOverlay.style.display = 'flex';
}

function hideTransformationSelectMenu() {
    if (!transformationSelectOverlay) return;
    
    transformationSelectOverlay.style.display = 'none';

    isPaused = false;
    if (!animationFrameId) {
        lastLoopTime = performance.now();
        accumulatedFrameTime = 0;
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}