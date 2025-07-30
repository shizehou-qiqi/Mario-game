/**
 * Physics类 - 物理引擎核心
 * 实现重力、碰撞检测和碰撞响应
 */
class Physics {
    /**
     * 物理常量
     */
    static get GRAVITY() { return 980; } // 重力加速度 (像素/秒²)
    static get TERMINAL_VELOCITY() { return 600; } // 终端速度
    static get FRICTION() { return 0.8; } // 摩擦系数
    static get BOUNCE_DAMPING() { return 0.3; } // 弹跳阻尼
    static get MIN_VELOCITY_THRESHOLD() { return 0.1; } // 最小速度阈值

    /**
     * 碰撞类型枚举
     */
    static get CollisionType() {
        return {
            NONE: 'none',
            TOP: 'top',
            BOTTOM: 'bottom',
            LEFT: 'left',
            RIGHT: 'right'
        };
    }

    /**
     * 应用重力到游戏对象
     * @param {GameObject} gameObject - 游戏对象
     * @param {number} deltaTime - 时间步长（秒）
     * @param {number} gravityScale - 重力缩放因子（默认1.0）
     */
    static applyGravity(gameObject, deltaTime, gravityScale = 1.0) {
        if (!gameObject || !gameObject.velocity) {
            return;
        }

        // 应用重力加速度
        const gravityForce = Physics.GRAVITY * gravityScale * deltaTime;
        gameObject.velocity.y += gravityForce;

        // 限制终端速度
        if (gameObject.velocity.y > Physics.TERMINAL_VELOCITY) {
            gameObject.velocity.y = Physics.TERMINAL_VELOCITY;
        }
    }

    /**
     * 应用摩擦力
     * @param {GameObject} gameObject - 游戏对象
     * @param {number} deltaTime - 时间步长（秒）
     * @param {number} frictionCoeff - 摩擦系数（默认使用全局摩擦系数）
     */
    static applyFriction(gameObject, deltaTime, frictionCoeff = Physics.FRICTION) {
        if (!gameObject || !gameObject.velocity) {
            return;
        }

        // 应用水平摩擦
        gameObject.velocity.x *= Math.pow(frictionCoeff, deltaTime);

        // 清除微小速度以避免抖动
        if (Math.abs(gameObject.velocity.x) < Physics.MIN_VELOCITY_THRESHOLD) {
            gameObject.velocity.x = 0;
        }
        if (Math.abs(gameObject.velocity.y) < Physics.MIN_VELOCITY_THRESHOLD) {
            gameObject.velocity.y = 0;
        }
    }

    /**
     * AABB碰撞检测
     * @param {GameObject} obj1 - 第一个对象
     * @param {GameObject} obj2 - 第二个对象
     * @returns {boolean} 是否发生碰撞
     */
    static checkAABBCollision(obj1, obj2) {
        if (!obj1 || !obj2 || !obj1.collisionEnabled || !obj2.collisionEnabled) {
            return false;
        }

        if (obj1.destroyed || obj2.destroyed) {
            return false;
        }

        const bounds1 = obj1.getCollisionBounds();
        const bounds2 = obj2.getCollisionBounds();

        return !(bounds1.x + bounds1.width <= bounds2.x ||
            bounds1.x >= bounds2.x + bounds2.width ||
            bounds1.y + bounds1.height <= bounds2.y ||
            bounds1.y >= bounds2.y + bounds2.height);
    }

    /**
     * 获取碰撞方向
     * @param {GameObject} obj1 - 移动的对象
     * @param {GameObject} obj2 - 被碰撞的对象
     * @returns {string} 碰撞方向
     */
    static getCollisionDirection(obj1, obj2) {
        if (!Physics.checkAABBCollision(obj1, obj2)) {
            return Physics.CollisionType.NONE;
        }

        const bounds1 = obj1.getCollisionBounds();
        const bounds2 = obj2.getCollisionBounds();

        // 计算重叠区域
        const overlapLeft = (bounds1.x + bounds1.width) - bounds2.x;
        const overlapRight = (bounds2.x + bounds2.width) - bounds1.x;
        const overlapTop = (bounds1.y + bounds1.height) - bounds2.y;
        const overlapBottom = (bounds2.y + bounds2.height) - bounds1.y;

        // 找到最小重叠方向
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop) {
            return Physics.CollisionType.TOP;
        } else if (minOverlap === overlapBottom) {
            return Physics.CollisionType.BOTTOM;
        } else if (minOverlap === overlapLeft) {
            return Physics.CollisionType.LEFT;
        } else if (minOverlap === overlapRight) {
            return Physics.CollisionType.RIGHT;
        }

