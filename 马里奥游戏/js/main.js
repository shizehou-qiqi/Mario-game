/**
 * GameInfoDisplay类 - 游戏信息显示对象
 */
class GameInfoDisplay extends GameObject {
    constructor() {
        super(10, 10, 300, 120);
        this.tag = 'GameInfoDisplay';
        this.collisionEnabled = false;
        this.useGravity = false;
    }
    
    onRender(context, interpolation) {
        // 保存上下文并重置变换（使UI固定在屏幕上）
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        // 显示控制说明
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(10, 10, 280, 110);
        
        context.fillStyle = '#FFFFFF';
        context.font = '14px Arial';
        context.textAlign = 'left';
        context.fillText('控制说明:', 20, 30);
        context.fillText('← → 移动', 20, 50);
        context.fillText('空格键 跳跃', 20, 65);
        context.fillText('ESC 暂停', 20, 80);
        
        // 显示玩家状态（如果玩家存在）
        if (window.player) {
            const status = window.player.getStatus();
            context.fillStyle = '#CCCCCC';
            context.font = '12px Arial';
            context.fillText(`位置: (${Math.round(status.position.x)}, ${Math.round(status.position.y)})`, 20, 100);
            context.fillText(`状态: ${status.animationState}`, 20, 115);
        }
        
        // 显示关卡信息
        if (window.currentLevel) {
            const levelInfo = window.currentLevel.getLevelInfo();
            context.fillStyle = '#FFFF00';
            context.fillText(`关卡: ${levelInfo.platformCount} 平台`, 150, 100);
            context.fillText(`尺寸: ${levelInfo.width}x${levelInfo.height}`, 150, 115);
        }
        
        context.restore();
    }
}

/**
 * 马里奥游戏主入口文件
 * 负责初始化游戏和管理游戏状态
 */

// 全局游戏变量
let gameCanvas;
let gameContext;
let gameEngine;
let gameStateManager;
let inputManager;
let player;
let currentLevel;
let scoreManager;
let hudManager;
let audioManager;
let eventManager;
let particleSystem;

/**
 * 初始化游戏
 */
function initGame() {
    console.log('初始化马里奥游戏...');
    
    // 获取Canvas和上下文
    gameCanvas = document.getElementById('gameCanvas');
    gameContext = gameCanvas.getContext('2d');
    
    // 检查Canvas支持
    if (!gameContext) {
        alert('您的浏览器不支持Canvas，无法运行游戏！');
        return;
    }
    
    // 初始化事件管理器
    eventManager = new EventManager();
    window.gameEvents = eventManager; // 全局访问
    
    // 初始化音频管理器
    audioManager = new AudioManager();
    window.audioManager = audioManager; // 全局访问
    
    // 初始化输入管理器
    inputManager = new InputManager();
    window.inputManager = inputManager; // 全局访问
    
    // 初始化分数管理器
    scoreManager = new ScoreManager();
    window.scoreManager = scoreManager; // 全局访问
    
    try {
        // 初始化游戏引擎
        console.log('🔧 开始初始化游戏引擎...');
        gameEngine = new GameEngine(gameCanvas);
        gameEngine.init();
        console.log('✅ 游戏引擎初始化成功');
    } catch (error) {
        console.error('❌ 游戏引擎初始化失败:', error);

        // 如果游戏引擎初始化失败，直接在Canvas上绘制错误信息
        const ctx = gameCanvas.getContext('2d');
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

        ctx.fillStyle = '#FF0000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏引擎初始化失败', gameCanvas.width / 2, gameCanvas.height / 2);
        ctx.fillText(error.message, gameCanvas.width / 2, gameCanvas.height / 2 + 30);

        return; // 停止初始化
    }
    
    // 初始化游戏状态管理器
    gameStateManager = new GameStateManager(gameEngine, gameCanvas);
    gameStateManager.init();
    window.gameStateManager = gameStateManager; // 全局访问

    // 🔧 立即设置状态管理器回调
    setupStateManagerCallbacks();
    console.log('✅ 状态管理器回调设置完成');
    
    // 设置游戏事件监听器
    setupGameEventListeners();
    
    console.log('游戏初始化完成！');
}

/**
 * 设置游戏事件监听器
 */
