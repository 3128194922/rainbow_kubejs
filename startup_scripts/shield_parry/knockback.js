// 盾反击退配置：每多少点被格挡伤害换算为一格水平击退速度。
// 修改此常量后需要重启游戏，让 startup_scripts 重新加载。
const SHIELD_PARRY_KNOCKBACK_DAMAGE_PER_BLOCK = 5.0;

// 将盾反伤害换算为水平击退速度，避免沿用 shiledattack 的碰撞体积公式。
function calculateShieldParryKnockbackSpeed(blockedDamage) {
    try {
        if (blockedDamage == null) return 0;

        let damage = blockedDamage * 1.0;
        if (!(damage > 0)) return 0;

        return damage / SHIELD_PARRY_KNOCKBACK_DAMAGE_PER_BLOCK;
    } catch (e) {
        console.log("计算盾反击退速度出现问题：");
        console.log(e);
        return 0;
    }
}

// 供同一 startup_scripts 生命周期下的盾反主入口调用，也便于离线行为测试。
global.calculateShieldParryKnockbackSpeed = calculateShieldParryKnockbackSpeed;
