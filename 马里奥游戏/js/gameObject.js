/**
 * GameObject基类 - 所有游戏对象的基础类
 * 包含位置、大小、更新和渲染方法
 */
class GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    constructor(x = 0, y = 0, width = 32, height = 32) {
        // 位置和尺寸
        this.position = new Vector2D(x, y);
        this.previousPosition = new Vector2D(x, y);
        this.size = new Vector2D(width, height);
        
        // 速度和加速度
        this.velocity = new Vector2D(0, 0);
        this.acceleration = new Vector2D(0, 0);
        
        // 对象状态
        this.active = true;
        this.visible = true;
        this.destroyed = false;
        
        // 渲染属性
        this.color = '#FF0000'; // 默认红色
        this.alpha = 1.0;
        this.rotation = 0;
        this.scale = new Vector2D(1, 1);
        
        // 精灵相关
        this.sprite = null;
        this.spriteOffset = new Vector2D(0, 0);
        this.flipX = false;
        this.flipY = false;
        
        // 碰撞相关
        this.collisionEnabled = true;
        this.collisionBounds = {
            x: 0,
            y: 0,
            width: width,
            height: height
        };
        
        // 物理相关
        this.useGravity = true; // 是否受重力影响
        this.useFriction = true; // 是否受摩擦力影响
        this.gravityScale = 1.0; // 重力缩放因子
        this.frictionCoeff = null; // 摩擦系数（null使用默认值）
        this.isGrounded = false; // 是否在地面上
        this.isPlatform = false; // 是否是平台对象
        
        // 生命周期标记
        this.initialized = false;
        this.updateCount = 0;
        
        // 标签和类型（用于识别和分类）
        this.tag = 'GameObject';
        this.type = 'default';
        