        return Physics.CollisionType.NONE;
    }

    /**
     * 获取更精确的碰撞方向（考虑速度方向）
     * @param {GameObject} obj1 - 移动的对象
     * @param {GameObject} obj2 - 被碰撞的对象
     * @returns {string} 碰撞方向
     */
    static getCollisionDirectionWithVelocity(obj1, obj2) {
        if (!Physics.checkAABBCollision(obj1, obj2)) {
            return Physics.CollisionType.NONE;
        }

        const bounds1 = obj1.getCollisionBounds();
        const bounds2 = obj2.getCollisionBounds();

        // 计算中心点
        const center1 = {
            x: bounds1.x + bounds1.width / 2,
            y: bounds1.y + bounds1.height / 2
        };
        const center2 = {
            x: bounds2.x + bounds2.width / 2,
            y: bounds2.y + bounds2.height / 2
        };

        // 计算相对位置
        const dx = center1.x - center2.x;
        const dy = center1.y - center2.y;

        // 计算重叠区域
        const overlapX = (bounds1.width + bounds2.width) / 2 - Math.abs(dx);
        const overlapY = (bounds1.height + bounds2.height) / 2 - Math.abs(dy);

        // 如果水平重叠更小，说明是水平碰撞
        if (overlapX < overlapY) {
            // 考虑速度方向来确定更准确的碰撞方向
            if (obj1.velocity && Math.abs(obj1.velocity.x) > Math.abs(obj1.velocity.y)) {
                return dx > 0 ? Physics.CollisionType.RIGHT : Physics.CollisionType.LEFT;
            } else {
                return dx > 0 ? Physics.CollisionType.RIGHT : Physics.CollisionType.LEFT;
            }
        } else {
            // 垂直碰撞 - 对于玩家-敌人交互特别重要
            if (obj1.velocity && obj1.velocity.y > 0 && dy > 0) {
                // 玩家正在下落且在敌人上方 - 这是从上方击败敌人的情况
                return Physics.CollisionType.TOP;
            } else if (obj1.velocity && obj1.velocity.y < 0 && dy < 0) {
                // 玩家正在上升且在敌人下方
                return Physics.CollisionType.BOTTOM;
            } else {
                // 根据相对位置判断
                return dy > 0 ? Physics.CollisionType.TOP : Physics.CollisionType.BOTTOM;
            }
        }
    }

    /**
     * 解决碰撞（分离对象）
     * @param {GameObject} obj1 - 移动的对象
     * @param {GameObject} obj2 - 被碰撞的对象
     * @param {string} collisionDirection - 碰撞方向
     */
    static resolveCollision(obj1, obj2, collisionDirection) {
        if (!obj1 || !obj2 || collisionDirection === Physics.CollisionType.NONE) {
            return;
        }

        const bounds1 = obj1.getCollisionBounds();
        const bounds2 = obj2.getCollisionBounds();

        switch (collisionDirection) {
            case Physics.CollisionType.TOP:
                // obj1从上方碰撞obj2
                obj1.position.y = bounds2.y - obj1.collisionBounds.height - obj1.collisionBounds.y;
                if (obj1.velocity.y > 0) {
                    obj1.velocity.y = 0;
                }
                break;

            case Physics.CollisionType.BOTTOM:
                // obj1从下方碰撞obj2
                obj1.position.y = bounds2.y + bounds2.height - obj1.collisionBounds.y;
                if (obj1.velocity.y < 0) {
                    obj1.velocity.y = 0;
                }
                break;

            case Physics.CollisionType.LEFT:
                // obj1从左侧碰撞obj2
                obj1.position.x = bounds2.x - obj1.collisionBounds.width - obj1.collisionBounds.x;
                if (obj1.velocity.x > 0) {
                    obj1.velocity.x = 0;
                }
                break;

            case Physics.CollisionType.RIGHT:
                // obj1从右侧碰撞obj2
                obj1.position.x = bounds2.x + bounds2.width - obj1.collisionBounds.x;
                if (obj1.velocity.x < 0) {
                    obj1.velocity.x = 0;
                }
                break;
        }
    }

    /**
     * 弹性碰撞响应
     * @param {GameObject} obj1 - 第一个对象
     * @param {GameObject} obj2 - 第二个对象
     * @param {string} collisionDirection - 碰撞方向
     * @param {number} restitution - 恢复系数（0-1）
     */
    static elasticCollisionResponse(obj1, obj2, collisionDirection, restitution = Physics.BOUNCE_DAMPING) {
        Physics.resolveCollision(obj1, obj2, collisionDirection);

        switch (collisionDirection) {
            case Physics.CollisionType.TOP:
            case Physics.CollisionType.BOTTOM:
                obj1.velocity.y = -obj1.velocity.y * restitution;
                break;

            case Physics.CollisionType.LEFT:
            case Physics.CollisionType.RIGHT:
                obj1.velocity.x = -obj1.velocity.x * restitution;
                break;
        }
    }

    /**
     * 检查对象是否在地面上
     * @param {GameObject} gameObject - 游戏对象
     * @param {Array<GameObject>} platforms - 平台数组
     * @returns {boolean} 是否在地面上
     */
    static isGrounded(gameObject, platforms) {
        if (!gameObject || !platforms || platforms.length === 0) {
            return false;
        }

        // 创建一个稍微向下的测试矩形
        const testBounds = gameObject.getCollisionBounds();
        testBounds.y += 1; // 向下移动1像素进行测试

        for (const platform of platforms) {
            if (!platform || platform === gameObject || platform.destroyed) {
                continue;
            }

            const platformBounds = platform.getCollisionBounds();

            // 检查是否与平台顶部接触
            if (testBounds.x < platformBounds.x + platformBounds.width &&
                testBounds.x + testBounds.width > platformBounds.x &&
                testBounds.y < platformBounds.y + platformBounds.height &&
                testBounds.y + testBounds.height > platformBounds.y) {

                // 确保是从上方接触
                const gameObjectBottom = gameObject.getCollisionBounds().y + gameObject.getCollisionBounds().height;
                const platformTop = platformBounds.y;

                if (Math.abs(gameObjectBottom - platformTop) <= 2) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 平台碰撞检测和响应
     * @param {GameObject} gameObject - 游戏对象
     * @param {Array<GameObject>} platforms - 平台数组
     * @returns {Array} 碰撞信息数组
     */
    static handlePlatformCollisions(gameObject, platforms) {
        if (!gameObject || !platforms || platforms.length === 0) {
            return [];
        }

        const collisions = [];

        for (const platform of platforms) {
            if (!platform || platform === gameObject || platform.destroyed) {
                continue;
            }

            if (Physics.checkAABBCollision(gameObject, platform)) {
                const direction = Physics.getCollisionDirection(gameObject, platform);

                if (direction !== Physics.CollisionType.NONE) {
                    // 解决碰撞
                    Physics.resolveCollision(gameObject, platform, direction);

                    // 记录碰撞信息
                    collisions.push({
                        object: platform,
                        direction: direction,
                        type: 'platform'
                    });

                    // 如果是从上方碰撞平台，标记为着地
                    if (direction === Physics.CollisionType.TOP) {
                        gameObject.isGrounded = true;
                    }
                }
            }
        }

        return collisions;
    }

    /**
     * 边界检测（防止对象离开游戏区域）
     * @param {GameObject} gameObject - 游戏对象
     * @param {Object} bounds - 边界 {x, y, width, height}
     * @returns {Array} 边界碰撞信息
     */
    static handleBoundaryCollisions(gameObject, bounds) {
        if (!gameObject || !bounds) {
            return [];
        }

        const collisions = [];
        const objBounds = gameObject.getCollisionBounds();

        // 左边界
        if (objBounds.x < bounds.x) {
            gameObject.position.x = bounds.x - gameObject.collisionBounds.x;
            if (gameObject.velocity.x < 0) {
                gameObject.velocity.x = 0;
            }
            collisions.push({
                direction: Physics.CollisionType.LEFT,
                type: 'boundary'
            });
        }

        // 右边界
        if (objBounds.x + objBounds.width > bounds.x + bounds.width) {
            gameObject.position.x = bounds.x + bounds.width - objBounds.width - gameObject.collisionBounds.x;
            if (gameObject.velocity.x > 0) {
                gameObject.velocity.x = 0;
            }
            collisions.push({
                direction: Physics.CollisionType.RIGHT,
                type: 'boundary'
            });
        }

        // 上边界
        if (objBounds.y < bounds.y) {
            gameObject.position.y = bounds.y - gameObject.collisionBounds.y;
            if (gameObject.velocity.y < 0) {
                gameObject.velocity.y = 0;
            }
            collisions.push({
                direction: Physics.CollisionType.TOP,
                type: 'boundary'
            });
        }

        // 下边界（通常用于检测掉出屏幕）
        if (objBounds.y > bounds.y + bounds.height) {
            collisions.push({
                direction: Physics.CollisionType.BOTTOM,
                type: 'boundary',
                outOfBounds: true
            });
        }

        return collisions;
    }

    /**
     * 射线投射检测
     * @param {Vector2D} origin - 射线起点
     * @param {Vector2D} direction - 射线方向（单位向量）
     * @param {number} maxDistance - 最大距离
     * @param {Array<GameObject>} objects - 要检测的对象数组
     * @returns {Object|null} 碰撞信息或null
     */
    static raycast(origin, direction, maxDistance, objects) {
        if (!origin || !direction || !objects || objects.length === 0) {
            return null;
        }

        let closestHit = null;
        let closestDistance = maxDistance;

        for (const obj of objects) {
            if (!obj || obj.destroyed || !obj.collisionEnabled) {
                continue;
            }

            const bounds = obj.getCollisionBounds();
            const hit = Physics.raycastAABB(origin, direction, bounds);

            if (hit && hit.distance < closestDistance) {
                closestDistance = hit.distance;
                closestHit = {
                    object: obj,
                    point: hit.point,
                    distance: hit.distance,
                    normal: hit.normal
                };
            }
        }

        return closestHit;
    }

    /**
     * 射线与AABB的交点检测
     * @param {Vector2D} origin - 射线起点
     * @param {Vector2D} direction - 射线方向
     * @param {Object} bounds - AABB边界
     * @returns {Object|null} 交点信息或null
     */
    static raycastAABB(origin, direction, bounds) {
        const invDir = new Vector2D(
            direction.x !== 0 ? 1 / direction.x : Infinity,
            direction.y !== 0 ? 1 / direction.y : Infinity
        );

        const t1 = (bounds.x - origin.x) * invDir.x;
        const t2 = (bounds.x + bounds.width - origin.x) * invDir.x;
        const t3 = (bounds.y - origin.y) * invDir.y;
        const t4 = (bounds.y + bounds.height - origin.y) * invDir.y;

        const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
        const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

        if (tmax < 0 || tmin > tmax) {
            return null;
        }

        const distance = tmin > 0 ? tmin : tmax;
        const point = new Vector2D(
            origin.x + direction.x * distance,
            origin.y + direction.y * distance
        );

        // 计算法向量
        let normal = new Vector2D(0, 0);
        if (Math.abs(point.x - bounds.x) < 0.001) {
            normal.set(-1, 0);
        } else if (Math.abs(point.x - (bounds.x + bounds.width)) < 0.001) {
            normal.set(1, 0);
        } else if (Math.abs(point.y - bounds.y) < 0.001) {
            normal.set(0, -1);
        } else if (Math.abs(point.y - (bounds.y + bounds.height)) < 0.001) {
            normal.set(0, 1);
        }

        return {
            point: point,
            distance: distance,
            normal: normal
        };
    }

    /**
     * 计算两个对象之间的分离向量
     * @param {GameObject} obj1 - 第一个对象
     * @param {GameObject} obj2 - 第二个对象
     * @returns {Vector2D|null} 分离向量或null
     */
    static getSeparationVector(obj1, obj2) {
        if (!Physics.checkAABBCollision(obj1, obj2)) {
            return null;
        }

        const bounds1 = obj1.getCollisionBounds();
        const bounds2 = obj2.getCollisionBounds();

        const overlapX = Math.min(
            bounds1.x + bounds1.width - bounds2.x,
            bounds2.x + bounds2.width - bounds1.x
        );

        const overlapY = Math.min(
            bounds1.y + bounds1.height - bounds2.y,
            bounds2.y + bounds2.height - bounds1.y
        );

        if (overlapX < overlapY) {
            // 水平分离
            const direction = bounds1.x < bounds2.x ? -1 : 1;
            return new Vector2D(overlapX * direction, 0);
        } else {
            // 垂直分离
            const direction = bounds1.y < bounds2.y ? -1 : 1;
            return new Vector2D(0, overlapY * direction);
        }
    }
}

// 导出Physics类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Physics;
} else {
    window.Physics = Physics;
}