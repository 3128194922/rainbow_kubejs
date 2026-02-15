// Priority: 1000

/**
 * MobEffectsVFX 粒子调用帮助脚本
 * 基于 MobEffectsVFX 源码复刻
 * 
 * 使用方法:
 * global.MobEffectsVFX.spawnEffectParticles(entity, r, g, b, isBeneficial)
 */

global.MobEffectsVFX = {
    /**
     * 在实体周围生成粒子效果（完全复刻模组生成逻辑）
     * @param {Internal.Entity} entity - 目标实体
     * @param {number} r - 红色分量 (0-1)
     * @param {number} g - 绿色分量 (0-1)
     * @param {number} b - 蓝色分量 (0-1)
     * @param {boolean} isBeneficial - 是否为增益效果（true=上升粒子, false=下降粒子）
     */
    spawnEffectParticles: function(entity, r, g, b, isBeneficial) {
        if (!entity || !entity.level) return;
        
        let level = entity.level;
        let x = entity.getX();
        let y = entity.getY();
        let z = entity.getZ();
        let particleId = isBeneficial ? "mob_effects_vfx:rising_particles" : "mob_effects_vfx:lowering_particles";
        
        // 辅助函数：生成指定范围内的随机数
        let randomRange = (min, max) => min + (max - min) * Math.random();

        // 这里的 spawnParticles 参数顺序为:
        // (type, force, x, y, z, deltaX, deltaY, deltaZ, speed, count)
        // 关键点：count 必须为 0，这样 deltaX/Y/Z 才会被作为额外参数（颜色）直接发送给客户端，而不是作为随机分布范围。

        // 第一组粒子 (3个)
        // 源码逻辑:
        // x + random(-0.8, 0)
        // y + 1 + random(0, 0.6)
        // z + random(0, 0.8)
        for (let i = 0; i < 3; i++) {
            let px = x + randomRange(-0.8, 0);
            let py = y + 1 + randomRange(0, 0.6);
            let pz = z + randomRange(0, 0.8);
            
            level.spawnParticles(particleId, true, px, py, pz, r, g, b, 1.0, 0);
        }

        // 第二组粒子 (3个)
        // 源码逻辑:
        // x + random(0, 0.8)
        // y + 1 + random(-0.6, 0)
        // z + random(-0.8, 0)
        for (let i = 0; i < 3; i++) {
            let px = x + randomRange(0, 0.8);
            let py = y + 1 + randomRange(-0.6, 0); // 即 0.4 到 1.0
            let pz = z + randomRange(-0.8, 0);
            
            level.spawnParticles(particleId, true, px, py, pz, r, g, b, 1.0, 0);
        }
    }
};

console.info("MobEffectsVFX Helper Loaded (Synced with Mod Logic)");