function setupGameEventListeners() {
    // 玩家相关事件
    eventManager.on('playerJump', (data) => {
        audioManager.playSound('jump');
        if (particleSystem && data.player) {
            const playerPos = data.player.position;
            particleSystem.createJumpDust(
                playerPos.x + data.player.size.x / 2, 
                playerPos.y + data.player.size.y
            );
        }
    });
    
    eventManager.on('playerHurt', (data) => {
        audioManager.playSound('playerHurt');
        if (particleSystem && data.player) {
            const playerPos = data.player.position;
            particleSystem.createExplosion(
                playerPos.x + data.player.size.x / 2, 
                playerPos.y + data.player.size.y / 2,
                { color: '#FF6B6B', particleCount: 6 }
            );
        }
    });
    
    eventManager.on('playerDeath', (data) => {
        audioManager.playSequence('gameOver');
        if (particleSystem && data.player) {
            particleSystem.createDeathEffect(
                data.position.x, 
                data.position.y,
                { color: '#FF4444' }
            );
        }
    });
    
    // 敌人相关事件
    eventManager.on('enemyDefeated', (data) => {
        audioManager.playSound('enemyDefeat');
        if (particleSystem && data.enemy) {
            const enemyPos = data.enemy.position;
            particleSystem.createExplosion(
                enemyPos.x + data.enemy.size.x / 2, 
                enemyPos.y + data.enemy.size.y / 2,
                { color: '#8B4513', particleCount: 8 }
            );
        }
    });
    
    // 收集品相关事件
    eventManager.on('coinCollected', (data) => {
        audioManager.playSound('coin');
        if (particleSystem && data.coin) {
            const coinPos = data.coin.position;
            particleSystem.createCollectEffect(
                coinPos.x + data.coin.size.x / 2, 
                coinPos.y + data.coin.size.y / 2,
                { color: '#FFD700' }
            );
        }
    });
    
    // 游戏状态事件
    eventManager.on('gameStart', () => {
        audioManager.playBackgroundMusic('main');
    });
    
    eventManager.on('gameOver', () => {
        audioManager.stopBackgroundMusic();
    });
    
    eventManager.on('victory', () => {
        audioManager.stopBackgroundMusic();
        audioManager.playSequence('levelComplete');
    });
    
    // 分数相关事件
    eventManager.on('scoreAdded', (data) => {
        if (data.isNewHighScore) {
            audioManager.playSequence('powerUp');
        }
    });
    
    console.log('Game event listeners set up');
}

/**
 * 设置游戏状态管理器回调
 */
function setupStateManagerCallbacks() {
    // 游戏开始回调
    gameStateManager.on('gameStart', () => {
        console.log('Game start callback triggered');
        // 启动音频上下文（需要用户交互）
        if (audioManager) {
            audioManager.resume();
        }
        initializeGameplay();
    });
    
    // 游戏结束回调
    gameStateManager.on('gameOver', () => {
        console.log('Game over callback triggered');
        cleanupGameplay();
    });
    
    // 游戏重启回调
    gameStateManager.on('gameRestart', () => {
        console.log('Game restart callback triggered');
        cleanupGameplay();
    });
    
    // 返回菜单回调
    gameStateManager.on('returnToMenu', () => {
        console.log('Return to menu callback triggered');
        cleanupGameplay();
    });
    
    // 下一关回调
    gameStateManager.on('nextLevel', () => {
        console.log('Next level callback triggered');
        initializeGameplay();
    });
    
    // 胜利回调
    gameStateManager.on('victory', () => {
        console.log('Victory callback triggered');
        cleanupGameplay();
    });
    
    // 状态变化回调
    gameStateManager.onStateChange((newState, oldState) => {
        console.log(`State changed from ${oldState} to ${newState}`);
        updateUIForState(newState);
    });
    
    // 防止方向键滚动页面
    window.addEventListener('keydown', function(e) {
        if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code) > -1) {
            e.preventDefault();
        }
    }, false);
}

/**
 * 根据状态更新UI
 */
function updateUIForState(state) {
    // 根据不同状态更新UI显示
    switch (state) {
        case GameState.PLAYING:
            // 更新游戏数据到状态管理器
            if (scoreManager) {
                gameStateManager.updateGameData({
                    score: scoreManager.getCurrentScore(),
                    lives: scoreManager.getLives()
                });
            }
            break;
            
        case GameState.PAUSED:
            // 暂停状态的UI更新已在GameStateManager中处理
            break;
            
        case GameState.GAME_OVER:
        case GameState.VICTORY:
            // 游戏结束状态的UI更新已在GameStateManager中处理
            break;
    }
}

/**
 * 初始化游戏玩法（创建关卡、玩家等）
 */
