// priority: 1000

/**
 * Tide Mod Time Stop Utility
 * 基于 Tide-2-main 源码分析
 * 
 * 实现原理:
 * 1. 核心接口: com.li64.tide.data.FreezableMob
 * 2. 核心方法: tide$setFrozen(boolean), tide$isFrozen()
 * 3. 混合(Mixin): MobMixin 注入到 Mob 类，拦截 tick() 方法
 */

const FreezableMob = Java.loadClass('com.li64.tide.data.FreezableMob');

global.TideUtil = {
    /**
     * 检查生物是否被冻结
     * @param {Internal.LivingEntity} entity 
     * @returns {boolean}
     */
    isFrozen: (entity) => {
        // 解包 KubeJS 包装器，获取原生实体
        let realEntity = entity.minecraftEntity || entity;
        
        if (realEntity instanceof FreezableMob) {
            return realEntity.tide$isFrozen();
        }
        return false;
    },

    /**
     * 设置生物冻结状态
     * @param {Internal.LivingEntity} entity 
     * @param {boolean} frozen 
     */
    setFrozen: (entity, frozen) => {
        let realEntity = entity.minecraftEntity || entity;
        
        if (realEntity instanceof FreezableMob) {
            realEntity.tide$setFrozen(frozen);
        } else {
            console.warn(`Entity ${entity} does not implement FreezableMob`);
        }
    },

    /**
     * 切换冻结状态（带音效和粒子，模拟怀表行为）
     * @param {Internal.LivingEntity} entity 
     * @param {Internal.Level} level 
     */
    toggleFreeze: (entity, level) => {
        let realEntity = entity.minecraftEntity || entity;
        
        if (realEntity instanceof FreezableMob) {
            if (realEntity.tide$isFrozen()) {
                // 解冻
                realEntity.tide$setFrozen(false);
            } else {
                // 冻结
                realEntity.tide$setFrozen(true);
                
                // 播放音效 (参考 EnchantedPocketWatchItem)
                // ELDER_GUARDIAN_CURSE
                if (level) {
                    level.playSound(null, entity.blockPosition(), 'entity.elder_guardian.curse', 'players', 0.8, 0.9);
                }
                
                // 粒子效果通常在客户端生成，服务端脚本可能无法直接生成复杂的魔法粒子
                // 但可以使用 server.runCommand 或 spawnParticles
            }
        }
    },

    /**
     * 解除生物冻结（恢复时间）
     * @param {Internal.LivingEntity} entity 
     */
    unfreeze: (entity) => {
        let realEntity = entity.minecraftEntity || entity;
        if (realEntity instanceof FreezableMob) {
            realEntity.tide$setFrozen(false);
        }
    },

    /**
     * 恢复范围内所有生物的时间（群体解冻）
     * @param {Internal.Level} level 
     * @param {Internal.Vec3} centerPos 中心坐标
     * @param {number} radius 半径
     * @returns {number} 解冻的生物数量
     */
    resumeArea: (level, centerPos, radius) => {
        // 动态加载 AABB 以防全局未定义
        const AABB = Java.loadClass('net.minecraft.world.phys.AABB');
        
        let count = 0;
        let aabb = AABB.of(
            centerPos.x - radius, centerPos.y - radius, centerPos.z - radius,
            centerPos.x + radius, centerPos.y + radius, centerPos.z + radius
        );
        
        // 获取范围内所有生物
        let entities = level.getEntitiesWithin(aabb);
        
        entities.forEach(entity => {
            let realEntity = entity.minecraftEntity || entity;
            if (realEntity instanceof FreezableMob && realEntity.tide$isFrozen()) {
                realEntity.tide$setFrozen(false);
                count++;
            }
        });
        
        return count;
    }
};

console.info('TideUtil loaded successfully.');
