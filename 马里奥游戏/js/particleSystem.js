/**
 * ParticleSystem类 - 粒子系统
 * 用于创建各种视觉效果，如爆炸、收集特效等
 */
class ParticleSystem extends GameObject {
    constructor(x = 0, y = 0) {
        super(x, y, 0, 0);
        
        this.tag = 'ParticleSystem';
        this.particles = [];
        this.maxParticles = 100;
        
        // 粒子系统不参与物理和碰撞
        this.useGravity = false;
        this.collisionEnabled = false;
        
        console.log('ParticleSystem created');
    }
    
    /**
     * 创建爆炸效果
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} options - 选项
     */
    createExplosion(x, y, options = {}) {
        const config = {
            particleCount: options.particleCount || 8,
            color: options.color || '#FFD700',
            size: options.size || 4,
            speed: options.speed || 100,
            lifetime: options.lifetime || 0.8,
            gravity: options.gravity || 200
        };
        
        for (let i = 0; i < config.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / config.particleCount;
            const speed = config.speed + (Math.random() - 0.5) * 50;
            
            this.addParticle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: config.size + (Math.random() - 0.5) * 2,
                color: config.color,
                lifetime: config.lifetime,
                maxLifetime: config.lifetime,
                gravity: config.gravity,
                type: 'explosion'
            });
        }
    }
    
    /**
     * 创建收集特效
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} options - 选项
     */
    createCollectEffect(x, y, options = {}) {
        const config = {
            particleCount: options.particleCount || 6,
            color: options.color || '#FFD700',
            size: options.size || 3,
            speed: options.speed || 80,
            lifetime: options.lifetime || 1.0
        };
        
        for (let i = 0; i < config.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / config.particleCount;
            const speed = config.speed + Math.random() * 40;
            
            this.addParticle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50, // 向上偏移
                size: config.size,
                color: config.color,
                lifetime: config.lifetime,
                maxLifetime: config.lifetime,
                gravity: 0, // 收集特效不受重力影响
                type: 'collect',
                sparkle: true
            });
        }
    }
    
    /**
     * 创建跳跃尘土效果
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} options - 选项
     */
    createJumpDust(x, y, options = {}) {
        const config = {
            particleCount: options.particleCount || 4,
            color: options.color || '#D2B48C',
            size: options.size || 2,
            speed: options.speed || 60,
            lifetime: options.lifetime || 0.5
        };
        
        for (let i = 0; i < config.particleCount; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.5; // 向下散开
            const speed = config.speed + Math.random() * 30;
            
            this.addParticle({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: config.size + Math.random(),
                color: config.color,
                lifetime: config.lifetime,
                maxLifetime: config.lifetime,
                gravity: 100,
                type: 'dust'
            });
        }
    }
    
    /**
     * 创建死亡特效
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} options - 选项
     */
    createDeathEffect(x, y, options = {}) {
        const config = {
            particleCount: options.particleCount || 12,
            color: options.color || '#FF6B6B',
            size: options.size || 3,
            speed: options.speed || 120,
            lifetime: options.lifetime || 1.2
        };
        
        for (let i = 0; i < config.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / config.particleCount + (Math.random() - 0.5) * 0.5;
            const speed = config.speed + (Math.random() - 0.5) * 60;
            
            this.addParticle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100, // 向上爆炸
                size: config.size + (Math.random() - 0.5) * 2,
                color: config.color,
                lifetime: config.lifetime,
                maxLifetime: config.lifetime,
                gravity: 300,
                type: 'death',
                fade: true
            });
        }
    }
    
    /**
     * 添加粒子
     * @param {Object} particle - 粒子配置
     */
    addParticle(particle) {
        if (this.particles.length >= this.maxParticles) {
            // 移除最老的粒子
            this.particles.shift();
        }
        
        // 设置默认值
        particle.alpha = particle.alpha || 1.0;
        particle.rotation = particle.rotation || 0;
        particle.rotationSpeed = particle.rotationSpeed || (Math.random() - 0.5) * 10;
        
        this.particles.push(particle);
    }
    
    /**
     * 更新粒子系统
     * @param {number} deltaTime - 时间步长
     */
    onUpdate(deltaTime) {
        // 更新所有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新位置
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // 应用重力
            if (particle.gravity) {
                particle.vy += particle.gravity * deltaTime;
            }
            
            // 更新旋转
            particle.rotation += particle.rotationSpeed * deltaTime;
            
            // 更新生命周期
            particle.lifetime -= deltaTime;
            
            // 更新透明度
            if (particle.fade) {
                particle.alpha = particle.lifetime / particle.maxLifetime;
            }
            
            // 闪烁效果
            if (particle.sparkle) {
                particle.alpha = 0.5 + 0.5 * Math.sin(particle.lifetime * 20);
            }
            
            // 移除过期粒子
            if (particle.lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * 渲染粒子系统
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} interpolation - 插值因子
     */
    onRender(context, interpolation) {
        context.save();
        
        for (const particle of this.particles) {
            context.save();
            
            // 设置透明度
            context.globalAlpha = particle.alpha;
            
            // 移动到粒子位置
            context.translate(particle.x, particle.y);
            
            // 应用旋转
            if (particle.rotation) {
                context.rotate(particle.rotation);
            }
            
            // 根据粒子类型渲染
            this.renderParticle(context, particle);
            
            context.restore();
        }
        
        context.restore();
    }
    
    /**
     * 渲染单个粒子
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {Object} particle - 粒子对象
     */
    renderParticle(context, particle) {
        const halfSize = particle.size / 2;
        
        switch (particle.type) {
            case 'explosion':
                // 爆炸粒子 - 圆形
                context.fillStyle = particle.color;
                context.beginPath();
                context.arc(0, 0, halfSize, 0, Math.PI * 2);
                context.fill();
                break;
                
            case 'collect':
                // 收集粒子 - 星形
                context.fillStyle = particle.color;
                context.strokeStyle = particle.color;
                context.lineWidth = 1;
                this.drawStar(context, 0, 0, halfSize, 4);
                break;
                
            case 'dust':
                // 尘土粒子 - 方形
                context.fillStyle = particle.color;
                context.fillRect(-halfSize, -halfSize, particle.size, particle.size);
                break;
                
            case 'death':
                // 死亡粒子 - 三角形
                context.fillStyle = particle.color;
                context.beginPath();
                context.moveTo(0, -halfSize);
                context.lineTo(-halfSize, halfSize);
                context.lineTo(halfSize, halfSize);
                context.closePath();
                context.fill();
                break;
                
            default:
                // 默认粒子 - 圆形
                context.fillStyle = particle.color;
                context.beginPath();
                context.arc(0, 0, halfSize, 0, Math.PI * 2);
                context.fill();
                break;
        }
    }
    
    /**
     * 绘制星形
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} radius - 半径
     * @param {number} points - 星形点数
     */
    drawStar(context, x, y, radius, points) {
        const innerRadius = radius * 0.5;
        const angle = Math.PI / points;
        
        context.beginPath();
        
        for (let i = 0; i < points * 2; i++) {
            const currentRadius = i % 2 === 0 ? radius : innerRadius;
            const currentAngle = i * angle - Math.PI / 2;
            
            const pointX = x + Math.cos(currentAngle) * currentRadius;
            const pointY = y + Math.sin(currentAngle) * currentRadius;
            
            if (i === 0) {
                context.moveTo(pointX, pointY);
            } else {
                context.lineTo(pointX, pointY);
            }
        }
        
        context.closePath();
        context.fill();
        context.stroke();
    }
    
    /**
     * 清除所有粒子
     */
    clearAllParticles() {
        this.particles.length = 0;
    }
    
    /**
     * 获取粒子数量
     * @returns {number} 当前粒子数量
     */
    getParticleCount() {
        return this.particles.length;
    }
    
    /**
     * 设置最大粒子数量
     * @param {number} max - 最大粒子数量
     */
    setMaxParticles(max) {
        this.maxParticles = Math.max(1, max);
        
        // 如果当前粒子数量超过限制，移除多余的
        while (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }
    }
    
    /**
     * 销毁粒子系统
     */
    onDestroy() {
        this.clearAllParticles();
        console.log('ParticleSystem destroyed');
        super.onDestroy();
    }
}

// 导出ParticleSystem类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
} else {
    window.ParticleSystem = ParticleSystem;
}