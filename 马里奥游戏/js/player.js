/**
 * Player类 - 玩家角色控制系统
 * 继承自GameObject，实现马里奥角色的移动、跳跃和动画
 */
class Player extends GameObject {
    constructor(x = 50, y = 500) {
        super(x, y, 32, 32);
        
        // 基本属性
        this.tag = 'Player';
        this.type = 'player';
        this.color = '#FF0000'; // 红色马里奥
        
        // 移动属性
        this.moveSpeed = 220; // 稍微提高移动速度以改善手感
        this.jumpPower = 420; // 稍微提高跳跃力度
        this.maxSpeed = 280; // 提高最大移动速度
        
        // 状态管理
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.canJump = true;
        this.isJumping = false;
        this.facingDirection = 1; // 1: 右, -1: 左
        
        // 动画状态
        this.animationState = 'idle'; // idle, walking, jumping, falling
        this.animationTime = 0;
        this.animationFrame = 0;
        
        // 物理属性
        this.useGravity = true;
        this.gravityScale = 1.0;
        this.useFriction = true;
        this.frictionCoeff = 0.85; // 地面摩擦
        this.airFriction = 0.98; // 空中阻力
        
        // 碰撞属性
        this.collisionBounds = {
            x: 2,
            y: 2,
            width: 28,
            height: 30
        };
        
        // 生命值和状态
        this.health = 3;
        this.maxHealth = 3;
        this.isInvulnerable = false;
        this.invulnerabilityTime = 0;
        this.invulnerabilityDuration = 1.0; // 1秒无敌时间
        
        // 死亡相关属性
        this.isDying = false;
        this.deathType = null; // 'fall', 'enemy', 'hazard'
        this.deathAnimationPhase = null;
        this.deathRotation = 0;
        this.deathRotationSpeed = 0;
        this.deathBlinkTimer = 0;
        this.deathBlinkInterval = 0.1;
        
        // 分数管理器引用
        this.scoreManager = null;
        
        // 输入缓冲
        this.jumpBuffer = 0; // 跳跃缓冲时间
        this.jumpBufferTime = 0.15; // 增加到150ms缓冲以改善手感
        this.coyoteTime = 0; // 土狼时间（离开平台后仍可跳跃的时间）
        this.coyoteTimeMax = 0.15; // 增加到150ms土狼时间
        
        console.log('Player created at position:', x, y);
    }
    
    /**
     * 初始化玩家
     */
    init() {
        super.init();
        this.setupInputHandling();
    }
    
    /**
     * 设置输入处理
     */
    setupInputHandling() {
        // 输入状态将由InputManager管理
        this.inputState = {
            left: false,
            right: false,
            jump: false,
            jumpPressed: false
        };
    }
    
    /**
     * 更新玩家逻辑
     * @param {number} deltaTime - 时间步长（秒）
     */
    onUpdate(deltaTime) {
        // 更新输入状态
        this.updateInput();
        
        // 更新移动
        this.updateMovement(deltaTime);
        
        // 更新跳跃
        this.updateJump(deltaTime);
        
        // 更新动画
        this.updateAnimation(deltaTime);
        
        // 更新缓冲时间
        this.updateBuffers(deltaTime);
        
        // 更新无敌状态
        this.updateInvulnerability(deltaTime);
        
        // 检查胜利条件
        this.checkVictoryCondition();
        
        // 限制速度
        this.limitVelocity();
    }
    
    /**
     * 更新输入状态
     */
    updateInput() {
        // 从全局输入管理器获取输入状态
        if (window.inputManager) {
            this.inputState.left = window.inputManager.isKeyPressed('ArrowLeft');
            this.inputState.right = window.inputManager.isKeyPressed('ArrowRight');
            this.inputState.jump = window.inputManager.isKeyPressed('Space') || 
                                  window.inputManager.isKeyPressed('ArrowUp');
            this.inputState.jumpPressed = window.inputManager.isKeyJustPressed('Space') || 
                                         window.inputManager.isKeyJustPressed('ArrowUp');
        } else {
            // 如果没有输入管理器，重置所有输入状态
            this.inputState.left = false;
            this.inputState.right = false;
            this.inputState.jump = false;
            this.inputState.jumpPressed = false;
        }
    }
    
