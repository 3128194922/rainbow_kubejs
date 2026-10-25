/**
 * 魂火喷火器 × MoreFire 兼容：判定与效果逻辑（事件注册入口见本文件夹 main.js）。
 * ClangingHowl 喷火器（clanginghowl:flamethrower）带 soul_burner 附魔时：
 *   1. 实体被 clanginghowl:fire_stream 伤害点燃 → MoreFire.ignite 附着 rainbow:soul_flame 火焰；
 *   2. 喷火 raycast 放置的 minecraft:fire / minecraft:soul_fire → 替换为 rainbow:soul_flame 方块。
 * 时序说明：LivingHurtEvent 在 hurt() 内部触发，ClangingHowl 随后的 setSecondsOnFire 只延长
 * 燃烧时长，不会破坏 MoreFire 的火焰 ID / 颜色渲染 / 持续燃烧伤害接管（已核对 MoreFireRuntime 源码）。
 */

// 自定义魂火方块 ID（StartupEvents.registry 注册，类型 morefire，见 main.js）
const SOUL_FLAME_FIRE_ID = 'rainbow:soul_flame';
// ClangingHowl 喷火器物品与魂火附魔
const SOUL_FLAMETHROWER_ITEM_ID = 'clanginghowl:flamethrower';
const SOUL_BURNER_ENCHANT_ID = 'clanginghowl:soul_burner';
// 喷火器火焰伤害类型（CHDamageSource.FIRE_STREAM 的 msgId）
const FIRE_STREAM_DAMAGE_TYPE = 'clanginghowl.fire_stream';
// 替换判定半径 12 格（喷火器射程 10 格 + 余量）的平方
const SOUL_FLAMETHROWER_REACH_SQR = 144;
// 需要替换为自定义魂火的方块 ID（ClangingHowl 放火仅产生这两种）
const REPLACEABLE_FIRE_IDS = {
    'minecraft:fire': true,
    'minecraft:soul_fire': true
};

/** 是否为魂火喷火器伤害源（clanginghowl:fire_stream） */
function isFireStreamDamage(damageType) {
    if (damageType == null) return false;
    return String(damageType) == FIRE_STREAM_DAMAGE_TYPE;
}

/** 是否为需要替换的火焰方块 ID */
function shouldReplaceFireBlock(fireId) {
    if (fireId == null) return false;
    return REPLACEABLE_FIRE_IDS[String(fireId)] === true;
}

/** 玩家与火位置的距离平方是否在替换判定半径内 */
function isWithinFlamethrowerRange(distanceSqr) {
    if (distanceSqr == null) return false;
    return distanceSqr <= SOUL_FLAMETHROWER_REACH_SQR;
}

// —— 以下为 Java 对象交互，全部惰性解析并缓存（保证本文件可在 node vm 测试中加载）——

// 附魔 / 物品 / 方块对象缓存（首次使用时从注册表解析）
let soulBurnerEnchant = null;
let flamethrowerItem = null;
let soulFlameBlock = null;
let soulFlameBlockState = null;

/** 惰性解析魂火附魔（soul_burner）对象 */
function getSoulBurnerEnchant() {
    if (soulBurnerEnchant == null) {
        soulBurnerEnchant = ForgeRegistries.ENCHANTMENTS.getValue(new ResourceLocation('clanginghowl', 'soul_burner'));
        if (soulBurnerEnchant == null) {
            console.log('[魂火喷火器] 未找到附魔: ' + SOUL_BURNER_ENCHANT_ID);
        }
    }
    return soulBurnerEnchant;
}

/** 惰性解析喷火器物品对象 */
function getFlamethrowerItem() {
    if (flamethrowerItem == null) {
        flamethrowerItem = ForgeRegistries.ITEMS.getValue(new ResourceLocation('clanginghowl', 'flamethrower'));
        if (flamethrowerItem == null) {
            console.log('[魂火喷火器] 未找到物品: ' + SOUL_FLAMETHROWER_ITEM_ID);
        }
    }
    return flamethrowerItem;
}

/** 惰性解析自定义魂火方块与其默认方块状态 */
function getSoulFlameBlockState() {
    if (soulFlameBlockState == null) {
        soulFlameBlock = ForgeRegistries.BLOCKS.getValue(new ResourceLocation('rainbow', 'soul_flame'));
        if (soulFlameBlock == null) {
            console.log('[魂火喷火器] 未找到方块: ' + SOUL_FLAME_FIRE_ID);
            return null;
        }
        soulFlameBlockState = soulFlameBlock.defaultBlockState();
    }
    return soulFlameBlockState;
}

