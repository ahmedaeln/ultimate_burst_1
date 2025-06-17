// js/config_assets.js (MODIFIED & CORRECTED)
console.log("config_assets.js loaded");

// =============================================
// GAME CONFIGURATION & CONSTANTS
// =============================================
const BASE_WIDTH = 1200;
const BASE_HEIGHT = 600;
const WORLD_WIDTH_BASE_MULTIPLIER = 5;
const WORLD_WIDTH_BASE = BASE_WIDTH * WORLD_WIDTH_BASE_MULTIPLIER;

const FIXED_TIMESTEP = 1000 / 60;

const DEFAULT_MAX_PLAYER_HITS = 5; // تم تقليلها من 5 لزيادة الصعوبة
const EXTRA_LIVES_AMOUNT = 2;

const TRANSFORMATION_DURATION = 18000; // تم تقليلها من 20000
const DEFAULT_TRANSFORMATION_COOLDOWN = 20000;
const POWERUP_COOLDOWN_REDUCTION = 4000;
const MIN_TRANSFORMATION_COOLDOWN = 5000;

const TRANSFORM_FRAME_DURATION = 75;
const TRANSFORM_ANIMATION_FRAMES_COUNT = 11;
const TRANSFORM_ANIMATION_TOTAL_DURATION = TRANSFORM_ANIMATION_FRAMES_COUNT * TRANSFORM_FRAME_DURATION;
const REVERT_TRANSFORM_GLOW_DURATION = TRANSFORM_ANIMATION_TOTAL_DURATION / 1.8;

const PLAYER_INVULNERABILITY_DURATION = 800; // تم تقليلها من 1000

const INVISIBILITY_DURATION = 10000;
const INVISIBILITY_COOLDOWN = 25000;
const INVISIBILITY_PLAYER_ALPHA = 0.4;

const SHIELD_DURATION = 3000;
const SHIELD_COOLDOWN = 20000;

const FINISHER_DURATION = 1500;
const FINISHER_BEAM_FRAME_DURATION = 80;
const FINISHER_ABILITY_PRICE = 10;

// ### NEW: Kick ability constants ###
const KICK_DURATION = 300; // مدة الركلة بالمللي ثانية
const KICK_ANIMATION_SPEED = 100; // سرعة تبديل إطارات الركلة
const KICK_COOLDOWN = 1200; // فترة التهدئة بعد كل ركلة
const KICK_RANGE = 80; // مدى تأثير الركلة
const KICK_PUSHBACK = 15; // قوة دفع الأعداء للخلف
const KICK_DAMAGE = 1; // مقدار الضرر

const BULLET_SPEED_BASE = 10;
const BULLET_WIDTH_BASE = 45;
const BULLET_HEIGHT_BASE = 30;
const MAX_BULLETS = 5;
const SHOOT_COOLDOWN = 300;

const BASE_GRAVITY = 0.85;

// إضافة جديدة
const STARON_UNLOCK_PRICE = 30;

const PLATFORM_TILE_BASE_WIDTH = 64;
const PLATFORM_TILE_BASE_HEIGHT_THIN = 28;
const GROUND_PLATFORM_BASE_HEIGHT = 60;

const flyingEnemyBaseWidth = 100;
const flyingEnemyBaseHeight = 70;
const flyingEnemyBaseSpeed = 2.8; // تم زيادتها
const FLYING_ENEMY_SHOOT_COOLDOWN = 4500; // تم تقليلها
const FLYING_ENEMY_SHOOT_FRAME_DURATION = 300;
const FLYING_ENEMY_Y_OFFSET = 70;

const rocketBaseWidth = 20;
const rocketBaseHeight = 50;
const ROCKET_BASE_SPEED = 3.8; // تم زيادتها
const ROCKET_DAMAGE = 1;

const EXPLOSION_DURATION = 300;
const explosionBaseWidth = 50;
const explosionBaseHeight = 50;

const WIN_SCREEN_STAR_DELAY = 700;
const WIN_SCREEN_STAR_ANIMATION_DURATION = 1000;
const WIN_SCREEN_TEXT_PULSE_SPEED = 300;
const WIN_SCREEN_DISPLAY_DURATION_AFTER_STARS = 3000;

const ENEMY_SHIELD_DURATION = 5000;
const ENEMY_SHIELD_COOLDOWN = 15000;
const ENEMY_SHIELD_HEALTH_THRESHOLD = 0.4;
const ENEMY_SHIELD_PLAYER_TRANSFORM_RANGE = 300;

// Storage Keys
const MAX_UNLOCKED_LEVEL_KEY = 'ultimateBurst_maxUnlockedLevel_v1';
const SCORE_STORAGE_KEY = 'ultimateBurst_playerScore_v1';
const COOLDOWN_REDUCTION_KEY = 'ultimateBurst_cooldownUpgradePurchased_v1';
const EXTRA_LIFE_KEY = 'ultimateBurst_extraLifePurchased_v1';
const INVISIBILITY_KEY = 'ultimateBurst_invisibilityPurchased_v1';
const SHIELD_KEY = 'ultimateBurst_shieldPurchased_v1';
const FINISHER_ABILITY_KEY = 'ultimateBurst_finisherAbilityPurchased_v1';
const LEVEL_STARS_KEY_PREFIX = 'ultimateBurst_levelStars_v1_';
// إضافة جديدة: مفاتيح Staron
const STARON_UNLOCKED_KEY = 'ultimateBurst_staronUnlocked_v1';
const SELECTED_TRANSFORMATION_KEY = 'ultimateBurst_selectedTransformation_v1';


