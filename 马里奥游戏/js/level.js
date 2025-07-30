/**
 * Level类 - 关卡管理系统
 * 负责加载关卡数据、管理关卡对象和相机系统
 */
class Level {
    constructor(levelData = null) {
        // 基本属性
        this.levelData = levelData;
        this.width = 3200; // 关卡宽度
        this.height = 600; // 关卡高度
        
        // 对象管理
        this.platforms = [];
        this.enemies = [];
        this.collectibles = [];
        this.decorations = [];
        this.allObjects = [];
        
        // 关卡状态
        this.isLoaded = false;
        this.spawnPoint = { x: 50, y: 500 };
        this.goalPoint = { x: 3000, y: 500 };
        
        // 相机系统
        this.camera = {
            x: 0,
            y: 0,
            width: 800,
            height: 600,
            target: null, // 跟随目标
            followSpeed: 5, // 跟随速度
            bounds: {
                left: 0,
                right: this.width - 800,
                top: 0,
                bottom: 0
            }
        };
        
        // 背景系统
        this.background = {
            color: '#87CEEB',
            layers: []
        };
        
        console.log('Level created');
    }
    
    /**
     * 加载关卡数据
     * @param {Object} data - 关卡数据
     */
    loadLevel(data = null) {
        console.log('Loading level...');
        
        if (data) {
            this.levelData = data;
        }
        
        // 如果没有提供数据，使用默认关卡
        if (!this.levelData) {
            this.levelData = this.getDefaultLevelData();
        }
        
        // 清理现有对象
        this.clearLevel();
        
        // 设置关卡属性
        this.width = this.levelData.width || 3200;
        this.height = this.levelData.height || 600;
        this.spawnPoint = this.levelData.spawn || { x: 50, y: 500 };
        this.goalPoint = this.levelData.goal || { x: 3000, y: 500 };
        
        // 更新相机边界
        this.updateCameraBounds();
        
        // 生成关卡对象
        this.spawnPlatforms();
        this.spawnEnemies();
        this.spawnCollectibles();
        this.spawnDecorations();
        
        this.isLoaded = true;
        console.log('Level loaded successfully');
    }
    
    /**
     * 获取默认关卡数据
     * @returns {Object} 默认关卡数据
     */
    getDefaultLevelData() {
        return {
            width: 3200,
            height: 600,
            spawn: { x: 50, y: 500 },
            goal: { x: 3000, y: 500 },
            platforms: [
                // 地面平台
                { x: 0, y: 550, width: 800, height: 50, type: 'ground' },
                { x: 900, y: 550, width: 400, height: 50, type: 'ground' },
                { x: 1400, y: 550, width: 600, height: 50, type: 'ground' },
                { x: 2100, y: 550, width: 500, height: 50, type: 'ground' },
                { x: 2700, y: 550, width: 500, height: 50, type: 'ground' },
                
                // 悬浮平台
                { x: 200, y: 450, width: 100, height: 20, type: 'brick' },
                { x: 400, y: 350, width: 120, height: 20, type: 'stone' },
                { x: 600, y: 250, width: 80, height: 20, type: 'wood' },
                { x: 100, y: 300, width: 60, height: 20, type: 'cloud' },
                { x: 500, y: 500, width: 100, height: 20, type: 'brick' },
                
                // 移动平台
                { x: 800, y: 400, width: 80, height: 20, type: 'moving' },
                { x: 1200, y: 300, width: 100, height: 20, type: 'moving' },
                
                // 高台区域
                { x: 1500, y: 450, width: 150, height: 20, type: 'stone' },
                { x: 1700, y: 350, width: 120, height: 20, type: 'brick' },
                { x: 1900, y: 250, width: 100, height: 20, type: 'wood' },
                
                // 跳跃挑战区域
                { x: 2200, y: 400, width: 80, height: 20, type: 'cloud' },
                { x: 2350, y: 300, width: 80, height: 20, type: 'cloud' },
                { x: 2500, y: 200, width: 80, height: 20, type: 'cloud' },
                
                // 终点区域
                { x: 2800, y: 450, width: 200, height: 20, type: 'stone' },
                { x: 3050, y: 350, width: 150, height: 20, type: 'brick' }
            ],
            enemies: [
                { x: 300, y: 500, type: 'goomba' },
                { x: 700, y: 200, type: 'goomba' },
                { x: 1600, y: 400, type: 'goomba' },
                { x: 2300, y: 500, type: 'goomba' }
            ],
            collectibles: [
                { x: 150, y: 400, type: 'coin', value: 100 },
                { x: 450, y: 300, type: 'coin', value: 100 },
                { x: 650, y: 200, type: 'coin', value: 100 },
                { x: 850, y: 350, type: 'coin', value: 100 },
                { x: 1250, y: 250, type: 'coin', value: 100 },
                { x: 1750, y: 300, type: 'coin', value: 100 },
                { x: 2250, y: 350, type: 'coin', value: 100 },
                { x: 2450, y: 150, type: 'coin', value: 100 },
                { x: 2900, y: 400, type: 'coin', value: 100 },
                { x: 3100, y: 300, type: 'coin', value: 100 }
            ]
        };
    }
    
