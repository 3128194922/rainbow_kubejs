// priority: 5000
/**
 * 玩家受伤事件
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.Entity} source
 * @param {string[]} range_damage 远程伤害
 * @param {string[]} thrown_damage 投掷伤害
 * @param {string[]} soure_magic 魔法伤害
 * @param {string[]} boom_damage 爆炸伤害
 */
function onPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (!victim.isPlayer()) return;

    // --- 民主甲套装效果 ---
    // 只有穿戴全套民主装备时生效
    if (
        victim.getItemBySlot("chest").id == "gimmethat:democracy_chestplate" &&
        victim.getItemBySlot("feet").id == "gimmethat:democracy_boots" &&
        victim.getItemBySlot("head").id == "gimmethat:democracy_helmet" &&
        victim.getItemBySlot("legs").id == "gimmethat:democracy_leggings"
    ) {
        let tank = getCuriosItem(victim, 'create:copper_backtank') ? getCuriosItem(victim, 'create:copper_backtank') : getCuriosItem(victim, 'create:netherite_backtank');
        let currentAir = tank.nbt.getInt("Air");
        if (tank && currentAir > 0) {
            let damage = event.getAmount();
            let airPerDamage = 5;
            let requiredAir = damage * airPerDamage;

            if (currentAir >= requiredAir) {
                tank.nbt.putInt("Air", tank.nbt.getInt("Air") - requiredAir);
                event.setAmount(0);
                //victim.level.runCommandSilent(`playsound create:steam voice @p ${victim.x} ${victim.y} ${victim.z}`)
                victim.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), "create:steam", "voice", 1, 1)
            }
            else {
                // 气量不足但仍有剩余 → 抵消部分伤害并耗尽气量
                let reducedDamage = damage * (1 - currentAir / requiredAir);
                event.setAmount(reducedDamage);
                tank.nbt.putInt("Air", 0);
                victim.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), "create:steam", "voice", 1, 1)
            }
        }
    }

    // --- 古代庇护饰品 ---
    // 转移伤害给绑定的玩家
    if (hasCurios(victim, "rainbow:ancientaegis")) {
        let item = getCuriosItem(victim, "rainbow:ancientaegis");
        if (item && item.nbt) {
            let uuidStr = item.nbt.getString("UUID");
            if (uuidStr) {
                try {
                    let uuid = UUID.fromString(uuidStr);
                    let targetPlayer = victim.level.getPlayerByUUID(uuid);
                    if (targetPlayer) {
                        // 将伤害转移给绑定目标，自身免伤
                        targetPlayer.attack(targetPlayer.damageSources().magic(), event.getAmount());
                        event.setAmount(0);
                    }
                } catch (err) {
                    console.log("UUID 解析失败: " + err);
                }
            }
        }
    }
}
