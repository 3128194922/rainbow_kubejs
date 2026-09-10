// 盾反击退配置：基础击飞距离 3 格，玩家每 1 点攻击击退属性额外增加 0.5 格。
// 修改此常量后需要重启游戏，让 startup_scripts 重新加载。
const SHIELD_PARRY_KNOCKBACK_BASE_BLOCKS = 3.0;
const SHIELD_PARRY_KNOCKBACK_PER_ATTR_POINT = 0.5;

// 根据玩家的攻击击退属性计算水平击飞距离（以速度形式应用）。
function calculateShieldParryKnockbackSpeed(player) {
    try {
        if (player == null) return SHIELD_PARRY_KNOCKBACK_BASE_BLOCKS;

        // 攻击击退属性（minecraft:generic.attack_knockback），玩家默认 0 点。
        let knockbackAttr = 0;
        let attribute = player.getAttribute("minecraft:generic.attack_knockback");
        if (attribute != null) {
            knockbackAttr = attribute.getValue();
        }
        if (!(knockbackAttr > 0)) knockbackAttr = 0;

        return SHIELD_PARRY_KNOCKBACK_BASE_BLOCKS + knockbackAttr * SHIELD_PARRY_KNOCKBACK_PER_ATTR_POINT;
    } catch (e) {
        console.log("计算盾反击退速度出现问题：");
        console.log(e);
        return SHIELD_PARRY_KNOCKBACK_BASE_BLOCKS;
    }
}

// 供同一 startup_scripts 生命周期下的盾反主入口调用，也便于离线行为测试。
global.calculateShieldParryKnockbackSpeed = calculateShieldParryKnockbackSpeed;
