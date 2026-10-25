// priority: 6000
// 伤害流派共用入口：只允许向下派生，保存/恢复每次独立命中的无敌帧。
const REBALANCE_HITS = [];
const REBALANCE_NO_KNOCKBACK = {};
const REBALANCE_DOT_EFFECTS = {
    'minecraft:poison': 'effect.minecraft.poison',
    'minecraft:wither': 'effect.minecraft.wither',
    'attributeslib:bleeding': 'effect.attributeslib.bleeding',
    'runiclib:venom': 'effect.runiclib.venom'
};
// 雷电瓶连锁 zap 的伤害类型串（mod 端 ModDamageTypes.LIGHTNING_BOTTLE_CHAIN，连锁 zap 与雷场共用）。
// KubeJS 的 source.getType() 经 DamageSourceMixin 映射到原版 getMsgId()，返回伤害类型 JSON 的 message_id；
// 当前 mod 端 message_id 写的是完整死亡翻译键，故同时兜底注册路径与裸 id 两种形态。
const REBALANCE_BOTTLE_ZAP_TYPES = [
    'death.attack.mysticartifacts.lightning_bottle_chain',
    'mysticartifacts:lightning_bottle_chain',
    'lightning_bottle_chain'
];

// 雷电瓶连锁 zap 判定：zap 由 mod 直接结算，不经 rebalanceDealDamage 登记（REBALANCE_HITS 无记录），
// 若不拦截会被流派矩阵视为 root 而触发三件套派生，派生伤害归属玩家又满足 mod 连锁条件，
// 与连锁互相触发形成指数递归（2026-10-25 服务器崩溃根因）。
// 原版闪电/其他来源不会命中这三种类型串，无误判。
function rebalanceIsBottleZap(context) {
    if (context == null || context.damageType == null) return false;
    for (let i = 0; i < REBALANCE_BOTTLE_ZAP_TYPES.length; i++) {
        if (context.damageType == REBALANCE_BOTTLE_ZAP_TYPES[i]) return true;
    }
    return false;
}

function rebalanceActiveHit(victim, source) {
    if (victim == null) return null;
    let key = String(victim.getUuid());
    for (let i = REBALANCE_HITS.length - 1; i >= 0; i--) {
        let hit = REBALANCE_HITS[i];
        if (hit.victimKey == key && (source == null || hit.source.equals(source))) return hit;
    }
    return null;
}

// 此矩阵同时限制根命中之外的所有派生，防止吐根/饮料/十字架互相递归。
function rebalanceCanProc(kind, proc) {
    if (kind == 'share' || kind == 'unholy') return false;
    if (proc == 'holy') return kind == 'root';
    if (proc == 'kinetic') return kind == 'root' || kind == 'holy';
    if (proc == 'lpecac') return kind == 'root' || kind == 'holy' || kind == 'kinetic';
    return proc == 'unholy';
}

function rebalanceDamageSource(victim, attacker, type) {
    let registry = victim.level.registryAccess().registryOrThrow(Registries.DAMAGE_TYPE);
    let holder = registry.getHolderOrThrow(ResourceKey.create(Registries.DAMAGE_TYPE, new ResourceLocation('rainbow', type)));
    // 分摊不归属实体，避免同队 PvP 拦截和误触发攻击者法球。
    return attacker == null ? new DamageSource(holder) : new DamageSource(holder, attacker, attacker);
}

function rebalanceDealDamage(attacker, victim, type, amount, kind, parent, noKnockback) {
    if (victim == null || !victim.isAlive() || !(amount > 0)) return false;
    let key = String(victim.getUuid());
    let previousTime = victim.invulnerableTime;
    let lastField = null;
    let lastAmount = null;
    let previousNoKnockback = REBALANCE_NO_KNOCKBACK[key];
    let pushed = false;
    try {
        lastField = getUnholyCrossLastHurtField(victim);
        if (lastField != null) lastAmount = lastField.getFloat(victim);
        let source = rebalanceDamageSource(victim, attacker, type);
        REBALANCE_HITS.push({victimKey: key, source: source, kind: kind, parent: parent, procced: false});
        pushed = true;
        if (noKnockback) REBALANCE_NO_KNOCKBACK[key] = true;
        victim.invulnerableTime = 0;
        return victim.attack(source, amount) === true;
    } catch (e) {
        console.log('[流派伤害] ' + type + ' 独立命中失败: ' + e);
        return false;
    } finally {
        if (pushed) REBALANCE_HITS.pop();
        victim.invulnerableTime = previousTime;
        if (previousNoKnockback == null) delete REBALANCE_NO_KNOCKBACK[key];
        else REBALANCE_NO_KNOCKBACK[key] = previousNoKnockback;
        if (lastField != null && lastAmount != null) {
            try { lastField.setFloat(victim, lastAmount); }
            catch (e) { console.log('[流派伤害] 还原lastHurt失败: ' + e); }
        }
    }
}

