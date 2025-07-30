/**
 * 任务10实现验证脚本
 * 验证分数和UI系统的实现
 */

// 验证结果存储
const verificationResults = {
    scoreManager: [],
    hudManager: [],
    integration: [],
    localStorage: []
};

/**
 * 验证ScoreManager类
 */
function verifyScoreManager() {
    console.log('🔍 验证ScoreManager类...');
    
    try {
        // 检查类是否存在
        if (typeof ScoreManager === 'undefined') {
            verificationResults.scoreManager.push({
                test: 'ScoreManager类存在性',
                status: 'FAIL',
                message: 'ScoreManager类未定义'
            });
            return;
        }
        
        verificationResults.scoreManager.push({
            test: 'ScoreManager类存在性',
            status: 'PASS',
            message: 'ScoreManager类已正确定义'
        });
        
        // 创建实例测试
        const scoreManager = new ScoreManager();
        
        // 测试基本功能
        const initialScore = scoreManager.getCurrentScore();
        scoreManager.addScore('coin', 100);
        const afterScore = scoreManager.getCurrentScore();
        
        verificationResults.scoreManager.push({
            test: '基本分数添加',
            status: afterScore === initialScore + 100 ? 'PASS' : 'FAIL',
            message: `初始分数: ${initialScore}, 添加后: ${afterScore}`
        });
        
        // 测试连击系统
        scoreManager.addScore('goomba', 100);
        scoreManager.addScore('goomba', 100);
        const comboScore = scoreManager.getCurrentScore();
        
        verificationResults.scoreManager.push({
            test: '连击系统',
            status: comboScore > afterScore + 200 ? 'PASS' : 'FAIL',
            message: `连击后分数: ${comboScore} (应该有连击奖励)`
        });
        
        // 测试生命值系统
        const initialLives = scoreManager.getLives();
        scoreManager.loseLife();
        const afterLives = scoreManager.getLives();
        
        verificationResults.scoreManager.push({
            test: '生命值管理',
            status: afterLives === initialLives - 1 ? 'PASS' : 'FAIL',
            message: `生命值: ${initialLives} -> ${afterLives}`
        });
        
        // 测试分数格式化
        const formatted = ScoreManager.formatScore(1234);
        verificationResults.scoreManager.push({
            test: '分数格式化',
            status: formatted === '001234' ? 'PASS' : 'FAIL',
            message: `格式化结果: ${formatted}`
        });
        
    } catch (error) {
        verificationResults.scoreManager.push({
            test: 'ScoreManager异常处理',
            status: 'FAIL',
            message: `错误: ${error.message}`
        });
    }
}

/**
 * 验证HUDManager类
 */
function verifyHUDManager() {
    console.log('🔍 验证HUDManager类...');
    
    try {
        // 检查类是否存在
        if (typeof HUDManager === 'undefined') {
            verificationResults.hudManager.push({
                test: 'HUDManager类存在性',
                status: 'FAIL',
                message: 'HUDManager类未定义'
            });
            return;
        }
        
        verificationResults.hudManager.push({
            test: 'HUDManager类存在性',
            status: 'PASS',
            message: 'HUDManager类已正确定义'
        });
        
        // 创建实例测试
        const scoreManager = new ScoreManager();
        const hudManager = new HUDManager(scoreManager);
        
        // 测试HUD是否继承自GameObject
        verificationResults.hudManager.push({
            test: 'GameObject继承',
            status: hudManager instanceof GameObject ? 'PASS' : 'FAIL',
            message: `HUDManager继承检查: ${hudManager instanceof GameObject}`
        });
        
        // 测试动画触发
        hudManager.triggerScoreFlash();
        const flashActive = hudManager.animations.scoreFlash.active;
        
        verificationResults.hudManager.push({
            test: '分数闪烁动画',
            status: flashActive ? 'PASS' : 'FAIL',
            message: `闪烁动画状态: ${flashActive}`
        });
        
        // 测试连击动画
        hudManager.triggerComboAnimation();
        const comboActive = hudManager.animations.comboDisplay.active;
        
        verificationResults.hudManager.push({
            test: '连击动画',
            status: comboActive ? 'PASS' : 'FAIL',
            message: `连击动画状态: ${comboActive}`
        });
        
    } catch (error) {
        verificationResults.hudManager.push({
            test: 'HUDManager异常处理',
            status: 'FAIL',
            message: `错误: ${error.message}`
        });
    }
}

/**
 * 验证本地存储功能
 */