// =============================================
// IMAGE ASSETS
// =============================================
const images = {
    ultimateBurstLogo: { src: 'public/images/ultimate_burst_logo.png', img: new Image(), loaded: false },
    playerNormal: { src: 'public/images/player_normal_idle.png', img: new Image(), loaded: false },
    playerNormalWalk: [
        { src: 'public/images/walknormal/walknormal1.png', img: new Image(), loaded: false },
        { src: 'public/images/walknormal/walknormal2.png', img: new Image(), loaded: false },
        { src: 'public/images/walknormal/walknormal3.png', img: new Image(), loaded: false },
        { src: 'public/images/walknormal/walknormal4.png', img: new Image(), loaded: false },
        { src: 'public/images/walknormal/walknormal5.png', img: new Image(), loaded: false },
        { src: 'public/images/walknormal/walknormal6.png', img: new Image(), loaded: false },
    ],
    playerNormalJump: [
        { src: 'public/images/jumpnormal/jumpnormal1.png', img: new Image(), loaded: false },
        { src: 'public/images/jumpnormal/jumpnormal2.png', img: new Image(), loaded: false },
        { src: 'public/images/jumpnormal/jumpnormal3.png', img: new Image(), loaded: false },
        { src: 'public/images/jumpnormal/jumpnormal4.png', img: new Image(), loaded: false },
        { src: 'public/images/jumpnormal/jumpnormal5.png', img: new Image(), loaded: false }
    ],
    playerKickFrames: [
        { src: 'public/images/push/push1.png', img: new Image(), loaded: false },
        { src: 'public/images/push/push2.png', img: new Image(), loaded: false },
        { src: 'public/images/push/push3.png', img: new Image(), loaded: false },
    ],
    playerTransformFrames: [
        { src: 'public/images/transform/transform1.png', img: new Image(), loaded: false },
        { src: 'public/images/transform/transform2.png', img: new Image(), loaded: false },
        { src: 'public/images/transform/transform3.png', img: new Image(), loaded: false },
        { src: 'public/images/transform/transform4.png', img: new Image(), loaded: false },
        { src: 'public/images/transform/transform5.png', img: new Image(), loaded: false },
        { src: 'public/images/transform/transform6.png', img: new Image(), loaded: false },
        { src: 'public/images/transform/transform7.png', img: new Image(), loaded: false },
        { src: 'public/images/transform/transform8.png', img: new Image(), loaded: false },
        { src: 'public/images/transform/transform9.png', img: new Image(), loaded: false },
        { src: 'public/images/transform/transform10.png', img: new Image(), loaded: false },
        { src: 'public/images/transform/transform11.png', img: new Image(), loaded: false }
    ],
    playerTransformedWalk: [
        { src: 'public/images/walktransfomal/1.png', img: new Image(), loaded: false },
        { src: 'public/images/walktransfomal/2.png', img: new Image(), loaded: false },
        { src: 'public/images/walktransfomal/3.png', img: new Image(), loaded: false },
        { src: 'public/images/walktransfomal/4.png', img: new Image(), loaded: false },
        { src: 'public/images/walktransfomal/5.png', img: new Image(), loaded: false },
        { src: 'public/images/walktransfomal/6.png', img: new Image(), loaded: false },
    ],
    playerTransformedJump: [
        { src: 'public/images/jumptransfomal/jumptransfomal1.png', img: new Image(), loaded: false },
        { src: 'public/images/jumptransfomal/jumptransfomal2.png', img: new Image(), loaded: false },
        { src: 'public/images/jumptransfomal/jumptransfomal3.png', img: new Image(), loaded: false },
        { src: 'public/images/jumptransfomal/jumptransfomal4.png', img: new Image(), loaded: false }
    ],
    playerTransformedShoot: { src: 'public/images/firetransfomal.png', img: new Image(), loaded: false },
    playerStaronIdle: { src: 'public/images/staron/staronup.png', img: new Image(), loaded: false },
    playerStaronWalk: [
        { src: 'public/images/staron/walk_1.png', img: new Image(), loaded: false },
        { src: 'public/images/staron/walk_2.png', img: new Image(), loaded: false },
        { src: 'public/images/staron/walk_3.png', img: new Image(), loaded: false },
        { src: 'public/images/staron/walk_4.png', img: new Image(), loaded: false },
        { src: 'public/images/staron/walk_5.png', img: new Image(), loaded: false },
        { src: 'public/images/staron/walk_6.png', img: new Image(), loaded: false },
    ],
    infinitySymbol: { src: 'public/images/infinity.png', img: new Image(), loaded: false },
    finisherBeamFrames: [
        { src: 'public/images/finsher/finsher1.png', img: new Image(), loaded: false },
        { src: 'public/images/finsher/finsher2.png', img: new Image(), loaded: false },
        { src: 'public/images/finsher/finsher3.png', img: new Image(), loaded: false },
        { src: 'public/images/finsher/finsher4.png', img: new Image(), loaded: false },
    ],
    enemyWalkFrames: [
        { src: 'public/images/hex_walk_1.png', img: new Image(), loaded: false },
        { src: 'public/images/hex_walk_2.png', img: new Image(), loaded: false },
        { src: 'public/images/hex_walk_3.png', img: new Image(), loaded: false },
        { src: 'public/images/hex_walk_4.png', img: new Image(), loaded: false },
        { src: 'public/images/hex_walk_5.png', img: new Image(), loaded: false },
        { src: 'public/images/hex_walk_6.png', img: new Image(), loaded: false },
    ],
    portalFrames: [
        { src: 'public/images/gate/gate_1.png', img: new Image(), loaded: false },
        { src: 'public/images/gate/gate_2.png', img: new Image(), loaded: false },
        { src: 'public/images/gate/gate_3.png', img: new Image(), loaded: false },
        { src: 'public/images/gate/gate_4.png', img: new Image(), loaded: false },
        { src: 'public/images/gate/gate_5.png', img: new Image(), loaded: false },
    ],
    gameBackgrounds: [
        { src: 'public/images/background_level_1.jpg', img: new Image(), loaded: false },
        { src: 'public/images/background_level_2.jpg', img: new Image(), loaded: false },
        { src: 'public/images/background_level_3.gif', img: new Image(), loaded: false },
        { src: 'public/images/background_level_4.jpg', img: new Image(), loaded: false },
        { src: 'public/images/background_level_5.jpg', img: new Image(), loaded: false },
        { src: 'public/images/background_level_6.gif', img: new Image(), loaded: false },
        { src: 'public/images/background_level_7.jpg', img: new Image(), loaded: false },
        { src: 'public/images/background_level_8.jpg', img: new Image(), loaded: false },
        { src: 'public/images/backfight.jpg', img: new Image(), loaded: false }
    ],
    bulletImage: { src: 'public/images/rayfiretransfomal.png', img: new Image(), loaded: false },
    powerupImage: { src: 'public/images/storngitem.png', img: new Image(), loaded: false },
    heartImage: { src: 'public/images/heart.png', img: new Image(), loaded: false },
    platformTile: { src: 'public/images/plat.png', img: new Image(), loaded: false },
    flyingEnemyImage: { src: 'public/images/flying/normal.png', img: new Image(), loaded: false },
    flyingEnemyShootImage: { src: 'public/images/flying/fire.png', img: new Image(), loaded: false },
    rocketImage: { src: 'public/images/flying/rocket.png', img: new Image(), loaded: false },
    explosionEffect: { src: 'public/images/flying/effect.png', img: new Image(), loaded: false },
    enemyShieldEffect: { src: 'public/images/enemy_shield_effect.png', img: new Image(), loaded: false },
    winStarImage: { src: 'public/images/star.png', img: new Image(), loaded: false },
    chaserEnemyIdleImage: { src: 'public/images/chaser_enemy_idle.png', img: new Image(), loaded: false },
    chaserEnemyRunFrames: [
        { src: 'public/images/chaser_run/1.png', img: new Image(), loaded: false },
        { src: 'public/images/chaser_run/2.png', img: new Image(), loaded: false },
        { src: 'public/images/chaser_run/3.png', img: new Image(), loaded: false },
        { src: 'public/images/chaser_run/4.png', img: new Image(), loaded: false },
        { src: 'public/images/chaser_run/5.png', img: new Image(), loaded: false },
        { src: 'public/images/chaser_run/6.png', img: new Image(), loaded: false },
        { src: 'public/images/chaser_run/7.png', img: new Image(), loaded: false }
    ],
    questionMark: { src: 'public/images/question_mark.png', img: new Image(), loaded: false },
    swordEnemyWalkFrames: [
        { src: 'public/images/sword_enemy_walk_1.png', img: new Image(), loaded: false },
        { src: 'public/images/sword_enemy_walk_2.png', img: new Image(), loaded: false },
        { src: 'public/images/sword_enemy_walk_3.png', img: new Image(), loaded: false },
        { src: 'public/images/sword_enemy_walk_4.png', img: new Image(), loaded: false },
    ],
    swordEnemyAttackFrames: [
        { src: 'public/images/sword_enemy_attack_1.png', img: new Image(), loaded: false },
        { src: 'public/images/sword_enemy_attack_2.png', img: new Image(), loaded: false },
        { src: 'public/images/sword_enemy_attack_3.png', img: new Image(), loaded: false },
        { src: 'public/images/sword_enemy_attack_4.png', img: new Image(), loaded: false },
    ],
    gunnerEnemyWalkFrames: [
        { src: 'public/images/enemies/gunner_walk_1.png', img: new Image(), loaded: false },
        { src: 'public/images/enemies/gunner_walk_2.png', img: new Image(), loaded: false },
        { src: 'public/images/enemies/gunner_walk_3.png', img: new Image(), loaded: false },
        { src: 'public/images/enemies/gunner_walk_4.png', img: new Image(), loaded: false },
        { src: 'public/images/enemies/gunner_walk_5.png', img: new Image(), loaded: false },
        { src: 'public/images/enemies/gunner_walk_6.png', img: new Image(), loaded: false },
        { src: 'public/images/enemies/gunner_walk_7.png', img: new Image(), loaded: false },
    ],
    gunnerEnemyShootFrames: [
        { src: 'public/images/gunner_shoot_1.png', img: new Image(), loaded: false },
        { src: 'public/images/gunner_shoot_2.png', img: new Image(), loaded: false },
    ],
    gunnerBulletImage: { src: 'public/images/gunner_bullet.png', img: new Image(), loaded: false },
    lionShoutFrames: [
        { src: 'public/images/lion/shouting_1.png', img: new Image(), loaded: false },
        { src: 'public/images/lion/shouting_2.png', img: new Image(), loaded: false },
        { src: 'public/images/lion/shouting_3.png', img: new Image(), loaded: false },
        { src: 'public/images/lion/shouting_4.png', img: new Image(), loaded: false },
        { src: 'public/images/lion/shouting_5.png', img: new Image(), loaded: false },
    ],
    lionRunFrames: [
        { src: 'public/images/lion/run_1.png', img: new Image(), loaded: false },
        { src: 'public/images/lion/run_2.png', img: new Image(), loaded: false },
        { src: 'public/images/lion/run_3.png', img: new Image(), loaded: false },
        { src: 'public/images/lion/run_4.png', img: new Image(), loaded: false },
        { src: 'public/images/lion/run_5.png', img: new Image(), loaded: false },
        { src: 'public/images/lion/run_6.png', img: new Image(), loaded: false },
    ],
    clownWalkFrames: [
        { src: 'public/images/clown/walk_1.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/walk_2.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/walk_3.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/walk_4.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/walk_5.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/walk_6.png', img: new Image(), loaded: false },
    ],
    clownIdleFrames: [
        { src: 'public/images/clown/up_1.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/up_2.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/up_3.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/up_4.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/up_5.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/up_6.png', img: new Image(), loaded: false },
    ],
    clownShootFrames: [
        { src: 'public/images/clown/fire1.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/fire2.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/fire3.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/fire4.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/fire5.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/fire6.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/fire7.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/fire8.png', img: new Image(), loaded: false },
    ],
    clownBallFrames: [
        { src: 'public/images/ball.png', img: new Image(), loaded: false },
        { src: 'public/images/ball1.png', img: new Image(), loaded: false },
    ],
    pieClownWalkFrames: [
        { src: 'public/images/clown/pie/walk_1.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/pie/walk_2.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/pie/walk_3.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/pie/walk_4.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/pie/walk_5.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/pie/walk_6.png', img: new Image(), loaded: false },
    ],
    pieClownShootFrames: [
        { src: 'public/images/clown/pie/pie1.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/pie/pie2.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/pie/pie3.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/pie/pie4.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/pie/pie5.png', img: new Image(), loaded: false },
        { src: 'public/images/clown/pie/pie6.png', img: new Image(), loaded: false },
    ],
    pieImage: { src: 'public/images/pie.png', img: new Image(), loaded: false },
    shopInvisibility: { src: 'public/images/shop/hide.png', img: new Image(), loaded: false },
    shopShield: { src: 'public/images/shop/tect.png', img: new Image(), loaded: false },
    shopTransformDuration: { src: 'https://i.postimg.cc/7Z9GCmxN/42b078a6f7954b4181ef3c6447a51b7f.png', img: new Image(), loaded: false }, // This is an external link, no change needed.
    shopDoubleJump: { src: 'public/images/shop/jump.gif', img: new Image(), loaded: false },
    shopCooldownReduction: { src: 'public/images/shop/time.png', img: new Image(), loaded: false },
    shopExtraLife: { src: 'public/images/shop/heart.png', img: new Image(), loaded: false },
    shopScoreMultiplier: { src: 'public/images/shop/dubel.png', img: new Image(), loaded: false },
    shopFinisherAbility: { src: 'public/images/shop/finsher.png', img: new Image(), loaded: false },
};
images.playerTransformed = images.playerTransformedWalk[0];


