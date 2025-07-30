/**
 * Platform类 - 可站立的平台对象
 * 继承自GameObject，实现各种类型的平台
 */
class Platform extends GameObject {
    constructor(x, y, width, height, type = 'normal') {
        super(x, y, width, height);
        
        // 基本属性
        this.tag = 'Platform';
        this.type = type;
        this.isPlatform = true;
        this.useGravity = false;
        this.useFriction = false;
        
        // 平台特定属性
        this.platformType = type;
        this.isOneWay = false; // 是否为单向平台（只能从上方通过）
        this.isMoving = false; // 是否为移动平台
        this.isBreakable = false; // 是否可破坏
        
        // 视觉属性
        this.setupVisualProperties();
        
        // 移动平台属性
        this.moveSpeed = 50; // 移动速度
        this.moveDirection = new Vector2D(1, 0); // 移动方向
        this.moveDistance = 100; // 移动距离
        this.startPosition = new Vector2D(x, y); // 起始位置
        this.moveTimer = 0; // 移动计时器
        
        console.log(`Platform created: ${type} at (${x}, ${y})`);
    }
    
    /**
     * 设置视觉属性
     */
    setupVisualProperties() {
        switch (this.platformType) {
            case 'ground':
                this.color = '#8B4513'; // 棕色地面
                this.topColor = '#228B22'; // 绿色草地
                break;
            case 'brick':
                this.color = '#CD853F'; // 砖块颜色
                this.topColor = '#D2691E';
                this.isBreakable = true;
                break;
            case 'stone':
                this.color = '#696969'; // 石头颜色
                this.topColor = '#778899';
                break;
            case 'wood':
                this.color = '#DEB887'; // 木头颜色
                this.topColor = '#F4A460';
                break;
            case 'cloud':
                this.color = '#F0F8FF'; // 云朵颜色
                this.topColor = '#E6E6FA';
                this.isOneWay = true;
                break;
            case 'moving':
                this.color = '#4682B4'; // 移动平台颜色
                this.topColor = '#5F9EA0';
                this.isMoving = true;
                break;
            default:
                this.color = '#654321'; // 默认平台颜色
                this.topColor = '#228B22';
                break;
        }
    }
    
    /**
     * 更新平台逻辑
     * @param {number} deltaTime - 时间步长（秒）
     */
    onUpdate(deltaTime) {
        if (this.isMoving) {
            this.updateMovement(deltaTime);
        }
    }
    
    /**
     * 更新移动平台逻辑
     * @param {number} deltaTime - 时间步长
     */
    updateMovement(deltaTime) {
        this.moveTimer += deltaTime;
        
        // 计算移动位置（使用正弦波实现往返运动）
        const progress = Math.sin(this.moveTimer * this.moveSpeed / this.moveDistance);
        const offset = Vector2D.multiply(this.moveDirection, progress * this.moveDistance);
        
        this.position.x = this.startPosition.x + offset.x;
        this.position.y = this.startPosition.y + offset.y;
    }
    
    /**
     * 渲染平台
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} interpolation - 插值因子
     */
    onRender(context, interpolation) {
        const centerX = -this.size.x / 2;
        const centerY = -this.size.y / 2;
        
        switch (this.platformType) {
            case 'ground':
                this.renderGroundPlatform(context, centerX, centerY);
                break;
            case 'brick':
                this.renderBrickPlatform(context, centerX, centerY);
                break;
            case 'stone':
                this.renderStonePlatform(context, centerX, centerY);
                break;
            case 'wood':
                this.renderWoodPlatform(context, centerX, centerY);
                break;
            case 'cloud':
                this.renderCloudPlatform(context, centerX, centerY);
                break;
            case 'moving':
                this.renderMovingPlatform(context, centerX, centerY);
                break;
            default:
                this.renderDefaultPlatform(context, centerX, centerY);
                break;
        }
    }
    
    /**
     * 渲染地面平台
     */
    renderGroundPlatform(context, centerX, centerY) {
        // 绘制草地顶部
        context.fillStyle = this.topColor;
        context.fillRect(centerX, centerY, this.size.x, 4);
        
        // 绘制土壤主体
        context.fillStyle = this.color;
        context.fillRect(centerX, centerY + 4, this.size.x, this.size.y - 4);
        
        // 添加一些细节
        context.fillStyle = '#654321';
        for (let i = 0; i < this.size.x; i += 20) {
            context.fillRect(centerX + i, centerY + 8, 2, this.size.y - 12);
        }
    }
    
    /**
     * 渲染砖块平台
     */
    renderBrickPlatform(context, centerX, centerY) {
        // 绘制砖块背景
        context.fillStyle = this.color;
        context.fillRect(centerX, centerY, this.size.x, this.size.y);
        
        // 绘制砖块纹理
        context.strokeStyle = '#8B4513';
        context.lineWidth = 1;
        
        const brickWidth = 20;
        const brickHeight = 10;
        
        for (let y = 0; y < this.size.y; y += brickHeight) {
            for (let x = 0; x < this.size.x; x += brickWidth) {
                const offsetX = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
                context.strokeRect(centerX + x + offsetX, centerY + y, brickWidth, brickHeight);
            }
        }
    }
    
