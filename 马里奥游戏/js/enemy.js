/**
 * Enemy类 - 敌人基类
 * 包含基本的敌人行为、巡逻逻辑和碰撞检测
 */
class Enemy extends GameObject {
    constructor(x = 0, y = 0, width = 32, height = 32, type = 'basic') {
        super(x, y, width, height);
        
        // 基本属性
        this.tag = 'Enemy';
        this.type = type;
        this.color = '#8B4513'; // 棕色
        
        // 敌人状态
        this.health = 1;
        this.isAlive = true;
        this.isDefeated = false;
        
        // 移动属性
        this.moveSpeed = 50; // 移动速度 (像素/秒)
        this.direction = 1; // 1: 右, -1: 左
        this.patrolDistance = 100; // 巡逻距离
        this.startPosition = new Vector2D(x, y); // 起始位置
        
        // 巡逻状态
        this.patrolState = 'moving'; // moving, turning, idle
        this.turnTimer = 0;
        this.turnDuration = 0.2; // 转向持续时间
        
        // 平台检测
        this.edgeDetectionOffset = 16; // 边缘检测偏移
        this.groundCheckDistance = 5; // 地面检测距离
        
        // 物理属性
        this.useGravity = true;
        this.gravityScale = 1.0;
        this.useFriction = true;
        this.frictionCoeff = 0.9;
        
        // 碰撞属性
        this.collisionBounds = {
            x: 2,
            y: 2,
            width: width - 4,
            height: height - 4
        };
        
        // 动画属性
        this.animationState = 'walking';
        this.animationTime = 0;
        this.animationFrame = 0;
        this.animationSpeed = 0.2; // 动画速度
        
        console.log(`Enemy created: ${type} at (${x}, ${y})`);
    }
    
    /**
     * 初始化敌人
     */
    init() {
        super.init();
        this.setupBehavior();
    }
    
    /**
     * 设置敌人行为
     */
    setupBehavior() {
        // 子类可以重写此方法来设置特定行为
    }
    
    /**
     * 更新敌人逻辑
     * @param {number} deltaTime - 时间步长（秒）
     */
    onUpdate(deltaTime) {
        if (!this.isAlive || this.isDefeated) {
            this.updateDeathAnimation(deltaTime);
            return;
        }
        
        // 更新巡逻行为
        this.updatePatrol(deltaTime);
        
        // 更新动画
        this.updateAnimation(deltaTime);
        
        // 检测平台边缘
        this.checkPlatformEdges();
        
        // 应用移动
        this.applyMovement(deltaTime);
    }
    
    /**
     * 更新巡逻逻辑
     * @param {number} deltaTime - 时间步长
     */
    updatePatrol(deltaTime) {
        switch (this.patrolState) {
            case 'moving':
                this.updateMoving(deltaTime);
                break;
                
            case 'turning':
                this.updateTurning(deltaTime);
                break;
                
            case 'idle':
                this.updateIdle(deltaTime);
                break;
        }
    }
    
    /**
     * 更新移动状态
     * @param {number} deltaTime - 时间步长
     */
    updateMoving(deltaTime) {
        // 检查是否需要转向
        const distanceFromStart = this.position.x - this.startPosition.x;
        
        if ((this.direction > 0 && distanceFromStart >= this.patrolDistance) ||
            (this.direction < 0 && distanceFromStart <= -this.patrolDistance)) {
            this.startTurning();
        }
    }
    
    /**
     * 更新转向状态
     * @param {number} deltaTime - 时间步长
     */
    updateTurning(deltaTime) {
        this.turnTimer += deltaTime;
        
        if (this.turnTimer >= this.turnDuration) {
            this.completeTurn();
        }
    }
    
    /**
     * 更新空闲状态
     * @param {number} deltaTime - 时间步长
     */
    updateIdle(deltaTime) {
        // 默认情况下立即返回移动状态
        this.patrolState = 'moving';
    }
    
    /**
     * 开始转向
     */
    startTurning() {
        this.patrolState = 'turning';
        this.turnTimer = 0;
        this.velocity.x = 0; // 停止移动
    }
    