// =============================================
// AUDIO ASSETS
// =============================================
let transformSound, shootSound, winSound, loseSound,
    finisherActivateSound, finisherBeamSound, invisibilitySound,
    shieldActivateSound, shieldHitSound, starAppearSound, enemyShieldActivateSound,
    playerKickSound, lionRoarSound, swordCutSound;

function initializeAudioElements() {
    transformSound = document.getElementById('transformSound');
    shootSound = document.getElementById('shootSound');
    winSound = document.getElementById('winSound');
    loseSound = document.getElementById('loseSound');
    finisherActivateSound = document.getElementById('finisherActivateSound');
    finisherBeamSound = document.getElementById('finisherBeamSound');
    invisibilitySound = document.getElementById('invisibilitySound');
    shieldActivateSound = document.getElementById('shieldActivateSound');
    shieldHitSound = document.getElementById('shieldHitSound');
    starAppearSound = document.getElementById('starAppearSound');
    enemyShieldActivateSound = document.getElementById('enemyShieldActivateSound');
    playerKickSound = document.getElementById('playerKickSound');
    lionRoarSound = document.getElementById('lionRoarSound');
    swordCutSound = document.getElementById('swordCutSound');
}

// =============================================
// ASSET LOADING FUNCTIONS
// =============================================
let imagesToLoad = 0;
let imagesLoadedCount = 0;
let allGameAssetsLoaded = false;

