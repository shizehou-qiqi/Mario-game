/**
 * InputManager类 - 输入管理系统
 * 处理键盘输入，提供按键状态查询和事件处理
 */
class InputManager {
    constructor() {
        // 当前按键状态
        this.keys = {};
        this.previousKeys = {};
        
        // 支持的按键映射
        this.keyMap = {
            // 移动键
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            
            // 动作键
            'Space': 'jump',
            'Enter': 'enter',
            'Escape': 'escape',
            
            // 字母键
            'KeyA': 'a',
            'KeyD': 'd',
            'KeyW': 'w',
            'KeyS': 's',
            
            // 数字键
            'Digit1': '1',
            'Digit2': '2',
            'Digit3': '3'
        };
        
        // 输入事件监听器
        this.eventListeners = {
            keydown: [],
            keyup: [],
            keypressed: []
        };
        
        // 初始化
        this.init();
        
        console.log('InputManager initialized');
    }
    
    /**
     * 初始化输入管理器
     */
    init() {
        // 绑定键盘事件（使用箭头函数保持this上下文）
        this.keyDownHandler = (event) => this.handleKeyDown(event);
        this.keyUpHandler = (event) => this.handleKeyUp(event);
        this.preventDefaultHandler = (event) => {
            if (this.shouldPreventDefault(event.code)) {
                event.preventDefault();
            }
        };
        this.blurHandler = () => this.clearAllKeys();
        
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        document.addEventListener('keydown', this.preventDefaultHandler);
        window.addEventListener('blur', this.blurHandler);
        window.addEventListener('focus', this.blurHandler);
    }
    
