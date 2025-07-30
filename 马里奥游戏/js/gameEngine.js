/**
 * 游戏引擎核心类
 * 负责游戏循环、渲染管理和时间控制
 */
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        
        // 游戏循环控制
        this.isRunning = false;
        this.animationId = null;
        
        // 时间管理
        this.lastTime = 0;
        this.deltaTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.accumulator = 0;
        
        // 帧率统计
        this.frameCount = 0;
        this.fpsTimer = 0;
        this.currentFPS = 0;
        
        // 性能监控
        this.performanceStats = {
            updateTime: 0,
            renderTime: 0,
            collisionTime: 0,
            objectCount: 0,
            averageFrameTime: 0,
            frameTimeHistory: []
        };
        
        // 游戏对象管理
        this.gameObjects = [];
        this.objectsToAdd = [];
        this.objectsToRemove = [];
        
        // 输入管理
        this.inputHandler = null;
        
        // 渲染设置
        this.clearColor = '#87CEEB'; // 天空蓝色
        
        console.log('GameEngine initialized');
    }
    
    /**
     * 初始化游戏引擎
     */
    init() {
        console.log('Initializing GameEngine...');
        
        // 设置Canvas属性
        this.setupCanvas();
        
        // 初始化输入处理
        this.setupInput();
        
        console.log('GameEngine initialization complete');
        return this;
    }
    
    /**
     * 设置Canvas属性
     */
    setupCanvas() {
        // 设置Canvas尺寸
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // 设置渲染上下文属性
        this.context.imageSmoothingEnabled = false; // 像素艺术风格
        this.context.textAlign = 'left';
        this.context.textBaseline = 'top';
    }
    
    /**
     * 设置输入处理
     */
    setupInput() {
        // 输入处理现在由全局InputManager管理
        this.inputHandler = window.inputManager || null;
    }
    
    /**
     * 启动游戏引擎
     */
    start() {
        if (this.isRunning) {
            console.warn('GameEngine is already running');
            return;
        }
        
        console.log('Starting GameEngine...');
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * 停止游戏引擎
     */
    stop() {
        if (!this.isRunning) {
            console.warn('GameEngine is not running');
            return;
        }
        
        console.log('Stopping GameEngine...');
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * 暂停游戏引擎
     */
    pause() {
        if (!this.isRunning) return;
        
        this.stop();
        console.log('GameEngine paused');
    }
    
    /**
     * 恢复游戏引擎
     */
    resume() {
        if (this.isRunning) return;
        
        this.start();
        console.log('GameEngine resumed');
    }
    
    /**
     * 主游戏循环
     */
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 累积时间用于固定时间步长更新
        this.accumulator += this.deltaTime;
        
        // 固定时间步长更新（确保物理计算的一致性）
        // 🔧 修复：添加最大更新次数限制，防止无限循环
        let maxUpdates = 5; // 最多连续更新5次
        while (this.accumulator >= this.frameInterval && maxUpdates > 0) {
            this.update(this.frameInterval / 1000); // 转换为秒
            this.accumulator -= this.frameInterval;
            maxUpdates--;
        }

        // 如果累积时间过大，重置以避免螺旋死亡
        if (this.accumulator > this.frameInterval * 5) {
            console.warn('GameEngine: 累积时间过大，重置accumulator');
            this.accumulator = 0;
        }
        
        // 渲染（使用插值以获得平滑的视觉效果）
        const interpolation = this.accumulator / this.frameInterval;
        this.render(interpolation);
        
        // 更新帧率统计
        this.updateFPSCounter(this.deltaTime);
        
        // 处理游戏对象的添加和移除
        this.processObjectChanges();
        
        // 请求下一帧
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * 更新游戏逻辑
     * @param {number} deltaTime - 时间步长（秒）
     */
    update(deltaTime) {
        const updateStartTime = performance.now();
        
        // 更新输入状态
        if (this.inputHandler) {
            this.inputHandler.update();
        }
        
        // 更新分数管理器
        if (window.scoreManager) {
            window.scoreManager.update(deltaTime);
        }
        
        // 如果有关卡系统，更新关卡
        if (window.currentLevel && window.currentLevel.isLoaded) {
            window.currentLevel.update(deltaTime);
        }
        
        // 更新所有游戏对象
        for (let i = 0; i < this.gameObjects.length; i++) {
            const gameObject = this.gameObjects[i];
            if (gameObject && gameObject.update) {
                gameObject.update(deltaTime);
            }
        }
        
        // 物理模拟和碰撞检测
        const physicsStartTime = performance.now();
        this.updatePhysics(deltaTime);
        this.performanceStats.collisionTime = performance.now() - physicsStartTime;
        
        // 更新UI显示
        if (window.updateUI) {
            window.updateUI();
        }
        
        // 记录更新时间
        this.performanceStats.updateTime = performance.now() - updateStartTime;
        this.performanceStats.objectCount = this.gameObjects.length;
    }
    
    /**
     * 渲染游戏画面
     * @param {number} interpolation - 插值因子（0-1）
     */
    render(interpolation = 0) {
        const renderStartTime = performance.now();

        // 清空画布
        this.clearCanvas();

        // 如果有关卡系统，使用关卡的渲染方法
        if (window.currentLevel && window.currentLevel.isLoaded) {
            window.currentLevel.render(this.context, interpolation);

            // 渲染不受相机影响的UI对象
            this.renderUIObjects(interpolation);
        } else {
            // 传统渲染方式（向后兼容）
            this.renderAllObjects(interpolation);
        }

        // 渲染调试信息（开发模式）
        if (this.isDebugMode()) {
            this.renderDebugInfo();
        }

        // 记录渲染时间
        this.performanceStats.renderTime = performance.now() - renderStartTime;
    }
    
    /**
     * 渲染所有游戏对象（传统方式）
     * @param {number} interpolation - 插值因子
     */
    renderAllObjects(interpolation) {
        for (let i = 0; i < this.gameObjects.length; i++) {
            const gameObject = this.gameObjects[i];
            if (gameObject && gameObject.render) {
                gameObject.render(this.context, interpolation);
            }
        }
    }
    
    /**
     * 渲染UI对象（不受相机影响）
     * @param {number} interpolation - 插值因子
     */
    renderUIObjects(interpolation) {
        for (let i = 0; i < this.gameObjects.length; i++) {
            const gameObject = this.gameObjects[i];
            if (gameObject && gameObject.render && 
                (gameObject.tag === 'GameInfoDisplay' || gameObject.tag === 'HUD')) {
                gameObject.render(this.context, interpolation);
            }
        }
    }
    
    /**
     * 清空画布
     */
    clearCanvas() {
        // 使用纯色填充背景
        this.context.fillStyle = this.clearColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 添加游戏对象
     * @param {Object} gameObject - 游戏对象
     */
    addGameObject(gameObject) {
        if (!gameObject) {
            console.warn('Attempted to add null/undefined game object');
            return;
        }
        
        this.objectsToAdd.push(gameObject);
    }
    
    /**
     * 移除游戏对象
     * @param {Object} gameObject - 游戏对象
     */
    removeGameObject(gameObject) {
        if (!gameObject) {
            console.warn('Attempted to remove null/undefined game object');
            return;
        }
        
        this.objectsToRemove.push(gameObject);
    }
    
    /**
     * 处理游戏对象的添加和移除
     */
    processObjectChanges() {
        // 添加新对象
        if (this.objectsToAdd.length > 0) {
            this.gameObjects.push(...this.objectsToAdd);
            this.objectsToAdd.length = 0;
        }
        
        // 移除对象
        if (this.objectsToRemove.length > 0) {
            for (const objToRemove of this.objectsToRemove) {
                const index = this.gameObjects.indexOf(objToRemove);
                if (index !== -1) {
                    this.gameObjects.splice(index, 1);
                }
            }
            this.objectsToRemove.length = 0;
        }
    }
    
    /**
     * 更新帧率计数器
     * @param {number} deltaTime - 帧时间间隔
     */
    updateFPSCounter(deltaTime) {
        this.frameCount++;
        this.fpsTimer += deltaTime;
        
        // 记录帧时间历史
        this.performanceStats.frameTimeHistory.push(deltaTime);
        if (this.performanceStats.frameTimeHistory.length > 60) {
            this.performanceStats.frameTimeHistory.shift();
        }
        
        // 计算平均帧时间
        const totalFrameTime = this.performanceStats.frameTimeHistory.reduce((sum, time) => sum + time, 0);
        this.performanceStats.averageFrameTime = totalFrameTime / this.performanceStats.frameTimeHistory.length;
        
        // 每秒更新一次FPS显示
        if (this.fpsTimer >= 1000) {
            this.currentFPS = Math.round((this.frameCount * 1000) / this.fpsTimer);
            this.frameCount = 0;
            this.fpsTimer = 0;
        }
    }
    
    /**
     * 获取当前FPS
     * @returns {number} 当前帧率
     */
    getFPS() {
        return this.currentFPS;
    }
    
    /**
     * 获取性能统计信息
     * @returns {Object} 性能统计数据
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats,
            fps: this.currentFPS,
            deltaTime: this.deltaTime
        };
    }
    
    /**
     * 获取时间步长
     * @returns {number} 时间步长（毫秒）
     */
    getDeltaTime() {
        return this.deltaTime;
    }
    
    /**
     * 检查是否为调试模式
     * @returns {boolean} 是否为调试模式
     */
    isDebugMode() {
        // 可以通过URL参数或其他方式控制
        return window.location.search.includes('debug=true');
    }
    
    /**
     * 渲染调试信息
     */
    renderDebugInfo() {
        const debugY = 10;
        const lineHeight = 20;
        let currentLine = 0;
        
        this.context.fillStyle = '#000000';
        this.context.font = '14px monospace';
        this.context.textAlign = 'left';
        
        // FPS信息
        this.context.fillText(`FPS: ${this.currentFPS}`, 10, debugY + (currentLine++ * lineHeight));
        this.context.fillText(`Delta: ${this.deltaTime.toFixed(2)}ms`, 10, debugY + (currentLine++ * lineHeight));
        this.context.fillText(`Objects: ${this.gameObjects.length}`, 10, debugY + (currentLine++ * lineHeight));
        
        // 性能统计
        this.context.fillText(`Update: ${this.performanceStats.updateTime.toFixed(2)}ms`, 10, debugY + (currentLine++ * lineHeight));
        this.context.fillText(`Render: ${this.performanceStats.renderTime.toFixed(2)}ms`, 10, debugY + (currentLine++ * lineHeight));
        this.context.fillText(`Collision: ${this.performanceStats.collisionTime.toFixed(2)}ms`, 10, debugY + (currentLine++ * lineHeight));
        this.context.fillText(`Avg Frame: ${this.performanceStats.averageFrameTime.toFixed(2)}ms`, 10, debugY + (currentLine++ * lineHeight));
        
        // 引擎状态
        this.context.fillText(`Running: ${this.isRunning}`, 10, debugY + (currentLine++ * lineHeight));
    }
    
    /**
     * 设置背景颜色
     * @param {string} color - 背景颜色
     */
    setClearColor(color) {
        this.clearColor = color;
    }
    
    /**
     * 获取Canvas上下文
     * @returns {CanvasRenderingContext2D} Canvas渲染上下文
     */
    getContext() {
        return this.context;
    }
    
    /**
     * 获取Canvas元素
     * @returns {HTMLCanvasElement} Canvas元素
     */
    getCanvas() {
        return this.canvas;
    }
    
    /**
     * 物理更新
     * @param {number} deltaTime - 时间步长（秒）
     */
    updatePhysics(deltaTime) {
        // 应用物理效果到所有游戏对象
        for (let i = 0; i < this.gameObjects.length; i++) {
            const gameObject = this.gameObjects[i];
            if (!gameObject || gameObject.destroyed || !gameObject.active) {
                continue;
            }
            
            // 重置着地状态
            gameObject.isGrounded = false;
            
            // 应用重力（如果对象启用了重力）
            if (gameObject.useGravity !== false) {
                Physics.applyGravity(gameObject, deltaTime, gameObject.gravityScale || 1.0);
            }
            
            // 应用摩擦力（如果对象在地面上）
            if (gameObject.useFriction !== false) {
                Physics.applyFriction(gameObject, deltaTime, gameObject.frictionCoeff);
            }
        }
        
        // 处理碰撞检测
        this.handleCollisions();
    }
    
    /**
     * 处理碰撞检测
     */
    handleCollisions() {
        // 获取平台对象（优先从关卡系统获取）
        let platforms = [];
        if (window.currentLevel && window.currentLevel.isLoaded) {
            platforms = window.currentLevel.getPlatforms();
        } else {
            platforms = this.gameObjects.filter(obj => 
                obj && !obj.destroyed && obj.active && obj.isPlatform
            );
        }
        
        // 性能优化：只处理活跃的游戏对象
        const activeObjects = this.gameObjects.filter(obj => 
            obj && !obj.destroyed && obj.active && obj.collisionEnabled
        );
        
        for (let i = 0; i < activeObjects.length; i++) {
            const gameObject = activeObjects[i];
            
            // 平台碰撞检测
            if (!gameObject.isPlatform) {
                const platformCollisions = Physics.handlePlatformCollisions(gameObject, platforms);
                
                // 通知对象发生了碰撞
                for (const collision of platformCollisions) {
                    if (gameObject.onCollision) {
                        gameObject.onCollision(collision.object, collision.direction, collision.type);
                    }
                }
            }
            
            // 边界碰撞检测（使用关卡边界或默认边界）
            let worldBounds = {
                x: 0,
                y: 0,
                width: this.canvas.width,
                height: this.canvas.height
            };
            
            if (window.currentLevel && window.currentLevel.isLoaded) {
                const levelInfo = window.currentLevel.getLevelInfo();
                worldBounds = {
                    x: 0,
                    y: 0,
                    width: levelInfo.width,
                    height: levelInfo.height + 200 // 给底部一些额外空间用于死亡动画
                };
            }
            
            const boundaryCollisions = Physics.handleBoundaryCollisions(gameObject, worldBounds);
            
            // 处理边界碰撞
            for (const collision of boundaryCollisions) {
                // 特殊处理玩家的出界情况
                if (gameObject.tag === 'Player') {
                    this.handlePlayerBoundaryCollision(gameObject, collision, worldBounds);
                } else {
                    // 其他对象的标准边界处理
                    if (collision.outOfBounds && gameObject.onOutOfBounds) {
                        gameObject.onOutOfBounds();
                    }
                }
                
                if (gameObject.onCollision) {
                    gameObject.onCollision(null, collision.direction, collision.type);
                }
            }
            
            // 对象间碰撞检测（优化：只检查后续对象避免重复）
            for (let j = i + 1; j < activeObjects.length; j++) {
                const otherObject = activeObjects[j];
                
                if (Physics.checkAABBCollision(gameObject, otherObject)) {
                    // 对于玩家-敌人交互使用更精确的碰撞检测
                    let direction;
                    if ((gameObject.tag === 'Player' && otherObject.tag === 'Enemy') ||
                        (gameObject.tag === 'Enemy' && otherObject.tag === 'Player')) {
                        direction = Physics.getCollisionDirectionWithVelocity(gameObject, otherObject);
                    } else {
                        direction = Physics.getCollisionDirection(gameObject, otherObject);
                    }
                    
                    // 通知两个对象发生了碰撞
                    if (gameObject.onCollision) {
                        gameObject.onCollision(otherObject, direction, 'object');
                    }
                    if (otherObject.onCollision) {
                        const oppositeDirection = GameEngine.getOppositeDirection(direction);
                        otherObject.onCollision(gameObject, oppositeDirection, 'object');
                    }
                }
            }
        }
    }
    
    /**
     * 处理玩家边界碰撞
     * @param {Player} player - 玩家对象
     * @param {Object} collision - 碰撞信息
     * @param {Object} worldBounds - 世界边界
     */
    handlePlayerBoundaryCollision(player, collision, worldBounds) {
        const playerBounds = player.getCollisionBounds();
        
        switch (collision.direction) {
            case Physics.CollisionType.BOTTOM:
                // 玩家掉出屏幕底部
                if (collision.outOfBounds) {
                    console.log('Player fell out of bottom boundary');
                    if (player.onOutOfBounds) {
                        player.onOutOfBounds();
                    }
                }
                break;
                
            case Physics.CollisionType.LEFT:
                // 玩家撞到左边界
                console.log('Player hit left boundary');
                break;
                
            case Physics.CollisionType.RIGHT:
                // 玩家撞到右边界
                console.log('Player hit right boundary');
                break;
                
            case Physics.CollisionType.TOP:
                // 玩家撞到上边界（不太常见，但可能发生）
                console.log('Player hit top boundary');
                break;
        }
        
        // 检查玩家是否完全离开了游戏区域（用于其他失败条件）
        const isCompletelyOutOfBounds = (
            playerBounds.x + playerBounds.width < worldBounds.x - 100 || // 左侧完全出界
            playerBounds.x > worldBounds.x + worldBounds.width + 100 || // 右侧完全出界
            playerBounds.y > worldBounds.y + worldBounds.height + 100    // 底部完全出界
        );
        
        if (isCompletelyOutOfBounds && !player.isDying) {
            console.log('Player is completely out of bounds');
            if (player.onOutOfBounds) {
                player.onOutOfBounds();
            }
        }
    }
    
    /**
     * 获取相反方向
     * @param {string} direction - 原方向
     * @returns {string} 相反方向
     */
    static getOppositeDirection(direction) {
        switch (direction) {
            case Physics.CollisionType.TOP: return Physics.CollisionType.BOTTOM;
            case Physics.CollisionType.BOTTOM: return Physics.CollisionType.TOP;
            case Physics.CollisionType.LEFT: return Physics.CollisionType.RIGHT;
            case Physics.CollisionType.RIGHT: return Physics.CollisionType.LEFT;
            default: return Physics.CollisionType.NONE;
        }
    }
    
    /**
     * 清理资源
     */
    destroy() {
        this.stop();
        this.gameObjects.length = 0;
        this.objectsToAdd.length = 0;
        this.objectsToRemove.length = 0;
        console.log('GameEngine destroyed');
    }
}

// 导出GameEngine类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEngine;
} else {
    window.GameEngine = GameEngine;
}