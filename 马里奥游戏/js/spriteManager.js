/**
 * SpriteManager类 - 基本的精灵渲染系统
 * 负责精灵图片的加载、缓存和管理
 */
class SpriteManager {
    constructor() {
        // 图片缓存
        this.imageCache = new Map();
        this.loadingPromises = new Map();
        
        // 精灵定义缓存
        this.spriteDefinitions = new Map();
        
        // 加载状态
        this.totalImages = 0;
        this.loadedImages = 0;
        this.failedImages = 0;
        
        console.log('SpriteManager initialized');
    }
    
    /**
     * 加载图片
     * @param {string} name - 图片名称（用作缓存键）
     * @param {string} src - 图片路径
     * @returns {Promise<HTMLImageElement>} 加载的图片
     */
    loadImage(name, src) {
        // 如果已经缓存，直接返回
        if (this.imageCache.has(name)) {
            return Promise.resolve(this.imageCache.get(name));
        }
        
        // 如果正在加载，返回现有的Promise
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }
        
        // 创建加载Promise
        const loadPromise = new Promise((resolve, reject) => {
            const image = new Image();
            
            image.onload = () => {
                this.imageCache.set(name, image);
                this.loadingPromises.delete(name);
                this.loadedImages++;
                
                console.log(`Image loaded: ${name} (${this.loadedImages}/${this.totalImages})`);
                resolve(image);
            };
            
            image.onerror = (error) => {
                this.loadingPromises.delete(name);
                this.failedImages++;
                
                console.error(`Failed to load image: ${name}`, error);
                
                // 创建占位符图片
                const placeholder = this.createPlaceholderImage(32, 32, '#FF00FF');
                this.imageCache.set(name, placeholder);
                resolve(placeholder);
            };
            
            image.src = src;
        });
        
        this.loadingPromises.set(name, loadPromise);
        this.totalImages++;
        
