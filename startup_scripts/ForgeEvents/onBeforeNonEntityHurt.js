// Priority: 5000
/**
 * 非玩家受伤前事件
 * @param {Internal.LivingAttackEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.Entity} source
 * @param {number} range_damage 远程伤害
 * @param {number} thrown_damage 投掷伤害
 * @param {number} soure_magic 魔法伤害
 * @param {number} boom_damage 爆炸伤害
 */
function onBeforeNonEntityHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage){
    // --- 虚化效果 ---
    if(victim.hasEffect("rainbow:void"))
        {
            event.setCanceled(true);
        }
    // --- 民主甲套装效果 ---
    // 只有穿戴全套民主装备时生效
    if (
        victim.getItemBySlot("chest").id == "mysticartifacts:democracy_chestplate" &&
        victim.getItemBySlot("feet").id == "mysticartifacts:democracy_boots" &&
        victim.getItemBySlot("head").id == "mysticartifacts:democracy_helmet" &&
        victim.getItemBySlot("legs").id == "mysticartifacts:democracy_leggings"
    ) {
        //console.log(victim.invulnerableTime)
        if(victim.invulnerableTime > 0)
            {
                event.setCanceled(true);
                return;
            }
        let tank = getCuriosItem(victim, 'create:copper_backtank') ? getCuriosItem(victim, 'create:copper_backtank') : getCuriosItem(victim, 'create:netherite_backtank');
        let currentAir = tank.nbt.getInt("Air");
        if (tank && currentAir > 0) {
            let damage = event.getAmount();
            let airPerDamage = 5;
            let requiredAir = damage * airPerDamage;

            if (currentAir >= requiredAir) {
                tank.nbt.putInt("Air", tank.nbt.getInt("Air") - requiredAir);
                //event.setAmount(0);
                //victim.level.runCommandSilent(`playsound create:steam voice @p ${victim.x} ${victim.y} ${victim.z}`)
                victim.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), "create:steam", "voice", 1, 1)
                victim.invulnerableTime = 20;
                event.setCanceled(true);
            }
            else {
                // 气量不足但仍有剩余 → 抵消部分伤害并耗尽气量
                /*let reducedDamage = damage * (1 - currentAir / requiredAir);
                event.setAmount(reducedDamage);*/
                tank.nbt.putInt("Air", 0);
                victim.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), "create:steam", "voice", 1, 1)
                victim.invulnerableTime = 20;
                event.setCanceled(true);
            }
        }
    }

        // --- 防化服套装效果 ---
        if (victim.getItemBySlot("head").id == 'alexscaves:hazmat_mask'
        && victim.getItemBySlot("chest").id == 'alexscaves:hazmat_chestplate'
        && victim.getItemBySlot("legs").id == 'alexscaves:hazmat_leggings'
        && victim.getItemBySlot("feet").id == 'alexscaves:hazmat_boots') {
        if (source.getType() == "poison_cloud" || source.getType() == "wither") {
            event.setCanceled(true)
        }
    }

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

    // --- 暴食护符（免饥饿伤害） ---
    if (source.getType() == "starve" && hasCurios(victim, "rainbow:gluttony_charm")) {
        event.setCanceled(true);
    }
}