function calculateImagesToLoad() {
    let count = 0;
    for (const key in images) {
        if (key === 'playerTransformed' && images.playerTransformedWalk && images.playerTransformedWalk.length > 0) {
            continue;
        }
        if (Array.isArray(images[key])) {
            images[key].forEach(imgData => {
                if (imgData && typeof imgData === 'object' && imgData.hasOwnProperty('src')) {
                    count++;
                }
            });
        } else if (images[key] && typeof images[key] === 'object' && images[key].hasOwnProperty('src')) {
            count++;
        }
    }
    return count;
}

function updateLoadingProgress() {
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        const totalImages = calculateImagesToLoad();
        const percentage = totalImages > 0 ? (imagesLoadedCount / totalImages) * 100 : 100;
        progressFill.style.width = Math.min(percentage, 100) + '%';
        if (percentage >= 100 && imagesLoadedCount >= totalImages) {
            allGameAssetsLoaded = true;
        }
    }
    const loadingScreenText = document.getElementById('loadingScreenText');
    if (loadingScreenText) {
        const total = calculateImagesToLoad();
        if (total > 0) {
            loadingScreenText.textContent = `جاري تحميل اللعبة... (${imagesLoadedCount}/${total})`;
        } else {
            loadingScreenText.textContent = `جاري تحميل اللعبة...`;
        }
    }
}

