// priority: 4500
// 多心经：在护甲、保护、现有饰品减伤及汉剑斩杀伤害写入后，限制过高的单次实际伤害。
const HEART_SUTRA_ITEM_ID = 'rainbow:the_heart_sutra'
const HEART_SUTRA_COOLDOWN_TICKS = 400
const HEART_SUTRA_DAMAGE_RATIO = 0.1

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDamageEvent', event => {
    try {
        let player = event.getEntity()
        if (player == null || !player.isPlayer() || player.level == null || player.level.isClientSide()) return
        // 已取消或归零的伤害不触发饰品，也不消耗冷却。
        if (event.isCanceled() || event.getAmount() <= 0) return
        if (!hasCurios(player, HEART_SUTRA_ITEM_ID)) return
        if (player.cooldowns.isOnCooldown(HEART_SUTRA_ITEM_ID)) return

        let maxHealth = player.getMaxHealth()
        if (maxHealth <= 0) return
        let damageLimit = maxHealth * HEART_SUTRA_DAMAGE_RATIO
        if (event.getAmount() <= damageLimit) return

        // Moreattribute 会在 addCooldown 时按冷却缩减再次折算；反向换算以保持实际冷却 400 tick。
        let cooldownReduction = Number(player.getAttributeValue('moreattribute:cooldown_reduction'))
        let cooldownTicks = HEART_SUTRA_COOLDOWN_TICKS
        if (cooldownReduction > 0 && cooldownReduction < 1) {
            cooldownTicks = Math.ceil((HEART_SUTRA_COOLDOWN_TICKS - 0.499999) / (1 - cooldownReduction))
        }
        event.setAmount(damageLimit)
        player.cooldowns.addCooldown(HEART_SUTRA_ITEM_ID, cooldownTicks)
    }
    catch (e) {
        console.log('[多心经] 伤害限制处理失败：')
        console.log(e)
    }
})