    /**
     * 完成转向
     */
    completeTurn() {
        this.direction *= -1; // 反转方向
        this.patrolState = 'moving';
        this.turnTimer = 0;
    }
    
    /**
     * 应用移动
     * @param {number} deltaTime - 时间步长
     */
    applyMovement(deltaTime) {
        if (this.patrolState === 'moving') {
            this.velocity.x = this.moveSpeed * this.direction;
        } else {
            this.velocity.x = 0;
        }
    }
    
    /**
     * 检测平台边缘
     */
    checkPlatformEdges() {
        if (!this.isGrounded || this.patrolState !== 'moving') {
            return;
        }
        
        // 获取当前关卡的平台
        const platforms = this.getCurrentPlatforms();
        if (!platforms || platforms.length === 0) {
            return;
        }
        
        // 计算前方检测点
        const checkX = this.position.x + (this.direction > 0 ? 
            this.size.x + this.edgeDetectionOffset : 
            -this.edgeDetectionOffset);
        const checkY = this.position.y + this.size.y + this.groundCheckDistance;
        
        // 检查前方是否有地面
        let hasGround = false;
        for (const platform of platforms) {
            if (platform === this || platform.destroyed) continue;
            
            const platformBounds = platform.getCollisionBounds();
            
            // 检查检测点是否在平台上方
            if (checkX >= platformBounds.x && 
                checkX <= platformBounds.x + platformBounds.width &&
                checkY >= platformBounds.y && 
                checkY <= platformBounds.y + platformBounds.height + 10) {
                hasGround = true;
                break;
            }
        }
        
        // 如果前方没有地面，开始转向
        if (!hasGround) {
            this.startTurning();
        }
    }
    
    /**
     * 获取当前关卡的平台
     * @returns {Array} 平台数组
     */
    getCurrentPlatforms() {
        if (window.currentLevel && window.currentLevel.isLoaded) {
            return window.currentLevel.getPlatforms();
        }
        return [];
    }
    
    /**
     * 更新动画
     * @param {number} deltaTime - 时间步长
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // 根据状态确定动画
        let newState = 'idle';
        
        if (!this.isAlive) {
            newState = 'defeated';
        } else if (this.patrolState === 'moving') {
            newState = 'walking';
        } else if (this.patrolState === 'turning') {
            newState = 'turning';
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
     * 更新动画帧
     */
    updateAnimationFrame() {
        switch (this.animationState) {
            case 'walking':
                if (this.animationTime >= this.animationSpeed) {
                    this.animationFrame = (this.animationFrame + 1) % 2; // 2帧走路动画
                    this.animationTime = 0;
                }
                break;
                
            case 'turning':
                this.animationFrame = 0; // 转向固定帧
                break;
                
            case 'defeated':
                this.animationFrame = 2; // 被击败帧
                break;
                
            case 'idle':
            default:
                this.animationFrame = 0; // 静止帧
                break;
        }
    }
    
    /**
     * 更新死亡动画
     * @param {number} deltaTime - 时间步长
     */
    updateDeathAnimation(deltaTime) {
        // 死亡动画逻辑
        if (this.isDefeated) {
            // 简单的消失效果
            if (this.alpha === undefined) {
                this.alpha = 1.0;
            }
            this.alpha -= deltaTime * 1.5; // 稍慢的消失效果
            
            // 轻微的向上漂移效果
            this.velocity.y = -20;
            
            if (this.alpha <= 0) {
                this.alpha = 0;
                // 标记为销毁，但不立即销毁（由defeat方法中的setTimeout处理）
            }
        }
    }
    
    /**
     * 渲染敌人
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} interpolation - 插值因子
     */
    onRender(context, interpolation) {
        // 保存上下文状态
        context.save();
        
        // 应用透明度（用于死亡动画）
        if (this.alpha !== undefined && this.alpha < 1.0) {
            context.globalAlpha = Math.max(0, this.alpha);
        }
        
        // 应用水平翻转
        if (this.direction === -1) {
            context.scale(-1, 1);
        }
        
        // 渲染精灵
        this.renderSprite(context);
        
        // 渲染调试信息
        if (this.shouldRenderDebug()) {
            this.renderEnemyDebug(context);
        }
        
        // 恢复上下文状态
        context.restore();
    }
    