        // 调用初始化
        this.init();
    }
    
    /**
     * 初始化方法 - 子类可以重写
     */
    init() {
        this.initialized = true;
        console.log(`GameObject initialized: ${this.tag}`);
    }
    
    /**
     * 更新方法 - 每帧调用
     * @param {number} deltaTime - 时间步长（秒）
     */
    update(deltaTime) {
        if (!this.active || this.destroyed) {
            return;
        }
        
        // 保存上一帧位置（用于插值渲染）
        this.previousPosition.copy(this.position);
        
        // 应用加速度到速度
        this.velocity.add(Vector2D.multiply(this.acceleration, deltaTime));
        
        // 应用速度到位置
        this.position.add(Vector2D.multiply(this.velocity, deltaTime));
        
        // 更新碰撞边界
        this.updateCollisionBounds();
        
        // 调用子类的更新逻辑
        this.onUpdate(deltaTime);
        
        this.updateCount++;
    }
    
    /**
     * 子类可重写的更新方法
     * @param {number} deltaTime - 时间步长（秒）
     */
    onUpdate(deltaTime) {
        // 子类实现具体逻辑
    }
    
    /**
     * 渲染方法
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} interpolation - 插值因子（0-1）
     */
    render(context, interpolation = 0) {
        if (!this.visible || this.destroyed) {
            return;
        }
        
        // 计算插值位置（平滑渲染）
        const renderPosition = this.getInterpolatedPosition(interpolation);
        
        // 保存上下文状态
        context.save();
        
        // 应用变换
        this.applyTransform(context, renderPosition);
        
        // 渲染对象
        if (this.sprite) {
            this.renderSprite(context);
        } else {
            this.renderDefault(context);
        }
        
        // 调用子类的渲染逻辑
        this.onRender(context, interpolation);
        
        // 恢复上下文状态
        context.restore();
        
        // 渲染调试信息（如果启用）
        if (this.shouldRenderDebug()) {
            this.renderDebug(context, renderPosition);
        }
    }
    
    /**
     * 子类可重写的渲染方法
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} interpolation - 插值因子
     */
    onRender(context, interpolation) {
        // 子类实现具体逻辑
    }
    
    /**
     * 获取插值位置（用于平滑渲染）
     * @param {number} interpolation - 插值因子
     * @returns {Vector2D} 插值位置
     */
    getInterpolatedPosition(interpolation) {
        if (interpolation <= 0) {
            return this.position.clone();
        }
        
        return Vector2D.add(
            this.previousPosition,
            Vector2D.multiply(
                Vector2D.subtract(this.position, this.previousPosition),
                interpolation
            )
        );
    }
    
    /**
     * 应用变换到渲染上下文
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {Vector2D} renderPosition - 渲染位置
     */
    applyTransform(context, renderPosition) {
        // 移动到对象位置
        context.translate(
            renderPosition.x + this.size.x / 2,
            renderPosition.y + this.size.y / 2
        );
        
        // 应用旋转
        if (this.rotation !== 0) {
            context.rotate(this.rotation);
        }
        
        // 应用缩放和翻转
        let scaleX = this.scale.x * (this.flipX ? -1 : 1);
        let scaleY = this.scale.y * (this.flipY ? -1 : 1);
        context.scale(scaleX, scaleY);
        
        // 应用透明度
        context.globalAlpha = this.alpha;
    }
    
    /**
     * 渲染精灵
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderSprite(context) {
        if (!this.sprite || !this.sprite.image) {
            this.renderDefault(context);
            return;
        }
        
        const image = this.sprite.image;
        const sx = this.sprite.sourceX || 0;
        const sy = this.sprite.sourceY || 0;
        const sw = this.sprite.sourceWidth || image.width;
        const sh = this.sprite.sourceHeight || image.height;
        
        // 绘制精灵（相对于中心点）
        context.drawImage(
            image,
            sx, sy, sw, sh,
            -this.size.x / 2 + this.spriteOffset.x,
            -this.size.y / 2 + this.spriteOffset.y,
            this.size.x,
            this.size.y
        );
    }
    
    /**
     * 默认渲染（矩形）
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderDefault(context) {
        context.fillStyle = this.color;
        context.fillRect(
            -this.size.x / 2,
            -this.size.y / 2,
            this.size.x,
            this.size.y
        );
    }
    
    /**
     * 渲染调试信息
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {Vector2D} renderPosition - 渲染位置
     */
    renderDebug(context, renderPosition) {
        context.save();
        
        // 重置变换
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        // 绘制边界框
        context.strokeStyle = '#00FF00';
        context.lineWidth = 1;
        context.strokeRect(
            renderPosition.x,
            renderPosition.y,
            this.size.x,
            this.size.y
        );
        
        // 绘制碰撞边界
        if (this.collisionEnabled) {
            context.strokeStyle = '#FF00FF';
            context.strokeRect(
                renderPosition.x + this.collisionBounds.x,
                renderPosition.y + this.collisionBounds.y,
                this.collisionBounds.width,
                this.collisionBounds.height
            );
        }
        
        // 绘制中心点
        context.fillStyle = '#FFFF00';
        context.fillRect(
            renderPosition.x + this.size.x / 2 - 2,
            renderPosition.y + this.size.y / 2 - 2,
            4, 4
        );
        
        // 绘制速度向量
        if (!this.velocity.isZero()) {
            const centerX = renderPosition.x + this.size.x / 2;
            const centerY = renderPosition.y + this.size.y / 2;
            const velScale = 10; // 缩放因子
            
            context.strokeStyle = '#0000FF';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(centerX, centerY);
            context.lineTo(
                centerX + this.velocity.x * velScale,
                centerY + this.velocity.y * velScale
            );
            context.stroke();
        }
        
        context.restore();
    }
    
    /**
     * 更新碰撞边界
     */
    updateCollisionBounds() {
        // 默认碰撞边界与对象大小相同
        this.collisionBounds.x = 0;
        this.collisionBounds.y = 0;
        this.collisionBounds.width = this.size.x;
        this.collisionBounds.height = this.size.y;
    }
    
    /**
     * 检查碰撞
     * @param {GameObject} other - 另一个游戏对象
     * @returns {boolean} 是否发生碰撞
     */
    checkCollision(other) {
        if (!this.collisionEnabled || !other.collisionEnabled) {
            return false;
        }
        
        if (this.destroyed || other.destroyed) {
            return false;
        }
        
        // AABB碰撞检测
        const thisLeft = this.position.x + this.collisionBounds.x;
        const thisRight = thisLeft + this.collisionBounds.width;
        const thisTop = this.position.y + this.collisionBounds.y;
        const thisBottom = thisTop + this.collisionBounds.height;
        
        const otherLeft = other.position.x + other.collisionBounds.x;
        const otherRight = otherLeft + other.collisionBounds.width;
        const otherTop = other.position.y + other.collisionBounds.y;
        const otherBottom = otherTop + other.collisionBounds.height;
        
        return !(thisRight <= otherLeft ||
                thisLeft >= otherRight ||
                thisBottom <= otherTop ||
                thisTop >= otherBottom);
    }
    
    /**
     * 碰撞响应
     * @param {GameObject} other - 碰撞的对象
     * @param {string} direction - 碰撞方向
     * @param {string} type - 碰撞类型
     */
    onCollision(other, direction, type) {
        // 子类可以重写此方法来处理碰撞
    }
    
    /**
     * 对象离开边界时调用
     */
    onOutOfBounds() {
        // 默认行为：销毁对象
        this.destroy();
    }
    
    /**
     * 设置精灵
     * @param {Object} sprite - 精灵对象
     */
    setSprite(sprite) {
        this.sprite = sprite;
    }
    
    /**
     * 设置位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    setPosition(x, y) {
        this.position.set(x, y);
        this.previousPosition.set(x, y);
    }
    
    /**
     * 设置速度
     * @param {number} x - X方向速度
     * @param {number} y - Y方向速度
     */
    setVelocity(x, y) {
        this.velocity.set(x, y);
    }
    
    /**
     * 添加力（影响加速度）
     * @param {number} x - X方向力
     * @param {number} y - Y方向力
     */
    addForce(x, y) {
        this.acceleration.add(new Vector2D(x, y));
    }
    
    /**
     * 获取边界矩形
     * @returns {Object} 边界矩形 {x, y, width, height}
     */
    getBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.size.x,
            height: this.size.y
        };
    }
    
    /**
     * 获取碰撞边界矩形
     * @returns {Object} 碰撞边界矩形 {x, y, width, height}
     */
    getCollisionBounds() {
        return {
            x: this.position.x + this.collisionBounds.x,
            y: this.position.y + this.collisionBounds.y,
            width: this.collisionBounds.width,
            height: this.collisionBounds.height
        };
    }
    
    /**
     * 获取中心点
     * @returns {Vector2D} 中心点坐标
     */
    getCenter() {
        return new Vector2D(
            this.position.x + this.size.x / 2,
            this.position.y + this.size.y / 2
        );
    }
    
    /**
     * 检查点是否在对象内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} 点是否在对象内
     */
    containsPoint(x, y) {
        return x >= this.position.x &&
               x <= this.position.x + this.size.x &&
               y >= this.position.y &&
               y <= this.position.y + this.size.y;
    }
    
    /**
     * 是否应该渲染调试信息
     * @returns {boolean} 是否渲染调试信息
     */
    shouldRenderDebug() {
        return window.location.search.includes('debug=true');
    }
    
    /**
     * 销毁对象
     */
    destroy() {
        if (this.destroyed) {
            return;
        }
        
        this.destroyed = true;
        this.active = false;
        this.visible = false;
        
        // 调用清理方法
        this.onDestroy();
        
        console.log(`GameObject destroyed: ${this.tag}`);
    }
    
    /**
     * 子类可重写的销毁方法
     */
    onDestroy() {
        // 子类实现清理逻辑
    }
    
    /**
     * 检查对象是否已销毁
     * @returns {boolean} 是否已销毁
     */
    isDestroyed() {
        return this.destroyed;
    }
    
    /**
     * 激活对象
     */
    activate() {
        this.active = true;
    }
    
    /**
     * 停用对象
     */
    deactivate() {
        this.active = false;
    }
    
    /**
     * 显示对象
     */
    show() {
        this.visible = true;
    }
    
    /**
     * 隐藏对象
     */
    hide() {
        this.visible = false;
    }
    
    /**
     * 转换为字符串表示
     * @returns {string} 字符串表示
     */
    toString() {
        return `${this.tag}(${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)})`;
    }
}

// 导出GameObject类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameObject;
} else {
    window.GameObject = GameObject;
}