    /**
     * 渲染石头平台
     */
    renderStonePlatform(context, centerX, centerY) {
        // 绘制石头背景
        context.fillStyle = this.color;
        context.fillRect(centerX, centerY, this.size.x, this.size.y);
        
        // 添加固定的石头纹理点
        context.fillStyle = '#A9A9A9';
        const texturePoints = [
            { x: 0.2, y: 0.3 },
            { x: 0.7, y: 0.2 },
            { x: 0.4, y: 0.6 },
            { x: 0.8, y: 0.7 },
            { x: 0.1, y: 0.8 }
        ];
        
        for (const point of texturePoints) {
            const x = centerX + point.x * this.size.x;
            const y = centerY + point.y * this.size.y;
            context.fillRect(x, y, 3, 3);
        }
        
        // 绘制边框
        context.strokeStyle = '#2F4F4F';
        context.lineWidth = 2;
        context.strokeRect(centerX, centerY, this.size.x, this.size.y);
    }
    
    /**
     * 渲染木头平台
     */
    renderWoodPlatform(context, centerX, centerY) {
        // 绘制木头背景
        context.fillStyle = this.color;
        context.fillRect(centerX, centerY, this.size.x, this.size.y);
        
        // 绘制木纹
        context.strokeStyle = '#8B4513';
        context.lineWidth = 1;
        
        for (let i = 0; i < this.size.y; i += 4) {
            context.beginPath();
            context.moveTo(centerX, centerY + i);
            context.lineTo(centerX + this.size.x, centerY + i);
            context.stroke();
        }
        
        // 绘制木板分割线
        const boardWidth = this.size.x / 3;
        for (let i = 1; i < 3; i++) {
            context.strokeStyle = '#654321';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(centerX + i * boardWidth, centerY);
            context.lineTo(centerX + i * boardWidth, centerY + this.size.y);
            context.stroke();
        }
    }
    
    /**
     * 渲染云朵平台
     */
    renderCloudPlatform(context, centerX, centerY) {
        // 绘制云朵形状
        context.fillStyle = this.color;
        
        // 主体
        context.fillRect(centerX + 10, centerY + 5, this.size.x - 20, this.size.y - 10);
        
        // 云朵的圆形部分
        const radius = this.size.y / 2;
        for (let i = 0; i < this.size.x; i += radius) {
            context.beginPath();
            context.arc(centerX + i + radius, centerY + radius, radius, 0, Math.PI * 2);
            context.fill();
        }
        
        // 添加阴影效果
        context.fillStyle = '#E0E0E0';
        context.fillRect(centerX + 10, centerY + this.size.y - 3, this.size.x - 20, 2);
    }
    
    /**
     * 渲染移动平台
     */
    renderMovingPlatform(context, centerX, centerY) {
        // 绘制平台主体
        context.fillStyle = this.color;
        context.fillRect(centerX, centerY, this.size.x, this.size.y);
        
        // 绘制顶部
        context.fillStyle = this.topColor;
        context.fillRect(centerX, centerY, this.size.x, 4);
        
        // 绘制移动指示器
        context.fillStyle = '#FFD700';
        const indicatorSize = 4;
        const spacing = 8;
        
        for (let i = indicatorSize; i < this.size.x - indicatorSize; i += spacing) {
            context.fillRect(centerX + i, centerY + this.size.y / 2 - indicatorSize / 2, indicatorSize, indicatorSize);
        }
        
        // 绘制边框
        context.strokeStyle = '#2F4F4F';
        context.lineWidth = 1;
        context.strokeRect(centerX, centerY, this.size.x, this.size.y);
    }
    
    /**
     * 渲染默认平台
     */
    renderDefaultPlatform(context, centerX, centerY) {
        // 绘制平台顶部
        context.fillStyle = this.topColor;
        context.fillRect(centerX, centerY, this.size.x, 4);
        
        // 绘制平台主体
        context.fillStyle = this.color;
        context.fillRect(centerX, centerY + 4, this.size.x, this.size.y - 4);
    }
    
    /**
     * 检查是否可以从指定方向通过
     * @param {string} direction - 碰撞方向
     * @returns {boolean} 是否可以通过
     */
    canPassThrough(direction) {
        if (this.isOneWay) {
            // 单向平台只能从上方通过
            return direction !== Physics.CollisionType.TOP;
        }
        return false;
    }
    
    /**
     * 平台被踩踏时的响应
     * @param {GameObject} object - 踩踏的对象
     */
    onStepped(object) {
        if (this.isBreakable && object.tag === 'Player') {
            // 可破坏平台的处理逻辑
            this.startBreaking();
        }
    }
    
    /**
     * 开始破坏平台
     */
    startBreaking() {
        // 简单的破坏效果 - 改变颜色并在一段时间后销毁
        this.color = '#8B0000'; // 变红表示即将破坏
        
        setTimeout(() => {
            this.destroy();
        }, 1000); // 1秒后销毁
    }
    
    /**
     * 设置移动参数
     * @param {Vector2D} direction - 移动方向
     * @param {number} distance - 移动距离
     * @param {number} speed - 移动速度
     */
    setMovement(direction, distance, speed) {
        this.moveDirection = direction.normalize();
        this.moveDistance = distance;
        this.moveSpeed = speed;
        this.isMoving = true;
    }
    
    /**
     * 获取平台信息
     * @returns {Object} 平台信息
     */
    getPlatformInfo() {
        return {
            type: this.platformType,
            position: { x: this.position.x, y: this.position.y },
            size: { width: this.size.x, height: this.size.y },
            isOneWay: this.isOneWay,
            isMoving: this.isMoving,
            isBreakable: this.isBreakable
        };
    }
    
    /**
     * 碰撞响应
     * @param {GameObject} other - 碰撞的对象
     * @param {string} direction - 碰撞方向
     * @param {string} type - 碰撞类型
     */
    onCollision(other, direction, type) {
        if (direction === Physics.CollisionType.TOP) {
            this.onStepped(other);
        }
    }
}

// 导出Platform类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Platform;
} else {
    window.Platform = Platform;
}