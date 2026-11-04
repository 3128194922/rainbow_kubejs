// ForgeEvents 事件上下文：统一缓存伤害事件链中会重复读取的数据。
// 玩家饰品索引按维度和 tick 复用，避免多弹丸同步伤害反复扫描，并在下一 tick 丢弃旧玩家引用。
const FORGE_CURIO_INDEX_CACHE = {};

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
 * 扫描玩家当前饰品并构建索引；调用方按玩家 tick 缓存扫描结果。
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
 * 获取当前 tick 可复用的玩家饰品索引；下一 tick 自动重建，饰品更换不会跨 tick 读取旧数据。
 */
function getForgeCurioIndex(player) {
    try {
        if (player == null || !player.isPlayer()) return {};
        let level = player.level;
        let dimensionKey = String(level.dimension);
        let tick = level.getTime();
        let dimensionCache = FORGE_CURIO_INDEX_CACHE[dimensionKey];
        if (dimensionCache == null || dimensionCache.tick != tick) {
            dimensionCache = {tick: tick, players: {}};
            FORGE_CURIO_INDEX_CACHE[dimensionKey] = dimensionCache;
        }
        let playerKey = String(player.getUuid());
        let index = dimensionCache.players[playerKey];
        if (index != null) return index;
        index = buildCurioIndex(player);
        dimensionCache.players[playerKey] = index;
        return index;
    } catch (e) {
        console.log("ForgeEvents 获取当前tick饰品缓存失败: " + e);
        return buildCurioIndex(player);
    }
}

/**
 * 从事件上下文中获取指定位置的饰品。
 * 同一角色在一个 tick 内只扫描一次饰品栏，事件上下文仍保留本地索引引用。
 */
function getContextCurioStack(context, role, id) {
    try {
        if (context == null || id == null) return null;

        let cacheName = role == "attacker" ? "attackerCurioIndex" : "victimCurioIndex";
        if (context[cacheName] == null) {
            let player = role == "attacker" ? context.attacker : context.victim;
            context[cacheName] = getForgeCurioIndex(player);
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