function rebalanceSplitDamage(event, attacker, victim, source, context) {
    // 雷电瓶连锁 zap 不参与神圣三段分裂：分裂产生的玩家归属派生会再次满足 mod 连锁条件形成递归。
    if (rebalanceIsBottleZap(context)) return false;
    if (attacker == null || !attacker.isPlayer() || !(event.getAmount() > 0)) return false;
    if (rebalanceActiveHit(victim, source) != null) return false;
    if (!hasContextCurio(context, 'attacker', attacker, 'rainbow:holy_cross')) return false;
    let amount = event.getAmount();
    // 原事件不再扣血；物理、法术、真实伤害各按原始伤害的20%结算，各自过对应防御且不重复应用攻击方加成。
    event.setAmount(0);
    rebalanceDealDamage(attacker, victim, 'holy_physical', amount * 0.2, 'holy', context);
    rebalanceDealDamage(attacker, victim, 'holy_magic', amount * 0.2, 'holy', context);
    rebalanceDealDamage(attacker, victim, 'holy_true', amount * 0.2, 'holy', context);
    return true;
}

function rebalanceDotMultiplier(victim, source, attacker) {
    try {
        // KubeJS-only 判别原版DOT：中毒使用magic伤害源，要求无攻击者且到达药水伤害刻。
        // getType() 经 DamageSourceMixin 映射到原版 getMsgId()；本项目包装不暴露 getMsgId，原写法每次都会抛 TypeError 致化学反应失效。
        if (victim == null || source == null) return 1;
        let messageId = String(source.getType());
        let sourceType = String(source.getType());
        let effects = victim.getActiveEffects();
        let activeIds = {};
        for (let effect of effects) {
            let description = String(effect.getDescriptionId());
            for (let id in REBALANCE_DOT_EFFECTS) {
                if (description == REBALANCE_DOT_EFFECTS[id]) activeIds[id] = effect;
            }
        }
        let poison = activeIds['minecraft:poison'];
        let wither = activeIds['minecraft:wither'];
        let poisonTick = attacker == null && messageId == 'magic' && poison != null && poison.getDuration() % 25 == 0;
        let witherTick = (messageId == 'wither' || sourceType == 'wither') && wither != null && wither.getDuration() % 40 == 0;
        let sourceDot = messageId == 'runiclib:venom' || sourceType == 'runiclib:venom'
            || messageId == 'attributeslib:bleeding' || sourceType == 'attributeslib:bleeding';
        if (!poisonTick && !witherTick && !sourceDot) return 1;
        let count = 0;
        let kinds = 0;
        for (let effect of effects) {
            let description = String(effect.getDescriptionId());
            for (let id in REBALANCE_DOT_EFFECTS) {
                if (description == REBALANCE_DOT_EFFECTS[id]) {
                    count += effect.getAmplifier() + 1;
                    kinds++;
                    break;
                }
            }
        }
        return kinds >= 2 ? 1 + count * 0.5 : 1;
    } catch (e) {
        console.log('[化学反应] 读取DOT失败: ' + e);
        return 1;
    }
}


function rebalanceIsAlly(player, entity) {
    if (player == entity || String(player.getUuid()) == String(entity.getUuid())) return true;
    let team = player.getTeam();
    let other = entity.getTeam();
    if (team != null && other != null && String(team.getName()) != 'white' && String(team.getName()) == String(other.getName())) return true;
    if (typeof entity.getOwner == 'function') {
        let owner = entity.getOwner();
        if (owner != null && String(owner.getUuid()) == String(player.getUuid())) return true;
    }
    return false;
}

// 普通 attack 也会触发 LivingKnockBackEvent；同步命中期间直接取消击退，不发送补偿运动包。
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingKnockBackEvent', event => {
    try {
        if (REBALANCE_NO_KNOCKBACK[String(event.getEntity().getUuid())]) event.setCanceled(true);
    } catch (e) { console.log('[流派伤害] 无击退处理失败: ' + e); }
});

function rebalanceAoe(player, x, y, z, radius, damage, type, kind, parent) {
    try {
        let area = new AABB(x - radius, y - radius, z - radius, x + radius, y + radius, z + radius);
        for (let target of player.level.getEntitiesWithin(area)) {
            if (target == null || !target.isLiving() || !target.isAlive() || rebalanceIsAlly(player, target)) continue;
            let dx = target.getX() - x;
            let dy = target.getY() - y;
            let dz = target.getZ() - z;
            if (dx * dx + dy * dy + dz * dz > radius * radius) continue;
            rebalanceDealDamage(player, target, type, damage, kind, parent, true);
        }
    } catch (e) { console.log('[流派AOE] 执行失败: ' + e); }
}

