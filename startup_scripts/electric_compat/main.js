// priority: 5500
// 电系伤害统一兼容层：
// 1. 数据包把整合包内的电系伤害类型并入 #minecraft:is_lightning，使灾变潮湿增伤生效。
// 2. 对没有使用 lightning 伤害类型的 eeeabsmobs 电系弹体/电涌做兜底：
//    补上潮湿增伤，并给命中目标附着 eeeabsmobs:electrified_effect（感电）。
// 3. 感电目标再受到火焰伤害时，由 eeeabsmobs 自身逻辑触发超载爆炸，实现电火联动。

// 已知电系伤害类型的 message_id / 注册路径两种形态都兜底，避免标签重载顺序造成漏判。
const ELECTRIC_COMPAT_DAMAGE_TYPES = {
    'cataclysm.lightning': true,
    'cataclysm:lightning': true,
    'cataclysm.storm_bringer': true,
    'cataclysm:storm_bringer': true,
    'cataclysm:player_ceraunus': true,
    'cataclysm.emp': true,
    'cataclysm:emp': true,
    'clanginghowl.lightning': true,
    'clanginghowl:lightning': true,
    'death.attack.mysticartifacts.lightning_bottle_chain': true,
    'mysticartifacts:lightning_bottle_chain': true,
    'lightning_bottle_chain': true
};

// 直接实体兜底：这些 eeeabsmobs 电系攻击没有专用 lightning damage_type，
// 仍需要吃到潮湿增伤并附着感电。
const ELECTRIC_COMPAT_DIRECT_ENTITIES = {
    'minecraft:lightning_bolt': true,
    'eeeabsmobs:electromagnetic': true,
    'eeeabsmobs:surge': true,
    'eeeabsmobs:pulsed_grenade': true,
    'eeeabsmobs:doombolt_axe': true,
    'cataclysm:player_ceraunus': true,
    'cataclysm:lightning_spear': true,
    'cataclysm:brontes': true,
    'cataclysm:storm_serpent': true
};

// 依伤害类型区分的直接实体：铳械的连锁闪电复用 bullet 实体，
// 但只有 indirectMagic / magic 这一段才是电，普通子弹伤害不能误判。
const ELECTRIC_COMPAT_MAGIC_ENTITIES = {
    'irons_artifice:bullet': true
};

// 观察者所有攻击都以电为主，但部分范围电击使用 mobAttack，无法从伤害类型或直接实体识别。
const ELECTRIC_COMPAT_ATTACKER_ENTITIES = {
    'eeeabsmobs:relic_observer': true
};

const ELECTRIC_COMPAT_ELECTRIFIED_ID = 'eeeabsmobs:electrified_effect';
const ELECTRIC_COMPAT_WETNESS_ID = 'cataclysm:wetness';
const ELECTRIC_COMPAT_ELECTRIFIED_DURATION = 200;
const ELECTRIC_COMPAT_EFFECTS = {
    electrified: null,
    wetness: null
};

function electricCompatGetEffect(cacheKey, namespace, path) {
    try {
        if (ELECTRIC_COMPAT_EFFECTS[cacheKey] != null) return ELECTRIC_COMPAT_EFFECTS[cacheKey];
        let effect = ForgeRegistries.MOB_EFFECTS.getValue(new ResourceLocation(namespace, path));
        ELECTRIC_COMPAT_EFFECTS[cacheKey] = effect;
        return effect;
    } catch (e) {
        console.log('[电系兼容] 读取效果失败(' + namespace + ':' + path + '): ' + e);
        return null;
    }
}

function electricCompatGetElectrifiedEffect() {
    let parts = ELECTRIC_COMPAT_ELECTRIFIED_ID.split(':');
    return electricCompatGetEffect('electrified', parts[0], parts[1]);
}

function electricCompatGetWetnessEffect() {
    let parts = ELECTRIC_COMPAT_WETNESS_ID.split(':');
    return electricCompatGetEffect('wetness', parts[0], parts[1]);
}

/**
 * 判断一次伤害是否属于电系。
 * 优先使用 #minecraft:is_lightning 标签；标签未覆盖时再按 message_id、
 * 直接实体类型和观察者攻击者做兜底。
 */
function electricCompatIsElectricSource(source) {
    try {
        if (source == null) return false;
        if (source.is(DamageTypeTags.IS_LIGHTNING)) return true;

        let damageType = String(source.getType());
        if (ELECTRIC_COMPAT_DAMAGE_TYPES[damageType] === true) return true;

        let direct = source.getImmediate();
        if (direct != null) {
            let directType = String(direct.getType());
            if (ELECTRIC_COMPAT_DIRECT_ENTITIES[directType] === true) return true;
            if (ELECTRIC_COMPAT_MAGIC_ENTITIES[directType] === true
                && (damageType == 'indirectMagic' || damageType == 'indirect_magic' || damageType == 'magic')) {
                return true;
            }
        }

        let attacker = source.getActual();
        if (attacker != null) {
            let attackerType = String(attacker.getType());
            if (ELECTRIC_COMPAT_ATTACKER_ENTITIES[attackerType] === true) return true;
        }

        return false;
    } catch (e) {
        console.log('[电系兼容] 判定电系伤害失败: ' + e);
        return false;
    }
}

/**
 * 灾变潮湿增伤默认只处理 #minecraft:is_lightning。
 * 对 eeeabsmobs 的通用伤害类型（magic / mobAttack / bypass_shield）在这里按同一公式补算，
 * 已带 lightning 标签的伤害跳过，避免与灾变自身处理器重复乘算。
 */
function electricCompatApplyWetnessBonus(event, victim, source) {
    try {
        if (source.is(DamageTypeTags.IS_LIGHTNING)) return;

        let wetness = electricCompatGetWetnessEffect();
        if (wetness == null || !victim.hasEffect(wetness)) return;

        let instance = victim.getEffect(wetness);
        if (instance == null) return;

        let amount = event.getAmount();
        let multiplier = 1.0 + (instance.getAmplifier() + 1) * 0.2;
        event.setAmount(amount * multiplier);
    } catch (e) {
        console.log('[电系兼容] 潮湿增伤兜底失败: ' + e);
    }
}

/**
 * 给电系伤害的受击者附着 eeeabsmobs 感电。
 * 持续时间与 eeeabsmobs 自身电磁脉冲一致（200 tick，0 级）。
 */
function electricCompatApplyElectrified(victim) {
    try {
        let electrified = electricCompatGetElectrifiedEffect();
        if (electrified == null) return;

        let instance = new MobEffectInstance(
            electrified,
            ELECTRIC_COMPAT_ELECTRIFIED_DURATION,
            0,
            false,
            false,
            true
        );
        victim.addEffect(instance);
    } catch (e) {
        console.log('[电系兼容] 附着感电失败: ' + e);
    }
}

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDamageEvent', event => {
    try {
        if (event == null || event.isCanceled()) return;
        if (!(event.getAmount() > 0)) return;

        let victim = event.getEntity();
        let source = event.getSource();
        if (victim == null || source == null) return;
        if (victim.level.isClientSide()) return;

        if (!electricCompatIsElectricSource(source)) return;

        electricCompatApplyWetnessBonus(event, victim, source);
        electricCompatApplyElectrified(victim);
    } catch (e) {
        console.log('[电系兼容] LivingDamageEvent 入口出错: ' + e);
    }
});