function loadImage(imageKey, arrayIndex = -1, callbackOnLoad) {
    let imgData;
    let specificKey = imageKey;

    if (arrayIndex !== -1 && Array.isArray(images[imageKey])) {
        imgData = images[imageKey][arrayIndex];
        specificKey = `${imageKey}[${arrayIndex}]`;
    } else if (images[imageKey] && typeof images[imageKey] === 'object' && !Array.isArray(images[imageKey])) {
        imgData = images[imageKey];
    } else {
        if (callbackOnLoad) callbackOnLoad(false);
        return;
    }

    if (!imgData || !imgData.hasOwnProperty('src')) {
        if (callbackOnLoad) callbackOnLoad(false);
        return;
    }

    imgData.img.src = imgData.src;
    imgData.img.onload = () => {
        imgData.loaded = true;
        imagesLoadedCount++;
        if (imageKey === 'playerTransformedWalk' && arrayIndex === 0) {
            if (images.playerTransformed) images.playerTransformed.loaded = true;
        }
        if (callbackOnLoad) callbackOnLoad(true);
    };
    imgData.img.onerror = () => {
        console.error(`فشل في تحميل الصورة ${specificKey} من ${imgData.src}`);
        imgData.loaded = false;
        if (imageKey === 'playerTransformedWalk' && arrayIndex === 0) {
            if (images.playerTransformed) images.playerTransformed.loaded = false;
        }
        imagesLoadedCount++;
        if (callbackOnLoad) callbackOnLoad(false);
    };
}


function loadAllImages(masterCallback) {
    imagesToLoad = calculateImagesToLoad();
    imagesLoadedCount = 0;
    allGameAssetsLoaded = false;

    if (imagesToLoad === 0) {
        allGameAssetsLoaded = true;
        if (masterCallback) masterCallback();
        updateLoadingProgress();
        return;
    }

    let attemptedToLoad = 0;

    const checkCompletion = () => {
        attemptedToLoad++;
        updateLoadingProgress();

        if (attemptedToLoad >= imagesToLoad) {
            allGameAssetsLoaded = true;
            if (imagesLoadedCount < imagesToLoad) {
                console.warn(`اكتمل تحميل الأصول، ولكن ${imagesToLoad - imagesLoadedCount} صورة فشلت في التحميل.`);
            } else {
                 console.log("All game assets loaded successfully.");
            }
            if (masterCallback) masterCallback();
        }
    };

    for (const key in images) {
        if (key === 'playerTransformed') continue;

        if (Array.isArray(images[key])) {
            images[key].forEach((imgDataElement, index) => {
                if (imgDataElement && imgDataElement.src) {
                    loadImage(key, index, checkCompletion);
                } else {
                    attemptedToLoad++;
                    updateLoadingProgress();
                }
            });
        } else if (images[key] && typeof images[key] === 'object' && images[key].hasOwnProperty('src')) {
            loadImage(key, -1, checkCompletion);
        } else {
            attemptedToLoad++;
            updateLoadingProgress();
        }
    }
    if (attemptedToLoad >= imagesToLoad) {
        checkCompletion();
    }
}


