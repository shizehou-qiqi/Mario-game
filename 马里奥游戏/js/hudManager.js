/**
 * HUDManager类 - 游戏界面管理系统
 * 负责显示分数、生命值、连击等游戏信息
 */
class HUDManager extends GameObject {
    constructor(scoreManager) {
        super(0, 0, 800, 600);

        this.tag = 'HUD';
        this.scoreManager = scoreManager;

        // HUD不参与物理和碰撞
        this.useGravity = false;
        this.collisionEnabled = false;

        // 🔧 修复：HUD不应该有可见的背景色
        this.color = 'transparent'; // 设置为透明
        this.visible = true; // 但仍然可见（用于渲染UI元素）
        
        // HUD元素配置
        this.config = {
            padding: 20,
            fontSize: {
                large: 24,
                medium: 18,
                small: 14
            },
            colors: {
                primary: '#FFFFFF',
                secondary: '#FFFF00',
                accent: '#FF6B6B',
                background: 'rgba(0, 0, 0, 0.7)',
                success: '#4ECDC4',
                warning: '#FFA726'
            },
            positions: {
                topLeft: { x: 20, y: 20 },
                topRight: { x: 780, y: 20 },
                topCenter: { x: 400, y: 20 },
                bottomLeft: { x: 20, y: 580 },
                bottomRight: { x: 780, y: 580 }
            }
        };
        
        // 动画状态
        this.animations = {
            scoreFlash: {
                active: false,
                time: 0,
                duration: 0.5
            },
            newHighScore: {
                active: false,
                time: 0,
                duration: 2.0
            },
            comboDisplay: {
                active: false,
                time: 0,
                duration: 1.0,
                scale: 1.0
            }
        };
        
        // 生命值显示
        this.heartSize = 20;
        this.heartSpacing = 25;
        
        console.log('HUDManager initialized');
    }
    
    /**
     * 更新HUD
     * @param {number} deltaTime - 时间步长
     */
    onUpdate(deltaTime) {
        // 更新动画
        this.updateAnimations(deltaTime);
        
        // 检查分数变化以触发动画
        this.checkScoreChanges();
    }
    
    /**
     * 更新动画状态
     * @param {number} deltaTime - 时间步长
     */
    updateAnimations(deltaTime) {
        // 更新分数闪烁动画
        if (this.animations.scoreFlash.active) {
            this.animations.scoreFlash.time += deltaTime;
            if (this.animations.scoreFlash.time >= this.animations.scoreFlash.duration) {
                this.animations.scoreFlash.active = false;
                this.animations.scoreFlash.time = 0;
            }
        }
        
        // 更新新纪录动画
        if (this.animations.newHighScore.active) {
            this.animations.newHighScore.time += deltaTime;
            if (this.animations.newHighScore.time >= this.animations.newHighScore.duration) {
                this.animations.newHighScore.active = false;
                this.animations.newHighScore.time = 0;
            }
        }
        
        // 更新连击显示动画
        if (this.animations.comboDisplay.active) {
            this.animations.comboDisplay.time += deltaTime;
            const progress = this.animations.comboDisplay.time / this.animations.comboDisplay.duration;
            
            if (progress >= 1.0) {
                this.animations.comboDisplay.active = false;
                this.animations.comboDisplay.time = 0;
                this.animations.comboDisplay.scale = 1.0;
            } else {
                // 缩放动画：开始时放大，然后缩小
                if (progress < 0.3) {
                    this.animations.comboDisplay.scale = 1.0 + (progress / 0.3) * 0.5;
                } else {
                    this.animations.comboDisplay.scale = 1.5 - ((progress - 0.3) / 0.7) * 0.5;
                }
            }
        }
    }
    
    /**
     * 检查分数变化
     */
    checkScoreChanges() {
        // 这里可以监听分数变化事件来触发动画
        // 由于我们有ScoreManager的引用，可以直接检查状态
        const comboInfo = this.scoreManager.getComboInfo();
        
        // 如果有连击且连击显示动画未激活，启动动画
        if (comboInfo.count > 1 && !this.animations.comboDisplay.active) {
            this.triggerComboAnimation();
        }
    }
    
    /**
     * 触发分数闪烁动画
     */
    triggerScoreFlash() {
        this.animations.scoreFlash.active = true;
        this.animations.scoreFlash.time = 0;
    }
    
    /**
     * 触发新纪录动画
     */
    triggerNewHighScore() {
        this.animations.newHighScore.active = true;
        this.animations.newHighScore.time = 0;
    }
    
    /**
     * 触发连击动画
     */
    triggerComboAnimation() {
        this.animations.comboDisplay.active = true;
        this.animations.comboDisplay.time = 0;
        this.animations.comboDisplay.scale = 1.0;
    }
    
