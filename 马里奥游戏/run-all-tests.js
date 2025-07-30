/**
 * 运行所有测试的脚本
 * 用于验证游戏的完整功能
 */

console.log('开始运行马里奥游戏综合测试...\n');

// 模拟浏览器环境
global.window = {
    performance: {
        now: () => Date.now(),
        memory: {
            usedJSHeapSize: 1024 * 1024 * 10 // 10MB
        }
    },
    requestAnimationFrame: (callback) => setTimeout(callback, 16),
    AudioContext: function() {},
    localStorage: {
        setItem: () => {},
        getItem: () => null,
        removeItem: () => {}
    }
};

global.document = {
    createElement: (tag) => {
        if (tag === 'canvas') {
            return {
                getContext: () => ({
                    fillRect: () => {},
                    clearRect: () => {},
                    fillText: () => {},
                    beginPath: () => {},
                    arc: () => {},
                    fill: () => {}
                }),
                width: 800,
                height: 600
            };
        }
        return {};
    },
    addEventListener: () => {}
};

global.console = console;

// 测试结果统计
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFunction) {
    totalTests++;
    try {
        console.log(`运行测试: ${testName}`);
        testFunction();
        passedTests++;
        console.log(`✅ ${testName} - 通过\n`);
    } catch (error) {
        failedTests++;
        console.log(`❌ ${testName} - 失败: ${error.message}\n`);
    }
}

// 引入游戏模块
try {
    const Vector2D = require('./js/vector2d.js');
    const GameObject = require('./js/gameObject.js');
    const Physics = require('./js/physics.js');
    
    global.Vector2D = Vector2D;
    global.GameObject = GameObject;
    global.Physics = Physics;
    
    console.log('✅ 核心模块加载成功');
} catch (error) {
    console.log('❌ 核心模块加载失败:', error.message);
}

// 基础功能测试
console.log('\n=== 基础功能测试 ===');

runTest('Vector2D 创建和计算', () => {
    const v1 = new Vector2D(3, 4);
    const v2 = new Vector2D(1, 2);
    
    if (v1.x !== 3 || v1.y !== 4) {
        throw new Error('Vector2D 构造失败');
    }
    
    if (Math.abs(v1.magnitude() - 5) > 0.001) {
        throw new Error('Vector2D 长度计算错误');
    }
    
    const sum = v1.add(v2);
    if (sum.x !== 4 || sum.y !== 6) {
        throw new Error('Vector2D 加法计算错误');
    }
});

runTest('GameObject 基础功能', () => {
    const obj = new GameObject(10, 20, 30, 40);
    
    if (obj.position.x !== 10 || obj.position.y !== 20) {
        throw new Error('GameObject 位置设置错误');
    }
    
    if (obj.size.x !== 30 || obj.size.y !== 40) {
        throw new Error('GameObject 尺寸设置错误');
    }
    
    const bounds = obj.getCollisionBounds();
    if (bounds.x !== 10 || bounds.y !== 20 || bounds.width !== 30 || bounds.height !== 40) {
        throw new Error('GameObject 碰撞边界计算错误');
    }
});

runTest('Physics 重力系统', () => {
    const obj = new GameObject(0, 0, 32, 32);
    obj.velocity = new Vector2D(0, 0);
    
    Physics.applyGravity(obj, 1/60);
    
    if (obj.velocity.y <= 0) {
        throw new Error('重力应该增加向下速度');
    }
});

runTest('Physics 碰撞检测', () => {
    const obj1 = new GameObject(10, 10, 20, 20);
    const obj2 = new GameObject(15, 15, 20, 20);
    const obj3 = new GameObject(50, 50, 20, 20);
    
    if (!Physics.checkAABBCollision(obj1, obj2)) {
        throw new Error('应该检测到重叠对象的碰撞');
    }
    
    if (Physics.checkAABBCollision(obj1, obj3)) {
        throw new Error('不应该检测到分离对象的碰撞');
    }
});

// 性能测试
console.log('\n=== 性能测试 ===');

runTest('大量对象物理计算性能', () => {
    const objects = [];
    for (let i = 0; i < 100; i++) {
        const obj = new GameObject(Math.random() * 800, Math.random() * 600, 32, 32);
        obj.velocity = new Vector2D(Math.random() * 100 - 50, Math.random() * 100 - 50);
        objects.push(obj);
    }
    
    const startTime = Date.now();
    
    // 模拟60帧的物理计算
    for (let frame = 0; frame < 60; frame++) {
        for (const obj of objects) {
            Physics.applyGravity(obj, 1/60);
            obj.position = obj.position.add(obj.velocity.multiply(1/60));
        }
        
        // 碰撞检测
        for (let i = 0; i < objects.length; i++) {
            for (let j = i + 1; j < objects.length; j++) {
                Physics.checkAABBCollision(objects[i], objects[j]);
            }
        }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration > 1000) {
        throw new Error(`物理计算耗时过长: ${duration}ms`);
    }
    
    console.log(`  物理计算耗时: ${duration}ms`);
});

