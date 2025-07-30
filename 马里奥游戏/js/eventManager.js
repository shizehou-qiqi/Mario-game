/**
 * EventManager类 - 游戏事件管理系统
 * 负责游戏中各种事件的发布和订阅
 */
class EventManager {
    constructor() {
        // 事件监听器存储
        this.listeners = new Map();
        
        // 事件队列（用于延迟处理）
        this.eventQueue = [];
        this.isProcessingQueue = false;
        
        // 调试模式
        this.debugMode = false;
        
        console.log('EventManager initialized');
    }
    
    /**
     * 添加事件监听器
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     * @param {Object} context - 上下文对象（可选）
     * @returns {Function} 取消监听的函数
     */
    on(eventType, callback, context = null) {
        if (typeof callback !== 'function') {
            console.warn('EventManager.on: callback must be a function');
            return () => {};
        }
        
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        
        const listener = {
            callback: callback,
            context: context,
            id: this.generateListenerId()
        };
        
        this.listeners.get(eventType).push(listener);
        
        if (this.debugMode) {
            console.log(`Event listener added: ${eventType} (ID: ${listener.id})`);
        }
        
        // 返回取消监听的函数
        return () => this.off(eventType, listener.id);
    }
    
    /**
     * 添加一次性事件监听器
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     * @param {Object} context - 上下文对象（可选）
     * @returns {Function} 取消监听的函数
     */
    once(eventType, callback, context = null) {
        const wrappedCallback = (...args) => {
            // 执行回调
            if (context) {
                callback.call(context, ...args);
            } else {
                callback(...args);
            }
            
            // 自动移除监听器
            this.off(eventType, listener.id);
        };
        
        const listener = {
            callback: wrappedCallback,
            context: context,
            id: this.generateListenerId(),
            isOnce: true
        };
        
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        
        this.listeners.get(eventType).push(listener);
        
        if (this.debugMode) {
            console.log(`One-time event listener added: ${eventType} (ID: ${listener.id})`);
        }
        
        return () => this.off(eventType, listener.id);
    }
    
    /**
     * 移除事件监听器
     * @param {string} eventType - 事件类型
     * @param {string|Function} callbackOrId - 回调函数或监听器ID
     */
    off(eventType, callbackOrId) {
        if (!this.listeners.has(eventType)) {
            return;
        }
        
        const listeners = this.listeners.get(eventType);
        let removedCount = 0;
        
        for (let i = listeners.length - 1; i >= 0; i--) {
            const listener = listeners[i];
            
            // 根据ID或回调函数匹配
            if (listener.id === callbackOrId || listener.callback === callbackOrId) {
                listeners.splice(i, 1);
                removedCount++;
                
                if (this.debugMode) {
                    console.log(`Event listener removed: ${eventType} (ID: ${listener.id})`);
                }
            }
        }
        
        // 如果没有监听器了，删除事件类型
        if (listeners.length === 0) {
            this.listeners.delete(eventType);
        }
        
        return removedCount;
    }
    
    /**
     * 触发事件
     * @param {string} eventType - 事件类型
     * @param {*} eventData - 事件数据
     * @param {boolean} immediate - 是否立即处理（默认true）
     */
    trigger(eventType, eventData = null, immediate = true) {
        if (immediate) {
            this.processEvent(eventType, eventData);
        } else {
            // 添加到事件队列
            this.eventQueue.push({
                type: eventType,
                data: eventData,
                timestamp: performance.now()
            });
        }
    }
    
