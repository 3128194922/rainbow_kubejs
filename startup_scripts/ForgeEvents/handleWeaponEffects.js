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
function handleWeaponEffects(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context) {
    if (!attacker || !attacker.isLiving()) return;
    let mainHand = attacker.getItemInHand("main_hand");
    let damageType = context != null ? context.damageType : String(source.getType());
    let isRangeDamage = context != null ? context.isRangeDamage : range_damage.indexOf(damageType) != -1;
    
    // 提尔锋原护甲增伤机制已停用，改为主手装备时提供盔甲穿透属性。
    /*if (mainHand.id == "rainbow:tyrfing" && !isRangeDamage) {
        event.setAmount(event.getAmount() + event.getAmount() * victim.getArmorValue());
    }*/

    // 重锤：下落动能增伤（根据下落距离和动能伤害属性）
    if (mainHand.id == "rainbow:heavy_axe" && !isRangeDamage) {
        let kineticAttr = attacker.getAttribute('oreganized:kinetic_damage');
        let kineticValue = kineticAttr ? kineticAttr.getValue() : 0;
        let bonus = (attacker.fallDistance * 0.5) + (kineticValue * 2);
        event.setAmount(event.getAmount() + bonus);
        attacker.fallDistance = 0;
    }

    // 万能钥匙斧：气罐触发额外伤害
    /*if (mainHand.id == "gimmethat:master_key" && range_damage.indexOf(source.getType()) == -1) {
        /*let tank = global.backtankUtils.getFirstTank(attacker);
        if (tank && global.backtankUtils.hasAirRemaining(tank)) {
            global.backtankUtils.consumeAir(attacker, tank, 10); // 消耗10气
            event.setAmount(event.getAmount() + 6); // 增加伤害
            attacker.level.playSound(null, attacker.blockPosition(), "create:whistle_low", "players", 1.0, 1.0);
        }*/
    /*    let tank = getCuriosItem(attacker, 'create:copper_backtank') ? getCuriosItem(attacker, 'create:copper_backtank') : getCuriosItem(attacker, 'create:netherite_backtank');
        let currentAir = tank.nbt.getInt("Air");
        if (tank && currentAir > 0) {
            tank.nbt.putInt("Air", currentAir - 10);
            event.setAmount(event.getAmount() + 6); // 增加伤害
            attacker.level.playSound(null, attacker.getX(), attacker.getY(), attacker.getZ(), "create:steam", "voice", 1, 1)
        }
    }*/

    // 决斗剑：按目标 UUID 记录单个生物；连续攻击同一生物时伤害提高 1.5 倍。
    if (mainHand.id == "rainbow:duel") {
        try {
            let duelTag = mainHand.getOrCreateTag();
            let targetUuid = victim.getUuid().toString();
            let recordedUuid = duelTag.getString("target_uuid");
            if (recordedUuid != null && recordedUuid != "" && recordedUuid == targetUuid) {
                event.setAmount(event.getAmount() * 1.5);
            }
            duelTag.putString("target_uuid", targetUuid);
        }
        catch (e) {
            console.log("决斗细剑目标 UUID 记录或伤害处理出错：");
            console.log(e);
        }
    }
}
