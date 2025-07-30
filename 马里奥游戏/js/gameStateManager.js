/**
 * 游戏状态管理器
 * 负责管理游戏的不同状态和状态转换
 */

// 游戏状态枚举
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory'
};

class GameStateManager {
    constructor(gameEngine, canvas) {
        this.gameEngine = gameEngine;
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        
        // 当前游戏状态
        this.currentState = GameState.MENU;
        this.previousState = null;
        
        // 状态变化回调
        this.stateChangeCallbacks = {};
        
        // UI元素引用
        this.uiElements = {};
        
        // 游戏数据
        this.gameData = {
            score: 0,
            lives: 3,
            level: 1,
            time: 300
        };
        
        console.log('GameStateManager initialized');
    }
    
    /**
     * 初始化状态管理器
     */
    init() {
        this.setupUIElements();
        this.setupEventListeners();
        this.setState(GameState.MENU);
        return this;
    }
    
    /**
     * 设置UI元素引用
     */
    setupUIElements() {
        this.uiElements = {
            gameMenu: document.getElementById('gameMenu'),
            gameOverScreen: document.getElementById('gameOver'),
            victoryScreen: document.getElementById('victoryScreen'),
            pauseOverlay: document.getElementById('pauseOverlay'),
            startButton: document.getElementById('startButton'),
            pauseButton: document.getElementById('pauseButton'),
            restartButton: document.getElementById('restartButton'),
            continueButton: document.getElementById('continueButton'),
            menuButton: document.getElementById('menuButton'),
            nextLevelButton: document.getElementById('nextLevelButton'),
            finalScore: document.getElementById('finalScore'),
            victoryScore: document.getElementById('victoryScore'),
            scoreElement: document.getElementById('score'),
            livesElement: document.getElementById('lives')
        };
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 开始游戏按钮
        if (this.uiElements.startButton) {
            this.uiElements.startButton.addEventListener('click', () => {
                this.startGame();
            });
        }
        
        // 暂停/继续按钮
        if (this.uiElements.pauseButton) {
            this.uiElements.pauseButton.addEventListener('click', () => {
                this.togglePause();
            });
        }
        
        // 重新开始按钮
        if (this.uiElements.restartButton) {
            this.uiElements.restartButton.addEventListener('click', () => {
                this.restartGame();
            });
        }
        
        // 继续游戏按钮
        if (this.uiElements.continueButton) {
            this.uiElements.continueButton.addEventListener('click', () => {
                this.resumeGame();
            });
        }
        
        // 返回菜单按钮（多个）
        const menuButtons = document.querySelectorAll('.menu-button');
        menuButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.returnToMenu();
            });
        });
        
        // 下一关按钮
        if (this.uiElements.nextLevelButton) {
            this.uiElements.nextLevelButton.addEventListener('click', () => {
                this.nextLevel();
            });
        }
        
        // 键盘事件
        document.addEventListener('keydown', (event) => {
            this.handleKeyDown(event);
        });
    }
    
    /**
     * 处理键盘输入
     */
    handleKeyDown(event) {
        switch (event.code) {
            case 'Escape':
                if (this.currentState === GameState.PLAYING) {
                    this.pauseGame();
                } else if (this.currentState === GameState.PAUSED) {
                    this.resumeGame();
                }
                break;
            case 'Enter':
                if (this.currentState === GameState.MENU) {
                    this.startGame();
                } else if (this.currentState === GameState.GAME_OVER) {
                    this.restartGame();
                } else if (this.currentState === GameState.VICTORY) {
                    this.nextLevel();
                }
                break;
        }
    }
    
    /**
     * 设置游戏状态
     */
    setState(newState) {
        if (this.currentState === newState) {
            return;
        }
        
        console.log(`State change: ${this.currentState} -> ${newState}`);
        
        this.previousState = this.currentState;
        this.currentState = newState;
        
        // 执行状态退出逻辑
        this.onStateExit(this.previousState);
        
        // 执行状态进入逻辑
        this.onStateEnter(newState);
        
        // 触发状态变化回调
        this.triggerStateChangeCallback(newState, this.previousState);
    }
    
    /**
     * 状态进入处理
     */
    onStateEnter(state) {
        switch (state) {
            case GameState.MENU:
                this.showMenu();
                this.gameEngine.stop();
                break;
                
            case GameState.PLAYING:
                this.hideAllScreens();
                this.showGameUI();

                // 🔧 确保游戏引擎可靠启动
                this.gameEngine.start();

                // 延迟检查游戏引擎是否真正启动
                setTimeout(() => {
                    if (!this.gameEngine.isRunning || this.gameEngine.frameCount === 0) {
                        console.warn('🔧 游戏引擎启动异常，尝试重启...');
                        this.gameEngine.stop();
                        this.gameEngine.start();
                    }
                }, 100);
                break;
                
            case GameState.PAUSED:
                this.showPauseScreen();
                this.gameEngine.pause();
                break;
                
            case GameState.GAME_OVER:
                this.showGameOverScreen();
                this.gameEngine.stop();
                break;
                
            case GameState.VICTORY:
                this.showVictoryScreen();
                this.gameEngine.stop();
                break;
        }
    }
    
    /**
     * 状态退出处理
     */
    onStateExit(state) {
        switch (state) {
            case GameState.MENU:
                this.hideMenu();
                break;
                
            case GameState.PAUSED:
                this.hidePauseScreen();
                break;
                
            case GameState.GAME_OVER:
                this.hideGameOverScreen();
                break;
                
            case GameState.VICTORY:
                this.hideVictoryScreen();
                break;
        }
    }
    
    /**
     * 开始游戏
     */
    startGame() {
        console.log('Starting new game');
        
        // 重置游戏数据
        this.resetGameData();
        
        // 通知游戏开始
        this.triggerCallback('gameStart');
        
        // 切换到游戏状态
        this.setState(GameState.PLAYING);
    }
    
    /**
     * 暂停游戏
     */
    pauseGame() {
        if (this.currentState === GameState.PLAYING) {
            this.setState(GameState.PAUSED);
        }
    }
    
    /**
     * 恢复游戏
     */
    resumeGame() {
        if (this.currentState === GameState.PAUSED) {
            this.setState(GameState.PLAYING);
        }
    }
    
    /**
     * 切换暂停状态
     */
    togglePause() {
        if (this.currentState === GameState.PLAYING) {
            this.pauseGame();
        } else if (this.currentState === GameState.PAUSED) {
            this.resumeGame();
        }
    }
    
    /**
     * 游戏结束
     */
    gameOver() {
        console.log('Game Over');
        
        // 保存最终分数
        this.saveGameStats();
        
        // 通知游戏结束
        this.triggerCallback('gameOver');
        
        // 切换到游戏结束状态
        this.setState(GameState.GAME_OVER);
    }
    
    /**
     * 游戏胜利
     */
    victory() {
        console.log('Victory!');
        
        // 保存游戏统计
        this.saveGameStats();
        
        // 通知游戏胜利
        this.triggerCallback('victory');
        
        // 切换到胜利状态
        this.setState(GameState.VICTORY);
    }
    
    /**
     * 重新开始游戏
     */
    restartGame() {
        console.log('Restarting game');
        
        // 通知游戏重启
        this.triggerCallback('gameRestart');
        
        // 开始新游戏
        this.startGame();
    }
    
    /**
     * 返回主菜单
     */
    returnToMenu() {
        console.log('Returning to menu');
        
        // 通知返回菜单
        this.triggerCallback('returnToMenu');
        
        // 切换到菜单状态
        this.setState(GameState.MENU);
    }
    
    /**
     * 下一关
     */
    nextLevel() {
        console.log('Next level');
        
        // 增加关卡数
        this.gameData.level++;
        
        // 通知下一关
        this.triggerCallback('nextLevel');
        
        // 开始新关卡
        this.setState(GameState.PLAYING);
    }
    
    /**
     * 重置游戏数据
     */
    resetGameData() {
        this.gameData = {
            score: 0,
            lives: 3,
            level: 1,
            time: 300
        };
        
        this.updateUI();
    }
    
    /**
     * 更新UI显示
     */
    updateUI() {
        if (this.uiElements.scoreElement) {
            this.uiElements.scoreElement.textContent = `分数: ${this.gameData.score}`;
        }
        
        if (this.uiElements.livesElement) {
            this.uiElements.livesElement.textContent = `生命: ${this.gameData.lives}`;
        }
    }
    
    /**
     * 显示菜单
     */
    showMenu() {
        if (this.uiElements.gameMenu) {
            this.uiElements.gameMenu.style.display = 'block';
        }
        
        // 在Canvas上绘制菜单背景
        this.renderMenuBackground();
    }
    
    /**
     * 隐藏菜单
     */
    hideMenu() {
        if (this.uiElements.gameMenu) {
            this.uiElements.gameMenu.style.display = 'none';
        }
    }
    
    /**
     * 显示暂停界面
     */
    showPauseScreen() {
        // 创建暂停覆盖层
        this.renderPauseOverlay();
        
        // 更新暂停按钮文本
        if (this.uiElements.pauseButton) {
            this.uiElements.pauseButton.textContent = '继续';
        }
    }
    
    /**
     * 隐藏暂停界面
     */
    hidePauseScreen() {
        // 更新暂停按钮文本
        if (this.uiElements.pauseButton) {
            this.uiElements.pauseButton.textContent = '暂停';
        }
    }
    
    /**
     * 显示游戏结束界面
     */
    showGameOverScreen() {
        if (this.uiElements.gameOverScreen) {
            this.uiElements.gameOverScreen.style.display = 'block';
        }
        
        // 更新最终分数
        if (this.uiElements.finalScore) {
            this.uiElements.finalScore.textContent = this.gameData.score;
        }
        
        // 在Canvas上绘制游戏结束背景
        this.renderGameOverBackground();
    }
    
    /**
     * 隐藏游戏结束界面
     */
    hideGameOverScreen() {
        if (this.uiElements.gameOverScreen) {
            this.uiElements.gameOverScreen.style.display = 'none';
        }
    }
    
    /**
     * 显示胜利界面
     */
    showVictoryScreen() {
        if (this.uiElements.victoryScreen) {
            this.uiElements.victoryScreen.style.display = 'block';
        }
        
        // 更新胜利分数
        if (this.uiElements.victoryScore) {
            this.uiElements.victoryScore.textContent = this.gameData.score;
        }
        
        // 在Canvas上绘制胜利背景
        this.renderVictoryBackground();
    }
    
    /**
     * 隐藏胜利界面
     */
    hideVictoryScreen() {
        if (this.uiElements.victoryScreen) {
            this.uiElements.victoryScreen.style.display = 'none';
        }
    }
    
    /**
     * 显示游戏UI
     */
    showGameUI() {
        if (this.uiElements.pauseButton) {
            this.uiElements.pauseButton.style.display = 'inline-block';
        }
    }
    
    /**
     * 隐藏所有界面
     */
    hideAllScreens() {
        this.hideMenu();
        this.hideGameOverScreen();
        this.hideVictoryScreen();
        this.hidePauseScreen();
    }
    
    /**
     * 渲染菜单背景
     */
    renderMenuBackground() {
        // 创建渐变背景
        const gradient = this.context.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');

        this.context.fillStyle = gradient;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制标题
        this.context.fillStyle = '#FF6B35';
        this.context.font = 'bold 48px Arial';
        this.context.textAlign = 'center';
        this.context.fillText('马里奥游戏', this.canvas.width / 2, this.canvas.height / 2 - 100);

        // 绘制提示文字
        this.context.fillStyle = '#333333';
        this.context.font = '20px Arial';
        this.context.fillText('按 Enter 开始游戏', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    /**
     * 渲染暂停覆盖层
     */
    renderPauseOverlay() {
        // 半透明覆盖层
        this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 暂停文字
        this.context.fillStyle = '#FFFFFF';
        this.context.font = 'bold 48px Arial';
        this.context.textAlign = 'center';
        this.context.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
        
        // 提示文字
        this.context.font = '20px Arial';
        this.context.fillText('按 ESC 或点击继续按钮恢复游戏', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }
    
    /**
     * 渲染游戏结束背景
     */
    renderGameOverBackground() {
        // 深色覆盖层
        this.context.fillStyle = 'rgba(139, 0, 0, 0.8)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 游戏结束文字
        this.context.fillStyle = '#FFFFFF';
        this.context.font = 'bold 48px Arial';
        this.context.textAlign = 'center';
        this.context.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // 分数显示
        this.context.font = '24px Arial';
        this.context.fillText(`最终分数: ${this.gameData.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // 提示文字
        this.context.font = '18px Arial';
        this.context.fillText('按 Enter 重新开始', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }
    
    /**
     * 渲染胜利背景
     */
    renderVictoryBackground() {
        // 金色覆盖层
        this.context.fillStyle = 'rgba(255, 215, 0, 0.9)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 胜利文字
        this.context.fillStyle = '#8B4513';
        this.context.font = 'bold 48px Arial';
        this.context.textAlign = 'center';
        this.context.fillText('恭喜通关！', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        // 分数显示
        this.context.font = '24px Arial';
        this.context.fillText(`关卡分数: ${this.gameData.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // 提示文字
        this.context.font = '18px Arial';
        this.context.fillText('按 Enter 进入下一关', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }
    
    /**
     * 保存游戏统计
     */
    saveGameStats() {
        try {
            const stats = {
                score: this.gameData.score,
                level: this.gameData.level,
                timestamp: Date.now()
            };
            
            // 保存到localStorage
            const highScore = localStorage.getItem('marioHighScore') || 0;
            if (this.gameData.score > highScore) {
                localStorage.setItem('marioHighScore', this.gameData.score.toString());
                console.log('New high score saved:', this.gameData.score);
            }
            
            // 保存游戏历史
            const gameHistory = JSON.parse(localStorage.getItem('marioGameHistory') || '[]');
            gameHistory.push(stats);
            
            // 只保留最近10次游戏记录
            if (gameHistory.length > 10) {
                gameHistory.splice(0, gameHistory.length - 10);
            }
            
            localStorage.setItem('marioGameHistory', JSON.stringify(gameHistory));
            
        } catch (error) {
            console.warn('Failed to save game stats:', error);
        }
    }
    
    /**
     * 获取最高分
     */
    getHighScore() {
        try {
            return parseInt(localStorage.getItem('marioHighScore') || '0');
        } catch (error) {
            console.warn('Failed to load high score:', error);
            return 0;
        }
    }
    
    /**
     * 注册状态变化回调
     */
    onStateChange(callback) {
        if (typeof callback === 'function') {
            this.stateChangeCallbacks.general = callback;
        }
    }
    
    /**
     * 注册特定事件回调
     */
    on(event, callback) {
        if (typeof callback === 'function') {
            this.stateChangeCallbacks[event] = callback;
        }
    }
    
    /**
     * 触发状态变化回调
     */
    triggerStateChangeCallback(newState, oldState) {
        if (this.stateChangeCallbacks.general) {
            this.stateChangeCallbacks.general(newState, oldState);
        }
    }
    
    /**
     * 触发特定事件回调
     */
    triggerCallback(event, data = null) {
        if (this.stateChangeCallbacks[event]) {
            this.stateChangeCallbacks[event](data);
        }
    }
    
    /**
     * 获取当前状态
     */
    getCurrentState() {
        return this.currentState;
    }
    
    /**
     * 获取游戏数据
     */
    getGameData() {
        return { ...this.gameData };
    }
    
    /**
     * 更新游戏数据
     */
    updateGameData(data) {
        Object.assign(this.gameData, data);
        this.updateUI();
    }
    
    /**
     * 检查是否在游戏中
     */
    isPlaying() {
        return this.currentState === GameState.PLAYING;
    }
    
    /**
     * 检查是否暂停
     */
    isPaused() {
        return this.currentState === GameState.PAUSED;
    }
    
    /**
     * 检查是否在菜单
     */
    isInMenu() {
        return this.currentState === GameState.MENU;
    }
    
    /**
     * 检查游戏是否结束
     */
    isGameOver() {
        return this.currentState === GameState.GAME_OVER;
    }
    
    /**
     * 检查是否胜利
     */
    isVictory() {
        return this.currentState === GameState.VICTORY;
    }
    
    /**
     * 销毁状态管理器
     */
    destroy() {
        // 清理事件监听器
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // 清理回调
        this.stateChangeCallbacks = {};
        
        console.log('GameStateManager destroyed');
    }
}

// 导出类和枚举
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameStateManager, GameState };
} else {
    window.GameStateManager = GameStateManager;
    window.GameState = GameState;
}