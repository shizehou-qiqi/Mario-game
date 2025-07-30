/**
 * 任务13实现验证脚本
 * 验证游戏失败条件的实现
 */

class Task13Validator {
    constructor() {
        this.testResults = [];
        this.testsPassed = 0;
        this.totalTests = 0;
    }
    
    /**
     * 运行所有验证测试
     */
    async runAllTests() {
        console.log('=== 任务13验证：游戏失败条件 ===');
        
        // 等待游戏初始化
        await this.waitForGameInitialization();
        
        // 运行各项测试
        await this.testOutOfBoundsDetection();
        await this.testLifeSystem();
        await this.testDeathAnimations();
        await this.testRespawnMechanism();
        await this.testGameOverLogic();
        
        // 输出测试结果
        this.printTestResults();
        
        return {
            passed: this.testsPassed,
            total: this.totalTests,
            success: this.testsPassed === this.totalTests
        };
    }
    
    /**
     * 等待游戏初始化完成
     */
    async waitForGameInitialization() {
        return new Promise((resolve) => {
            const checkInit = () => {
                if (window.gameEngine && window.gameStateManager && window.scoreManager) {
                    resolve();
                } else {
                    setTimeout(checkInit, 100);
                }
            };
            checkInit();
        });
    }
    
    /**
     * 测试掉出屏幕检测
     */
    async testOutOfBoundsDetection() {
        console.log('\n--- 测试掉出屏幕检测 ---');
        
        // 启动游戏
        if (window.gameStateManager) {
            window.gameStateManager.startGame();
            await this.wait(500); // 等待游戏启动
        }
        
        // 测试1：检查玩家是否有onOutOfBounds方法
        this.test('玩家具有onOutOfBounds方法', () => {
            return window.player && typeof window.player.onOutOfBounds === 'function';
        });
        
        // 测试2：检查玩家是否有onFallOutOfBounds方法
        this.test('玩家具有onFallOutOfBounds方法', () => {
            return window.player && typeof window.player.onFallOutOfBounds === 'function';
        });
        
        // 测试3：检查边界碰撞检测
        this.test('游戏引擎具有边界碰撞处理', () => {
            return window.gameEngine && typeof window.gameEngine.handlePlayerBoundaryCollision === 'function';
        });
        
        // 测试4：模拟玩家掉出屏幕
        if (window.player) {
            const originalHealth = window.player.health;
            const originalY = window.player.position.y;
            
            // 将玩家移动到屏幕底部下方
            window.player.setPosition(400, 700);
            await this.wait(100);
            
            // 手动触发边界检测
            window.player.onFallOutOfBounds();
            
            this.test('掉出屏幕触发失败条件', () => {
                return window.player.health < originalHealth || window.player.isDying;
            });
            
            // 恢复玩家位置
            window.player.setPosition(400, originalY);
            window.player.isDying = false;
        }
    }
    
    /**
     * 测试生命值系统
     */
    async testLifeSystem() {
        console.log('\n--- 测试生命值系统 ---');
        
        // 测试1：检查分数管理器的生命值功能
        this.test('分数管理器具有生命值管理功能', () => {
            return window.scoreManager && 
                   typeof window.scoreManager.loseLife === 'function' &&
                   typeof window.scoreManager.getLives === 'function';
        });
        
        // 测试2：检查玩家的生命值属性
        this.test('玩家具有生命值属性', () => {
            return window.player && 
                   typeof window.player.health === 'number' &&
                   typeof window.player.maxHealth === 'number';
        });
        
        // 测试3：测试生命值减少
        if (window.scoreManager && window.player) {
            const originalLives = window.scoreManager.getLives();
            window.scoreManager.loseLife();
            const newLives = window.scoreManager.getLives();
            
            this.test('生命值正确减少', () => {
                return newLives === originalLives - 1;
            });
            
            // 同步玩家生命值
            window.player.health = newLives;
        }
        
        // 测试4：测试生命值增加
        if (window.scoreManager) {
            const originalLives = window.scoreManager.getLives();
            window.scoreManager.addLife();
            const newLives = window.scoreManager.getLives();
            
            this.test('生命值正确增加', () => {
                return newLives === originalLives + 1;
            });
        }
    }
    
    /**
     * 测试死亡动画
     */
    async testDeathAnimations() {
        console.log('\n--- 测试死亡动画 ---');
        
        // 测试1：检查死亡相关属性
        this.test('玩家具有死亡动画属性', () => {
            return window.player && 
                   'isDying' in window.player &&
                   'deathType' in window.player &&
                   'deathRotation' in window.player;
        });
        
        // 测试2：检查死亡序列方法
        this.test('玩家具有死亡序列方法', () => {
            return window.player && 
                   typeof window.player.triggerDeathSequence === 'function' &&
                   typeof window.player.startDeathAnimation === 'function';
        });
        
        // 测试3：检查死亡动画更新
        this.test('玩家具有死亡动画更新方法', () => {
            return window.player && 
                   typeof window.player.updateDeathAnimation === 'function';
        });
        
        // 测试4：检查死亡渲染
        this.test('玩家具有死亡渲染方法', () => {
            return window.player && 
                   typeof window.player.renderDeathAnimation === 'function' &&
                   typeof window.player.renderDeathSprite === 'function';
        });
        
        // 测试5：模拟死亡动画
        if (window.player) {
            const originalState = window.player.animationState;
            window.player.triggerDeathSequence('enemy');
            
            this.test('死亡序列正确触发', () => {
                return window.player.isDying && window.player.animationState === 'death';
            });
            
            // 恢复状态
            window.player.isDying = false;
            window.player.animationState = originalState;
        }
    }
    
