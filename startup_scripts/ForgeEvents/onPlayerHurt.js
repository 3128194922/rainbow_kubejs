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
                        if(hasCurios(targetPlayer, "rainbow:ancientaegis"))
                        {
                            return; // 目标玩家也有古代庇护，不转移伤害
                        }
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

    // --- 圣饼 ---
    // 10%伤害减免 + 60tick无敌帧
    if (hasCurios(victim, "rainbow:the_wafer")) {
            try{
                event.setAmount(event.getAmount() * 0.9);
                victim.invulnerableTime = 60;

            }catch(e)
            {
                console.log("圣饼出错："+e)
            }
    }

    // --- 混沌核心 ---
    // 携带时: 1)伤害乘以[0.0,2.0]倍率(受幸运影响) 2)概率反弹伤害给攻击者(受幸运影响)
    if (hasCurios(victim, "rainbow:chaos_core")) {
        try {
            let luckAttr = victim.getAttribute("minecraft:generic.luck");
            let luckValue = luckAttr ? luckAttr.getValue() : 0;
            luckValue = Math.max(-512, Math.min(512, luckValue));
            // 伤害倍率: luck=-512→0.0, luck=0→1.0, luck=512→2.0
            let multiplier = 1.0 + (luckValue / 512.0);
            let originalAmount = event.getAmount();
            event.setAmount(originalAmount * multiplier);
            // 反弹概率: 基础0.5, 幸运影响±0.3, 范围[0.0,1.0]
            let luckFactor = luckValue / 512.0;
            let reflectChance = Math.max(0.0, Math.min(1.0, 0.5 + luckFactor * 0.3));
            if (attacker !== null && attacker.isAlive() && Math.random() < reflectChance) {
                // 使用魔法伤害反弹，避免递归
                attacker.hurt(victim.damageSources().magic(), originalAmount);
            }
        } catch (e) {
            console.log("混沌核心出错：" + e);
        }
    }

    // --- 七阳之戒 ---
    // 1)小于10的伤害有概率完全抵消 2)火焰/岩浆伤害转换为治疗(均受幸运影响)
    if (hasCurios(victim, "rainbow:dark_sun_ring")) {
        try {
            let luckAttr = victim.getAttribute("minecraft:generic.luck");
            let luckValue = luckAttr ? luckAttr.getValue() : 0;
            luckValue = Math.max(-512, Math.min(512, luckValue));
            let luckFactor = luckValue / 512.0;

            // 火焰/岩浆伤害转换为治疗: 基础40%, 幸运影响±30%
            let sourceType = source.getType();
            let isFireLava = sourceType === "inFire" || sourceType === "onFire" || sourceType === "lava" || sourceType === "hotFloor";
            if (isFireLava) {
                let healChance = Math.max(0.0, Math.min(1.0, 0.4 + luckFactor * 0.3));
                if (Math.random() < healChance) {
                    let amount = event.getAmount();
                    event.setAmount(0);
                    victim.heal(amount);
                }
            }

            // 小于10的伤害有概率完全抵消: 基础30%, 幸运影响±20%
            let currentDamage = event.getAmount();
            if (currentDamage < 10) {
                let negateChance = Math.max(0.0, Math.min(1.0, 0.3 + luckFactor * 0.2));
                if (Math.random() < negateChance) {
                    event.setAmount(0);
                }
            }
        } catch (e) {
            console.log("七阳之戒出错：" + e);
        }
    }
}
