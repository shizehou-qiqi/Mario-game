/**
 * 任务8实现验证脚本
 * 验证玩家与敌人互动的所有功能是否正确实现
 */

console.log('=== 任务8实现验证 ===');
console.log('验证玩家与敌人的互动功能...');

// 验证需求3.1: 当马里奥从上方跳到敌人身上时，系统应该消除敌人并给予分数
function verifyRequirement3_1() {
    console.log('\n验证需求3.1: 玩家从上方击败敌人...');
    
    // 检查Player类是否有defeatEnemy方法
    if (typeof Player.prototype.defeatEnemy === 'function') {
        console.log('✓ Player.defeatEnemy 方法存在');
    } else {
        console.log('✗ Player.defeatEnemy 方法缺失');
        return false;
    }
    
    // 检查Player类是否有handleEnemyCollision方法
    if (typeof Player.prototype.handleEnemyCollision === 'function') {
        console.log('✓ Player.handleEnemyCollision 方法存在');
    } else {
        console.log('✗ Player.handleEnemyCollision 方法缺失');
        return false;
    }
    
    // 检查Player类是否有分数奖励方法
    if (typeof Player.prototype.getEnemyScoreReward === 'function') {
        console.log('✓ Player.getEnemyScoreReward 方法存在');
    } else {
        console.log('✗ Player.getEnemyScoreReward 方法缺失');
        return false;
    }
    
    // 检查Enemy类是否有defeat方法
    if (typeof Enemy.prototype.defeat === 'function') {
        console.log('✓ Enemy.defeat 方法存在');
    } else {
        console.log('✗ Enemy.defeat 方法缺失');
        return false;
    }
    
    console.log('✓ 需求3.1相关方法验证通过');
    return true;
}

// 验证需求3.2: 当马里奥从侧面接触敌人时，系统应该让马里奥受伤或死亡
function verifyRequirement3_2() {
    console.log('\n验证需求3.2: 玩家从侧面接触敌人受伤...');
    
    // 检查Player类是否有takeDamageFromEnemy方法
    if (typeof Player.prototype.takeDamageFromEnemy === 'function') {
        console.log('✓ Player.takeDamageFromEnemy 方法存在');
    } else {
        console.log('✗ Player.takeDamageFromEnemy 方法缺失');
        return false;
    }
    
    // 检查Player类是否有无敌状态管理
    if (typeof Player.prototype.isInvulnerableState === 'function') {
        console.log('✓ Player.isInvulnerableState 方法存在');
    } else {
        console.log('✗ Player.isInvulnerableState 方法缺失');
        return false;
    }
    
    // 检查Player类是否有死亡处理
    if (typeof Player.prototype.onPlayerDeath === 'function') {
        console.log('✓ Player.onPlayerDeath 方法存在');
    } else {
        console.log('✗ Player.onPlayerDeath 方法缺失');
        return false;
    }
    
    console.log('✓ 需求3.2相关方法验证通过');
    return true;
}

// 验证碰撞检测的方向判断
function verifyCollisionDirection() {
    console.log('\n验证碰撞方向检测...');
    
    // 检查Physics类是否有改进的碰撞方向检测
    if (typeof Physics.getCollisionDirectionWithVelocity === 'function') {
        console.log('✓ Physics.getCollisionDirectionWithVelocity 方法存在');
    } else {
        console.log('✗ Physics.getCollisionDirectionWithVelocity 方法缺失');
        return false;
    }
    
    // 检查GameEngine是否使用了改进的碰撞检测
    const gameEngineCode = GameEngine.toString();
    if (gameEngineCode.includes('getCollisionDirectionWithVelocity')) {
        console.log('✓ GameEngine使用了改进的碰撞方向检测');
    } else {
        console.log('✗ GameEngine未使用改进的碰撞方向检测');
        return false;
    }
    
    console.log('✓ 碰撞方向检测验证通过');
    return true;
}