    /**
     * 处理按键按下事件
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyDown(event) {
        const keyCode = event.code;
        this.keys[keyCode] = true;
    }
    
    /**
     * 处理按键释放事件
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyUp(event) {
        const keyCode = event.code;
        this.keys[keyCode] = false;
    }
    
    /**
     * 检查是否应该阻止默认行为
     * @param {string} keyCode - 按键代码
     * @returns {boolean} 是否阻止默认行为
     */
    shouldPreventDefault(keyCode) {
        const preventKeys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Space', 'Enter'
        ];
        return preventKeys.includes(keyCode);
    }
    
    /**
     * 更新输入状态（每帧调用）
     */
    update() {
        // 保存上一帧的按键状态
        this.previousKeys = { ...this.keys };
    }
    
    /**
     * 检查按键是否被按下
     * @param {string} keyCode - 按键代码或映射名称
     * @returns {boolean} 按键是否被按下
     */
    isKeyPressed(keyCode) {
        // 支持直接使用按键代码或映射名称
        const actualKey = this.getActualKeyCode(keyCode);
        return !!this.keys[actualKey];
    }
    
    /**
     * 检查按键是否刚刚被按下（这一帧按下，上一帧没按下）
     * @param {string} keyCode - 按键代码或映射名称
     * @returns {boolean} 按键是否刚刚被按下
     */
    isKeyJustPressed(keyCode) {
        const actualKey = this.getActualKeyCode(keyCode);
        return !!this.keys[actualKey] && !this.previousKeys[actualKey];
    }
    
    /**
     * 检查按键是否刚刚被释放（这一帧没按下，上一帧按下）
     * @param {string} keyCode - 按键代码或映射名称
     * @returns {boolean} 按键是否刚刚被释放
     */
    isKeyJustReleased(keyCode) {
        const actualKey = this.getActualKeyCode(keyCode);
        return !this.keys[actualKey] && !!this.previousKeys[actualKey];
    }
    
    /**
     * 获取实际的按键代码
     * @param {string} keyCode - 按键代码或映射名称
     * @returns {string} 实际的按键代码
     */
    getActualKeyCode(keyCode) {
        // 如果是映射名称，查找对应的按键代码
        for (const [code, name] of Object.entries(this.keyMap)) {
            if (name === keyCode) {
                return code;
            }
        }
        // 否则直接返回按键代码
        return keyCode;
    }
    
    /**
     * 获取按键的映射名称
     * @param {string} keyCode - 按键代码
     * @returns {string} 映射名称
     */
    getKeyName(keyCode) {
        return this.keyMap[keyCode] || keyCode;
    }
    
    /**
     * 清除所有按键状态
     */
    clearAllKeys() {
        this.keys = {};
        this.previousKeys = {};
    }
    
    /**
     * 添加事件监听器
     * @param {string} eventType - 事件类型 ('keydown', 'keyup', 'keypressed')
     * @param {Function} callback - 回调函数
     */
    addEventListener(eventType, callback) {
        if (this.eventListeners[eventType]) {
            this.eventListeners[eventType].push(callback);
        }
    }
    
    /**
     * 移除事件监听器
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     */
    removeEventListener(eventType, callback) {
        if (this.eventListeners[eventType]) {
            const index = this.eventListeners[eventType].indexOf(callback);
            if (index !== -1) {
                this.eventListeners[eventType].splice(index, 1);
            }
        }
    }
    
    /**
     * 触发事件
     * @param {string} eventType - 事件类型
     * @param {Object} eventData - 事件数据
     */
    triggerEvent(eventType, eventData) {
        if (this.eventListeners[eventType]) {
            for (const callback of this.eventListeners[eventType]) {
                callback(eventData);
            }
        }
    }
    
    /**
     * 获取当前所有按下的按键
     * @returns {Array<string>} 按下的按键列表
     */
    getPressedKeys() {
        return Object.keys(this.keys).filter(key => this.keys[key]);
    }
    
    /**
     * 获取输入轴值（用于模拟摇杆输入）
     * @param {string} negativeKey - 负方向按键
     * @param {string} positiveKey - 正方向按键
     * @returns {number} 轴值 (-1 到 1)
     */
    getAxis(negativeKey, positiveKey) {
        let value = 0;
        if (this.isKeyPressed(negativeKey)) value -= 1;
        if (this.isKeyPressed(positiveKey)) value += 1;
        return value;
    }
    
    /**
     * 获取水平移动轴值
     * @returns {number} 水平轴值 (-1: 左, 0: 无, 1: 右)
     */
    getHorizontalAxis() {
        return this.getAxis('ArrowLeft', 'ArrowRight');
    }
    
    /**
     * 获取垂直移动轴值
     * @returns {number} 垂直轴值 (-1: 上, 0: 无, 1: 下)
     */
    getVerticalAxis() {
        return this.getAxis('ArrowUp', 'ArrowDown');
    }
    
    /**
     * 检查任意按键是否被按下
     * @returns {boolean} 是否有按键被按下
     */
    isAnyKeyPressed() {
        return Object.values(this.keys).some(pressed => pressed);
    }
    
    /**
     * 模拟按键按下（用于测试或特殊情况）
     * @param {string} keyCode - 按键代码
     */
    simulateKeyDown(keyCode) {
        this.keys[keyCode] = true;
        this.triggerEvent('keydown', {
            code: keyCode,
            key: keyCode,
            repeat: false,
            wasPressed: false,
            simulated: true
        });
    }
    
    /**
     * 模拟按键释放（用于测试或特殊情况）
     * @param {string} keyCode - 按键代码
     */
    simulateKeyUp(keyCode) {
        this.keys[keyCode] = false;
        this.triggerEvent('keyup', {
            code: keyCode,
            key: keyCode,
            simulated: true
        });
    }
    
    /**
     * 获取调试信息
     * @returns {Object} 调试信息
     */
    getDebugInfo() {
        return {
            pressedKeys: this.getPressedKeys(),
            keyCount: Object.keys(this.keys).length,
            horizontalAxis: this.getHorizontalAxis(),
            verticalAxis: this.getVerticalAxis(),
            anyKeyPressed: this.isAnyKeyPressed()
        };
    }
    
    /**
     * 销毁输入管理器
     */
    destroy() {
        // 移除事件监听器
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
            document.removeEventListener('keydown', this.preventDefaultHandler);
            document.removeEventListener('keyup', this.keyUpHandler);
            window.removeEventListener('blur', this.blurHandler);
            window.removeEventListener('focus', this.blurHandler);
        }
        
        // 清除状态
        this.clearAllKeys();
        this.eventListeners = { keydown: [], keyup: [], keypressed: [] };
        
        console.log('InputManager destroyed');
    }
}

// 导出InputManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputManager;
} else {
    window.InputManager = InputManager;
}