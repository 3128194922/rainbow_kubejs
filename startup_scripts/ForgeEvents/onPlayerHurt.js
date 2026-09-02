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
function onPlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context) {
    if (!victim.isPlayer()) return;

    // --- 古代庇护饰品 ---
    // 转移伤害给绑定的玩家
    if (hasContextCurio(context, "victim", victim, "rainbow:ancientaegis")) {
        let item = getContextCurioStack(context, "victim", "rainbow:ancientaegis");
        if (item && item.nbt) {
            let uuidStr = item.nbt.getString("UUID");
            if (uuidStr) {
                try {
                    let uuid = UUID.fromString(uuidStr);
                    let targetPlayer = victim.level.getPlayerByUUID(uuid);
                    if (targetPlayer) {
                        if(getCuriosItem(targetPlayer, "rainbow:ancientaegis") != null)
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

    // --- 巫毒女巫锅 ---
    // 佩戴时，攻击者每有一个负面药水效果，对玩家的伤害减少4%，最高100%
    if (hasContextCurio(context, "victim", victim, "mysticartifacts:witch_pot")) {
        try {
            if (attacker != null && attacker.isAlive()) {
                let effects = attacker.getActiveEffects();
                if (effects != null && effects.size() > 0) {
                    let negativeCount = 0;
                    for (let effect of effects) {
                        if (!effect.getEffect().isBeneficial()) {
                            negativeCount++;
                        }
                    }
                    let reduction = Math.min(1.0, negativeCount * 0.04);
                    event.setAmount(event.getAmount() * (1.0 - reduction));
                }
            }
        } catch (e) {
            console.log("巫毒女巫锅出错：" + e);
        }
    }

    // --- 兽性面具 ---
    // 每次受伤增加1层 rainbow:beast_dodge，最高10层；击杀回血和极限闪避回血保留。
    handleBeastMaskHurt(event, victim, context);

    // --- 狂怒面具 ---
    // 玩家累计受到10点伤害后进入狂怒状态，触发后进入5秒冷却。
    handleFuryMaskHurt(event, victim, context);

    // --- 圣饼 ---
    // 10%伤害减免 + 60tick无敌帧
    if (hasContextCurio(context, "victim", victim, "rainbow:the_wafer")) {
            try{
                event.setAmount(event.getAmount() * 0.9);
                victim.invulnerableTime = 30;

            }catch(e)
            {
                console.log("圣饼出错："+e)
            }
    }

    // --- 混沌核心 ---
    // 携带时: 1)伤害乘以倍率(受幸运影响) 2)概率反弹伤害给攻击者(受幸运影响)
    if (hasContextCurio(context, "victim", victim, "rainbow:chaos_core")) {
        try {
            let luckAttr = victim.getAttribute("minecraft:generic.luck");
            let luckValue = luckAttr ? luckAttr.getValue() : 0;
            if (luckValue < 0) luckValue = 0; // 幸运需要 >= 0
            // 伤害倍率: 1 + 幸运/25*0.05（幸运25时最大1.05倍）
            let multiplier = 1.0 + (luckValue / 25.0) * 0.05;
            let originalAmount = event.getAmount();
            event.setAmount(originalAmount * multiplier);
            // 反弹概率: 触发概率 = 幸运/25（幸运≥0生效，上限100%）
            let reflectChance = Math.min(1.0, luckValue / 25.0);
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
    if (hasContextCurio(context, "victim", victim, "rainbow:dark_sun_ring")) {
        try {
            let luckAttr = victim.getAttribute("minecraft:generic.luck");
            let luckValue = luckAttr ? luckAttr.getValue() : 0;
            if (luckValue < 0) luckValue = 0; // 幸运需要 >= 0

            // 火焰/岩浆伤害转换为治疗: 触发概率 = 幸运/25
            let isFireLava = context != null
                ? context.isFireDamage
                : source.getType() === "inFire" || source.getType() === "onFire" || source.getType() === "lava" || source.getType() === "hotFloor";
            if (isFireLava) {
                let healChance = Math.min(1.0, luckValue / 25.0);
                if (Math.random() < healChance) {
                    let amount = event.getAmount();
                    event.setAmount(0);
                    victim.heal(amount);
                }
            }

            // 小于10的伤害有概率完全抵消: 触发概率 = 幸运/25
            let currentDamage = event.getAmount();
            if (currentDamage < 10) {
                let negateChance = Math.min(1.0, luckValue / 25.0);
                if (Math.random() < negateChance) {
                    event.setAmount(0);
                }
            }
        } catch (e) {
            console.log("七阳之戒出错：" + e);
        }
    }

    // --- 肩甲 ---
    // 受伤时抵消一次不小于 6 的伤害（完全免伤），抵消后物品进入冷却，冷却期间无法抵消
    if(hasContextCurio(context, "victim", victim, "rainbow:pauldron"))
    {
        try{
            if (event.getAmount() >= 12 && !victim.cooldowns.isOnCooldown("rainbow:pauldron")) {
                event.setAmount(0);
                global.sendParticleTextInFront(victim, "肩甲抵消！", 0xFFFFFF);
                victim.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), "minecraft:block.anvil.place", "players", 1.0, 1.0);
                victim.cooldowns.addCooldown("rainbow:pauldron", SecoundToTick(20));
            }
        }
        catch(e)
        {
            console.log("肩甲出错："+e)
        }
    }
}