    /**
     * 生成平台对象
     */
    spawnPlatforms() {
        if (!this.levelData.platforms) return;
        
        for (const platformData of this.levelData.platforms) {
            const platform = new Platform(
                platformData.x,
                platformData.y,
                platformData.width,
                platformData.height,
                platformData.type
            );
            
            // 设置移动平台的特殊属性
            if (platformData.type === 'moving') {
                const movement = platformData.movement || {};
                platform.setMovement(
                    new Vector2D(movement.directionX || 1, movement.directionY || 0),
                    movement.distance || 100,
                    movement.speed || 50
                );
            }
            
            this.platforms.push(platform);
            this.allObjects.push(platform);
        }
        
        console.log(`Spawned ${this.platforms.length} platforms`);
    }
    
    /**
     * 生成敌人对象
     */
    spawnEnemies() {
        if (!this.levelData.enemies) return;
        
        for (const enemyData of this.levelData.enemies) {
            let enemy = null;
            
            // 根据类型创建不同的敌人
            switch (enemyData.type) {
                case 'goomba':
                    enemy = new Goomba(enemyData.x, enemyData.y);
                    break;
                    
                default:
                    console.warn(`Unknown enemy type: ${enemyData.type}`);
                    continue;
            }
            
            // 设置敌人特殊属性
            if (enemyData.patrolDistance) {
                enemy.setPatrolDistance(enemyData.patrolDistance);
            }
            
            if (enemyData.moveSpeed) {
                enemy.setMoveSpeed(enemyData.moveSpeed);
            }
            
            if (enemyData.direction) {
                enemy.direction = enemyData.direction;
            }
            
            this.enemies.push(enemy);
            this.allObjects.push(enemy);
        }
        
        console.log(`Spawned ${this.enemies.length} enemies`);
    }
    
    /**
     * 生成收集品对象
     */
    spawnCollectibles() {
        if (!this.levelData.collectibles) return;
        
        for (const collectibleData of this.levelData.collectibles) {
            let collectible = null;
            
            // 根据类型创建不同的收集品
            switch (collectibleData.type) {
                case 'coin':
                    collectible = new Coin(collectibleData.x, collectibleData.y);
                    break;
                    
                default:
                    console.warn(`Unknown collectible type: ${collectibleData.type}`);
                    continue;
            }
            
            // 设置收集品特殊属性
            if (collectibleData.value) {
                collectible.setValue(collectibleData.value);
            }
            
            this.collectibles.push(collectible);
            this.allObjects.push(collectible);
        }
        
        console.log(`Spawned ${this.collectibles.length} collectibles`);
    }
    
