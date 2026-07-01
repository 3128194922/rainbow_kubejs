// priority: 5000
/**
 * 非玩家受伤后事件
 * @param {Internal.LivingDamageEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.DamageSource} source
 * @param {string[]} range_damage 远程伤害
 * @param {string[]} thrown_damage 投掷伤害
 * @param {string[]} soure_magic 魔法伤害
 * @param {string[]} boom_damage 爆炸伤害
 */
function onNonPlayerDamaged(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (victim.isPlayer()) return;

    // --- 驯服马匹伤害传导主人 ---
    // 已被驯服的马/驴/骡受伤时，骑乘者若为主人则伤害100%传导给主人
    try {
        //let horseTypes = ["minecraft:horse", "minecraft:donkey", "minecraft:mule"];
        //if (horseTypes.indexOf(victim.getType()) != -1) {
            if (victim.owner && victim.owner.isPlayer()) {
                let passengers = victim.getPassengers();
                if (!passengers.isEmpty()) {
                    let rider = passengers.get(0);
                    if (rider.isPlayer() && rider.uuid.toString() == victim.owner.uuid.toString()) {
                        let damage = event.getAmount();
                        event.setAmount(0);
                        rider.attack(rider.damageSources().generic(), damage);
                    }
                }
            }
        //}
    } catch (e) {
        console.log("坐骑伤害传导出错: " + e);
    }
}