function rebalanceProcDamage(event, attacker, victim, source, context) {
    try {
        // 雷电瓶连锁 zap 不触发法球/吐根/亵渎派生：派生伤害归属玩家，会再次触发 mod 连锁形成递归。
        if (rebalanceIsBottleZap(context)) return;
        if (!(event.getAmount() > 0) || attacker == null || !attacker.isPlayer()) return;
        let hit = rebalanceActiveHit(victim, source);
        let kind = hit == null ? 'root' : hit.kind;
        if (hit != null) {
            if (hit.procced) return;
            hit.procced = true;
        }
        if (rebalanceCanProc(kind, 'kinetic') && hasContextCurio(context, 'attacker', attacker, 'rainbow:ice_tea')) {
            let bonus = Math.max(0, attacker.getAttributeValue('oreganized:kinetic_damage')) * 0.3;
            rebalanceDealDamage(attacker, victim, 'kinetic_orb', bonus, 'kinetic', hit);
        }
        if (rebalanceCanProc(kind, 'lpecac') && hasContextCurio(context, 'attacker', attacker, 'rainbow:lpecac')
            && !attacker.cooldowns.isOnCooldown('rainbow:lpecac')) {
            attacker.cooldowns.addCooldown('rainbow:lpecac', 3);
            let damage = Math.max(0, attacker.getAttributeValue('rainbow:generic.boom_damage'));
            // AOE 爆炸特效：在目标位置播放爆炸音效与粒子；特效单独 try-catch，失败不中断伤害派生链
            try {
                attacker.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), 'minecraft:entity.generic.explode', 'players', 2.0, 1.0);
                attacker.level.spawnParticles('minecraft:explosion_emitter', true, victim.getX(), victim.getY() + 0.5, victim.getZ(), 0.1, 0.1, 0.1, 1, 0);
                attacker.level.spawnParticles('minecraft:poof', true, victim.getX(), victim.getY() + 0.5, victim.getZ(), 0.5, 0.5, 0.5, 10, 0.05);
            } catch (e) { console.log('[法球派生] lpecac 爆炸特效失败: ' + e); }
            rebalanceAoe(attacker, victim.getX(), victim.getY(), victim.getZ(), 3, damage, 'lpecac_aoe', 'lpecac', hit);
        }
        if (rebalanceCanProc(kind, 'unholy') && hasContextCurio(context, 'attacker', attacker, 'rainbow:unholy_cross')) {
            rebalanceDealDamage(attacker, victim, 'unholy_cross', 1, 'unholy', hit);
        }
    } catch (e) { console.log('[法球派生] 执行失败: ' + e); }
}

function rebalanceReadDebt(player) {
    let stack = getCuriosItem(player, 'rainbow:ancient_skull');
    return stack == null ? 0 : ancientSkullGetDebt(stack);
}

function rebalanceShareDamage(event, victim, source, context) {
    try {
        let type = String(source.getType());
        if (type == 'ancient_skull' || type == 'aegis_share' || type == 'outOfWorld' || type == 'genericKill') return;
        if (!(event.getAmount() > 0) || !hasContextCurio(context, 'victim', victim, 'rainbow:ancientaegis')) return;
        if (typeof global.getAncientAegisDamageTargets != 'function') return;
        let targets = global.getAncientAegisDamageTargets(victim);
        if (targets == null || targets.length == 0) return;
        let total = event.getAmount();
        let share = total * 0.25 / targets.length;
        let accepted = 0;
        for (let member of targets) {
            if (member == null || !member.isAlive() || String(member.getUuid()) == String(victim.getUuid())) continue;
            let oldDebt = hasCurios(member, 'rainbow:ancient_skull') ? rebalanceReadDebt(member) : 0;
            let applied = rebalanceDealDamage(null, member, 'aegis_share', share, 'share', null, true);
            if (applied || (hasCurios(member, 'rainbow:ancient_skull') && rebalanceReadDebt(member) > oldDebt)) accepted += share;
        }
        event.setAmount(Math.max(0, total - accepted));
    } catch (e) { console.log('[远古之庇护] 最终伤害分摊失败: ' + e); }
}

// 主动AOE与服务端技能跨脚本域共用同一无击退/友军规则。
global.rebalanceAoe = rebalanceAoe;
global.rebalanceIsAlly = rebalanceIsAlly;