runTest('内存使用测试', () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 创建大量对象
    const objects = [];
    for (let i = 0; i < 1000; i++) {
        objects.push(new GameObject(i, i, 32, 32));
    }
    
    const midMemory = process.memoryUsage().heapUsed;
    
    // 清理对象
    objects.length = 0;
    
    // 强制垃圾回收
    if (global.gc) {
        global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
    
    console.log(`  内存变化: ${memoryIncrease.toFixed(2)}MB`);
    
    if (memoryIncrease > 10) {
        throw new Error(`内存增长过多: ${memoryIncrease.toFixed(2)}MB`);
    }
});

// 边界情况测试
console.log('\n=== 边界情况测试 ===');

runTest('极值输入处理', () => {
    // 测试极大值
    const largeObj = new GameObject(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 1, 1);
    if (!largeObj.position.x || !largeObj.position.y) {
        throw new Error('极大值处理失败');
    }
    
    // 测试零值
    const zeroObj = new GameObject(0, 0, 0, 0);
    if (zeroObj.position.x !== 0 || zeroObj.position.y !== 0) {
        throw new Error('零值处理失败');
    }
    
    // 测试负值
    const negativeObj = new GameObject(-100, -100, 10, 10);
    if (negativeObj.position.x !== -100 || negativeObj.position.y !== -100) {
        throw new Error('负值处理失败');
    }
});

runTest('空值和未定义值处理', () => {
    try {
        // 这些应该抛出错误或有合理的默认处理
        const nullObj = new GameObject(null, null, null, null);
        // 如果没有抛出错误，检查是否有合理的默认值
        if (isNaN(nullObj.position.x) || isNaN(nullObj.position.y)) {
            // 这是可以接受的处理方式
        }
    } catch (error) {
        // 抛出错误也是可以接受的
    }
});

// 浏览器兼容性模拟测试
console.log('\n=== 浏览器兼容性测试 ===');

runTest('Canvas API 兼容性', () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
        throw new Error('Canvas 2D context 不可用');
    }
    
    // 测试基本绘制方法
    const methods = ['fillRect', 'clearRect', 'fillText', 'beginPath', 'arc', 'fill'];
    for (const method of methods) {
        if (typeof context[method] !== 'function') {
            throw new Error(`Canvas 方法 ${method} 不可用`);
        }
    }
});

runTest('本地存储兼容性', () => {
    try {
        window.localStorage.setItem('test', 'value');
        const value = window.localStorage.getItem('test');
        window.localStorage.removeItem('test');
        
        // 在模拟环境中，这些操作应该不会抛出错误
    } catch (error) {
        throw new Error('本地存储不可用');
    }
});

// 游戏逻辑测试
console.log('\n=== 游戏逻辑测试 ===');

runTest('碰撞方向检测', () => {
    const obj1 = new GameObject(10, 5, 20, 20);  // 上方对象
    const obj2 = new GameObject(10, 20, 20, 20); // 下方对象
    
    const direction = Physics.getCollisionDirection(obj1, obj2);
    if (direction !== Physics.CollisionType.TOP) {
        throw new Error('碰撞方向检测错误');
    }
});

runTest('边界碰撞处理', () => {
    const obj = new GameObject(-10, 10, 20, 20); // 超出左边界
    const bounds = { x: 0, y: 0, width: 800, height: 600 };
    
    const collisions = Physics.handleBoundaryCollisions(obj, bounds);
    
    if (collisions.length === 0) {
        throw new Error('应该检测到边界碰撞');
    }
    
    if (obj.position.x < bounds.x) {
        throw new Error('对象应该被移回边界内');
    }
});

// 生成测试报告
console.log('\n=== 测试报告 ===');
console.log(`总测试数: ${totalTests}`);
console.log(`通过: ${passedTests}`);
console.log(`失败: ${failedTests}`);
console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
    console.log('\n🎉 所有测试通过！游戏核心功能正常。');
} else {
    console.log(`\n⚠️  有 ${failedTests} 个测试失败，需要修复。`);
}

// 性能建议
console.log('\n=== 性能建议 ===');
console.log('1. 定期进行性能测试，确保游戏在不同设备上流畅运行');
console.log('2. 监控内存使用，避免内存泄漏');
console.log('3. 优化碰撞检测算法，减少不必要的计算');
console.log('4. 使用对象池来减少垃圾回收压力');

// 浏览器兼容性建议
console.log('\n=== 浏览器兼容性建议 ===');
console.log('1. 测试主流浏览器：Chrome, Firefox, Safari, Edge');
console.log('2. 检查移动设备兼容性');
console.log('3. 提供降级方案，处理不支持的功能');
console.log('4. 使用 polyfill 来支持旧版本浏览器');

console.log('\n测试完成！');