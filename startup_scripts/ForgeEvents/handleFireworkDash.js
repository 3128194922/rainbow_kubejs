// priority: 5000
// ==========================================
// 🎆 烟花拳套 - 冲撞击退 & 撞墙伤害处理
// ==========================================
// 由 LivingTickEvent 检测被冲刺击飞的实体，
// 施加持续击退速度，撞墙时触发二次伤害

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

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingEvent$LivingTickEvent', event => {
    let entity = event.entity;
    if (entity.level.isClientSide()) return;

    let data = entity.persistentData;
    let impactTicks = data.getInt(FW_GAUNTLET_IMPACT_TICKS);
    if (impactTicks <= 0) return;

    // 撞墙检测：水平碰撞 → 二次伤害
    if (entity.horizontalCollision) {
        let sourceId = data.getInt(FW_GAUNTLET_IMPACT_SRC_ID);
        let source = sourceId ? entity.level.getEntity(sourceId) : null;
        let wallDmg = data.getFloat(FW_GAUNTLET_IMPACT_DAMAGE);
        if (source) {
            entity.attack(source.damageSources().playerAttack(source), wallDmg);
        } else {
            entity.attack(entity.damageSources().generic(), wallDmg);
        }
        clearFireworkImpact(data);
        return;
    }

    // 持续击退速度
    let dx = data.getDouble(FW_GAUNTLET_IMPACT_DX);
    let dz = data.getDouble(FW_GAUNTLET_IMPACT_DZ);
    entity.setDeltaMovement(new Vec3d(dx * FW_GAUNTLET_IMPACT_KNOCKBACK_SPEED, 0.4, dz * FW_GAUNTLET_IMPACT_KNOCKBACK_SPEED));
    entity.hurtMarked = true;

    impactTicks--;
    if (impactTicks <= 0) {
        clearFireworkImpact(data);
    } else {
        data.putInt(FW_GAUNTLET_IMPACT_TICKS, impactTicks);
    }
});
