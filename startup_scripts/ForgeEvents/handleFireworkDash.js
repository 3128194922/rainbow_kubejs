// priority: 5000
// ==========================================
// 🎆 烟花拳套 - 冲撞击退 & 撞墙伤害处理
// ==========================================
// 命中时登记一次，由服务端调度器在后续 10 tick 施加持续击退速度；
// 撞墙时触发二次伤害。

// 常量（需与 Skillwheel.js 一致）
const FW_GAUNTLET_IMPACT_TICKS = "FireworkDashImpactTicks";
const FW_GAUNTLET_IMPACT_DX = "FireworkDashImpactDx";
const FW_GAUNTLET_IMPACT_DZ = "FireworkDashImpactDz";
const FW_GAUNTLET_IMPACT_DAMAGE = "FireworkDashImpactDamage";
const FW_GAUNTLET_IMPACT_SRC_ID = "FireworkDashImpactSrcId";
const FW_GAUNTLET_IMPACT_KNOCKBACK_TICKS = 10;
const FW_GAUNTLET_IMPACT_KNOCKBACK_SPEED = 2.0;

// 清空实体的冲撞击退数据
function clearFireworkImpact(data) {
    data.remove(FW_GAUNTLET_IMPACT_TICKS);
    data.remove(FW_GAUNTLET_IMPACT_DX);
    data.remove(FW_GAUNTLET_IMPACT_DZ);
    data.remove(FW_GAUNTLET_IMPACT_DAMAGE);
    data.remove(FW_GAUNTLET_IMPACT_SRC_ID);
}

function runFireworkDashImpact(entity, dx, dz, damage, sourceId, remainingTicks) {
    try {
        if (entity === null || !entity.isAlive()) return;
        let data = entity.persistentData;

        // 撞墙检测：水平碰撞 → 二次伤害
        if (entity.horizontalCollision) {
            let source = sourceId ? entity.level.getEntity(sourceId) : null;
            if (source) {
                entity.attack(source.damageSources().playerAttack(source), damage);
            } else {
                entity.attack(entity.damageSources().generic(), damage);
            }
            clearFireworkImpact(data);
            return;
        }

        entity.setDeltaMovement(new Vec3d(
            dx * FW_GAUNTLET_IMPACT_KNOCKBACK_SPEED,
            0.4,
            dz * FW_GAUNTLET_IMPACT_KNOCKBACK_SPEED
        ));
        entity.hurtMarked = true;

        remainingTicks--;
        if (remainingTicks <= 0) {
            clearFireworkImpact(data);
            return;
        }
        data.putInt(FW_GAUNTLET_IMPACT_TICKS, remainingTicks);
        entity.level.server.scheduleInTicks(1, () => {
            runFireworkDashImpact(entity, dx, dz, damage, sourceId, remainingTicks);
        });
    } catch (e) {
        console.log('[烟花拳套] 冲撞击退执行失败: ' + e);
        try { clearFireworkImpact(entity.persistentData); } catch (ignored) {}
    }
}

// 命中时只登记一次，后续 10 tick 由服务端调度器驱动，不再扫描全部 living entity。
global.startFireworkDashImpact = function (entity, dx, dz, damage, sourceId) {
    if (entity === null || !entity.isAlive()) return;
    let data = entity.persistentData;
    data.putInt(FW_GAUNTLET_IMPACT_TICKS, FW_GAUNTLET_IMPACT_KNOCKBACK_TICKS);
    data.putDouble(FW_GAUNTLET_IMPACT_DX, dx);
    data.putDouble(FW_GAUNTLET_IMPACT_DZ, dz);
    data.putFloat(FW_GAUNTLET_IMPACT_DAMAGE, damage);
    data.putInt(FW_GAUNTLET_IMPACT_SRC_ID, sourceId);
    entity.level.server.scheduleInTicks(1, () => {
        runFireworkDashImpact(entity, dx, dz, damage, sourceId, FW_GAUNTLET_IMPACT_KNOCKBACK_TICKS);
    });
}
