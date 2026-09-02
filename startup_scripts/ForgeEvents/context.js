// ForgeEvents 事件上下文：统一缓存一次事件内会重复读取的数据。

// 伤害类型分组：事件上下文只做一次字典查询，处理器直接读取布尔标记。
const FORGE_DAMAGE_TYPE_GROUPS = {
    range: {
        "atmospheric.passionFruitSeed": true,
        "soulBullet": true,
        "arrow": true,
        "lead_bolt": true,
        "create.potato_cannon": true
    },
    thrown: {
        "thrown": true,
        "trident": true,
        "dungeonsdelight.cleaver": true,
        "spirit_dinosaur": true
    },
    magic: {
        "indirectMagic": true,
        "magic": true
    },
    explosion: {
        "explosion.player": true,
        "explosion": true
    },
    fire: {
        "inFire": true,
        "onFire": true,
        "lava": true,
        "hotFloor": true
    },
    hazard: {
        "poison_cloud": true,
        "wither": true
    },
    fall: {
        "fall": true
    },
    starve: {
        "starve": true
    }
};

function isForgeDamageType(damageType, groupName) {
    try {
        if (damageType == null || groupName == null) return false;
        let group = FORGE_DAMAGE_TYPE_GROUPS[groupName];
        return group != null && group[String(damageType)] === true;
    } catch (e) {
        console.log("ForgeEvents 查询伤害类型分组失败: " + e);
        return false;
    }
}

/**
 * 创建伤害事件上下文。
 * 伤害处理函数应优先使用该上下文，避免重复读取 source、实体类型和伤害类型。
 */
function createDamageContext(event) {
    try {
        if (event == null || event.entity == null || event.source == null) return null;

        let victim = event.entity;
        let source = event.source;
        let attacker = source.actual;
        let damageType = null;

        try {
            damageType = String(source.getType());
        } catch (e) {
            console.log("ForgeEvents 获取伤害类型失败: " + e);
        }

        return {
            event: event,
            victim: victim,
            attacker: attacker,
            source: source,
            damageType: damageType,
            isRangeDamage: isForgeDamageType(damageType, "range"),
            isThrownDamage: isForgeDamageType(damageType, "thrown"),
            isMagicDamage: isForgeDamageType(damageType, "magic"),
            isExplosionDamage: isForgeDamageType(damageType, "explosion"),
            isFireDamage: isForgeDamageType(damageType, "fire"),
            isHazardDamage: isForgeDamageType(damageType, "hazard"),
            isFallDamage: isForgeDamageType(damageType, "fall"),
            isStarveDamage: isForgeDamageType(damageType, "starve"),
            victimIsPlayer: victim.isPlayer(),
            attackerIsPlayer: attacker != null && attacker.isPlayer(),
            attackerIsLiving: attacker != null && attacker.isLiving()
        };
    } catch (e) {
        console.log("ForgeEvents 创建伤害上下文失败: " + e);
        return null;
    }
}

/**
 * 创建实体攻击事件上下文，缓存主手、副手和目标实体。
 */
function createAttackContext(event) {
    try {
        if (event == null) return null;

        let attacker = event.getEntity();
        let target = event.getTarget();
        if (attacker == null || target == null) return null;

        return {
            event: event,
            attacker: attacker,
            target: target,
            mainHand: attacker.getItemInHand("main_hand"),
            offHand: attacker.getItemInHand("off_hand")
        };
    } catch (e) {
        console.log("ForgeEvents 创建攻击上下文失败: " + e);
        return null;
    }
}

/**
 * 构建玩家当前饰品索引。
 * 索引只在当前事件上下文中使用，不跨 tick 缓存，避免饰品更换后数据过期。
 */
function buildCurioIndex(player) {
    let index = {};

    try {
        if (player == null || !player.isPlayer()) return index;

        let curios = player.curiosInventory;
        if (curios == null || curios.curios == null) return index;

        for (let slot of curios.curios.values()) {
            if (slot == null || slot.getStacks() == null) continue;

            for (let stack of slot.getStacks().getAllItems()) {
                if (stack == null || stack.isEmpty()) continue;

                let id = String(stack.getId());
                if (index[id] == null) index[id] = stack;
            }
        }
    } catch (e) {
        console.log("ForgeEvents 构建饰品索引失败: " + e);
    }

    return index;
}

/**
 * 从事件上下文中获取指定位置的饰品。
 * 同一角色在一个事件内只构建一次饰品索引。
 */
function getContextCurioStack(context, role, id) {
    try {
        if (context == null || id == null) return null;

        let cacheName = role == "attacker" ? "attackerCurioIndex" : "victimCurioIndex";
        if (context[cacheName] == null) {
            let player = role == "attacker" ? context.attacker : context.victim;
            context[cacheName] = buildCurioIndex(player);
        }

        let stack = context[cacheName][id];
        return stack == null ? null : stack;
    } catch (e) {
        console.log("ForgeEvents 查询缓存饰品失败: " + e);
        return null;
    }
}

/**
 * 判断事件上下文中的角色是否装备指定饰品。
 * 未传入上下文时回退到项目原有 hasCurios，兼容旧调用方。
 */
function hasContextCurio(context, role, player, id) {
    try {
        if (context != null) return getContextCurioStack(context, role, id) != null;
        return hasCurios(player, id);
    } catch (e) {
        console.log("ForgeEvents 判断缓存饰品失败: " + e);
        return false;
    }
}
