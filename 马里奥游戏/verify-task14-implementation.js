/**
 * 任务14实现验证脚本
 * 验证游戏优化和完善体验功能的实现
 */

console.log('开始验证任务14实现...');

// 验证结果存储
const verificationResults = {
    audioSystem: false,
    performanceOptimization: false,
    visualEnhancements: false,
    gameBalance: false,
    overall: false
};

// 1. 验证音效系统
function verifyAudioSystem() {
    console.log('验证音效系统...');
    
    try {
        // 检查AudioManager类是否存在
        if (typeof AudioManager === 'undefined') {
            console.error('❌ AudioManager类未找到');
            return false;
        }
        
        // 创建AudioManager实例
        const audioManager = new AudioManager();
        
        // 检查基本属性
        const requiredProperties = ['soundEffects', 'backgroundMusic', 'isInitialized'];
        for (const prop of requiredProperties) {
            if (!(prop in audioManager)) {
                console.error(`❌ AudioManager缺少属性: ${prop}`);
                return false;
            }
        }
        
        // 检查音效配置
        const requiredSounds = ['jump', 'coin', 'enemyDefeat', 'playerHurt', 'victory', 'gameOver'];
        for (const sound of requiredSounds) {
            if (!(sound in audioManager.soundEffects)) {
                console.error(`❌ 缺少音效配置: ${sound}`);
                return false;
            }
        }
        
        // 检查方法
        const requiredMethods = ['playSound', 'playBackgroundMusic', 'stopBackgroundMusic', 'setMasterVolume'];
        for (const method of requiredMethods) {
            if (typeof audioManager[method] !== 'function') {
                console.error(`❌ AudioManager缺少方法: ${method}`);
                return false;
            }
        }
        
        console.log('✅ 音效系统验证通过');
        return true;
        
    } catch (error) {
        console.error('❌ 音效系统验证失败:', error);
        return false;
    }
}

// 2. 验证性能优化
function verifyPerformanceOptimization() {
    console.log('验证性能优化...');
    
    try {
        // 检查GameEngine是否有性能监控
        if (typeof GameEngine === 'undefined') {
            console.error('❌ GameEngine类未找到');
            return false;
        }
        
        // 创建临时canvas用于测试
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 800;
        testCanvas.height = 600;
        
        const gameEngine = new GameEngine(testCanvas);
        gameEngine.init();
        
        // 检查性能统计属性
        if (!gameEngine.performanceStats) {
            console.error('❌ GameEngine缺少性能统计功能');
            return false;
        }
        
        // 检查性能统计方法
        if (typeof gameEngine.getPerformanceStats !== 'function') {
            console.error('❌ GameEngine缺少getPerformanceStats方法');
            return false;
        }
        
        // 检查碰撞检测优化
        const handleCollisionsSource = gameEngine.handleCollisions.toString();
        if (!handleCollisionsSource.includes('activeObjects')) {
            console.error('❌ 碰撞检测未优化');
            return false;
        }
        
        console.log('✅ 性能优化验证通过');
        return true;
        
    } catch (error) {
        console.error('❌ 性能优化验证失败:', error);
        return false;
    }
}

// 3. 验证视觉增强
function verifyVisualEnhancements() {
    console.log('验证视觉增强...');
    
    try {
        // 检查ParticleSystem类
        if (typeof ParticleSystem === 'undefined') {
            console.error('❌ ParticleSystem类未找到');
            return false;
        }
        
        // 创建粒子系统实例
        const particleSystem = new ParticleSystem();
        
        // 检查粒子效果方法
        const requiredEffects = ['createExplosion', 'createCollectEffect', 'createJumpDust', 'createDeathEffect'];
        for (const effect of requiredEffects) {
            if (typeof particleSystem[effect] !== 'function') {
                console.error(`❌ ParticleSystem缺少方法: ${effect}`);
                return false;
            }
        }
        
        // 检查EventManager类
        if (typeof EventManager === 'undefined') {
            console.error('❌ EventManager类未找到');
            return false;
        }
        
        const eventManager = new EventManager();
        
        // 检查事件管理方法
        const requiredEventMethods = ['on', 'off', 'trigger', 'once'];
        for (const method of requiredEventMethods) {
            if (typeof eventManager[method] !== 'function') {
                console.error(`❌ EventManager缺少方法: ${method}`);
                return false;
            }
        }
        
        console.log('✅ 视觉增强验证通过');
        return true;
        
    } catch (error) {
        console.error('❌ 视觉增强验证失败:', error);
        return false;
    }
}

