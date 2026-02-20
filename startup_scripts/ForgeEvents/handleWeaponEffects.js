// Priority: 5000
/**
 * 处理玩家攻击时的特殊武器效果
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.Entity} source
 * @param {string[]} range_damage 远程伤害
 * @param {string[]} thrown_damage 投掷伤害
 * @param {string[]} soure_magic 魔法伤害
 * @param {string[]} boom_damage 爆炸伤害
 */
function handleWeaponEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (!attacker || !attacker.isLiving()) return;
    const mainHand = attacker.getItemInHand("main_hand");
    const offHand = attacker.getItemInHand("off_hand");

    // 提尔锋：按目标护甲值增加伤害
    if (mainHand.id == "rainbow:tyrfing" && range_damage.indexOf(source.getType()) == -1) {
        event.setAmount(event.getAmount() + event.getAmount() * victim.getArmorValue());
    }

    // 重锤：下落动能增伤（根据垂直速度）
    if (mainHand.id == "rainbow:heavy_axe" && range_damage.indexOf(source.getType()) == -1) {
        event.setAmount(event.getAmount() + ((Math.abs(attacker.getDeltaMovement().y()).toFixed(1) - 0.1) * 40));
        attacker.fallDistance = 0;
    }

    // 万能钥匙斧：气罐触发额外伤害
    if (mainHand.id == "gimmethat:master_key" && range_damage.indexOf(source.getType()) == -1) {
        /*let tank = global.backtankUtils.getFirstTank(attacker);
        if (tank && global.backtankUtils.hasAirRemaining(tank)) {
            global.backtankUtils.consumeAir(attacker, tank, 10); // 消耗10气
            event.setAmount(event.getAmount() + 6); // 增加伤害
            attacker.level.playSound(null, attacker.blockPosition(), "create:whistle_low", "players", 1.0, 1.0);
        }*/
        let tank = getCuriosItem(attacker, 'create:copper_backtank') ? getCuriosItem(attacker, 'create:copper_backtank') : getCuriosItem(attacker, 'create:netherite_backtank');
        let currentAir = tank.nbt.getInt("Air");
        if (tank && currentAir > 0) {
            tank.nbt.putInt("Air", currentAir - 10);
            event.setAmount(event.getAmount() + 6); // 增加伤害
            attacker.level.playSound(null, attacker.getX(), attacker.getY(), attacker.getZ(), "create:steam", "voice", 1, 1)
        }
    }

    // 决斗剑：对已记录类型的生物造成额外伤害
    if (mainHand.id == "rainbow:duel") {
        let Nbt = mainHand.getOrCreateTag();
        if (Nbt.type == victim.getType()) {
            event.setAmount(event.getAmount() * 1.5);
        } else {
            Nbt.type = victim.getType();
        }
    }
}