    /**
     * 测试重生机制
     */
    async testRespawnMechanism() {
        console.log('\n--- 测试重生机制 ---');
        
        // 测试1：检查重生方法
        this.test('玩家具有重生方法', () => {
            return window.player && 
                   typeof window.player.respawn === 'function' &&
                   typeof window.player.respawnPlayer === 'function';
        });
        
        // 测试2：检查无敌状态
        this.test('玩家具有无敌状态管理', () => {
            return window.player && 
                   'isInvulnerable' in window.player &&
                   'invulnerabilityTime' in window.player &&
                   typeof window.player.isInvulnerableState === 'function';
        });
        
        // 测试3：测试重生功能
        if (window.player && window.currentLevel) {
            const spawnPoint = window.currentLevel.getSpawnPoint();
            const originalPos = { x: window.player.position.x, y: window.player.position.y };
            
            // 移动玩家到其他位置
            window.player.setPosition(1000, 500);
            
            // 执行重生
            window.player.respawn();
            
            this.test('重生位置正确', () => {
                const distance = Math.abs(window.player.position.x - spawnPoint.x) + 
                               Math.abs(window.player.position.y - spawnPoint.y);
                return distance < 100; // 允许一定误差
            });
        }
        
        // 测试4：测试重生后的无敌状态
        if (window.player) {
            window.player.respawnPlayer();
            
            this.test('重生后激活无敌状态', () => {
                return window.player.isInvulnerable && window.player.invulnerabilityTime > 0;
            });
        }
    }
    
    /**
     * 测试游戏结束逻辑
     */
    async testGameOverLogic() {
        console.log('\n--- 测试游戏结束逻辑 ---');
        
        // 测试1：检查游戏状态管理器的游戏结束方法
        this.test('游戏状态管理器具有游戏结束方法', () => {
            return window.gameStateManager && 
                   typeof window.gameStateManager.gameOver === 'function';
        });
        
        // 测试2：检查玩家死亡处理方法
        this.test('玩家具有死亡处理方法', () => {
            return window.player && 
                   typeof window.player.handlePlayerDeath === 'function';
        });
        
        // 测试3：模拟生命值耗尽
        if (window.player && window.scoreManager) {
            // 保存原始状态
            const originalLives = window.scoreManager.getLives();
            const originalHealth = window.player.health;
            
            // 设置生命值为1
            window.scoreManager.lives = 1;
            window.player.health = 1;
            
            // 触发死亡
            window.player.triggerDeathSequence('enemy');
            
            this.test('生命值耗尽时标记为死亡', () => {
                return window.player.isDying;
            });
            
            // 恢复原始状态
            window.scoreManager.lives = originalLives;
            window.player.health = originalHealth;
            window.player.isDying = false;
        }
        
        // 测试4：检查游戏结束状态
        this.test('游戏状态管理器具有游戏结束状态检查', () => {
            return window.gameStateManager && 
                   typeof window.gameStateManager.isGameOver === 'function';
        });
    }
    
    /**
     * 执行单个测试
     */
    test(description, testFunction) {
        this.totalTests++;
        try {
            const result = testFunction();
            if (result) {
                console.log(`✅ ${description}`);
                this.testsPassed++;
                this.testResults.push({ description, passed: true, error: null });
            } else {
                console.log(`❌ ${description}`);
                this.testResults.push({ description, passed: false, error: 'Test returned false' });
            }
        } catch (error) {
            console.log(`❌ ${description} - Error: ${error.message}`);
            this.testResults.push({ description, passed: false, error: error.message });
        }
    }
    
    /**
     * 等待指定时间
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 打印测试结果
     */
    printTestResults() {
        console.log('\n=== 测试结果汇总 ===');
        console.log(`总测试数: ${this.totalTests}`);
        console.log(`通过测试: ${this.testsPassed}`);
        console.log(`失败测试: ${this.totalTests - this.testsPassed}`);
        console.log(`成功率: ${((this.testsPassed / this.totalTests) * 100).toFixed(1)}%`);
        
        if (this.testsPassed === this.totalTests) {
            console.log('🎉 所有测试通过！任务13实现正确。');
        } else {
            console.log('⚠️ 部分测试失败，需要检查实现。');
            
            // 显示失败的测试
            console.log('\n失败的测试:');
            this.testResults
                .filter(result => !result.passed)
                .forEach(result => {
                    console.log(`- ${result.description}: ${result.error}`);
                });
        }
    }
}

// 自动运行验证（如果在浏览器环境中）
if (typeof window !== 'undefined') {
    window.Task13Validator = Task13Validator;
    
    // 页面加载完成后自动运行验证
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(async () => {
                const validator = new Task13Validator();
                await validator.runAllTests();
            }, 1000);
        });
    } else {
        setTimeout(async () => {
            const validator = new Task13Validator();
            await validator.runAllTests();
        }, 1000);
    }
}

// Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Task13Validator;
}