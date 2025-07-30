/**
 * Collectible基类 - 所有收集品的基础类
 */
class Collectible extends GameObject {
    constructor(x = 0, y = 0, width = 20, height = 20) {
        super(x, y, width, height);
        
        this.tag = 'Collectible';
        this.type = 'collectible';
        this.value = 100;
        this.isCollected = false;
        
        // 简单动画
        this.animationTime = 0;
        this.originalY = y;
        
        // 物理设置
        this.useGravity = false;
        this.collisionEnabled = true;
        
        console.log(`Collectible created at (${x}, ${y})`);
    }
    
    /**
     * 设置收集品的分数值
     */
    setValue(value) {
        this.value = value;
    }

    /**
     * 获取收集品的分数值
     */
    getValue() {
        return this.value;
    }

    /**
     * 更新收集品
     */
    onUpdate(deltaTime) {
        if (this.isCollected) {
            this.destroy();
            return;
        }

        // 简单浮动动画
        this.animationTime += deltaTime;
        const floatOffset = Math.sin(this.animationTime * 2) * 3;
        this.position.y = this.originalY + floatOffset;
    }
    
    /**
     * 渲染收集品
     */
    onRender(context, interpolation) {
        // 简单的金色圆形
        const centerX = -this.size.x / 2 + this.size.x / 2;
        const centerY = -this.size.y / 2 + this.size.y / 2;
        const radius = this.size.x / 2 - 2;
        
        // 外圈
        context.fillStyle = '#B8860B';
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.fill();
        
        // 内圈
        context.fillStyle = '#FFD700';
        context.beginPath();
        context.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
        context.fill();
        
        // 高光
        context.fillStyle = 'rgba(255, 255, 255, 0.6)';
        context.beginPath();
        context.arc(centerX - 3, centerY - 3, 3, 0, Math.PI * 2);
        context.fill();
    }
    
    /**
     * 碰撞处理
     */
    onCollision(other, direction, type) {
        if (type === 'object' && other && other.tag === 'Player' && !this.isCollected) {
            console.log(`💰 Coin collected! +${this.value} points`);
            
            // 通过分数管理器给玩家加分
            if (other.scoreManager) {
                const coinCenter = {
                    x: this.position.x + this.size.x / 2,
                    y: this.position.y + this.size.y / 2
                };
                other.scoreManager.addScore('coin', this.value, coinCenter);
            }
            
            // 触发金币收集事件
            if (window.gameEvents) {
                window.gameEvents.trigger('coinCollected', {
                    coin: this,
                    player: other,
                    value: this.value
                });
            }
            
            // 标记为已收集
            this.isCollected = true;
            this.collisionEnabled = false;
        }
    }
}

/**
 * Coin类 - 金币收集品
 */
class Coin extends Collectible {
    constructor(x = 0, y = 0) {
        super(x, y, 16, 16);
        this.tag = 'Coin';
        this.type = 'coin';
        console.log(`Coin created at (${x}, ${y})`);
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Collectible, Coin };
} else {
    window.Collectible = Collectible;
    window.Coin = Coin;
}