function initializeGameplay() {
    console.log('🎮 开始初始化游戏玩法...');
    
    try {
        // 重置分数管理器
        if (scoreManager) {
            scoreManager.reset();
            console.log('✅ 分数管理器重置完成');
        }
        
        // 创建粒子系统
        createParticleSystem();
        
            // 创建关卡
    createLevel();
    
    // 将关卡设置为全局变量，供游戏引擎使用
    window.currentLevel = currentLevel;
    
    // 创建玩家
    createPlayer();
        
        // 创建HUD管理器
        createHUD();
        
        // 添加游戏UI
        addGameUI();
        
        console.log('🎉 游戏玩法初始化完成！');
        
        // 在Canvas上绘制一些初始内容
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏已启动！', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('使用方向键移动，空格键跳跃', canvas.width / 2, canvas.height / 2 + 10);
        
    } catch (error) {
        console.error('❌ 游戏玩法初始化失败:', error);
        
        // 在Canvas上显示错误信息
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FF0000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏玩法初始化失败', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText(error.message, canvas.width / 2, canvas.height / 2 + 10);
    }
}

/**
 * 清理游戏玩法（清除游戏对象）
 */
function cleanupGameplay() {
    // 清理游戏引擎中的所有对象
    if (gameEngine) {
        gameEngine.gameObjects.length = 0;
        gameEngine.objectsToAdd.length = 0;
        gameEngine.objectsToRemove.length = 0;
    }
    
    // 重置全局变量
    player = null;
    currentLevel = null;
    hudManager = null;
    particleSystem = null;
    
    console.log('Gameplay cleaned up');
}

/**
 * 游戏结束（由其他系统调用）
 */
function gameOver() {
    if (gameStateManager) {
        gameStateManager.gameOver();
    }
}

/**
 * 游戏胜利（由其他系统调用）
 */
function victory() {
    if (gameStateManager) {
        gameStateManager.victory();
    }
}

/**
 * 更新UI显示（全局函数，供游戏引擎调用）
 */
function updateUI() {
    if (gameStateManager && scoreManager) {
        gameStateManager.updateGameData({
            score: scoreManager.getCurrentScore(),
            lives: scoreManager.getLives()
        });
    }
}

/**
 * 创建粒子系统
 */
function createParticleSystem() {
    particleSystem = new ParticleSystem();
    window.particleSystem = particleSystem; // 全局访问
    gameEngine.addGameObject(particleSystem);
    console.log('Particle system created and added to game');
}

/**
 * 创建关卡
 */
function createLevel() {
    console.log('🏗️ 创建关卡...');
    
    try {
        currentLevel = new Level();
        currentLevel.loadLevel(); // 加载默认关卡
        
        // 将关卡对象添加到游戏引擎
        const levelObjects = currentLevel.getAllObjects();
        console.log(`📦 关卡对象数量: ${levelObjects.length}`);
        
        levelObjects.forEach(obj => {
            if (obj && gameEngine) {
                gameEngine.addGameObject(obj);
            }
        });
        
        console.log('✅ 关卡创建完成');
        
    } catch (error) {
        console.error('❌ 关卡创建失败:', error);
        throw error;
    }
}

/**
 * 创建玩家角色
 */
function createPlayer() {
    console.log('👤 创建玩家...');
    
    try {
        const spawnPoint = currentLevel ? currentLevel.getSpawnPoint() : { x: 50, y: 500 };
        player = new Player(spawnPoint.x, spawnPoint.y);

        // 🔧 重要：初始化玩家（设置输入处理等）
        player.init();

        // 将分数管理器传递给玩家
        if (scoreManager) {
            player.scoreManager = scoreManager;
            // 同步生命值
            player.health = scoreManager.getLives();
            player.maxHealth = scoreManager.getLives();
        }

        if (gameEngine) {
            gameEngine.addGameObject(player);
        }

        // 🔧 重要：将玩家添加到关卡的allObjects中，确保被渲染
        if (currentLevel) {
            currentLevel.allObjects.push(player);
            console.log('✅ 玩家已添加到关卡渲染列表');
            
            // 设置相机跟随玩家
            currentLevel.setCameraTarget(player);
        }

        console.log('✅ 玩家创建完成');
        
    } catch (error) {
        console.error('❌ 玩家创建失败:', error);
        throw error;
    }
}

/**
 * 创建HUD管理器
 */
function createHUD() {
    if (scoreManager) {
        hudManager = new HUDManager(scoreManager);
        gameEngine.addGameObject(hudManager);
        console.log('HUD Manager created and added to game');
    }
}

/**
 * 添加游戏UI显示对象
 */
function addGameUI() {
    const gameInfo = new GameInfoDisplay();
    gameEngine.addGameObject(gameInfo);
    
    console.log('游戏UI创建完成');
}



/**
 * 页面加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', initGame);