    /**
     * 生成装饰对象
     */
    spawnDecorations() {
        // 创建背景装饰对象
        class BackgroundDecoration extends GameObject {
            constructor() {
                super(0, 0, 3200, 600);
                this.tag = 'Background';
                this.collisionEnabled = false;
                this.useGravity = false;
            }
            
            onRender(context, interpolation) {
                // 绘制天空背景渐变
                const gradient = context.createLinearGradient(0, -this.size.y / 2, 0, this.size.y / 2);
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.7, '#98FB98');
                gradient.addColorStop(1, '#90EE90');
                context.fillStyle = gradient;
                context.fillRect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
                
                // 绘制远山
                context.fillStyle = '#8FBC8F';
                context.beginPath();
                context.moveTo(-this.size.x / 2, this.size.y / 2 - 200);
                for (let i = 0; i < this.size.x; i += 100) {
                    const height = 150 + Math.sin(i * 0.01) * 50;
                    context.lineTo(-this.size.x / 2 + i, this.size.y / 2 - height);
                }
                context.lineTo(this.size.x / 2, this.size.y / 2);
                context.lineTo(-this.size.x / 2, this.size.y / 2);
                context.fill();
                
                // 绘制云朵
                this.drawClouds(context);
            }
            
            drawClouds(context) {
                context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                
                const clouds = [
                    { x: 200, y: 100, size: 30 },
                    { x: 600, y: 80, size: 40 },
                    { x: 1000, y: 120, size: 35 },
                    { x: 1400, y: 90, size: 45 },
                    { x: 1800, y: 110, size: 30 },
                    { x: 2200, y: 70, size: 50 },
                    { x: 2600, y: 100, size: 35 },
                    { x: 3000, y: 85, size: 40 }
                ];
                
                for (const cloud of clouds) {
                    this.drawCloud(context, cloud.x - this.size.x / 2, cloud.y - this.size.y / 2, cloud.size);
                }
            }
            
            drawCloud(context, x, y, size) {
                context.beginPath();
                context.arc(x, y, size, 0, Math.PI * 2);
                context.arc(x + size * 0.6, y, size * 0.8, 0, Math.PI * 2);
                context.arc(x + size * 1.2, y, size * 0.7, 0, Math.PI * 2);
                context.arc(x + size * 0.3, y - size * 0.5, size * 0.6, 0, Math.PI * 2);
                context.arc(x + size * 0.9, y - size * 0.4, size * 0.5, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        const background = new BackgroundDecoration();
        this.decorations.push(background);
        this.allObjects.push(background);
        
        console.log('Background decorations created');
    }
    
    /**
     * 清理关卡
     */
    clearLevel() {
        this.platforms.length = 0;
        this.enemies.length = 0;
        this.collectibles.length = 0;
        this.decorations.length = 0;
        this.allObjects.length = 0;
        this.isLoaded = false;
    }
    
    /**
     * 更新关卡逻辑
     * @param {number} deltaTime - 时间步长（秒）
     */
    update(deltaTime) {
        if (!this.isLoaded) return;
        
        // 更新相机
        this.updateCamera(deltaTime);
        
        // 更新所有关卡对象
        for (const obj of this.allObjects) {
            if (obj && obj.update && obj.active && !obj.destroyed) {
                obj.update(deltaTime);
            }
        }
        
        // 清理已销毁的对象
        this.cleanupDestroyedObjects();
    }
    
    /**
     * 更新相机系统
     * @param {number} deltaTime - 时间步长
     */
    updateCamera(deltaTime) {
        if (!this.camera.target) return;
        
        // 计算目标位置
        const targetX = this.camera.target.position.x - this.camera.width / 2;
        const targetY = this.camera.target.position.y - this.camera.height / 2;
        
        // 应用边界限制
        const clampedX = Math.max(this.camera.bounds.left, 
                         Math.min(this.camera.bounds.right, targetX));
        const clampedY = Math.max(this.camera.bounds.top, 
                         Math.min(this.camera.bounds.bottom, targetY));
        
        // 平滑跟随
        const followSpeed = this.camera.followSpeed * deltaTime;
        this.camera.x += (clampedX - this.camera.x) * followSpeed;
        this.camera.y += (clampedY - this.camera.y) * followSpeed;
    }
    
    /**
     * 设置相机跟随目标
     * @param {GameObject} target - 跟随目标
     */
    setCameraTarget(target) {
        this.camera.target = target;
        console.log('Camera target set to:', target.tag);
    }
    
    /**
     * 更新相机边界
     */
    updateCameraBounds() {
        this.camera.bounds.right = Math.max(0, this.width - this.camera.width);
        this.camera.bounds.bottom = Math.max(0, this.height - this.camera.height);
    }
    
    /**
     * 应用相机变换到渲染上下文
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    applyCameraTransform(context) {
        context.translate(-this.camera.x, -this.camera.y);
    }
    
    /**
     * 重置相机变换
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    resetCameraTransform(context) {
        context.translate(this.camera.x, this.camera.y);
    }
    
    /**
     * 渲染关卡
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {number} interpolation - 插值因子
     */
    render(context, interpolation = 0) {
        if (!this.isLoaded) return;

        // 应用相机变换
        context.save();
        this.applyCameraTransform(context);

        // 渲染所有关卡对象
        for (const obj of this.allObjects) {
            if (obj && obj.render && obj.visible && !obj.destroyed) {
                // 🔧 临时禁用视锥剔除来调试渲染问题
                // if (this.isObjectInCameraView(obj)) {
                    obj.render(context, interpolation);
                // }
            }
        }

        // 重置相机变换
        context.restore();

        // 渲染UI元素（不受相机影响）
        this.renderUI(context);
    }
    
    /**
     * 检查对象是否在相机视野内
     * @param {GameObject} obj - 游戏对象
     * @returns {boolean} 是否在视野内
     */
    isObjectInCameraView(obj) {
        const objBounds = obj.getBounds();
        const cameraBounds = {
            x: this.camera.x,
            y: this.camera.y,
            width: this.camera.width,
            height: this.camera.height
        };
        
        return !(objBounds.x + objBounds.width < cameraBounds.x ||
                objBounds.x > cameraBounds.x + cameraBounds.width ||
                objBounds.y + objBounds.height < cameraBounds.y ||
                objBounds.y > cameraBounds.y + cameraBounds.height);
    }
    
    /**
     * 渲染UI元素
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     */
    renderUI(context) {
        // 渲染相机调试信息
        if (this.shouldRenderDebug()) {
            context.fillStyle = '#FFFFFF';
            context.font = '12px monospace';
            context.textAlign = 'left';
            context.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, 10, 20);
            
            if (this.camera.target) {
                context.fillText(`Target: (${Math.round(this.camera.target.position.x)}, ${Math.round(this.camera.target.position.y)})`, 10, 35);
            }
        }
    }
    
    /**
     * 清理已销毁的对象
     */
    cleanupDestroyedObjects() {
        this.allObjects = this.allObjects.filter(obj => !obj.destroyed);
        this.platforms = this.platforms.filter(obj => !obj.destroyed);
        this.enemies = this.enemies.filter(obj => !obj.destroyed);
        this.collectibles = this.collectibles.filter(obj => !obj.destroyed);
        this.decorations = this.decorations.filter(obj => !obj.destroyed);
    }
    
    /**
     * 获取所有关卡对象
     * @returns {Array} 所有对象数组
     */
    getAllObjects() {
        return this.allObjects;
    }
    
    /**
     * 获取平台对象
     * @returns {Array} 平台数组
     */
    getPlatforms() {
        return this.platforms;
    }
    
    /**
     * 获取敌人对象
     * @returns {Array} 敌人数组
     */
    getEnemies() {
        return this.enemies;
    }
    
    /**
     * 获取收集品对象
     * @returns {Array} 收集品数组
     */
    getCollectibles() {
        return this.collectibles;
    }
    
    /**
     * 获取生成点
     * @returns {Object} 生成点坐标
     */
    getSpawnPoint() {
        return { ...this.spawnPoint };
    }
    
    /**
     * 获取终点
     * @returns {Object} 终点坐标
     */
    getGoalPoint() {
        return { ...this.goalPoint };
    }
    
    /**
     * 检查胜利条件
     * @param {GameObject} player - 玩家对象
     * @returns {boolean} 是否达到胜利条件
     */
    checkWinCondition(player) {
        if (!player) return false;
        
        const distance = Math.abs(player.position.x - this.goalPoint.x);
        return distance < 50; // 玩家距离终点50像素内即为胜利
    }
    
    /**
     * 重置关卡
     */
    reset() {
        console.log('Resetting level...');
        
        // 重新加载关卡数据
        this.loadLevel(this.levelData);
        
        // 重置相机位置
        this.camera.x = 0;
        this.camera.y = 0;
    }
    
    /**
     * 获取关卡信息
     * @returns {Object} 关卡信息
     */
    getLevelInfo() {
        return {
            width: this.width,
            height: this.height,
            platformCount: this.platforms.length,
            enemyCount: this.enemies.length,
            collectibleCount: this.collectibles.length,
            spawnPoint: this.spawnPoint,
            goalPoint: this.goalPoint,
            isLoaded: this.isLoaded
        };
    }
    
    /**
     * 是否应该渲染调试信息
     * @returns {boolean} 是否渲染调试信息
     */
    shouldRenderDebug() {
        return window.location.search.includes('debug=true');
    }
}

// 导出Level类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Level;
} else {
    window.Level = Level;
}