    /**
     * 渲染精灵（基础敌人外观）
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderSprite(context) {
        const centerX = -this.size.x / 2;
        const centerY = -this.size.y / 2;
        
        // 根据动画状态和类型渲染
        let bodyColor = this.color;
        let eyeColor = '#000000';
        
        if (this.animationState === 'defeated') {
            bodyColor = '#666666'; // 灰色表示被击败
        }
        
        // 绘制身体
        context.fillStyle = bodyColor;
        context.fillRect(centerX + 4, centerY + 8, 24, 20);
        
        // 绘制眼睛
        context.fillStyle = eyeColor;
        context.fillRect(centerX + 8, centerY + 12, 3, 3);
        context.fillRect(centerX + 17, centerY + 12, 3, 3);
        
        // 绘制脚部（根据动画帧调整）
        context.fillStyle = bodyColor;
        if (this.animationState === 'walking' && this.animationFrame === 1) {
            // 走路动画 - 脚部摆动
            context.fillRect(centerX + 6, centerY + 26, 6, 4);
            context.fillRect(centerX + 20, centerY + 28, 6, 4);
        } else {
            // 默认脚部位置
            context.fillRect(centerX + 8, centerY + 28, 6, 4);
            context.fillRect(centerX + 18, centerY + 28, 6, 4);
        }
    }
    
    /**
     * 渲染敌人调试信息
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderEnemyDebug(context) {
        context.fillStyle = '#FFFF00';
        context.font = '8px monospace';
        context.textAlign = 'center';
        
        const debugInfo = [
            `${this.type}`,
            `State: ${this.patrolState}`,
            `Dir: ${this.direction}`,
            `Grounded: ${this.isGrounded}`,
            `Health: ${this.health}`
        ];
        
        for (let i = 0; i < debugInfo.length; i++) {
            context.fillText(debugInfo[i], 0, -this.size.y / 2 - 40 + i * 10);
        }
        
        // 绘制巡逻范围
        context.strokeStyle = '#FFFF00';
        context.lineWidth = 1;
        context.setLineDash([2, 2]);
        
        const startX = this.startPosition.x - this.position.x;
        context.beginPath();
        context.moveTo(startX - this.patrolDistance, this.size.y / 2 + 5);
        context.lineTo(startX + this.patrolDistance, this.size.y / 2 + 5);
        context.stroke();
        context.setLineDash([]);
        
        // 绘制边缘检测点
        context.fillStyle = '#FF0000';
        const checkOffsetX = this.direction > 0 ? 
            this.size.x / 2 + this.edgeDetectionOffset : 
            -this.size.x / 2 - this.edgeDetectionOffset;
        context.fillRect(checkOffsetX - 2, this.size.y / 2 + this.groundCheckDistance - 2, 4, 4);
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
        }
        
        if (type === 'boundary') {
            if (direction === Physics.CollisionType.LEFT || direction === Physics.CollisionType.RIGHT) {
                // 撞到边界，转向
                this.startTurning();
            }
        }
        
        // 与玩家的碰撞将在后续任务中处理
        if (other.tag === 'Player') {
            this.handlePlayerCollision(other, direction);
        }
    }
    
    /**
     * 处理与玩家的碰撞
     * @param {Player} player - 玩家对象
     * @param {string} direction - 碰撞方向
     */
    handlePlayerCollision(player, direction) {
        if (!this.isAlive || this.isDefeated) {
            return;
        }
        
        console.log(`Enemy collision with player from ${direction}`);
        
        // 玩家的碰撞处理会在Player类中进行
        // 这里只是记录碰撞，实际的伤害/击败逻辑由Player类处理
    }
    