    /**
     * 处理事件
     * @param {string} eventType - 事件类型
     * @param {*} eventData - 事件数据
     */
    processEvent(eventType, eventData) {
        if (!this.listeners.has(eventType)) {
            if (this.debugMode) {
                console.log(`No listeners for event: ${eventType}`);
            }
            return;
        }
        
        const listeners = this.listeners.get(eventType);
        const listenersToRemove = [];
        
        if (this.debugMode) {
            console.log(`Triggering event: ${eventType}`, eventData);
        }
        
        // 执行所有监听器
        for (const listener of listeners) {
            try {
                if (listener.context) {
                    listener.callback.call(listener.context, eventData);
                } else {
                    listener.callback(eventData);
                }
                
                // 标记一次性监听器待移除
                if (listener.isOnce) {
                    listenersToRemove.push(listener.id);
                }
            } catch (error) {
                console.error(`Error in event listener for ${eventType}:`, error);
            }
        }
        
        // 移除一次性监听器
        listenersToRemove.forEach(id => {
            this.off(eventType, id);
        });
    }
    
    /**
     * 处理事件队列
     */
    processEventQueue() {
        if (this.isProcessingQueue || this.eventQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        // 处理队列中的所有事件
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.processEvent(event.type, event.data);
        }
        
        this.isProcessingQueue = false;
    }
    
    /**
     * 清空事件队列
     */
    clearEventQueue() {
        this.eventQueue.length = 0;
        this.isProcessingQueue = false;
    }
    
    /**
     * 移除所有监听器
     * @param {string} eventType - 事件类型（可选，不指定则移除所有）
     */
    removeAllListeners(eventType = null) {
        if (eventType) {
            this.listeners.delete(eventType);
            if (this.debugMode) {
                console.log(`All listeners removed for event: ${eventType}`);
            }
        } else {
            this.listeners.clear();
            if (this.debugMode) {
                console.log('All event listeners removed');
            }
        }
    }
    
    /**
     * 获取事件监听器数量
     * @param {string} eventType - 事件类型（可选）
     * @returns {number} 监听器数量
     */
    getListenerCount(eventType = null) {
        if (eventType) {
            return this.listeners.has(eventType) ? this.listeners.get(eventType).length : 0;
        } else {
            let total = 0;
            for (const listeners of this.listeners.values()) {
                total += listeners.length;
            }
            return total;
        }
    }
    
    /**
     * 获取所有事件类型
     * @returns {Array} 事件类型数组
     */
    getEventTypes() {
        return Array.from(this.listeners.keys());
    }
    
    /**
     * 生成监听器ID
     * @returns {string} 唯一ID
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 设置调试模式
     * @param {boolean} enabled - 是否启用调试模式
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`EventManager debug mode: ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * 创建事件命名空间
     * @param {string} namespace - 命名空间
     * @returns {Object} 命名空间对象
     */
    createNamespace(namespace) {
        const namespacedEventManager = {
            on: (eventType, callback, context) => {
                return this.on(`${namespace}:${eventType}`, callback, context);
            },
            once: (eventType, callback, context) => {
                return this.once(`${namespace}:${eventType}`, callback, context);
            },
            off: (eventType, callbackOrId) => {
                return this.off(`${namespace}:${eventType}`, callbackOrId);
            },
            trigger: (eventType, eventData, immediate) => {
                return this.trigger(`${namespace}:${eventType}`, eventData, immediate);
            },
            removeAllListeners: () => {
                // 移除该命名空间下的所有监听器
                const eventTypes = this.getEventTypes();
                const namespacePrefix = `${namespace}:`;
                eventTypes.forEach(eventType => {
                    if (eventType.startsWith(namespacePrefix)) {
                        this.removeAllListeners(eventType);
                    }
                });
            }
        };
        
        return namespacedEventManager;
    }
    
    /**
     * 获取事件统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const stats = {
            totalEventTypes: this.listeners.size,
            totalListeners: this.getListenerCount(),
            queuedEvents: this.eventQueue.length,
            eventTypes: {}
        };
        
        // 统计每种事件类型的监听器数量
        for (const [eventType, listeners] of this.listeners) {
            stats.eventTypes[eventType] = listeners.length;
        }
        
        return stats;
    }
    
    /**
     * 销毁事件管理器
     */
    destroy() {
        this.removeAllListeners();
        this.clearEventQueue();
        console.log('EventManager destroyed');
    }
}

// 导出EventManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventManager;
} else {
    window.EventManager = EventManager;
}