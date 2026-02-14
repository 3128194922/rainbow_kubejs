// Priority: 5000
/**
 * 处理攻击者佩戴饰品或拥有特定状态时的效果
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.Entity} source
 * @param {string[]} range_damage 远程伤害
 * @param {string[]} thrown_damage 投掷伤害
 * @param {string[]} soure_magic 魔法伤害
 * @param {string[]} boom_damage 爆炸伤害
 */
function handleCuriosEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    const mainHand = attacker.getItemInHand("main_hand");
    const offHand = attacker.getItemInHand("off_hand");

    // 牢大饮料/曼巴效果：速度加成伤害倍率
    if (hasCurios(attacker, "rainbow:ice_tea") || attacker.hasEffect("rainbow:manba")) {
        event.setAmount(event.getAmount() * attacker.getSpeed().toFixed(2) * 10);
        //attacker.server.runCommandSilent(`/playsound rainbow:voice.man voice @p ${victim.x} ${victim.y} ${victim.z}`);
        attacker.level.playSound(null, attacker.getX(), attacker.getY(), attacker.getZ(), "rainbow:voice.man", "voice", 1, 1)
    }

    // 屠夫之钉：远程攻击暴击引发爆炸
    if (hasCurios(attacker, "rainbow:clawofhorus") &&
        range_damage.indexOf(source.getType()) != -1 &&
        !attacker.cooldowns.isOnCooldown("rainbow:clawofhorus")) {

        // 幸运值影响触发概率
        if (randomBool(attacker.getAttribute("generic.luck").getValue() / 10.0)) {
            attacker.level.createExplosion(victim.x, victim.y + 1, victim.z)
                .causesFire(false)
                .exploder(attacker)
                .explosionMode("none")
                .strength(0)
                .explode();
            attacker.cooldowns.addCooldown("rainbow:clawofhorus", SecoundToTick(6));
            attacker.cooldowns.removeCooldown(offHand.id);
        }
    }

    // 决斗剑：对已记录类型的生物造成额外伤害
    if (mainHand.id == "rainbow:duel") {
        if (mainHand.nbt.type == victim.getType()) {
            event.setAmount(event.getAmount() * 1.5);
        } else {
            mainHand.nbt.type = victim.getType();
        }
    }

    // 链式闪电饰品：攻击时触发链式闪电
    if (hasCurios(attacker, "rainbow:lightning")) {
        let lightning = attacker.level.createEntity('domesticationinnovation:chain_lightning');
        lightning.setCreatorEntityID(attacker.getId());
        lightning.setFromEntityID(attacker.getId());
        lightning.setToEntityID(victim.getId());
        lightning.setChainsLeft(5);
        victim.level.addFreshEntity(lightning);
        //attacker.server.runCommandSilent(`/playsound domesticationinnovation:chain_lightning voice @p ${attacker.x} ${attacker.y} ${attacker.z}`);
        attacker.level.playSound(null, attacker.getX(), attacker.getY(), attacker.getZ(), "domesticationinnovation:chain_lightning", "voice", 1, 1)
    }

    // 被标记目标（tag）受到远程攻击双倍伤害
    if (victim.hasEffect("rainbow:tag") && range_damage.indexOf(source.getType().toString()) != -1) {
        event.setAmount(event.getAmount() * 2);
    }
}
