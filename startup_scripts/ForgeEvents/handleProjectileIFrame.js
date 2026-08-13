// priority: 10000
// ==========================================
// 抛射体无敌帧优化 - 复刻 combat-nouveau 的 noProjectileImmunity 逻辑
// Projectile i-frame optimization - replicates combat-nouveau's noProjectileImmunity
// ==========================================
// 逻辑：当实体被抛射体伤害命中时，立即重置 invulnerableTime 为 0，
// 取消原版伤害无敌帧（20 tick），使多个抛射体可在同一 tick 内全部造成伤害。
// 解决多重射击（multishot）等场景下只有首个抛射体生效的问题。
//
// 原理：LivingHurtEvent 在 LivingEntity.hurt() 内部触发，时序为：
//   1. hurt() 检查 invulnerableTime（首次命中为 0，放行）
//   2. hurt() 设置 invulnerableTime = 20
//   3. hurt() 调用 actuallyHurt() → 触发 LivingHurtEvent
//   4. 本处理器在此将 invulnerableTime 重置为 0
//   5. 下一发抛射体的 hurt() 检查时 invulnerableTime 仍为 0，可正常命中
//
// 位置：LivingHurtEvent 中最先执行，使后续饰品/护甲（如圣饼）仍可覆盖 i-frame。
// 原始实现：fuzs.combatnouveau.handler.CombatTestHandler#onLivingHurt
// ==========================================

/**
 * 抛射体无敌帧重置处理。
 * @param {Object} event  LivingHurtEvent 事件对象
 * @param {Object} victim 受害者实体
 * @param {Object} source 伤害来源 DamageSource
 */
function handleProjectileIFrame(event, victim, source) {
    try {
        if (source === null || source === undefined) return;
        if (victim === null || victim === undefined) return;
        // 判断是否为抛射体伤害（DamageTypeTags.IS_PROJECTILE）
        if (source.is(DamageTypeTags.IS_PROJECTILE)) {
            // 立即重置无敌帧，使后续抛射体可继续造成伤害（修复多重射击）
            victim.invulnerableTime = 0;
        }
    } catch (err) {
        console.log(`[抛射体无敌帧] 执行失败: ${err}`);
    }
}