function verifyLocalStorage() {
    console.log('🔍 验证本地存储功能...');
    
    try {
        const scoreManager = new ScoreManager();
        
        // 测试保存和加载
        scoreManager.addScore('coin', 5000);
        const testScore = scoreManager.getCurrentScore();
        scoreManager.saveHighScore();
        
        // 创建新实例测试加载
        const newManager = new ScoreManager();
        const loadedScore = newManager.getHighScore();
        
        verificationResults.localStorage.push({
            test: '最高分数保存/加载',
            status: loadedScore >= testScore ? 'PASS' : 'FAIL',
            message: `保存: ${testScore}, 加载: ${loadedScore}`
        });
        
        // 测试游戏统计
        scoreManager.saveGameStats();
        const stats = scoreManager.getGameStats();
        
        verificationResults.localStorage.push({
            test: '游戏统计保存',
            status: typeof stats.gamesPlayed === 'number' ? 'PASS' : 'FAIL',
            message: `统计数据: ${JSON.stringify(stats)}`
        });
        
        // 测试清除数据
        scoreManager.clearSavedData();
        const clearedManager = new ScoreManager();
        
        verificationResults.localStorage.push({
            test: '数据清除功能',
            status: clearedManager.getHighScore() === 0 ? 'PASS' : 'FAIL',
            message: `清除后最高分: ${clearedManager.getHighScore()}`
        });
        
    } catch (error) {
        verificationResults.localStorage.push({
            test: '本地存储异常处理',
            status: 'FAIL',
            message: `错误: ${error.message}`
        });
    }
}

/**
 * 验证系统集成
 */
function verifyIntegration() {
    console.log('🔍 验证系统集成...');
    
    try {
        // 检查HTML中是否包含了新的脚本文件
        const scripts = Array.from(document.scripts).map(script => script.src);
        const hasScoreManager = scripts.some(src => src.includes('scoreManager.js'));
        const hasHudManager = scripts.some(src => src.includes('hudManager.js'));
        
        verificationResults.integration.push({
            test: '脚本文件包含',
            status: hasScoreManager && hasHudManager ? 'PASS' : 'FAIL',
            message: `ScoreManager: ${hasScoreManager}, HUDManager: ${hasHudManager}`
        });
        
        // 检查全局变量
        const hasGlobalScoreManager = typeof window.scoreManager !== 'undefined';
        const hasGlobalHudManager = typeof window.hudManager !== 'undefined';
        
        verificationResults.integration.push({
            test: '全局变量设置',
            status: 'INFO',
            message: `全局scoreManager: ${hasGlobalScoreManager}, 全局hudManager: ${hasGlobalHudManager}`
        });
        
        // 检查UI元素
        const scoreElement = document.getElementById('score');
        const livesElement = document.getElementById('lives');
        
        verificationResults.integration.push({
            test: 'UI元素存在',
            status: scoreElement && livesElement ? 'PASS' : 'FAIL',
            message: `分数元素: ${!!scoreElement}, 生命元素: ${!!livesElement}`
        });
        
    } catch (error) {
        verificationResults.integration.push({
            test: '集成验证异常',
            status: 'FAIL',
            message: `错误: ${error.message}`
        });
    }
}

/**
 * 生成验证报告
 */
function generateReport() {
    console.log('\n📊 任务10实现验证报告');
    console.log('=' .repeat(50));
    
    const categories = [
        { name: 'ScoreManager功能', results: verificationResults.scoreManager },
        { name: 'HUDManager功能', results: verificationResults.hudManager },
        { name: '本地存储功能', results: verificationResults.localStorage },
        { name: '系统集成', results: verificationResults.integration }
    ];
    
    let totalTests = 0;
    let passedTests = 0;
    
    categories.forEach(category => {
        console.log(`\n📋 ${category.name}:`);
        category.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : 
                        result.status === 'FAIL' ? '❌' : 'ℹ️';
            console.log(`  ${icon} ${result.test}: ${result.message}`);
            
            if (result.status !== 'INFO') {
                totalTests++;
                if (result.status === 'PASS') passedTests++;
            }
        });
    });
    
    console.log('\n📈 总体结果:');
    console.log(`  通过测试: ${passedTests}/${totalTests}`);
    console.log(`  成功率: ${totalTests > 0 ? Math.round((passedTests/totalTests) * 100) : 0}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 任务10实现验证通过！');
    } else {
        console.log('⚠️  部分测试未通过，请检查实现。');
    }
    
    return {
        total: totalTests,
        passed: passedTests,
        percentage: totalTests > 0 ? Math.round((passedTests/totalTests) * 100) : 0
    };
}

/**
 * 运行所有验证
 */
function runAllVerifications() {
    console.log('🚀 开始任务10实现验证...\n');
    
    verifyScoreManager();
    verifyHUDManager();
    verifyLocalStorage();
    verifyIntegration();
    
    return generateReport();
}

// 如果在浏览器环境中，自动运行验证
if (typeof window !== 'undefined') {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAllVerifications);
    } else {
        runAllVerifications();
    }
}

// 导出验证函数（用于Node.js环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllVerifications,
        verifyScoreManager,
        verifyHUDManager,
        verifyLocalStorage,
        verifyIntegration,
        generateReport
    };
}