/**
 * 物品是否为带 soul_burner 附魔的 ClangingHowl 喷火器。
 * @param {Internal.ItemStack} stack 待判定物品
 * @returns {boolean}
 */
function isSoulFlamethrowerStack(stack) {
    try {
        if (stack == null || stack.isEmpty()) return false;
        let item = getFlamethrowerItem();
        if (item == null || stack.getItem() != item) return false;
        let enchant = getSoulBurnerEnchant();
        if (enchant == null) return false;
        return stack.getEnchantmentLevel(enchant) > 0;
    } catch (e) {
        console.log('[魂火喷火器] 判定喷火器失败: ' + e);
        return false;
    }
}

/**
 * 为实体附着 rainbow:soul_flame 火焰（存在性校验后调用 MoreFire.ignite）。
 * @param {Internal.Entity} target 目标实体
 * @param {number} ticks 燃烧 tick 数
 */
function igniteSoulFlame(target, ticks) {
    try {
        if (target == null || target.level.isClientSide()) return;
        if (!MoreFire.exists(SOUL_FLAME_FIRE_ID)) {
            console.log('[魂火喷火器] 未找到火焰定义: ' + SOUL_FLAME_FIRE_ID);
            return;
        }
        MoreFire.ignite(target, SOUL_FLAME_FIRE_ID, ticks);
    } catch (e) {
        console.log('[魂火喷火器] 附着火焰失败(' + SOUL_FLAME_FIRE_ID + '): ' + e);
    }
}

/**
 * LivingHurtEvent：魂火喷火器灼烧目标时，为目标附着自定义魂火。
 * @param {Internal.LivingHurtEvent} event
 */
function handleSoulFlamethrowerHurt(event) {
    try {
        let source = event.source;
        if (source == null) return;
        if (!isFireStreamDamage(String(source.getType()))) return;
        // fireStream 的直接实体即持喷火器者（KubeJS 将 DamageSource.getEntity 重映射为 actual，原方法名不可用）
        let attacker = source.actual;
        if (attacker == null) return;
        if (!isSoulFlamethrowerStack(attacker.getMainHandItem())) return;
        igniteSoulFlame(event.entity, 160);
    } catch (e) {
        console.log('[魂火喷火器] LivingHurt 处理出错: ' + e);
    }
}

/**
 * NeighborNotifyEvent：魂火喷火器点燃的方块火替换为 rainbow:soul_flame。
 * ClangingHowl 用 setBlockAndUpdate 放火（无专用放置事件），本事件是服务端可靠钩子；
 * 事件高频触发，第一行做 O(1) 火焰类型过滤。
 * @param {Internal.BlockEvent$NeighborNotifyEvent} event
 */
function handleSoulFlamethrowerFirePlace(event) {
    try {
        let state = event.state;
        if (state == null) return;
        if (!shouldReplaceFireBlock(String(ForgeRegistries.BLOCKS.getKey(state.getBlock())))) return;
        let level = event.level;
        // NeighborNotifyEvent 仅在服务端触发，getLevel() 返回 LevelAccessor，判定 ServerLevel 后才能取玩家列表
        if (level == null || !(level instanceof ServerLevel)) return;
        // KubeJS 的 ServerLevelMixin 隐藏了 players() 方法，改走 PlayerList.getPlayers()
        let players = level.getServer().getPlayerList().getPlayers();
        let pos = event.pos;
        // 火位置附近必须存在正在使用魂火喷火器的玩家，避免误替换其他来源的火
        let hasSoulFlamethrowerUser = false;
        for (let player of players) {
            if (player == null || !player.isUsingItem()) continue;
            if (!isSoulFlamethrowerStack(player.getMainHandItem())) continue;
            let dx = player.getX() - (pos.getX() + 0.5);
            let dy = player.getY() - (pos.getY() + 0.5);
            let dz = player.getZ() - (pos.getZ() + 0.5);
            if (!isWithinFlamethrowerRange(dx * dx + dy * dy + dz * dz)) continue;
            hasSoulFlamethrowerUser = true;
            break;
        }
        if (!hasSoulFlamethrowerUser) return;
        // 替换前校验自定义魂火能否在该位置存活（ClangingHowl 的 isAir 分支未做 canSurvive 检查，
        // 悬空位置跳过替换、保留原版火，避免火放置后立即消失）
        let soulFlameState = getSoulFlameBlockState();
        if (soulFlameState == null) return;
        if (!soulFlameState.canSurvive(level, pos)) return;
        level.setBlock(pos, soulFlameState, 3);
    } catch (e) {
        console.log('[魂火喷火器] NeighborNotify 处理出错: ' + e);
    }
}
