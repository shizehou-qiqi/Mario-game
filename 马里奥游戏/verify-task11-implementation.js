/**
 * 任务11实现验证脚本
 * 验证游戏状态管理系统的实现
 */

// 验证结果存储
const verificationResults = {
    passed: 0,
    failed: 0,
    tests: []
};

/**
 * 添加测试结果
 */
function addTestResult(testName, passed, message, details = null) {
    const result = {
        name: testName,
        passed: passed,
        message: message,
        details: details,
        timestamp: new Date().toISOString()
    };
    
    verificationResults.tests.push(result);
    if (passed) {
        verificationResults.passed++;
    } else {
        verificationResults.failed++;
    }
    
    // 输出结果
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${testName}: ${message}`);
    if (details) {
        console.log(`   详情: ${details}`);
    }
}

/**
 * 验证GameStateManager类的存在和基本功能
 */
function verifyGameStateManagerClass() {
    console.log('\n=== 验证GameStateManager类 ===');
    
    // 测试1: 类存在性
    const classExists = typeof GameStateManager === 'function';
    addTestResult(
        'GameStateManager类存在性',
        classExists,
        classExists ? 'GameStateManager类已正确定义' : 'GameStateManager类未找到'
    );
    
    if (!classExists) return false;
    
    // 测试2: GameState枚举存在性
    const enumExists = typeof GameState === 'object' && GameState !== null;
    addTestResult(
        'GameState枚举存在性',
        enumExists,
        enumExists ? 'GameState枚举已正确定义' : 'GameState枚举未找到'
    );
    
    // 测试3: 枚举值完整性
    if (enumExists) {
        const requiredStates = ['MENU', 'PLAYING', 'PAUSED', 'GAME_OVER', 'VICTORY'];
        const missingStates = requiredStates.filter(state => !GameState.hasOwnProperty(state));
        
        addTestResult(
            'GameState枚举完整性',
            missingStates.length === 0,
            missingStates.length === 0 ? '所有必需的游戏状态都已定义' : `缺少状态: ${missingStates.join(', ')}`,
            `定义的状态: ${Object.keys(GameState).join(', ')}`
        );
    }
    
    return classExists && enumExists;
}

/**
 * 验证GameStateManager实例化和初始化
 */
function verifyGameStateManagerInitialization() {
    console.log('\n=== 验证GameStateManager初始化 ===');
    
    try {
        // 创建测试用的Canvas和GameEngine
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        
        const gameEngine = new GameEngine(canvas);
        gameEngine.init();
        
        // 创建GameStateManager实例
        const stateManager = new GameStateManager(gameEngine, canvas);
        
        addTestResult(
            'GameStateManager实例化',
            true,
            'GameStateManager实例创建成功'
        );
        
        // 初始化状态管理器
        stateManager.init();
        
        addTestResult(
            'GameStateManager初始化',
            true,
            'GameStateManager初始化成功'
        );
        
        // 验证初始状态
        const initialState = stateManager.getCurrentState();
        addTestResult(
            '初始状态设置',
            initialState === GameState.MENU,
            `初始状态为: ${initialState}`,
            '初始状态应该是MENU'
        );
        
        return stateManager;
        
    } catch (error) {
        addTestResult(
            'GameStateManager初始化',
            false,
            `初始化失败: ${error.message}`,
            error.stack
        );
        return null;
    }
}

/**
 * 验证状态转换功能
 */
function verifyStateTransitions(stateManager) {
    console.log('\n=== 验证状态转换功能 ===');
    
    if (!stateManager) {
        addTestResult('状态转换测试', false, '状态管理器未初始化');
        return;
    }
    
    // 测试状态转换序列
    const testSequence = [
        { method: 'startGame', expectedState: GameState.PLAYING, description: '开始游戏' },
        { method: 'pauseGame', expectedState: GameState.PAUSED, description: '暂停游戏' },
        { method: 'resumeGame', expectedState: GameState.PLAYING, description: '恢复游戏' },
        { method: 'gameOver', expectedState: GameState.GAME_OVER, description: '游戏结束' },
        { method: 'restartGame', expectedState: GameState.PLAYING, description: '重新开始' },
        { method: 'victory', expectedState: GameState.VICTORY, description: '游戏胜利' },
        { method: 'returnToMenu', expectedState: GameState.MENU, description: '返回菜单' }
    ];
    
    for (const test of testSequence) {
        try {
            // 执行状态转换方法
            if (typeof stateManager[test.method] === 'function') {
                stateManager[test.method]();
                const currentState = stateManager.getCurrentState();
                
                addTestResult(
                    `状态转换 - ${test.description}`,
                    currentState === test.expectedState,
                    `${test.description}: ${currentState}`,
                    `期望状态: ${test.expectedState}, 实际状态: ${currentState}`
                );
            } else {
                addTestResult(
                    `状态转换 - ${test.description}`,
                    false,
                    `方法 ${test.method} 不存在`
                );
            }
        } catch (error) {
            addTestResult(
                `状态转换 - ${test.description}`,
                false,
                `状态转换失败: ${error.message}`,
                error.stack
            );
        }
    }
}

/**
 * 验证游戏数据管理
 */
function verifyGameDataManagement(stateManager) {
    console.log('\n=== 验证游戏数据管理 ===');
    
    if (!stateManager) {
        addTestResult('游戏数据管理测试', false, '状态管理器未初始化');
        return;
    }
    
    try {
        // 测试获取游戏数据
        const gameData = stateManager.getGameData();
        const hasRequiredFields = gameData.hasOwnProperty('score') && 
                                 gameData.hasOwnProperty('lives') && 
                                 gameData.hasOwnProperty('level') && 
                                 gameData.hasOwnProperty('time');
        
        addTestResult(
            '游戏数据结构',
            hasRequiredFields,
            hasRequiredFields ? '游戏数据结构完整' : '游戏数据结构不完整',
            `数据字段: ${Object.keys(gameData).join(', ')}`
        );
        
        // 测试更新游戏数据
        const testData = { score: 1000, lives: 2, level: 2 };
        stateManager.updateGameData(testData);
        const updatedData = stateManager.getGameData();
        
        const dataUpdated = updatedData.score === testData.score && 
                           updatedData.lives === testData.lives && 
                           updatedData.level === testData.level;
        
        addTestResult(
            '游戏数据更新',
            dataUpdated,
            dataUpdated ? '游戏数据更新成功' : '游戏数据更新失败',
            `更新后数据: score=${updatedData.score}, lives=${updatedData.lives}, level=${updatedData.level}`
        );
        
    } catch (error) {
        addTestResult(
            '游戏数据管理',
            false,
            `数据管理测试失败: ${error.message}`,
            error.stack
        );
    }
}

/**
 * 验证UI元素和事件处理
 */
function verifyUIElements() {
    console.log('\n=== 验证UI元素 ===');
    
    // 检查必需的UI元素
    const requiredElements = [
        'gameMenu',
        'gameOver', 
        'victoryScreen',
        'pauseOverlay',
        'startButton',
        'pauseButton',
        'restartButton',
        'continueButton',
        'nextLevelButton'
    ];
    
    let missingElements = [];
    let foundElements = [];
    
    for (const elementId of requiredElements) {
        const element = document.getElementById(elementId);
        if (element) {
            foundElements.push(elementId);
        } else {
            missingElements.push(elementId);
        }
    }
    
    addTestResult(
        'UI元素存在性',
        missingElements.length === 0,
        missingElements.length === 0 ? '所有必需UI元素都存在' : `缺少元素: ${missingElements.join(', ')}`,
        `找到的元素: ${foundElements.join(', ')}`
    );
    
    // 检查菜单按钮（使用class选择器）
    const menuButtons = document.querySelectorAll('.menu-button');
    addTestResult(
        '菜单按钮',
        menuButtons.length > 0,
        `找到 ${menuButtons.length} 个菜单按钮`,
        '菜单按钮应该使用.menu-button类'
    );
}

/**
 * 验证本地存储功能
 */
function verifyLocalStorage(stateManager) {
    console.log('\n=== 验证本地存储功能 ===');
    
    if (!stateManager) {
        addTestResult('本地存储测试', false, '状态管理器未初始化');
        return;
    }
    
    try {
        // 测试保存游戏统计
        stateManager.updateGameData({ score: 5000 });
        stateManager.saveGameStats();
        
        addTestResult(
            '游戏统计保存',
            true,
            '游戏统计保存成功'
        );
        
        // 测试获取最高分
        const highScore = stateManager.getHighScore();
        addTestResult(
            '最高分获取',
            typeof highScore === 'number',
            `最高分: ${highScore}`,
            '最高分应该是数字类型'
        );
        
        // 测试localStorage中的数据
        const savedHighScore = localStorage.getItem('marioHighScore');
        const savedHistory = localStorage.getItem('marioGameHistory');
        
        addTestResult(
            'localStorage数据',
            savedHighScore !== null,
            savedHighScore ? `localStorage中保存的最高分: ${savedHighScore}` : 'localStorage中没有最高分数据'
        );
        
    } catch (error) {
        addTestResult(
            '本地存储功能',
            false,
            `本地存储测试失败: ${error.message}`,
            error.stack
        );
    }
}

/**
 * 验证状态查询方法
 */
function verifyStateQueryMethods(stateManager) {
    console.log('\n=== 验证状态查询方法 ===');
    
    if (!stateManager) {
        addTestResult('状态查询测试', false, '状态管理器未初始化');
        return;
    }
    
    const queryMethods = [
        'isPlaying',
        'isPaused', 
        'isInMenu',
        'isGameOver',
        'isVictory'
    ];
    
    let methodsExist = true;
    let missingMethods = [];
    
    for (const method of queryMethods) {
        if (typeof stateManager[method] !== 'function') {
            methodsExist = false;
            missingMethods.push(method);
        }
    }
    
    addTestResult(
        '状态查询方法存在性',
        methodsExist,
        methodsExist ? '所有状态查询方法都存在' : `缺少方法: ${missingMethods.join(', ')}`
    );
    
    if (methodsExist) {
        // 测试方法功能
        stateManager.setState(GameState.PLAYING);
        addTestResult(
            'isPlaying方法',
            stateManager.isPlaying() === true,
            `isPlaying() 返回: ${stateManager.isPlaying()}`
        );
        
        stateManager.setState(GameState.MENU);
        addTestResult(
            'isInMenu方法',
            stateManager.isInMenu() === true,
            `isInMenu() 返回: ${stateManager.isInMenu()}`
        );
    }
}

/**
 * 验证回调系统
 */
function verifyCallbackSystem(stateManager) {
    console.log('\n=== 验证回调系统 ===');
    
    if (!stateManager) {
        addTestResult('回调系统测试', false, '状态管理器未初始化');
        return;
    }
    
    try {
        let callbackTriggered = false;
        let callbackData = null;
        
        // 注册状态变化回调
        stateManager.onStateChange((newState, oldState) => {
            callbackTriggered = true;
            callbackData = { newState, oldState };
        });
        
        // 触发状态变化
        const oldState = stateManager.getCurrentState();
        stateManager.setState(GameState.PLAYING);
        
        // 给回调一些时间执行
        setTimeout(() => {
            addTestResult(
                '状态变化回调',
                callbackTriggered,
                callbackTriggered ? '状态变化回调成功触发' : '状态变化回调未触发',
                callbackData ? `回调数据: ${JSON.stringify(callbackData)}` : null
            );
        }, 100);
        
        // 测试事件回调
        let eventCallbackTriggered = false;
        stateManager.on('gameStart', () => {
            eventCallbackTriggered = true;
        });
        
        stateManager.startGame();
        
        setTimeout(() => {
            addTestResult(
                '事件回调系统',
                eventCallbackTriggered,
                eventCallbackTriggered ? '事件回调成功触发' : '事件回调未触发'
            );
        }, 100);
        
    } catch (error) {
        addTestResult(
            '回调系统',
            false,
            `回调系统测试失败: ${error.message}`,
            error.stack
        );
    }
}

/**
 * 运行所有验证测试
 */
function runAllVerifications() {
    console.log('🚀 开始验证任务11 - 游戏状态管理系统实现');
    console.log('='.repeat(60));
    
    // 重置结果
    verificationResults.passed = 0;
    verificationResults.failed = 0;
    verificationResults.tests = [];
    
    // 运行验证测试
    const classValid = verifyGameStateManagerClass();
    
    if (classValid) {
        const stateManager = verifyGameStateManagerInitialization();
        
        if (stateManager) {
            verifyStateTransitions(stateManager);
            verifyGameDataManagement(stateManager);
            verifyStateQueryMethods(stateManager);
            verifyCallbackSystem(stateManager);
            verifyLocalStorage(stateManager);
        }
    }
    
    verifyUIElements();
    
    // 输出总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 验证结果总结');
    console.log('='.repeat(60));
    console.log(`✅ 通过测试: ${verificationResults.passed}`);
    console.log(`❌ 失败测试: ${verificationResults.failed}`);
    console.log(`📈 成功率: ${((verificationResults.passed / (verificationResults.passed + verificationResults.failed)) * 100).toFixed(1)}%`);
    
    const allPassed = verificationResults.failed === 0;
    console.log(`\n🎯 任务11实现状态: ${allPassed ? '✅ 完成' : '❌ 需要修复'}`);
    
    if (!allPassed) {
        console.log('\n🔧 需要修复的问题:');
        verificationResults.tests
            .filter(test => !test.passed)
            .forEach(test => {
                console.log(`   • ${test.name}: ${test.message}`);
            });
    }
    
    return verificationResults;
}

// 如果在浏览器环境中，自动运行验证
if (typeof window !== 'undefined') {
    // 等待页面加载完成后运行验证
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(runAllVerifications, 1000);
        });
    } else {
        setTimeout(runAllVerifications, 1000);
    }
}

// 导出验证函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllVerifications,
        verificationResults
    };
} else if (typeof window !== 'undefined') {
    window.verifyTask11Implementation = runAllVerifications;
    window.task11VerificationResults = verificationResults;
}