    /**
     * 渲染HUD
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} interpolation - 插值因子
     */
    /**
     * 重写render方法，跳过默认的矩形渲染
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} interpolation - 插值因子
     */
    render(context, interpolation = 0) {
        if (!this.visible || this.destroyed) {
            return;
        }

        // 🔧 修复：直接调用onRender，跳过GameObject的默认矩形渲染
        this.onRender(context, interpolation);
    }

    onRender(context, interpolation) {
        // 保存上下文并重置变换（使HUD固定在屏幕上）
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);

        // 渲染主要HUD元素
        this.renderScoreDisplay(context);
        this.renderLivesDisplay(context);
        this.renderComboDisplay(context);
        this.renderHighScoreDisplay(context);

        // 渲染特殊效果
        this.renderNewHighScoreEffect(context);

        // 渲染分数动画（由ScoreManager处理）
        if (this.scoreManager && this.scoreManager.renderScoreAnimations) {
            // 获取相机信息（如果有的话）
            let camera = null;
            if (window.currentLevel && window.currentLevel.camera) {
                camera = window.currentLevel.camera;
            }
            this.scoreManager.renderScoreAnimations(context, camera);
        }

        context.restore();
    }
    
    /**
     * 渲染分数显示
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderScoreDisplay(context) {
        const pos = this.config.positions.topLeft;
        const score = this.scoreManager.getCurrentScore();
        
        // 背景
        this.renderBackground(context, pos.x - 10, pos.y - 5, 200, 35);
        
        // 分数标签
        context.fillStyle = this.config.colors.secondary;
        context.font = `${this.config.fontSize.medium}px Arial`;
        context.textAlign = 'left';
        context.fillText('分数', pos.x, pos.y);
        
        // 分数值（带闪烁效果）
        let scoreColor = this.config.colors.primary;
        if (this.animations.scoreFlash.active) {
            const flashProgress = this.animations.scoreFlash.time / this.animations.scoreFlash.duration;
            const alpha = 0.5 + 0.5 * Math.sin(flashProgress * Math.PI * 6); // 快速闪烁
            scoreColor = `rgba(255, 255, 255, ${alpha})`;
        }
        
        context.fillStyle = scoreColor;
        context.font = `bold ${this.config.fontSize.large}px Arial`;
        context.fillText(ScoreManager.formatScore(score), pos.x, pos.y + 20);
    }
    
    /**
     * 渲染生命值显示
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderLivesDisplay(context) {
        const pos = this.config.positions.topRight;
        const lives = this.scoreManager.getLives();
        
        // 背景
        const bgWidth = 120;
        this.renderBackground(context, pos.x - bgWidth + 10, pos.y - 5, bgWidth, 35);
        
        // 生命值标签
        context.fillStyle = this.config.colors.accent;
        context.font = `${this.config.fontSize.medium}px Arial`;
        context.textAlign = 'right';
        context.fillText('生命', pos.x - 80, pos.y);
        
        // 渲染心形图标
        for (let i = 0; i < 3; i++) {
            const heartX = pos.x - 70 + i * this.heartSpacing;
            const heartY = pos.y + 15;
            
            if (i < lives) {
                // 满心形（红色）
                this.renderHeart(context, heartX, heartY, this.config.colors.accent, true);
            } else {
                // 空心形（灰色）
                this.renderHeart(context, heartX, heartY, '#666666', false);
            }
        }
    }
    
    /**
     * 渲染心形图标
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} color - 颜色
     * @param {boolean} filled - 是否填充
     */
    renderHeart(context, x, y, color, filled) {
        const size = this.heartSize / 2;
        
        context.save();
        context.translate(x, y);
        
        // 简化的心形绘制
        context.fillStyle = color;
        context.strokeStyle = color;
        context.lineWidth = 2;
        
        if (filled) {
            // 填充心形
            context.fillRect(-size/2, -size/2, size, size/2);
            context.fillRect(-size/4, -size/2, size/2, size);
            
            // 简单的心形效果
            context.beginPath();
            context.arc(-size/4, -size/4, size/4, 0, Math.PI * 2);
            context.fill();
            context.beginPath();
            context.arc(size/4, -size/4, size/4, 0, Math.PI * 2);
            context.fill();
        } else {
            // 空心形
            context.strokeRect(-size/2, -size/2, size, size/2);
            context.strokeRect(-size/4, -size/2, size/2, size);
            
            context.beginPath();
            context.arc(-size/4, -size/4, size/4, 0, Math.PI * 2);
            context.stroke();
            context.beginPath();
            context.arc(size/4, -size/4, size/4, 0, Math.PI * 2);
            context.stroke();
        }
        
        context.restore();
    }
    
    /**
     * 渲染连击显示
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderComboDisplay(context) {
        const comboInfo = this.scoreManager.getComboInfo();
        
        if (comboInfo.count <= 1) {
            return; // 没有连击时不显示
        }
        
        const pos = this.config.positions.topCenter;
        
        context.save();
        
        // 应用缩放动画
        if (this.animations.comboDisplay.active) {
            context.translate(pos.x, pos.y + 40);
            context.scale(this.animations.comboDisplay.scale, this.animations.comboDisplay.scale);
            context.translate(-pos.x, -pos.y - 40);
        }
        
        // 背景
        this.renderBackground(context, pos.x - 80, pos.y + 35, 160, 50);
        
        // 连击文字
        context.fillStyle = this.config.colors.warning;
        context.font = `bold ${this.config.fontSize.large}px Arial`;
        context.textAlign = 'center';
        context.fillText(`${comboInfo.count} 连击!`, pos.x, pos.y + 55);
        
        // 倍数显示
        context.fillStyle = this.config.colors.success;
        context.font = `${this.config.fontSize.medium}px Arial`;
        context.fillText(`x${comboInfo.multiplier.toFixed(1)}`, pos.x, pos.y + 75);
        
        // 连击时间条
        if (comboInfo.timeRemaining > 0) {
            const barWidth = 120;
            const barHeight = 4;
            const barX = pos.x - barWidth / 2;
            const barY = pos.y + 85;
            
            // 背景条
            context.fillStyle = 'rgba(255, 255, 255, 0.3)';
            context.fillRect(barX, barY, barWidth, barHeight);
            
            // 进度条
            const progress = comboInfo.timeRemaining / 2.0; // 假设连击时间限制是2秒
            const progressWidth = barWidth * progress;
            
            let progressColor = this.config.colors.success;
            if (progress < 0.3) {
                progressColor = this.config.colors.accent; // 时间不多时变红
            } else if (progress < 0.6) {
                progressColor = this.config.colors.warning; // 时间一般时变橙
            }
            
            context.fillStyle = progressColor;
            context.fillRect(barX, barY, progressWidth, barHeight);
        }
        
        context.restore();
    }
    
    /**
     * 渲染最高分数显示
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderHighScoreDisplay(context) {
        const pos = this.config.positions.bottomLeft;
        const highScore = this.scoreManager.getHighScore();
        
        if (highScore <= 0) {
            return; // 没有最高分数时不显示
        }
        
        // 背景
        this.renderBackground(context, pos.x - 10, pos.y - 35, 200, 35);
        
        // 最高分数标签
        context.fillStyle = this.config.colors.success;
        context.font = `${this.config.fontSize.small}px Arial`;
        context.textAlign = 'left';
        context.fillText('最高分数', pos.x, pos.y - 20);
        
        // 最高分数值
        context.fillStyle = this.config.colors.primary;
        context.font = `${this.config.fontSize.medium}px Arial`;
        context.fillText(ScoreManager.formatScore(highScore), pos.x, pos.y - 5);
    }
    
    /**
     * 渲染新纪录效果
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderNewHighScoreEffect(context) {
        if (!this.animations.newHighScore.active) {
            return;
        }
        
        const progress = this.animations.newHighScore.time / this.animations.newHighScore.duration;
        const alpha = 1.0 - progress;
        
        context.save();
        context.globalAlpha = alpha;
        
        // 彩虹色效果
        const hue = (this.animations.newHighScore.time * 360) % 360;
        context.fillStyle = `hsl(${hue}, 100%, 50%)`;
        
        // 缩放效果
        const scale = 1.0 + Math.sin(progress * Math.PI) * 0.3;
        context.translate(400, 200);
        context.scale(scale, scale);
        
        // 新纪录文字
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.strokeStyle = '#000000';
        context.lineWidth = 4;
        context.strokeText('新纪录!', 0, 0);
        context.fillText('新纪录!', 0, 0);
        
        context.restore();
    }
    
    /**
     * 渲染背景
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    renderBackground(context, x, y, width, height) {
        context.fillStyle = this.config.colors.background;
        context.fillRect(x, y, width, height);
        
        // 边框
        context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        context.lineWidth = 1;
        context.strokeRect(x, y, width, height);
    }
    
    /**
     * 处理分数事件
     * @param {string} eventType - 事件类型
     * @param {Object} eventData - 事件数据
     */
    handleScoreEvent(eventType, eventData) {
        switch (eventType) {
            case 'scoreAdded':
                this.triggerScoreFlash();
                if (eventData.isNewHighScore) {
                    this.triggerNewHighScore();
                }
                break;
                
            case 'lifeLost':
                // 可以添加生命值丢失的视觉效果
                break;
                
            case 'lifeGained':
                // 可以添加生命值获得的视觉效果
                break;
        }
    }
    
    /**
     * 设置HUD可见性
     * @param {boolean} visible - 是否可见
     */
    setVisible(visible) {
        this.active = visible;
    }
    
    /**
     * 销毁HUD管理器
     */
    onDestroy() {
        console.log('HUDManager destroyed');
        super.onDestroy();
    }
}

// 导出HUDManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HUDManager;
} else {
    window.HUDManager = HUDManager;
}