// 4. 验证游戏平衡性调整
function verifyGameBalance() {
    console.log('验证游戏平衡性调整...');
    
    try {
        // 检查Player类的平衡性调整
        if (typeof Player === 'undefined') {
            console.error('❌ Player类未找到');
            return false;
        }
        
        const player = new Player();
        
        // 检查移动速度是否已调整
        if (player.moveSpeed < 220) {
            console.error('❌ 玩家移动速度未优化');
            return false;
        }
        
        // 检查跳跃缓冲时间是否已调整
        if (player.jumpBufferTime < 0.15) {
            console.error('❌ 跳跃缓冲时间未优化');
            return false;
        }
        
        // 检查土狼时间是否已调整
        if (player.coyoteTimeMax < 0.15) {
            console.error('❌ 土狼时间未优化');
            return false;
        }
        
        // 检查Goomba类的平衡性调整
        if (typeof Goomba === 'undefined') {
            console.error('❌ Goomba类未找到');
            return false;
        }
        
        const goomba = new Goomba();
        
        // 检查敌人移动速度是否已调整
        if (goomba.moveSpeed < 40) {
            console.error('❌ 敌人移动速度未优化');
            return false;
        }
        
        console.log('✅ 游戏平衡性调整验证通过');
        return true;
        
    } catch (error) {
        console.error('❌ 游戏平衡性调整验证失败:', error);
        return false;
    }
}

// 5. 验证文件集成
function verifyFileIntegration() {
    console.log('验证文件集成...');
    
    try {
        // 检查index.html是否包含新的脚本文件
        const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
        
        const requiredScripts = [
            'js/audioManager.js',
            'js/eventManager.js',
            'js/particleSystem.js'
        ];
        
        for (const script of requiredScripts) {
            const found = scripts.some(src => src.includes(script));
            if (!found) {
                console.error(`❌ 缺少脚本文件: ${script}`);
                return false;
            }
        }
        
        console.log('✅ 文件集成验证通过');
        return true;
        
    } catch (error) {
        console.error('❌ 文件集成验证失败:', error);
        return false;
    }
}

// 执行所有验证
function runAllVerifications() {
    console.log('='.repeat(50));
    console.log('任务14实现验证开始');
    console.log('='.repeat(50));
    
    verificationResults.audioSystem = verifyAudioSystem();
    verificationResults.performanceOptimization = verifyPerformanceOptimization();
    verificationResults.visualEnhancements = verifyVisualEnhancements();
    verificationResults.gameBalance = verifyGameBalance();
    
    // 如果在浏览器环境中，验证文件集成
    if (typeof document !== 'undefined') {
        verificationResults.fileIntegration = verifyFileIntegration();
    }
    
    // 计算总体结果
    const passedTests = Object.values(verificationResults).filter(result => result === true).length;
    const totalTests = Object.keys(verificationResults).length;
    verificationResults.overall = passedTests === totalTests;
    
    console.log('='.repeat(50));
    console.log('验证结果汇总:');
    console.log('='.repeat(50));
    
    for (const [test, result] of Object.entries(verificationResults)) {
        const status = result ? '✅ 通过' : '❌ 失败';
        console.log(`${test}: ${status}`);
    }
    
    console.log('='.repeat(50));
    console.log(`总体结果: ${verificationResults.overall ? '✅ 通过' : '❌ 失败'} (${passedTests}/${totalTests})`);
    console.log('='.repeat(50));
    
    if (verificationResults.overall) {
        console.log('🎉 任务14实现验证成功！');
        console.log('所有优化功能都已正确实现：');
        console.log('- ✅ 音效系统（跳跃、收集、击败敌人音效）');
        console.log('- ✅ 游戏性能和帧率优化');
        console.log('- ✅ 动画效果和视觉反馈增强');
        console.log('- ✅ 游戏平衡性和难度调整');
    } else {
        console.log('⚠️ 任务14实现存在问题，请检查失败的测试项。');
    }
    
    return verificationResults;
}

// 如果在浏览器环境中，自动运行验证
if (typeof window !== 'undefined') {
    // 等待页面加载完成后运行验证
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllVerifications);
    } else {
        runAllVerifications();
    }
}

// 如果在Node.js环境中，导出验证函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllVerifications,
        verifyAudioSystem,
        verifyPerformanceOptimization,
        verifyVisualEnhancements,
        verifyGameBalance,
        verificationResults
    };
}