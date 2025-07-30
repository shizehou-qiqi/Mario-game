/**
 * Vector2D类 - 用于位置和速度计算
 * 提供2D向量的基本数学运算
 */
class Vector2D {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * 设置向量值
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {Vector2D} 返回自身以支持链式调用
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    
    /**
     * 复制另一个向量的值
     * @param {Vector2D} vector - 要复制的向量
     * @returns {Vector2D} 返回自身以支持链式调用
     */
    copy(vector) {
        this.x = vector.x;
        this.y = vector.y;
        return this;
    }
    
    /**
     * 克隆当前向量
     * @returns {Vector2D} 新的向量实例
     */
    clone() {
        return new Vector2D(this.x, this.y);
    }
    
    /**
     * 向量加法
     * @param {Vector2D} vector - 要相加的向量
     * @returns {Vector2D} 返回自身以支持链式调用
     */
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }
    
    /**
     * 向量减法
     * @param {Vector2D} vector - 要相减的向量
     * @returns {Vector2D} 返回自身以支持链式调用
     */
    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }
    
    /**
     * 向量乘法（标量）
     * @param {number} scalar - 标量值
     * @returns {Vector2D} 返回自身以支持链式调用
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    
    /**
     * 向量除法（标量）
     * @param {number} scalar - 标量值
     * @returns {Vector2D} 返回自身以支持链式调用
     */
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }
    
    /**
     * 计算向量长度（模）
     * @returns {number} 向量长度
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    /**
     * 计算向量长度的平方（避免开方运算，用于性能优化）
     * @returns {number} 向量长度的平方
     */
    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }
    
    /**
     * 向量归一化（单位向量）
     * @returns {Vector2D} 返回自身以支持链式调用
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }
    
    /**
     * 限制向量长度
     * @param {number} max - 最大长度
     * @returns {Vector2D} 返回自身以支持链式调用
     */
    limit(max) {
        const magSq = this.magnitudeSquared();
        if (magSq > max * max) {
            this.normalize().multiply(max);
        }
        return this;
    }
    
    /**
     * 计算两个向量的距离
     * @param {Vector2D} vector - 另一个向量
     * @returns {number} 距离
     */
    distance(vector) {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 计算两个向量距离的平方
     * @param {Vector2D} vector - 另一个向量
     * @returns {number} 距离的平方
     */
    distanceSquared(vector) {
        const dx = this.x - vector.x;
        const dy = this.y - vector.y;
        return dx * dx + dy * dy;
    }
    
    /**
     * 计算点积
     * @param {Vector2D} vector - 另一个向量
     * @returns {number} 点积结果
     */
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }
    
    /**
     * 计算叉积（2D中返回标量）
     * @param {Vector2D} vector - 另一个向量
     * @returns {number} 叉积结果
     */
    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }
    
    /**
     * 向量插值
     * @param {Vector2D} vector - 目标向量
     * @param {number} t - 插值因子 (0-1)
     * @returns {Vector2D} 返回自身以支持链式调用
     */
    lerp(vector, t) {
        this.x += (vector.x - this.x) * t;
        this.y += (vector.y - this.y) * t;
        return this;
    }
    
    /**
     * 重置向量为零向量
     * @returns {Vector2D} 返回自身以支持链式调用
     */
    zero() {
        this.x = 0;
        this.y = 0;
        return this;
    }
    
    /**
     * 检查是否为零向量
     * @returns {boolean} 是否为零向量
     */
    isZero() {
        return this.x === 0 && this.y === 0;
    }
    
    /**
     * 向量相等比较
     * @param {Vector2D} vector - 要比较的向量
     * @returns {boolean} 是否相等
     */
    equals(vector) {
        return this.x === vector.x && this.y === vector.y;
    }
    
    /**
     * 转换为字符串表示
     * @returns {string} 字符串表示
     */
    toString() {
        return `Vector2D(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }
    
    /**
     * 静态方法：创建零向量
     * @returns {Vector2D} 零向量
     */
    static zero() {
        return new Vector2D(0, 0);
    }
    
    /**
     * 静态方法：创建单位向量（右方向）
     * @returns {Vector2D} 单位向量
     */
    static right() {
        return new Vector2D(1, 0);
    }
    
    /**
     * 静态方法：创建单位向量（左方向）
     * @returns {Vector2D} 单位向量
     */
    static left() {
        return new Vector2D(-1, 0);
    }
    
    /**
     * 静态方法：创建单位向量（上方向）
     * @returns {Vector2D} 单位向量
     */
    static up() {
        return new Vector2D(0, -1);
    }
    
    /**
     * 静态方法：创建单位向量（下方向）
     * @returns {Vector2D} 单位向量
     */
    static down() {
        return new Vector2D(0, 1);
    }
    
    /**
     * 静态方法：向量加法（不修改原向量）
     * @param {Vector2D} v1 - 第一个向量
     * @param {Vector2D} v2 - 第二个向量
     * @returns {Vector2D} 新的向量
     */
    static add(v1, v2) {
        return new Vector2D(v1.x + v2.x, v1.y + v2.y);
    }
    
    /**
     * 静态方法：向量减法（不修改原向量）
     * @param {Vector2D} v1 - 第一个向量
     * @param {Vector2D} v2 - 第二个向量
     * @returns {Vector2D} 新的向量
     */
    static subtract(v1, v2) {
        return new Vector2D(v1.x - v2.x, v1.y - v2.y);
    }
    
    /**
     * 静态方法：向量乘法（不修改原向量）
     * @param {Vector2D} vector - 向量
     * @param {number} scalar - 标量
     * @returns {Vector2D} 新的向量
     */
    static multiply(vector, scalar) {
        return new Vector2D(vector.x * scalar, vector.y * scalar);
    }
    
    /**
     * 静态方法：计算两点间距离
     * @param {Vector2D} v1 - 第一个点
     * @param {Vector2D} v2 - 第二个点
     * @returns {number} 距离
     */
    static distance(v1, v2) {
        return v1.distance(v2);
    }
}

// 导出Vector2D类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Vector2D;
} else {
    window.Vector2D = Vector2D;
}