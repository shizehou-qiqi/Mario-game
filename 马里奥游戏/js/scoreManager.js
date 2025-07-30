/**
 * ScoreManager类 - 分数管理系统
 * 负责分数计算、显示、动画效果和本地存储
 */
class ScoreManager {
    constructor() {
        // 分数状态
        this.currentScore = 0;
        this.highScore = 0;
        this.lives = 3;
        this.maxLives = 3;
        
        // 分数动画
        this.scoreAnimations = [];
        this.animationDuration = 1.0; // 1秒动画时间
        
        // 分数规则
        this.scoreRules = {
            coin: 100,
            goomba: 100,
            koopa: 200,
            powerup: 1000,
            levelComplete: 5000,
            timeBonus: 50 // 每剩余秒数的奖励
        };
        
        // 连击系统
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboTimeLimit = 2.0; // 2秒内的连击有效
        this.comboMultiplier = 1.0;
        
        // 本地存储键名
        this.storageKeys = {
            highScore: 'mario_game_high_score',
            totalCoins: 'mario_game_total_coins',
            gamesPlayed: 'mario_game_games_played'
        };
        
        // 初始化
        this.loadHighScore();
        
        console.log('ScoreManager initialized');
    }
    
    /**
     * 重置分数（开始新游戏时调用）
     */
    reset() {
        this.currentScore = 0;
        this.lives = this.maxLives;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1.0;
        this.scoreAnimations = [];
        
        console.log('ScoreManager reset');
    }
    