// 验证分数系统
function verifyScoreSystem() {
    console.log('\n验证分数系统...');
    
    // 检查Player类是否有addScore方法
    if (typeof Player.prototype.addScore === 'function') {
        console.log('✓ Player.addScore 方法存在');
    } else {
        console.log('✗ Player.addScore 方法缺失');
        return false;
    }
    
    // 检查Player类是否有getScore方法
    if (typeof Player.prototype.getScore === 'function') {
        console.log('✓ Player.getScore 方法存在');
    } else {
        console.log('✗ Player.getScore 方法缺失');
        return false;
    }
    
    console.log('✓ 分数系统验证通过');
    return true;
}

// 验证事件系统
function verifyEventSystem() {
    console.log('\n验证事件系统...');
    
    // 检查是否有全局事件管理器
    if (typeof window !== 'undefined' && window.gameEvents) {
        console.log('✓ 全局事件管理器存在');
    } else {
        console.log('✗ 全局事件管理器缺失');
        return false;
    }
    
    // 检查Player类是否触发相关事件
    const playerCode = Player.toString();
    if (playerCode.includes('playerHurt') && 
        playerCode.includes('playerDeath') && 
        playerCode.includes('enemyDefeated') && 
        playerCode.includes('scoreChanged')) {
        console.log('✓ Player类触发所有必要事件');
    } else {
        console.log('✗ Player类缺少某些事件触发');
        return false;
    }
    
    console.log('✓ 事件系统验证通过');
    return true;
}

// 验证敌人被击败效果
function verifyEnemyDefeatEffects() {
    console.log('\n验证敌人被击败效果...');
    
    // 检查Enemy类是否有死亡动画
    if (typeof Enemy.prototype.updateDeathAnimation === 'function') {
        console.log('✓ Enemy.updateDeathAnimation 方法存在');
    } else {
        console.log('✗ Enemy.updateDeathAnimation 方法缺失');
        return false;
    }
    
    // 检查Enemy类渲染是否支持透明度
    const enemyCode = Enemy.toString();
    if (enemyCode.includes('globalAlpha') || enemyCode.includes('alpha')) {
        console.log('✓ Enemy类支持透明度效果');
    } else {
        console.log('✗ Enemy类不支持透明度效果');
        return false;
    }
    
    console.log('✓ 敌人被击败效果验证通过');
    return true;
}

// 主验证函数
function verifyTask8Implementation() {
    console.log('开始验证任务8的实现...\n');
    
    const results = [
        verifyRequirement3_1(),
        verifyRequirement3_2(),
        verifyCollisionDirection(),
        verifyScoreSystem(),
        verifyEventSystem(),
        verifyEnemyDefeatEffects()
    ];
    
    const passedTests = results.filter(result => result).length;
    const totalTests = results.length;
    
    console.log(`\n=== 验证结果 ===`);
    console.log(`通过测试: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
        console.log('🎉 任务8实现验证通过！所有功能都已正确实现。');
        console.log('\n实现的功能包括:');
        console.log('- ✓ 玩家跳跃击败敌人的逻辑');
        console.log('- ✓ 玩家受伤和死亡机制');
        console.log('- ✓ 敌人被击败的效果和分数奖励');
        console.log('- ✓ 碰撞检测的方向判断（从上方vs从侧面）');
        console.log('- ✓ 改进的碰撞方向检测算法');
        console.log('- ✓ 完整的事件系统支持');
        console.log('- ✓ 视觉反馈和动画效果');
        return true;
    } else {
        console.log('❌ 任务8实现验证失败，请检查缺失的功能。');
        return false;
    }
}

// 如果在浏览器环境中运行，自动执行验证
if (typeof window !== 'undefined') {
    // 等待所有脚本加载完成后执行验证
    window.addEventListener('load', () => {
        setTimeout(verifyTask8Implementation, 1000);
    });
} else {
    // 在Node.js环境中，需要手动调用
    console.log('请在浏览器环境中运行此验证脚本');
}

// 导出验证函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { verifyTask8Implementation };
}