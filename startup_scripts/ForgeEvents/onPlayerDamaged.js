// priority: 5000
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
function onPlayerDamaged(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (!victim.isPlayer()) return;

    // --- 大胃王饰品 ---
    // 消耗饱和度抵消伤害
    if (hasCurios(victim, "rainbow:big_stomach")) {
        if (victim.getFoodData().getSaturationLevel() > 0) {
            victim.getFoodData().setSaturation(
                Math.max(victim.getFoodData().getSaturationLevel() - event.getAmount(), 0)
            );
            event.setCanceled(true);
        }
    }

    // --- 动能核心（受伤时触发范围动能爆破 AOE） ---
    if(hasCurios(victim, "species:kinetic_core"))
    {
        // 动能核心：受到伤害时释放范围动能爆破，对周围非友军造成伤害（参考圣经脉冲 + taunt_effect 友军判断）
        if (victim.isPlayer()) {
            try {
                var damage = event.getAmount();

                // 粒子效果
                victim.server.runCommandSilent(`/particle species:small_kinetic_energy ${victim.getX()} ${victim.getY()} ${victim.getZ()}`)

                // 范围动能爆破参数
                var radius = 7;
                var centerX = victim.getX();
                var centerY = victim.getY() + 0.5;
                var centerZ = victim.getZ();
                var area = victim.boundingBox.inflate(radius);

                victim.level.getEntitiesWithin(area).forEach(entity => {
                    if (!entity || !entity.isLiving() || !entity.isAlive()) return;
                    if (entity == victim) return;

                    // --- 友军判断（参考 taunt_effect） ---
                    if (victim.team && entity.team && victim.team == entity.team) return;
                    if (victim.persistentData.OwnerName && entity.persistentData.OwnerName
                        && victim.persistentData.OwnerName == entity.persistentData.OwnerName) return;
                    if (victim.owner && entity.id == victim.owner.id) return;
                    if (entity.owner && entity.owner.id == victim.id) return;

                    // 计算距离
                    var dx = entity.getX() - centerX;
                    var dy = entity.getY() - centerY;
                    var dz = entity.getZ() - centerZ;
                    var distanceSq = dx * dx + dy * dy + dz * dz;
                    if (distanceSq <= 0 || distanceSq > radius * radius) return;

                    var distance = Math.sqrt(distanceSq);
                    // 距离越远伤害越低（中心100% ~ 边缘30%）
                    var damageMultiplier = 1.0 - (distance / radius) * 0.7;
                    var finalDamage = Math.max(1, damage * damageMultiplier);

                    // 造成玩家来源伤害（伤害值=玩家收到的伤害）
                    entity.attack(victim.damageSources().playerAttack(victim), finalDamage);

                    // 击退效果（参考圣经脉冲）
                    var knockbackStrength = 2.0 * (1.0 - distance / radius * 0.5);
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
    }
}