    /**
     * 更新分数管理器
     * @param {number} deltaTime - 时间步长（秒）
     */
    update(deltaTime) {
        // 更新连击计时器
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.resetCombo();
            }
        }
        
        // 更新分数动画
        this.updateScoreAnimations(deltaTime);
    }
    
    /**
     * 添加分数
     * @param {string} type - 分数类型
     * @param {number} basePoints - 基础分数（可选，覆盖默认值）
     * @param {Object} position - 动画显示位置（可选）
     * @returns {number} 实际获得的分数
     */
    addScore(type, basePoints = null, position = null) {
        let points = basePoints || this.scoreRules[type] || 0;
        
        // 应用连击倍数
        if (this.comboMultiplier > 1.0) {
            points = Math.floor(points * this.comboMultiplier);
        }
        
        // 更新分数
        this.currentScore += points;
        
        // 更新连击
        this.updateCombo(type);
        
        // 创建分数动画
        if (position) {
            this.createScoreAnimation(points, position, type);
        }
        
        // 检查是否创造新纪录
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            this.saveHighScore();
        }
        
        console.log(`Score +${points} (${type}), Total: ${this.currentScore}, Combo: x${this.comboMultiplier.toFixed(1)}`);
        
        // 触发分数变化事件
        this.triggerScoreEvent('scoreAdded', {
            type: type,
            points: points,
            totalScore: this.currentScore,
            comboMultiplier: this.comboMultiplier,
            isNewHighScore: this.currentScore === this.highScore && points > 0
        });
        
        return points;
    }
    
    /**
     * 更新连击系统
     * @param {string} type - 分数类型
     */
    updateCombo(type) {
        // 只有特定类型才能触发连击
        const comboTypes = ['goomba', 'koopa', 'coin'];
        if (!comboTypes.includes(type)) {
            return;
        }
        
        // 增加连击数
        this.comboCount++;
        this.comboTimer = this.comboTimeLimit;
        
        // 计算连击倍数
        if (this.comboCount >= 2) {
            this.comboMultiplier = 1.0 + (this.comboCount - 1) * 0.2; // 每次连击增加20%
            this.comboMultiplier = Math.min(this.comboMultiplier, 3.0); // 最大3倍
        }
        
        console.log(`Combo: ${this.comboCount}, Multiplier: x${this.comboMultiplier.toFixed(1)}`);
    }
    
    /**
     * 重置连击
     */
    resetCombo() {
        if (this.comboCount > 1) {
            console.log(`Combo ended: ${this.comboCount} hits`);
        }
        
        this.comboCount = 0;
        this.comboMultiplier = 1.0;
        this.comboTimer = 0;
    }
    
    /**
     * 创建分数动画
     * @param {number} points - 分数
     * @param {Object} position - 位置 {x, y}
     * @param {string} type - 分数类型
     */
    createScoreAnimation(points, position, type) {
        const animation = {
            points: points,
            x: position.x,
            y: position.y,
            startY: position.y,
            time: 0,
            duration: this.animationDuration,
            type: type,
            alpha: 1.0,
            scale: 1.0
        };
        
        this.scoreAnimations.push(animation);
    }
    
    /**
     * 更新分数动画
     * @param {number} deltaTime - 时间步长
     */
    updateScoreAnimations(deltaTime) {
        for (let i = this.scoreAnimations.length - 1; i >= 0; i--) {
            const anim = this.scoreAnimations[i];
            anim.time += deltaTime;
            
            // 计算动画进度
            const progress = anim.time / anim.duration;
            
            if (progress >= 1.0) {
                // 动画结束，移除
                this.scoreAnimations.splice(i, 1);
                continue;
            }
            
            // 更新动画属性
            // Y位置向上移动
            anim.y = anim.startY - (progress * 50);
            
            // 透明度渐变
            anim.alpha = 1.0 - progress;
            
            // 缩放效果（开始时放大，然后缩小）
            if (progress < 0.2) {
                anim.scale = 1.0 + (progress / 0.2) * 0.5; // 前20%时间放大到1.5倍
            } else {
                anim.scale = 1.5 - ((progress - 0.2) / 0.8) * 0.5; // 后80%时间缩小回1倍
            }
        }
    }
    
    /**
     * 渲染分数动画
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {Object} camera - 相机对象（用于世界坐标转换）
     */
    renderScoreAnimations(context, camera = null) {
        context.save();
        
        for (const anim of this.scoreAnimations) {
            context.save();
            
            // 计算屏幕坐标
            let screenX = anim.x;
            let screenY = anim.y;
            
            if (camera) {
                screenX = anim.x - camera.x;
                screenY = anim.y - camera.y;
            }
            
            // 设置透明度和缩放
            context.globalAlpha = anim.alpha;
            context.translate(screenX, screenY);
            context.scale(anim.scale, anim.scale);
            
            // 选择颜色
            let color = '#FFFF00'; // 默认黄色
            switch (anim.type) {
                case 'coin':
                    color = '#FFD700'; // 金色
                    break;
                case 'goomba':
                case 'koopa':
                    color = '#FF6B6B'; // 红色
                    break;
                case 'powerup':
                    color = '#4ECDC4'; // 青色
                    break;
                case 'levelComplete':
                    color = '#45B7D1'; // 蓝色
                    break;
            }
            
            // 绘制分数文字
            context.fillStyle = color;
            context.strokeStyle = '#000000';
            context.lineWidth = 2;
            context.font = 'bold 16px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            const text = `+${anim.points}`;
            context.strokeText(text, 0, 0);
            context.fillText(text, 0, 0);
            
            // 如果有连击，显示连击信息
            if (this.comboMultiplier > 1.0 && (anim.type === 'goomba' || anim.type === 'koopa' || anim.type === 'coin')) {
                context.font = 'bold 12px Arial';
                context.fillStyle = '#FF69B4'; // 粉色
                const comboText = `x${this.comboMultiplier.toFixed(1)}`;
                context.strokeText(comboText, 0, -20);
                context.fillText(comboText, 0, -20);
            }
            
            context.restore();
        }
        
        context.restore();
    }
    
    /**
     * 减少生命值
     * @returns {boolean} 是否还有生命值
     */
    loseLife() {
        this.lives = Math.max(0, this.lives - 1);
        
        console.log(`Life lost! Lives remaining: ${this.lives}`);
        
        this.triggerScoreEvent('lifeLost', {
            livesRemaining: this.lives,
            isGameOver: this.lives <= 0
        });
        
        return this.lives > 0;
    }
    
    /**
     * 增加生命值
     * @param {number} amount - 增加的生命值数量
     */
    addLife(amount = 1) {
        this.lives = Math.min(this.maxLives, this.lives + amount);
        
        console.log(`Life gained! Lives: ${this.lives}`);
        
        this.triggerScoreEvent('lifeGained', {
            livesTotal: this.lives,
            livesGained: amount
        });
    }
    
    /**
     * 获取当前分数
     * @returns {number} 当前分数
     */
    getCurrentScore() {
        return this.currentScore;
    }
    
    /**
     * 获取最高分数
     * @returns {number} 最高分数
     */
    getHighScore() {
        return this.highScore;
    }
    
    /**
     * 获取当前生命值
     * @returns {number} 当前生命值
     */
    getLives() {
        return this.lives;
    }
    
    /**
     * 获取连击信息
     * @returns {Object} 连击信息
     */
    getComboInfo() {
        return {
            count: this.comboCount,
            multiplier: this.comboMultiplier,
            timeRemaining: this.comboTimer
        };
    }
    
    /**
     * 计算关卡完成奖励
     * @param {number} timeRemaining - 剩余时间（秒）
     * @returns {number} 奖励分数
     */
    calculateLevelCompleteBonus(timeRemaining = 0) {
        const baseBonus = this.scoreRules.levelComplete;
        const timeBonus = Math.floor(timeRemaining) * this.scoreRules.timeBonus;
        const totalBonus = baseBonus + timeBonus;
        
        this.addScore('levelComplete', totalBonus);
        
        return totalBonus;
    }
    
    /**
     * 从本地存储加载最高分数
     */
    loadHighScore() {
        try {
            const savedHighScore = localStorage.getItem(this.storageKeys.highScore);
            if (savedHighScore !== null) {
                this.highScore = parseInt(savedHighScore, 10) || 0;
                console.log(`High score loaded: ${this.highScore}`);
            }
        } catch (error) {
            console.warn('Failed to load high score from localStorage:', error);
            this.highScore = 0;
        }
    }
    
    /**
     * 保存最高分数到本地存储
     */
    saveHighScore() {
        try {
            localStorage.setItem(this.storageKeys.highScore, this.highScore.toString());
            console.log(`High score saved: ${this.highScore}`);
        } catch (error) {
            console.warn('Failed to save high score to localStorage:', error);
        }
    }
    
    /**
     * 保存游戏统计数据
     */
    saveGameStats() {
        try {
            // 增加游戏次数
            const gamesPlayed = parseInt(localStorage.getItem(this.storageKeys.gamesPlayed) || '0', 10) + 1;
            localStorage.setItem(this.storageKeys.gamesPlayed, gamesPlayed.toString());
            
            // 保存总收集金币数（如果需要的话）
            // 这里可以添加更多统计数据
            
            console.log(`Game stats saved. Games played: ${gamesPlayed}`);
        } catch (error) {
            console.warn('Failed to save game stats:', error);
        }
    }
    
    /**
     * 获取游戏统计数据
     * @returns {Object} 统计数据
     */
    getGameStats() {
        try {
            return {
                highScore: this.highScore,
                gamesPlayed: parseInt(localStorage.getItem(this.storageKeys.gamesPlayed) || '0', 10),
                totalCoins: parseInt(localStorage.getItem(this.storageKeys.totalCoins) || '0', 10)
            };
        } catch (error) {
            console.warn('Failed to load game stats:', error);
            return {
                highScore: this.highScore,
                gamesPlayed: 0,
                totalCoins: 0
            };
        }
    }
    
    /**
     * 清除所有保存的数据
     */
    clearSavedData() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            this.highScore = 0;
            console.log('All saved data cleared');
        } catch (error) {
            console.warn('Failed to clear saved data:', error);
        }
    }
    
    /**
     * 触发分数相关事件
     * @param {string} eventType - 事件类型
     * @param {Object} eventData - 事件数据
     */
    triggerScoreEvent(eventType, eventData) {
        // 如果有全局事件系统，使用它
        if (window.gameEvents && window.gameEvents.trigger) {
            window.gameEvents.trigger(eventType, eventData);
        }
        
        // 也可以使用自定义事件系统
        if (window.dispatchEvent) {
            const customEvent = new CustomEvent(`mario_${eventType}`, {
                detail: eventData
            });
            window.dispatchEvent(customEvent);
        }
    }
    
    /**
     * 获取分数显示格式化文本
     * @param {number} score - 分数
     * @returns {string} 格式化的分数文本
     */
    static formatScore(score) {
        return score.toString().padStart(6, '0');
    }
    
    /**
     * 销毁分数管理器
     */
    destroy() {
        this.scoreAnimations = [];
        console.log('ScoreManager destroyed');
    }
}

// 导出ScoreManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoreManager;
} else {
    window.ScoreManager = ScoreManager;
}