// =============================================
// LEVELS DATA
// =============================================
const levelsData = [
    { // Level 1
        gameTitleText: "مدينة الأبطال",
        basePlatformsData: [
            { x: 0, yOffset: GROUND_PLATFORM_BASE_HEIGHT, width: WORLD_WIDTH_BASE, height: GROUND_PLATFORM_BASE_HEIGHT, isGround: true, color: '#2E8B57' },
            { x: 180, yOffset: 150 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: 900, yOffset: 150 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 55 },
            { x: 400, yOffset: 190 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: 650, yOffset: 140 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: 880, yOffset: 230 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4 },
            { x: 1200, yOffset: 180 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: 1500, yOffset: 210 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2, isMoving: true, moveAxis: 'x', moveMinX: 1450, moveMaxX: 1700, moveSpeedX: 1.5, moveDirectionX: 1 },
            { x: WORLD_WIDTH_BASE - 1150, yOffset: 200 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: WORLD_WIDTH_BASE - 780, yOffset: 170 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3, isEnemySpawnPlatform: true },
            { x: WORLD_WIDTH_BASE - 450, yOffset: 240 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
        ],
        enemyInitialHealth: 0,
        hasNewChaserEnemy: true,
        numChaserEnemies: 9,
        powerupPlatformIndices: [2, 5, 6],
        hasFlyingEnemies: false,
        pointsForCompletion: 50
    },
    { // Level 2
        gameTitleText: "معركة النيازك",
        basePlatformsData: [
            { x: 0, yOffset: GROUND_PLATFORM_BASE_HEIGHT, width: WORLD_WIDTH_BASE, height: GROUND_PLATFORM_BASE_HEIGHT, isGround: true, color: '#1A522D' },
            { x: 150, yOffset: 170 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: 380, yOffset: 240 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: 580, yOffset: 150 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: 950, yOffset: 200 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: 1150, yOffset: 170 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2, isMoving: true, moveAxis: 'y', moveMinY: 150, moveMaxY: 250, moveSpeedY: 1.0, moveDirectionY: 1 },
            { x: 1050, yOffset: 260 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4 },
            { x: WORLD_WIDTH_BASE - 1250, yOffset: 180 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: WORLD_WIDTH_BASE - 900, yOffset: 220 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: WORLD_WIDTH_BASE - 550, yOffset: 160 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4, isEnemySpawnPlatform: true },
        ],
        enemyInitialHealth: 0,
        powerupPlatformIndices: [2, 6, 7, 4],
        hasFlyingEnemies: true,
        numFlyingEnemies: 2,
        hasNewChaserEnemy: true,
        numChaserEnemies: 8,
        pointsForCompletion: 75
    },
    { // Level 3
        gameTitleText: "القلعة الجليدية",
        basePlatformsData: [
            { x: 0, yOffset: GROUND_PLATFORM_BASE_HEIGHT, width: WORLD_WIDTH_BASE, height: GROUND_PLATFORM_BASE_HEIGHT, isGround: true, color: '#33334C' },
            { x: 200, yOffset: 160 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: 500, yOffset: 220 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: 1500, yOffset: 250 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 44, isMoving: true, moveAxis: 'x', moveMinX: 100, moveMaxX: 200, moveSpeedX: 1.2, moveDirectionX: 1 },
            { x: 750, yOffset: 180 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4 },
            { x: 1100, yOffset: 250 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: 1400, yOffset: 190 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2, isMoving: true, moveAxis: 'y', moveMinY: 150, moveMaxY: 300, moveSpeedY: 1.2, moveDirectionY: 1 },
            { x: 1700, yOffset: 220 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: WORLD_WIDTH_BASE - 1000, yOffset: 190 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: WORLD_WIDTH_BASE - 650, yOffset: 230 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3, isEnemySpawnPlatform: true },
        ],
        enemyInitialHealth: 20,
        powerupPlatformIndices: [1, 4, 6],
        hasFlyingEnemies: true,
        numFlyingEnemies: 2,
        hasNewChaserEnemy: true,
        numChaserEnemies: 9,
        flyingEnemyInitialHealth: 2,
        pointsForCompletion: 100
    },
    { // Level 4
        gameTitleText: "قلعة الأوهام",
        basePlatformsData: [
            { x: 0, yOffset: GROUND_PLATFORM_BASE_HEIGHT, width: WORLD_WIDTH_BASE, height: GROUND_PLATFORM_BASE_HEIGHT, isGround: true, color: '#4B0082' },
            { x: 300, yOffset: 200 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3, isMoving: true, moveAxis: 'x', moveMinX: 250, moveMaxX: 650, moveSpeedX: 1.8, moveDirectionX: 1 },
            { x: 750, yOffset: 150 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: 1000, yOffset: 250 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2, isMoving: true, moveAxis: 'y', moveMinY: 220, moveMaxY: 380, moveSpeedY: 1.5, moveDirectionY: 1 },
            { x: 1300, yOffset: 180 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: 1600, yOffset: 210 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: WORLD_WIDTH_BASE - 1200, yOffset: 180 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: WORLD_WIDTH_BASE - 800, yOffset: 280 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4, isEnemySpawnPlatform: true },
        ],
        enemyInitialHealth: 25,
        powerupPlatformIndices: [1, 4],
        hasFlyingEnemies: true,
        numFlyingEnemies: 5,
        flyingEnemyInitialHealth: 1,
        hasNewChaserEnemy: true,
        numChaserEnemies: 7,
        chaserInitialHealth: 5,
        pointsForCompletion: 150
    },
    { // Level 5
        gameTitleText: "البركان الثائر",
        worldWidthMultiplier: 1.2,
        basePlatformsData: [
            { x: 0, yOffset: GROUND_PLATFORM_BASE_HEIGHT, width: (WORLD_WIDTH_BASE * 1.2), height: GROUND_PLATFORM_BASE_HEIGHT, isGround: true, color: '#5C4033' },
            { x: 200, yOffset: 180 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: 550, yOffset: 250 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4 },
            { x: 900, yOffset: 160 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: 1200, yOffset: 220 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: 1550, yOffset: 300 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4 },
            { x: 1850, yOffset: 180 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2, isMoving: true, moveAxis: 'x', moveMinX: 1800, moveMaxX: 2100, moveSpeedX: 1.7, moveDirectionX: 1 },
            { x: (WORLD_WIDTH_BASE * 1.2) * 0.25, yOffset: 150 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: (WORLD_WIDTH_BASE * 1.2) * 0.65, yOffset: 180 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: 400, yOffset: 350 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2, isMoving: true, moveAxis: 'x', moveMinX: 350, moveMaxX: 750, moveSpeedX: 2.0, moveDirectionX: 1 },
            { x: 1000, yOffset: 100 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3, isMoving: true, moveAxis: 'y', moveMinY: 80, moveMaxY: 250, moveSpeedY: 1.8, moveDirectionY: -1 },
            { x: WORLD_WIDTH_BASE * 1.2 - 1400, yOffset: 200 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: WORLD_WIDTH_BASE * 1.2 - 1000, yOffset: 280 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2, isEnemySpawnPlatform: true },
            { x: WORLD_WIDTH_BASE * 1.2 - 700, yOffset: 190 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: WORLD_WIDTH_BASE * 1.2 - 600, yOffset: 170 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4 },
        ],
        enemyInitialHealth: 25,
        powerupPlatformIndices: [1, 4, 7, 11],
        hasFlyingEnemies: true,
        numFlyingEnemies: 7,
        flyingEnemyInitialHealth: 2,
        hasSwordEnemy: true,
        numSwordEnemies: 3,
        hasNewChaserEnemy: true,
        numChaserEnemies: 8,
        chaserInitialHealth: 8,
        pointsForCompletion: 200
    },
    { // Level 6
        gameTitleText: "الهاوية المتحركة",
        worldWidthMultiplier: 1.8,
        basePlatformsData: [
            { x: 0, yOffset: GROUND_PLATFORM_BASE_HEIGHT, width: WORLD_WIDTH_BASE * 1.8, height: GROUND_PLATFORM_BASE_HEIGHT, isGround: true, color: '#4A3B31' },
            { x: WORLD_WIDTH_BASE * 0.1, yOffset: 250 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 }, 
            { x: WORLD_WIDTH_BASE * 0.4, yOffset: 190 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2, isMoving: true, moveAxis: 'y', moveMinY: 150, moveMaxY: 320, moveSpeedY: 1.5, moveDirectionY: 1 },
            { x: WORLD_WIDTH_BASE * 0.5, yOffset: 300 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: WORLD_WIDTH_BASE * 1.2, yOffset: 280 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2, isMoving: true, moveAxis: 'x', moveMinX: WORLD_WIDTH_BASE * 1.15, moveMaxX: WORLD_WIDTH_BASE * 1.35, moveSpeedX: 1.9, moveDirectionX: 1 },
            { x: WORLD_WIDTH_BASE * 1.4, yOffset: 220 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4, isEnemySpawnPlatform: true },
            { x: WORLD_WIDTH_BASE * 0.3, yOffset: 180 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: WORLD_WIDTH_BASE * 1.6, yOffset: 160 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
        ],
        enemyInitialHealth: 33,
        hasFlyingEnemies: true,
        numFlyingEnemies: 4,
        flyingEnemyInitialHealth: 3,
        hasNewChaserEnemy: true,
        numChaserEnemies: 2,
        chaserInitialHealth: 10,
        hasGunnerEnemy: true,
        numGunnerEnemies: 4,
        hasSwordEnemy: true,
        numSwordEnemies: 1,
        swordEnemyInitialHealth: 15,
        powerupPlatformIndices: [1, 2, 3], 
        pointsForCompletion: 300
    },
    { // Level 7
        gameTitleText: "المصنع المهجور",
        worldWidthMultiplier: 2.0,
        basePlatformsData: [
            { x: 0, yOffset: GROUND_PLATFORM_BASE_HEIGHT, width: WORLD_WIDTH_BASE * 2.0, height: GROUND_PLATFORM_BASE_HEIGHT, isGround: true, color: '#3D4A4D' },
            { x: WORLD_WIDTH_BASE * 0.2, yOffset: 150 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4 },
            { x: WORLD_WIDTH_BASE * 0.25, yOffset: 200 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 13 },
            { x: WORLD_WIDTH_BASE * 0.5, yOffset: 300 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3, isEnemySpawnPlatform: true },
            { x: WORLD_WIDTH_BASE * 0.9, yOffset: 250 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 5, isMoving: true, moveAxis: 'x', moveMinX: WORLD_WIDTH_BASE * 0.85, moveMaxX: WORLD_WIDTH_BASE * 1.15, moveSpeedX: 2.2, moveDirectionX: 1 },
            { x: WORLD_WIDTH_BASE * 0.65, yOffset: 180 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3 },
            { x: WORLD_WIDTH_BASE * 1.4, yOffset: 220 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4 },
            { x: WORLD_WIDTH_BASE * 1.6, yOffset: 320 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2 },
            { x: WORLD_WIDTH_BASE * 1.7, yOffset: 150 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3, isMoving: true, moveAxis: 'y', moveMinY: 150, moveMaxY: 280, moveSpeedY: 1.8, moveDirectionY: 1},
        ],
        enemyInitialHealth: 35,
        hasFlyingEnemies: true,
        numFlyingEnemies: 3,
        flyingEnemyInitialHealth: 4,
        hasNewChaserEnemy: true,
        numChaserEnemies: 2,
        chaserInitialHealth: 12,
        hasGunnerEnemy: true,
        numGunnerEnemies: 2,
        gunnerEnemyInitialHealth: 18,
        hasLionEnemy: true,
        numLionEnemies: 4,
        lionInitialHealth: 5,
        powerupPlatformIndices: [2, 8],
        pointsForCompletion: 400
    },
    { // Level 8
        gameTitleText: "سيرك المهرجين",
        worldWidthMultiplier: 1.9,
        basePlatformsData: [
            { x: 0, yOffset: GROUND_PLATFORM_BASE_HEIGHT, width: WORLD_WIDTH_BASE * 1.9, height: GROUND_PLATFORM_BASE_HEIGHT, isGround: true, color: '#A0522D' },
            { x: 200, yOffset: 150 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 50 },
            { x: 900, yOffset: 250 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3, isMoving: true, moveAxis: 'x', moveMinX: 850, moveMaxX: 1200, moveSpeedX: 1.2, moveDirectionX: 1 },
            { x: 1500, yOffset: 220 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 5 },
            { x: (WORLD_WIDTH_BASE * 1.9) * 0.4, yOffset: 350 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 2},
            { x: (WORLD_WIDTH_BASE * 1.9) * 0.6, yOffset: 180 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4 },
            { x: (WORLD_WIDTH_BASE * 1.9) * 0.8, yOffset: 300 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3, isMoving: true, moveAxis: 'y', moveMinY: 280, moveMaxY: 400, moveSpeedY: 1.0, moveDirectionY: -1  },
       ],
        enemyInitialHealth: 1, // لا يوجد عدو رئيسي هنا
        numenemyInitia: 1,
        hasFlyingEnemies: true,
        numFlyingEnemies: 1,
        flyingEnemyInitialHealth: 1,
        hasSwordEnemy: true,
        numSwordEnemies: 1,
        hasNewChaserEnemy: true,
        numChaserEnemies: 1,
        hasGunnerEnemy: true,
        hasLionEnemy: true,
        numLionEnemies: 1,
        lionInitialHealth: 1,
        
        // Clown Enemy Properties for Level 8
        hasClownEnemy: true,
        numClownEnemies: 1, // تم تقليل العدد لإفساح المجال للعدو الجديد
        clownInitialHealth: 1,
        
        // ### NEW ###: Pie Clown Enemy Properties for Level 8
        hasPieClownEnemy: true,
        numPieClownEnemies: 1,
        pieClownInitialHealth: 1,
        
        powerupPlatformIndices: [1, 3],
        pointsForCompletion: 500
    },
    // ### NEW LEVEL ###
    { // Level 9 - Battle Arena
        gameTitleText: "ساحة المعركة",
        worldWidthMultiplier: 1.0, // عالم أصغر
        basePlatformsData: [
            // منصة أرضية تغطي كامل المساحة
            { x: 0, yOffset: GROUND_PLATFORM_BASE_HEIGHT, width: (WORLD_WIDTH_BASE * 1.0), height: GROUND_PLATFORM_BASE_HEIGHT, isGround: true, color: '#333' },
            // منصة في المنتصف مرتفعة
            { x: ((BASE_WIDTH * 1.0) / 4) - ((4 * PLATFORM_TILE_BASE_WIDTH)/2), yOffset: 180, numTiles: 20 },
            { x: 200, yOffset: 250 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 3, isMoving: true, moveAxis: 'x', moveMinX: 500, moveMaxX: 5500, moveSpeedX: 6, moveDirectionX: 1 },
            { x: 4500, yOffset: 150 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 20 },
            { x: 2000, yOffset: 220 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 29 },
            { x: 1620, yOffset: 190 + PLATFORM_TILE_BASE_HEIGHT_THIN, numTiles: 4 },
            // منصتان جانبيتان متماثلتان
            { x: 170, yOffset: 200, numTiles: 9 },
            { x: (BASE_WIDTH * 1.0) - 3000 - (4 * PLATFORM_TILE_BASE_WIDTH), yOffset: 200, numTiles: 2 },
        ],
        enemyInitialHealth: 0, // لا يوجد عدو رئيسي
        hasFlyingEnemies: false,
        hasNewChaserEnemy: false,
        hasSwordEnemy: false,
        hasGunnerEnemy: false,
        hasLionEnemy: false,
        hasClownEnemy: false,
        hasPieClownEnemy: false,
        powerupPlatformIndices: [], // لا توجد عناصر قوة
        pointsForCompletion: 0 // لا توجد نقاط عند الفوز
    }
];
const MAX_LEVELS = levelsData.length;