    /**
     * 被击败
     * @param {GameObject} attacker - 攻击者
     */
    defeat(attacker = null) {
        if (!this.isAlive || this.isDefeated) {
            return;
        }
        
        this.isAlive = false;
        this.isDefeated = true;
        this.health = 0;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.animationState = 'defeated';
        
        // 设置透明度用于消失效果
        this.alpha = 1.0;
        
        console.log(`Enemy defeated: ${this.type}`);
        
        // 触发击败事件
        this.onDefeat(attacker);
        
        // 延迟销毁敌人对象
        setTimeout(() => {
            if (this.destroy) {
                this.destroy();
            }
        }, 1000); // 1秒后销毁
    }
    
    /**
     * 击败事件处理
     * @param {GameObject} attacker - 攻击者
     */
    onDefeat(attacker) {
        // 子类可以重写此方法来处理特定的击败逻辑
        // 例如：播放音效、给予分数、创建特效等
        
        // 触发敌人被击败事件
        if (window.gameEvents) {
            window.gameEvents.trigger('enemyDefeated', {
                enemy: this,
                attacker: attacker,
                type: this.type
            });
        }
    }
    
    /**
     * 受到伤害
     * @param {number} damage - 伤害值
     * @param {GameObject} attacker - 攻击者
     */
    takeDamage(damage, attacker = null) {
        if (!this.isAlive || this.isDefeated) {
            return;
        }
        
        this.health -= damage;
        
        if (this.health <= 0) {
            this.defeat(attacker);
        }
    }
    
    /**
     * 设置巡逻距离
     * @param {number} distance - 巡逻距离
     */
    setPatrolDistance(distance) {
        this.patrolDistance = distance;
    }
    
    /**
     * 设置移动速度
     * @param {number} speed - 移动速度
     */
    setMoveSpeed(speed) {
        this.moveSpeed = speed;
    }
    
    /**
     * 获取敌人状态
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            type: this.type,
            position: { x: this.position.x, y: this.position.y },
            direction: this.direction,
            patrolState: this.patrolState,
            isAlive: this.isAlive,
            isDefeated: this.isDefeated,
            health: this.health,
            isGrounded: this.isGrounded
        };
    }
    
    /**
     * 销毁时的清理
     */
    onDestroy() {
        console.log(`Enemy destroyed: ${this.type}`);
        super.onDestroy();
    }
}

/**
 * Goomba类 - 蘑菇敌人
 * 经典的马里奥敌人，来回巡逻并可以被跳跃击败
 */
class Goomba extends Enemy {
    constructor(x = 0, y = 0) {
        super(x, y, 32, 32, 'goomba');
        
        // Goomba特有属性
        this.color = '#8B4513'; // 棕色
        this.moveSpeed = 40; // 稍微提高移动速度以增加挑战
        this.patrolDistance = 100; // 增加巡逻距离
        this.animationSpeed = 0.25; // 稍快的动画速度
        
        // 碰撞属性调整
        this.collisionBounds = {
            x: 4,
            y: 4,
            width: 24,
            height: 28
        };
        
        console.log(`Goomba created at (${x}, ${y})`);
    }
    
    /**
     * 设置Goomba特有行为
     */
    setupBehavior() {
        super.setupBehavior();
        
        // Goomba特有的行为设置
        this.edgeDetectionOffset = 12; // 更小的边缘检测偏移
        this.turnDuration = 0.1; // 更快的转向
    }
    
