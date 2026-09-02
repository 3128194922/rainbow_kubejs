// priority: 5000
// 葵花宝典免伤待触发期间显示的 Dyeing 层 ID。
const SUNFLOWER_INVULNERABILITY_DYEING_ID = "sunflower_invulnerability";
// 葵花宝典翻滚后的角色颜色：半透明灰色。
const SUNFLOWER_INVULNERABILITY_DYEING_COLOR = "80808080";

// 葵花宝典翻滚后写入的下一次伤害免疫标记。
const SUNFLOWER_NEXT_DAMAGE_KEY = "rainbow:sunflower_next_damage";

/**
 * CombatRoll 翻滚事件回传：将翻滚转换为下一次伤害免疫。
 * 佩戴葵花宝典时，每次翻滚事件都会触发，不依赖技能轮盘。
 */
function handleSunflowerCombatRollEvent(event) {
    try {
        let player = event.getPlayer();
        let rollDuration = event.getRollDuration();
        if (player == null || !player.isPlayer()) return;
        if (getCuriosItem(player, 'rainbow:fist_of_seven_wounds') == null) return;

        // 读取回传时长，确保事件对象符合 CombatRoll 源码提供的事件接口。
        if (rollDuration == null || rollDuration < 0) {
            console.log('[葵花宝典] CombatRollEvent 翻滚时长无效: ' + rollDuration);
        }
        player.persistentData.putBoolean(SUNFLOWER_NEXT_DAMAGE_KEY, true);
        let playerUuid = player.getUuid().toString();
        player.level.server.runCommandSilent(
            "/dyeing paint add static " + SUNFLOWER_INVULNERABILITY_DYEING_ID + " " +
            playerUuid + " " + SUNFLOWER_INVULNERABILITY_DYEING_COLOR + " 1.0"
        );
    } catch (e) {
        console.log('[葵花宝典] CombatRollEvent处理出错: ' + e);
        console.log(e);
    }
}

function removeSunflowerInvulnerabilityDyeing(victim) {
    try {
        let playerUuid = victim.getUuid().toString();
        victim.level.server.runCommandSilent("/dyeing paint remove " + playerUuid + " " + SUNFLOWER_INVULNERABILITY_DYEING_ID);
    } catch (e) {
        console.log('[葵花宝典] 移除免伤Dyeing层出错: ' + e);
    }
}

function playSunflowerInvulnerabilityFeedback(victim) {
    try {
        global.sendParticleTextInFront(victim, "免疫伤害！", 0xFFFF00);
        victim.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), "minecraft:item.totem.use", "players", 1.0, 1.0);
    } catch (e) {
        console.log('[葵花宝典] 免伤反馈播放出错: ' + e);
    }
}

/**
 * @param {Internal.LivingAttackEvent} event
 * @param {Internal.Entity} attacker
 * @param {Internal.Entity} victim
 * @param {Internal.Entity} source
 * @param {number} range_damage 远程伤害
 * @param {number} thrown_damage 投掷伤害
 * @param {number} soure_magic 魔法伤害
 * @param {number} boom_damage 爆炸伤害
 */
function onBeforePlayerHurt(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage, context)
{
    if (!victim.isPlayer()) return;

    let damageType = context != null ? context.damageType : String(source.getType());
    let isFallDamage = context != null ? context.isFallDamage : damageType == "fall";

    if(isFallDamage && victim.persistentData.isGravityCore)
        {
            event.setCanceled(true);
        }
    
    if(hasContextCurio(context, "victim", victim, 'rainbow:cloud_boots') && isFallDamage)
    {
        event.setCanceled(true);
    }

    // 葵花宝典翻滚后的下一次伤害免疫；成功触发时移除Dyeing层并播放反馈。
    if (victim.persistentData.getBoolean(SUNFLOWER_NEXT_DAMAGE_KEY)) {
        if (hasContextCurio(context, "victim", victim, 'rainbow:fist_of_seven_wounds')) {
            victim.persistentData.putBoolean(SUNFLOWER_NEXT_DAMAGE_KEY, false);
            removeSunflowerInvulnerabilityDyeing(victim);
            playSunflowerInvulnerabilityFeedback(victim);
            event.setCanceled(true);
            return;
        }
        victim.persistentData.putBoolean(SUNFLOWER_NEXT_DAMAGE_KEY, false);
        removeSunflowerInvulnerabilityDyeing(victim);
    }
}
