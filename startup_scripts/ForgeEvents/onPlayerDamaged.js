// priority: 5000
const KINETIC_CORE_AOE_RADIUS = 7;
const KINETIC_CORE_DODGE_DAMAGE = 6;
const KINETIC_CORE_ITEM_ID = 'species:kinetic_core';

/**
 * 玩家受伤后事件
 * @param {Internal.LivingDamageEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.DamageSource} source
 * @param {string[]} range_damage 远程伤害
 * @param {string[]} thrown_damage 投掷伤害
 * @param {string[]} soure_magic 魔法伤害
 * @param {string[]} boom_damage 爆炸伤害
 */
function onPlayerDamaged(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context) {
    if (!victim.isPlayer()) return;

    // 玩家佩戴动能核心受伤时，沿用本次实际结算伤害作为爆破基础伤害。
    if (!hasContextCurio(context, "victim", victim, KINETIC_CORE_ITEM_ID)) return;
    try {
        kineticCoreExplosion(victim, event.getAmount());
    } catch (e) {
        console.log("动能核心受伤爆破触发失败：" + e);
    }
}

// 统一执行动能核心范围爆破；成功闪避时使用固定 6 点基础伤害。
function kineticCoreExplosion(victim, damage) {
    try {
        // 爆破粒子效果
        victim.server.runCommandSilent(`/particle species:small_kinetic_energy ${victim.getX()} ${victim.getY()} ${victim.getZ()}`);

        let centerX = victim.getX();
        let centerY = victim.getY() + 0.5;
        let centerZ = victim.getZ();
        let area = victim.boundingBox.inflate(KINETIC_CORE_AOE_RADIUS);

        victim.level.getEntitiesWithin(area).forEach(entity => {
            if (!entity || !entity.isLiving() || !entity.isAlive()) return;
            if (entity == victim) return;

            // 排除队友、同一所有者的实体，以及佩戴者与其主人。
            if (victim.team && entity.team && victim.team == entity.team) return;
            if (victim.persistentData.OwnerName && entity.persistentData.OwnerName
                && victim.persistentData.OwnerName == entity.persistentData.OwnerName) return;
            if (victim.owner && entity.id == victim.owner.id) return;
            if (entity.owner && entity.owner.id == victim.id) return;

            let dx = entity.getX() - centerX;
            let dy = entity.getY() - centerY;
            let dz = entity.getZ() - centerZ;
            let distanceSq = dx * dx + dy * dy + dz * dz;
            if (distanceSq <= 0 || distanceSq > KINETIC_CORE_AOE_RADIUS * KINETIC_CORE_AOE_RADIUS) return;

            let distance = Math.sqrt(distanceSq);
            // 距离越远伤害越低（中心 100% 至边缘 30%）。
            let damageMultiplier = 1.0 - (distance / KINETIC_CORE_AOE_RADIUS) * 0.7;
            let finalDamage = Math.max(1, damage * damageMultiplier);

            // 爆破伤害归属佩戴者。
            entity.attack(victim.damageSources().playerAttack(victim), finalDamage);

            // 击退效果随距离衰减。
            let knockbackStrength = 2.0 * (1.0 - distance / KINETIC_CORE_AOE_RADIUS * 0.5);
            entity.setDeltaMovement(new Vec3d(
                (dx / distance) * knockbackStrength,
                0.5 + Math.max(dy / distance * 0.15, 0),
                (dz / distance) * knockbackStrength
            ));
            entity.hurtMarked = true;
        });
    } catch (e) {
        console.log("动能核心AOE出错：" + e);
    }
}

// 玩家成功触发 Apothic 闪避且佩戴动能核心时，以固定伤害释放同一范围爆破。
function onPlayerKineticCoreDodge(event) {
    let victim = event.getTarget();
    if (victim == null || !victim.isPlayer() || victim.level == null || victim.level.isClientSide()) return;
    if (!hasContextCurio(null, "victim", victim, KINETIC_CORE_ITEM_ID)) return;
    kineticCoreExplosion(victim, KINETIC_CORE_DODGE_DAMAGE);
}