    /**
     * 渲染Goomba精灵
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderSprite(context) {
        const centerX = -this.size.x / 2;
        const centerY = -this.size.y / 2;
        
        // 根据状态选择颜色
        let bodyColor = this.color;
        let eyeColor = '#000000';
        let mouthColor = '#FFFFFF';
        
        if (this.animationState === 'defeated') {
            bodyColor = '#666666'; // 灰色表示被击败
            eyeColor = '#333333';
            mouthColor = '#999999';
        }
        
        // 绘制主体（蘑菇形状）
        context.fillStyle = bodyColor;
        
        // 蘑菇帽
        context.beginPath();
        context.arc(centerX + 16, centerY + 12, 14, Math.PI, 0);
        context.fill();
        
        // 蘑菇茎
        context.fillRect(centerX + 8, centerY + 12, 16, 16);
        
        // 绘制眼睛
        context.fillStyle = eyeColor;
        if (this.animationState !== 'defeated') {
            // 愤怒的眉毛
            context.fillRect(centerX + 8, centerY + 8, 6, 2);
            context.fillRect(centerX + 18, centerY + 8, 6, 2);
            
            // 眼睛
            context.fillRect(centerX + 10, centerY + 10, 3, 4);
            context.fillRect(centerX + 19, centerY + 10, 3, 4);
        } else {
            // 被击败时的X眼睛
            context.lineWidth = 2;
            context.strokeStyle = eyeColor;
            
            // 左眼X
            context.beginPath();
            context.moveTo(centerX + 9, centerY + 9);
            context.lineTo(centerX + 13, centerY + 13);
            context.moveTo(centerX + 13, centerY + 9);
            context.lineTo(centerX + 9, centerY + 13);
            context.stroke();
            
            // 右眼X
            context.beginPath();
            context.moveTo(centerX + 19, centerY + 9);
            context.lineTo(centerX + 23, centerY + 13);
            context.moveTo(centerX + 23, centerY + 9);
            context.lineTo(centerX + 19, centerY + 13);
            context.stroke();
        }
        
        // 绘制嘴巴（獠牙）
        if (this.animationState !== 'defeated') {
            context.fillStyle = mouthColor;
            
            // 獠牙
            context.beginPath();
            context.moveTo(centerX + 12, centerY + 16);
            context.lineTo(centerX + 14, centerY + 20);
            context.lineTo(centerX + 16, centerY + 16);
            context.fill();
            
            context.beginPath();
            context.moveTo(centerX + 16, centerY + 16);
            context.lineTo(centerX + 18, centerY + 20);
            context.lineTo(centerX + 20, centerY + 16);
            context.fill();
        }
        
        // 绘制脚部
        context.fillStyle = bodyColor;
        if (this.animationState === 'walking') {
            // 走路动画 - 脚部摆动
            const footOffset = this.animationFrame === 1 ? 1 : -1;
            context.fillRect(centerX + 6 + footOffset, centerY + 26, 8, 4);
            context.fillRect(centerX + 18 - footOffset, centerY + 26, 8, 4);
        } else {
            // 默认脚部位置
            context.fillRect(centerX + 6, centerY + 26, 8, 4);
            context.fillRect(centerX + 18, centerY + 26, 8, 4);
        }
        
        // 绘制蘑菇斑点
        if (this.animationState !== 'defeated') {
            context.fillStyle = '#654321'; // 深棕色斑点
            context.beginPath();
            context.arc(centerX + 10, centerY + 6, 2, 0, Math.PI * 2);
            context.arc(centerX + 22, centerY + 6, 2, 0, Math.PI * 2);
            context.arc(centerX + 16, centerY + 4, 1.5, 0, Math.PI * 2);
            context.fill();
        }
    }
    
    /**
     * 处理与玩家的碰撞
     * @param {Player} player - 玩家对象
     * @param {string} direction - 碰撞方向
     */
    handlePlayerCollision(player, direction) {
        if (!this.isAlive || this.isDefeated) {
            return;
        }
        
        console.log(`Goomba collision with player from ${direction}`);
        
        // 碰撞处理现在由Player类统一处理
        // 这里只是记录碰撞信息
    }
    
    /**
     * Goomba被击败时的特殊处理
     * @param {GameObject} attacker - 攻击者
     */
    onDefeat(attacker) {
        super.onDefeat(attacker);
        
        // Goomba特有的击败效果
        console.log('Goomba defeated! *squish*');
        
        // 可以在这里添加音效、分数奖励等
        // 例如：播放击败音效、给玩家加分
    }
    
    /**
     * 更新Goomba特有的巡逻逻辑
     * @param {number} deltaTime - 时间步长
     */
    updateMoving(deltaTime) {
        super.updateMoving(deltaTime);
        
        // Goomba可能有特殊的移动模式
        // 例如：遇到其他敌人时的行为等
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Enemy, Goomba };
} else {
    window.Enemy = Enemy;
    window.Goomba = Goomba;
}