    /**
     * 更新移动逻辑
     * @param {number} deltaTime - 时间步长
     */
    updateMovement(deltaTime) {
        let targetVelocityX = 0;
        
        // 处理左右移动输入
        if (this.inputState.left && !this.inputState.right) {
            targetVelocityX = -this.moveSpeed;
            this.facingDirection = -1;
            this.isMovingLeft = true;
            this.isMovingRight = false;
        } else if (this.inputState.right && !this.inputState.left) {
            targetVelocityX = this.moveSpeed;
            this.facingDirection = 1;
            this.isMovingLeft = false;
            this.isMovingRight = true;
        } else {
            this.isMovingLeft = false;
            this.isMovingRight = false;
        }
        
        // 应用移动速度（使用插值以获得平滑移动）
        const acceleration = this.isGrounded ? 1000 : 600; // 地面和空中加速度不同
        const friction = this.isGrounded ? this.frictionCoeff : this.airFriction;
        
        if (targetVelocityX !== 0) {
            // 加速到目标速度
            const speedDiff = targetVelocityX - this.velocity.x;
            const accelRate = acceleration * deltaTime;
            
            if (Math.abs(speedDiff) < accelRate) {
                this.velocity.x = targetVelocityX;
            } else {
                this.velocity.x += Math.sign(speedDiff) * accelRate;
            }
        } else {
            // 应用摩擦力减速
            this.velocity.x *= Math.pow(friction, deltaTime * 60); // 60fps标准化
        }
        
        // 限制最大移动速度
        this.velocity.x = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velocity.x));
    }
    
    /**
     * 更新跳跃逻辑
     * @param {number} deltaTime - 时间步长
     */
    updateJump(deltaTime) {
        // 更新跳跃缓冲
        if (this.inputState.jumpPressed) {
            this.jumpBuffer = this.jumpBufferTime;
        }
        
        // 更新土狼时间
        if (this.isGrounded) {
            this.coyoteTime = this.coyoteTimeMax;
            this.canJump = true;
            this.isJumping = false;
        }
        
        // 执行跳跃
        if (this.jumpBuffer > 0 && (this.isGrounded || this.coyoteTime > 0) && this.canJump) {
            this.performJump();
        }
        
        // 可变跳跃高度（松开跳跃键时减少上升速度）
        if (this.isJumping && !this.inputState.jump && this.velocity.y < 0) {
            this.velocity.y *= 0.5;
            this.isJumping = false;
        }
    }
    
    /**
     * 执行跳跃
     */
    performJump() {
        this.velocity.y = -this.jumpPower;
        this.isJumping = true;
        this.canJump = false;
        this.jumpBuffer = 0;
        this.coyoteTime = 0;
        
        // 触发跳跃事件
        if (window.gameEvents) {
            window.gameEvents.trigger('playerJump', { player: this });
        }
        
        console.log('Player jumped!');
    }
    
    /**
     * 更新动画状态
     * @param {number} deltaTime - 时间步长
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // 如果正在死亡，更新死亡动画
        if (this.isDying || this.animationState === 'death') {
            this.updateDeathAnimation(deltaTime);
            return;
        }
        
        // 确定动画状态
        let newState = 'idle';
        
        if (!this.isGrounded) {
            if (this.velocity.y < 0) {
                newState = 'jumping';
            } else {
                newState = 'falling';
            }
        } else if (this.isMovingLeft || this.isMovingRight) {
            newState = 'walking';
        }
        
        // 状态改变时重置动画
        if (newState !== this.animationState) {
            this.animationState = newState;
            this.animationTime = 0;
            this.animationFrame = 0;
        }
        
        // 更新动画帧
        this.updateAnimationFrame();
    }
    
    /**
     * 更新死亡动画
     * @param {number} deltaTime - 时间步长
     */
    updateDeathAnimation(deltaTime) {
        if (!this.isDying) return;
        
        switch (this.deathType) {
            case 'fall':
                // 旋转动画
                this.deathRotation += this.deathRotationSpeed * deltaTime;
                break;
                
            case 'enemy':
                // 旋转动画
                this.deathRotation += this.deathRotationSpeed * deltaTime;
                break;
                
            case 'hazard':
                // 闪烁动画
                this.deathBlinkTimer += deltaTime;
                break;
        }
    }
    
    /**
     * 更新动画帧
     */
    updateAnimationFrame() {
        const frameTime = 0.1; // 每帧0.1秒
        
        switch (this.animationState) {
            case 'walking':
                if (this.animationTime >= frameTime) {
                    this.animationFrame = (this.animationFrame + 1) % 4; // 4帧走路动画
                    this.animationTime = 0;
                }
                break;
                
            case 'jumping':
                this.animationFrame = 0; // 跳跃固定帧
                break;
                
            case 'falling':
                this.animationFrame = 1; // 下落固定帧
                break;
                
            case 'death':
                this.animationFrame = 2; // 死亡固定帧
                break;
                
            case 'idle':
            default:
                this.animationFrame = 0; // 静止固定帧
                break;
        }
    }
    
    /**
     * 更新缓冲时间
     * @param {number} deltaTime - 时间步长
     */
    updateBuffers(deltaTime) {
        if (this.jumpBuffer > 0) {
            this.jumpBuffer -= deltaTime;
        }
        
        if (this.coyoteTime > 0 && !this.isGrounded) {
            this.coyoteTime -= deltaTime;
        }
    }
    
    /**
     * 更新无敌状态
     * @param {number} deltaTime - 时间步长
     */
    updateInvulnerability(deltaTime) {
        if (this.isInvulnerable) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.isInvulnerable = false;
                this.invulnerabilityTime = 0;
            }
        }
    }
    
    /**
     * 限制速度
     */
    limitVelocity() {
        // 限制水平速度
        this.velocity.x = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.velocity.x));
        
        // 限制垂直速度（终端速度）
        const maxFallSpeed = 600;
        if (this.velocity.y > maxFallSpeed) {
            this.velocity.y = maxFallSpeed;
        }
    }
    
    /**
     * 渲染玩家
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} interpolation - 插值因子
     */
    onRender(context, interpolation) {
        // 保存上下文状态
        context.save();
        
        // 死亡动画特殊处理
        if (this.isDying || this.animationState === 'death') {
            this.renderDeathAnimation(context);
            context.restore();
            return;
        }
        
        // 无敌状态闪烁效果
        if (this.isInvulnerable) {
            const blinkRate = 8; // 闪烁频率
            const blinkTime = this.invulnerabilityDuration - this.invulnerabilityTime;
            if (Math.floor(blinkTime * blinkRate) % 2 === 0) {
                context.globalAlpha = 0.3; // 更透明的效果
            } else {
                context.globalAlpha = 0.8; // 稍微透明
            }
        }
        
        // 应用水平翻转
        if (this.facingDirection === -1) {
            context.scale(-1, 1);
        }
        
        // 根据动画状态渲染不同的精灵
        this.renderSprite(context);
        
        // 渲染调试信息
        if (this.shouldRenderDebug()) {
            this.renderPlayerDebug(context);
        }
        
        // 恢复上下文状态
        context.restore();
    }
    
    /**
     * 渲染死亡动画
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderDeathAnimation(context) {
        switch (this.deathType) {
            case 'fall':
            case 'enemy':
                // 旋转死亡动画
                context.save();
                
                // 应用旋转
                if (this.deathRotation) {
                    context.rotate(this.deathRotation);
                }
                
                // 应用水平翻转
                if (this.facingDirection === -1) {
                    context.scale(-1, 1);
                }
                
                // 渲染死亡状态的精灵（变灰）
                this.renderDeathSprite(context);
                
                context.restore();
                break;
                
            case 'hazard':
                // 闪烁死亡动画
                const blinkRate = 10; // 快速闪烁
                if (Math.floor(this.deathBlinkTimer * blinkRate) % 2 === 0) {
                    context.globalAlpha = 0.2;
                } else {
                    context.globalAlpha = 0.8;
                }
                
                // 应用水平翻转
                if (this.facingDirection === -1) {
                    context.scale(-1, 1);
                }
                
                this.renderDeathSprite(context);
                break;
                
            default:
                // 默认死亡渲染
                this.renderDeathSprite(context);
                break;
        }
    }
    
    /**
     * 渲染死亡状态的精灵
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderDeathSprite(context) {
        const centerX = -this.size.x / 2;
        const centerY = -this.size.y / 2;
        
        // 死亡状态时的颜色（变灰）
        const bodyColor = '#666666';
        const hatColor = '#444444';
        const overallColor = '#333333';
        const skinColor = '#999999';
        
        // 绘制帽子
        context.fillStyle = hatColor;
        context.fillRect(centerX + 4, centerY + 2, 24, 8);
        
        // 绘制脸部
        context.fillStyle = skinColor;
        context.fillRect(centerX + 6, centerY + 8, 20, 12);
        
        // 绘制X形眼睛（表示死亡）
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.beginPath();
        // 左眼X
        context.moveTo(centerX + 9, centerY + 9);
        context.lineTo(centerX + 13, centerY + 13);
        context.moveTo(centerX + 13, centerY + 9);
        context.lineTo(centerX + 9, centerY + 13);
        // 右眼X
        context.moveTo(centerX + 19, centerY + 9);
        context.lineTo(centerX + 23, centerY + 13);
        context.moveTo(centerX + 23, centerY + 9);
        context.lineTo(centerX + 19, centerY + 13);
        context.stroke();
        
        // 绘制鼻子
        context.fillStyle = '#000000';
        context.fillRect(centerX + 15, centerY + 12, 2, 2);
        
        // 绘制倒转的胡子（表示死亡）
        context.fillStyle = '#8B4513';
        context.fillRect(centerX + 12, centerY + 16, 8, 2);
        
        // 绘制身体
        context.fillStyle = bodyColor;
        context.fillRect(centerX + 8, centerY + 18, 16, 8);
        
        // 绘制工装裤
        context.fillStyle = overallColor;
        context.fillRect(centerX + 6, centerY + 24, 20, 8);
        
        // 绘制手臂（下垂状态）
        context.fillStyle = skinColor;
        context.fillRect(centerX + 2, centerY + 22, 4, 6);
        context.fillRect(centerX + 26, centerY + 22, 4, 6);
        
        // 绘制腿部（倒下状态）
        context.fillStyle = overallColor;
        context.fillRect(centerX + 8, centerY + 28, 6, 4);
        context.fillRect(centerX + 18, centerY + 28, 6, 4);
        
        // 绘制鞋子
        context.fillStyle = '#8B4513';
        context.fillRect(centerX + 6, centerY + 30, 8, 2);
        context.fillRect(centerX + 18, centerY + 30, 8, 2);
    }
    
    /**
     * 渲染精灵（简单的像素艺术风格）
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderSprite(context) {
        const centerX = -this.size.x / 2;
        const centerY = -this.size.y / 2;
        
        // 根据动画状态选择颜色和形状
        let bodyColor = '#FF0000'; // 红色身体
        let hatColor = '#8B0000';  // 深红色帽子
        let overallColor = '#0000FF'; // 蓝色工装裤
        
        // 死亡状态时变灰
        if (this.animationState === 'death') {
            bodyColor = '#666666';
            hatColor = '#444444';
            overallColor = '#333333';
        }
        
        // 绘制帽子
        context.fillStyle = hatColor;
        context.fillRect(centerX + 4, centerY + 2, 24, 8);
        
        // 绘制脸部
        context.fillStyle = '#FFDBAC'; // 肤色
        context.fillRect(centerX + 6, centerY + 8, 20, 12);
        
        // 绘制眼睛
        context.fillStyle = '#000000';
        context.fillRect(centerX + 10, centerY + 10, 2, 2);
        context.fillRect(centerX + 20, centerY + 10, 2, 2);
        
        // 绘制鼻子
        context.fillStyle = '#000000';
        context.fillRect(centerX + 15, centerY + 12, 2, 2);
        
        // 绘制胡子
        context.fillStyle = '#8B4513';
        context.fillRect(centerX + 12, centerY + 14, 8, 2);
        
        // 绘制身体
        context.fillStyle = bodyColor;
        context.fillRect(centerX + 8, centerY + 18, 16, 8);
        
        // 绘制工装裤
        context.fillStyle = overallColor;
        context.fillRect(centerX + 6, centerY + 24, 20, 8);
        
        // 绘制手臂（根据动画状态调整）
        context.fillStyle = '#FFDBAC';
        if (this.animationState === 'walking' && this.animationFrame % 2 === 0) {
            // 走路动画 - 摆臂
            context.fillRect(centerX + 2, centerY + 18, 4, 8);
            context.fillRect(centerX + 26, centerY + 20, 4, 6);
        } else {
            // 默认手臂位置
            context.fillRect(centerX + 2, centerY + 20, 4, 6);
            context.fillRect(centerX + 26, centerY + 20, 4, 6);
        }
        
        // 绘制腿部（根据动画状态调整）
        context.fillStyle = overallColor;
        if (this.animationState === 'walking') {
            // 走路动画 - 腿部摆动
            const legOffset = this.animationFrame % 2 === 0 ? 1 : -1;
            context.fillRect(centerX + 10 + legOffset, centerY + 28, 4, 4);
            context.fillRect(centerX + 18 - legOffset, centerY + 28, 4, 4);
        } else if (this.animationState === 'jumping') {
            // 跳跃姿势 - 腿部收起
            context.fillRect(centerX + 10, centerY + 26, 4, 6);
            context.fillRect(centerX + 18, centerY + 26, 4, 6);
        } else {
            // 默认腿部位置
            context.fillRect(centerX + 10, centerY + 28, 4, 4);
            context.fillRect(centerX + 18, centerY + 28, 4, 4);
        }
        
        // 绘制鞋子
        context.fillStyle = '#8B4513'; // 棕色鞋子
        if (this.animationState !== 'jumping') {
            context.fillRect(centerX + 8, centerY + 30, 6, 2);
            context.fillRect(centerX + 18, centerY + 30, 6, 2);
        }
    }
    
    /**
     * 渲染玩家调试信息
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderPlayerDebug(context) {
        context.fillStyle = '#FFFFFF';
        context.font = '10px monospace';
        context.textAlign = 'left';
        
        const debugInfo = [
            `State: ${this.animationState}`,
            `Grounded: ${this.isGrounded}`,
            `Vel: ${this.velocity.x.toFixed(1)}, ${this.velocity.y.toFixed(1)}`,
            `Jump: ${this.canJump}`,
            `Health: ${this.health}/${this.maxHealth}`,
            `Invulnerable: ${this.isInvulnerable}`,
            `Score: ${this.getScore()}`
        ];
        
        for (let i = 0; i < debugInfo.length; i++) {
            context.fillText(debugInfo[i], -this.size.x / 2, -this.size.y / 2 - 60 + i * 12);
        }
    }
    
    /**
     * 碰撞响应
     * @param {GameObject} other - 碰撞的对象
     * @param {string} direction - 碰撞方向
     * @param {string} type - 碰撞类型
     */
    onCollision(other, direction, type) {
        if (type === 'platform' && direction === Physics.CollisionType.TOP) {
            // 着陆在平台上
            this.isGrounded = true;
            this.canJump = true;
            this.isJumping = false;
        }
        
        if (type === 'boundary') {
            if (direction === Physics.CollisionType.BOTTOM) {
                // 掉出屏幕底部
                this.onFallOutOfBounds();
            }
        }
        
        if (type === 'object' && other && other.tag === 'Enemy') {
            this.handleEnemyCollision(other, direction);
        }
    }
    
    /**
     * 掉出边界处理
     */
    onFallOutOfBounds() {
        console.log('Player fell out of bounds!');
        
        // 如果已经在死亡状态，不重复处理
        if (this.animationState === 'death' || this.isDying) {
            return;
        }
        
        // 标记正在死亡
        this.isDying = true;
        
        // 减少生命值
        if (this.scoreManager) {
            this.scoreManager.loseLife();
            this.health = this.scoreManager.getLives();
        } else {
            this.health--;
        }
        
        // 触发死亡动画和逻辑
        this.triggerDeathSequence('fall');
    }
    
    /**
     * 对象离开边界时调用（GameEngine调用）
     */
    onOutOfBounds() {
        this.onFallOutOfBounds();
    }
    
    /**
     * 重生玩家
     */
    respawn() {
        // 使用关卡的生成点，如果没有则使用默认位置
        let spawnX = 50, spawnY = 400;
        if (window.currentLevel && window.currentLevel.isLoaded) {
            const spawnPoint = window.currentLevel.getSpawnPoint();
            spawnX = spawnPoint.x;
            spawnY = spawnPoint.y;
        }
        
        this.setPosition(spawnX, spawnY);
        this.setVelocity(0, 0);
        this.isGrounded = false;
        this.canJump = true;
        this.isJumping = false;
        console.log('Player respawned at:', spawnX, spawnY);
    }
    
    /**
     * 获取玩家状态信息
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            position: { x: this.position.x, y: this.position.y },
            velocity: { x: this.velocity.x, y: this.velocity.y },
            isGrounded: this.isGrounded,
            animationState: this.animationState,
            facingDirection: this.facingDirection,
            canJump: this.canJump
        };
    }
    
    /**
     * 设置玩家移动速度
     * @param {number} speed - 移动速度
     */
    setMoveSpeed(speed) {
        this.moveSpeed = speed;
    }
    
    /**
     * 设置跳跃力度
     * @param {number} power - 跳跃力度
     */
    setJumpPower(power) {
        this.jumpPower = power;
    }
    
    /**
     * 强制跳跃（用于特殊情况）
     */
    forceJump() {
        if (this.isGrounded || this.coyoteTime > 0) {
            this.performJump();
        }
    }
    
    /**
     * 处理与敌人的碰撞
     * @param {Enemy} enemy - 敌人对象
     * @param {string} direction - 碰撞方向
     */
    handleEnemyCollision(enemy, direction) {
        if (!enemy || !enemy.isAlive || enemy.isDefeated) {
            return;
        }
        
        console.log(`Player-Enemy collision: direction=${direction}, playerVelY=${this.velocity.y.toFixed(2)}`);
        
        // 判断碰撞方向来决定是击败敌人还是受伤
        if (direction === Physics.CollisionType.TOP && this.velocity.y > 0) {
            // 玩家从上方跳到敌人身上且正在下落 - 击败敌人
            this.defeatEnemy(enemy);
        } else if (direction === Physics.CollisionType.LEFT || 
                   direction === Physics.CollisionType.RIGHT || 
                   direction === Physics.CollisionType.BOTTOM) {
            // 玩家从侧面或下方接触敌人 - 玩家受伤
            this.takeDamageFromEnemy(enemy, direction);
        } else if (direction === Physics.CollisionType.TOP && this.velocity.y <= 0) {
            // 玩家在敌人上方但不是在下落（可能是站在敌人上） - 也算击败
            this.defeatEnemy(enemy);
        }
    }
    
    /**
     * 击败敌人
     * @param {Enemy} enemy - 被击败的敌人
     */
    defeatEnemy(enemy) {
        if (!enemy || !enemy.isAlive || enemy.isDefeated) {
            return;
        }
        
        console.log('Player defeated enemy:', enemy.type);
        
        // 击败敌人
        enemy.defeat(this);
        
        // 给予分数奖励
        if (this.scoreManager) {
            const enemyCenter = {
                x: enemy.position.x + enemy.size.x / 2,
                y: enemy.position.y + enemy.size.y / 2
            };
            const scoreReward = this.scoreManager.addScore(enemy.type, null, enemyCenter);
            this.onEnemyDefeated(enemy, scoreReward);
        }
        
        // 给玩家一个小的向上弹跳效果（只有在下落时才给弹跳）
        if (this.velocity.y > 0) {
            this.velocity.y = -200; // 小跳跃效果
            this.isJumping = true;
        }
    }
    
    /**
     * 从敌人受到伤害
     * @param {Enemy} enemy - 造成伤害的敌人
     * @param {string} direction - 碰撞方向
     */
    takeDamageFromEnemy(enemy, direction) {
        if (this.isInvulnerable || this.health <= 0 || this.isDying) {
            console.log('Player damage ignored - invulnerable, dead, or dying');
            return;
        }
        
        console.log('Player took damage from enemy:', enemy.type, 'direction:', direction);
        
        // 通过分数管理器减少生命值
        if (this.scoreManager) {
            this.scoreManager.loseLife();
            this.health = this.scoreManager.getLives(); // 同步生命值
        } else {
            this.health -= 1;
        }
        
        // 检查是否死亡
        if (this.health <= 0) {
            // 触发敌人死亡序列
            this.triggerDeathSequence('enemy');
        } else {
            // 受伤但未死亡
            this.handlePlayerHurt(enemy, direction);
        }
    }
    
    /**
     * 处理玩家受伤（但未死亡）
     * @param {Enemy} enemy - 造成伤害的敌人
     * @param {string} direction - 碰撞方向
     */
    handlePlayerHurt(enemy, direction) {
        // 激活无敌状态
        this.isInvulnerable = true;
        this.invulnerabilityTime = this.invulnerabilityDuration;
        
        // 击退效果
        const knockbackForce = 200;
        if (direction === Physics.CollisionType.LEFT) {
            this.velocity.x = knockbackForce; // 向右击退
        } else if (direction === Physics.CollisionType.RIGHT) {
            this.velocity.x = -knockbackForce; // 向左击退
        } else {
            // 如果是其他方向，根据敌人位置决定击退方向
            const enemyCenter = enemy.position.x + enemy.size.x / 2;
            const playerCenter = this.position.x + this.size.x / 2;
            this.velocity.x = playerCenter > enemyCenter ? knockbackForce : -knockbackForce;
        }
        
        // 小的向上弹跳
        this.velocity.y = -150;
        
        // 触发受伤事件
        this.onPlayerHurt(enemy);
    }
    
    /**
     * 玩家受伤事件
     * @param {Enemy} enemy - 造成伤害的敌人
     */
    onPlayerHurt(enemy) {
        console.log(`Player hurt! Health: ${this.health}/${this.maxHealth}`);
        
        // 可以在这里添加受伤音效、视觉效果等
        // 例如：播放受伤音效、屏幕闪烁等
        
        // 触发受伤事件（可以被其他系统监听）
        if (window.gameEvents) {
            window.gameEvents.trigger('playerHurt', {
                player: this,
                enemy: enemy,
                currentHealth: this.health,
                maxHealth: this.maxHealth
            });
        }
    }
    
    /**
     * 触发死亡序列
     * @param {string} deathType - 死亡类型 ('fall', 'enemy', 'hazard')
     */
    triggerDeathSequence(deathType = 'enemy') {
        console.log(`Player death sequence triggered: ${deathType}`);
        
        // 如果已经在死亡状态，不重复处理
        if (this.animationState === 'death' || this.isDying) {
            return;
        }
        
        // 标记正在死亡
        this.isDying = true;
        this.deathType = deathType;
        
        // 禁用碰撞和重力（根据死亡类型）
        if (deathType === 'fall') {
            // 掉落死亡：保持重力，让玩家继续下落
            this.collisionEnabled = false;
        } else {
            // 其他死亡：停止物理效果
            this.useGravity = false;
            this.collisionEnabled = false;
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
        
        // 开始死亡动画
        this.startDeathAnimation(deathType);
        
        // 触发死亡事件
        if (window.gameEvents) {
            window.gameEvents.trigger('playerDeath', {
                player: this,
                deathType: deathType,
                score: this.getScore(),
                position: { x: this.position.x, y: this.position.y }
            });
        }
        
        // 延迟处理死亡后逻辑
        setTimeout(() => {
            this.handlePlayerDeath();
        }, this.getDeathAnimationDuration(deathType));
    }
    
    /**
     * 开始死亡动画
     * @param {string} deathType - 死亡类型
     */
    startDeathAnimation(deathType) {
        this.animationState = 'death';
        this.animationTime = 0;
        this.deathAnimationPhase = 'start';
        
        // 根据死亡类型设置不同的动画效果
        switch (deathType) {
            case 'fall':
                // 掉落死亡：玩家继续下落并旋转
                this.deathRotation = 0;
                this.deathRotationSpeed = 5; // 旋转速度
                break;
                
            case 'enemy':
                // 敌人死亡：向上弹跳然后下落
                this.velocity.y = -300; // 向上弹跳
                this.deathRotation = 0;
                this.deathRotationSpeed = 3;
                this.useGravity = true; // 重新启用重力让玩家下落
                break;
                
            case 'hazard':
                // 危险物死亡：闪烁效果
                this.deathBlinkTimer = 0;
                this.deathBlinkInterval = 0.1; // 闪烁间隔
                break;
        }
        
        console.log(`Death animation started: ${deathType}`);
    }
    
    /**
     * 获取死亡动画持续时间
     * @param {string} deathType - 死亡类型
     * @returns {number} 动画持续时间（毫秒）
     */
    getDeathAnimationDuration(deathType) {
        switch (deathType) {
            case 'fall':
                return 2000; // 2秒，让玩家完全掉出屏幕
            case 'enemy':
                return 1500; // 1.5秒
            case 'hazard':
                return 1000; // 1秒
            default:
                return 1000;
        }
    }
    
    /**
     * 玩家死亡事件（保持向后兼容）
     */
    onPlayerDeath() {
        this.triggerDeathSequence('enemy');
    }
    
    /**
     * 处理玩家死亡后的逻辑
     */
    handlePlayerDeath() {
        console.log(`Handling player death. Lives remaining: ${this.health}`);
        
        // 检查是否还有生命值
        if (this.health <= 0) {
            // 触发游戏结束
            console.log('Game Over - No lives remaining');
            if (window.gameStateManager) {
                window.gameStateManager.gameOver();
            } else if (window.gameOver) {
                window.gameOver();
            }
        } else {
            // 还有生命值，重生玩家
            console.log('Player has lives remaining, respawning...');
            this.respawnPlayer();
        }
    }
    
    /**
     * 重生玩家
     */
    respawnPlayer() {
        console.log('Respawning player...');
        
        // 重置死亡状态
        this.isDying = false;
        this.deathType = null;
        this.deathAnimationPhase = null;
        this.deathRotation = 0;
        this.deathRotationSpeed = 0;
        this.deathBlinkTimer = 0;
        
        // 重置物理属性
        this.useGravity = true;
        this.collisionEnabled = true;
        
        // 重置动画状态
        this.animationState = 'idle';
        this.animationTime = 0;
        this.animationFrame = 0;
        
        // 激活无敌状态
        this.isInvulnerable = true;
        this.invulnerabilityTime = this.invulnerabilityDuration * 2; // 重生后更长的无敌时间
        
        // 重置位置和速度
        this.respawn();
        
        // 触发重生事件
        if (window.gameEvents) {
            window.gameEvents.trigger('playerRespawn', {
                player: this,
                livesRemaining: this.health,
                position: { x: this.position.x, y: this.position.y }
            });
        }
        
        console.log('Player respawned successfully');
    }
    
    /**
     * 检查胜利条件
     */
    checkVictoryCondition() {
        // 检查是否到达关卡终点
        if (window.currentLevel && window.currentLevel.isLoaded) {
            if (window.currentLevel.checkWinCondition(this)) {
                // 触发胜利
                if (window.gameStateManager) {
                    window.gameStateManager.victory();
                } else if (window.victory) {
                    window.victory();
                }
            }
        }
    }
    
    /**
     * 敌人被击败事件
     * @param {Enemy} enemy - 被击败的敌人
     * @param {number} scoreReward - 分数奖励
     */
    onEnemyDefeated(enemy, scoreReward) {
        console.log(`Enemy defeated! Score +${scoreReward}`);
        
        // 可以在这里添加击败敌人的音效、视觉效果等
        
        // 触发敌人被击败事件
        if (window.gameEvents) {
            window.gameEvents.trigger('enemyDefeated', {
                player: this,
                enemy: enemy,
                scoreReward: scoreReward,
                totalScore: this.getScore()
            });
        }
    }
    
    /**
     * 获取击败敌人的分数奖励
     * @param {string} enemyType - 敌人类型
     * @returns {number} 分数奖励
     */
    getEnemyScoreReward(enemyType) {
        const scoreTable = {
            'goomba': 100,
            'koopa': 200,
            'basic': 50
        };
        
        return scoreTable[enemyType] || 50;
    }
    
    /**
     * 获取当前分数
     * @returns {number} 当前分数
     */
    getScore() {
        return this.scoreManager ? this.scoreManager.getCurrentScore() : 0;
    }
    
    /**
     * 获取当前生命值
     * @returns {number} 当前生命值
     */
    getHealth() {
        return this.health;
    }
    
    /**
     * 获取最大生命值
     * @returns {number} 最大生命值
     */
    getMaxHealth() {
        return this.maxHealth;
    }
    
    /**
     * 是否处于无敌状态
     * @returns {boolean} 是否无敌
     */
    isInvulnerableState() {
        return this.isInvulnerable;
    }
    
    /**
     * 销毁时的清理
     */
    onDestroy() {
        console.log('Player destroyed');
        super.onDestroy();
    }
}

// 导出Player类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
} else {
    window.Player = Player;
}