        return loadPromise;
    }
    
    /**
     * 批量加载图片
     * @param {Object} imageMap - 图片映射 {name: src, ...}
     * @returns {Promise<void>} 加载完成Promise
     */
    async loadImages(imageMap) {
        const loadPromises = [];
        
        for (const [name, src] of Object.entries(imageMap)) {
            loadPromises.push(this.loadImage(name, src));
        }
        
        try {
            await Promise.all(loadPromises);
            console.log(`All images loaded successfully (${this.loadedImages} loaded, ${this.failedImages} failed)`);
        } catch (error) {
            console.error('Error loading images:', error);
        }
    }
    
    /**
     * 获取缓存的图片
     * @param {string} name - 图片名称
     * @returns {HTMLImageElement|null} 图片对象
     */
    getImage(name) {
        return this.imageCache.get(name) || null;
    }
    
    /**
     * 创建精灵定义
     * @param {string} name - 精灵名称
     * @param {string} imageName - 图片名称
     * @param {number} sourceX - 源图片X坐标
     * @param {number} sourceY - 源图片Y坐标
     * @param {number} sourceWidth - 源图片宽度
     * @param {number} sourceHeight - 源图片高度
     * @returns {Object} 精灵定义
     */
    createSprite(name, imageName, sourceX = 0, sourceY = 0, sourceWidth = null, sourceHeight = null) {
        const image = this.getImage(imageName);
        if (!image) {
            console.warn(`Image not found for sprite: ${name} (image: ${imageName})`);
            return null;
        }
        
        const sprite = {
            name: name,
            image: image,
            sourceX: sourceX,
            sourceY: sourceY,
            sourceWidth: sourceWidth || image.width,
            sourceHeight: sourceHeight || image.height
        };
        
        this.spriteDefinitions.set(name, sprite);
        return sprite;
    }
    
    /**
     * 创建精灵表定义
     * @param {string} imageName - 图片名称
     * @param {number} tileWidth - 瓦片宽度
     * @param {number} tileHeight - 瓦片高度
     * @param {Object} sprites - 精灵定义 {name: {x, y}, ...}
     * @returns {Object} 精灵映射
     */
    createSpriteSheet(imageName, tileWidth, tileHeight, sprites) {
        const spriteMap = {};
        
        for (const [name, coords] of Object.entries(sprites)) {
            const sprite = this.createSprite(
                name,
                imageName,
                coords.x * tileWidth,
                coords.y * tileHeight,
                tileWidth,
                tileHeight
            );
            
            if (sprite) {
                spriteMap[name] = sprite;
            }
        }
        
        return spriteMap;
    }
    
    /**
     * 获取精灵定义
     * @param {string} name - 精灵名称
     * @returns {Object|null} 精灵定义
     */
    getSprite(name) {
        return this.spriteDefinitions.get(name) || null;
    }
    
    /**
     * 创建动画精灵序列
     * @param {string} baseName - 基础名称
     * @param {string} imageName - 图片名称
     * @param {number} frameCount - 帧数
     * @param {number} frameWidth - 帧宽度
     * @param {number} frameHeight - 帧高度
     * @param {number} startX - 起始X坐标
     * @param {number} startY - 起始Y坐标
     * @returns {Array} 动画帧数组
     */
    createAnimationFrames(baseName, imageName, frameCount, frameWidth, frameHeight, startX = 0, startY = 0) {
        const frames = [];
        
        for (let i = 0; i < frameCount; i++) {
            const frameName = `${baseName}_${i}`;
            const sprite = this.createSprite(
                frameName,
                imageName,
                startX + (i * frameWidth),
                startY,
                frameWidth,
                frameHeight
            );
            
            if (sprite) {
                frames.push(sprite);
            }
        }
        
        return frames;
    }
    
    /**
     * 创建占位符图片
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {string} color - 颜色
     * @returns {HTMLCanvasElement} 占位符图片
     */
    createPlaceholderImage(width, height, color = '#FF00FF') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // 绘制棋盘格背景
        const tileSize = 8;
        for (let y = 0; y < height; y += tileSize) {
            for (let x = 0; x < width; x += tileSize) {
                const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
                ctx.fillStyle = isEven ? color : '#FFFFFF';
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
        
        // 绘制边框
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        // 绘制X标记
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(4, 4);
        ctx.lineTo(width - 4, height - 4);
        ctx.moveTo(width - 4, 4);
        ctx.lineTo(4, height - 4);
        ctx.stroke();
        
        return canvas;
    }
    
    /**
     * 渲染精灵到指定位置
     * @param {CanvasRenderingContext2D} context - 渲染上下文
     * @param {Object} sprite - 精灵对象
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 渲染宽度（可选）
     * @param {number} height - 渲染高度（可选）
     */
    renderSprite(context, sprite, x, y, width = null, height = null) {
        if (!sprite || !sprite.image) {
            return;
        }
        
        const renderWidth = width || sprite.sourceWidth;
        const renderHeight = height || sprite.sourceHeight;
        
        context.drawImage(
            sprite.image,
            sprite.sourceX,
            sprite.sourceY,
            sprite.sourceWidth,
            sprite.sourceHeight,
            x,
            y,
            renderWidth,
            renderHeight
        );
    }
    
    /**
     * 获取加载进度
     * @returns {Object} 加载进度信息
     */
    getLoadingProgress() {
        return {
            total: this.totalImages,
            loaded: this.loadedImages,
            failed: this.failedImages,
            progress: this.totalImages > 0 ? this.loadedImages / this.totalImages : 1,
            isComplete: this.loadedImages + this.failedImages >= this.totalImages
        };
    }
    
    /**
     * 检查是否所有图片都已加载
     * @returns {boolean} 是否加载完成
     */
    isLoadingComplete() {
        return this.getLoadingProgress().isComplete;
    }
    
    /**
     * 清理缓存
     */
    clearCache() {
        this.imageCache.clear();
        this.spriteDefinitions.clear();
        this.loadingPromises.clear();
        
        this.totalImages = 0;
        this.loadedImages = 0;
        this.failedImages = 0;
        
        console.log('SpriteManager cache cleared');
    }
    
    /**
     * 获取缓存统计信息
     * @returns {Object} 缓存统计
     */
    getCacheStats() {
        return {
            images: this.imageCache.size,
            sprites: this.spriteDefinitions.size,
            loading: this.loadingPromises.size,
            totalImages: this.totalImages,
            loadedImages: this.loadedImages,
            failedImages: this.failedImages
        };
    }
}

// 创建全局精灵管理器实例
const spriteManager = new SpriteManager();

// 导出SpriteManager类和全局实例
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpriteManager, spriteManager };
} else {
    window.SpriteManager = SpriteManager;
    window.spriteManager = spriteManager;
}