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
//
// 黑名单说明（写入 ID 自动识别匹配）：
//   - PROJECTILE_BLACKLIST：造成伤害的抛射体实体 ID（如 "minecraft:arrow"）
//   - ENTITY_BLACKLIST：受伤实体 ID（如 "minecraft:wither"）
//   - DAMAGE_TYPE_BLACKLIST：伤害类型 ID（如 "arrow"、"trident"）
//   - 命中任一黑名单则跳过本次无敌帧重置（保留原版无敌帧）
//   - 玩家默认不受优化影响（EXCLUDE_PLAYER = true）
// ==========================================

// ========== 黑名单配置（直接编辑数组即可） ==========
// 抛射体黑名单：造成伤害的抛射体实体 ID（在黑名单中的抛射体不触发无敌帧重置）
const PROJECTILE_BLACKLIST = [
    // 示例：'minecraft:arrow', 'minecraft:snowball', 'minecraft:trident',
];

// 实体黑名单：受伤实体 ID（在黑名单中的实体不被重置无敌帧）
const ENTITY_BLACKLIST = [
    // 示例：'minecraft:wither', 'minecraft:ender_dragon',
];

// 伤害类型黑名单：伤害类型 ID（在黑名单中的伤害类型不触发无敌帧重置）
const DAMAGE_TYPE_BLACKLIST = [
    // 示例：'arrow', 'trident', 'thrown',
];

// 玩家默认不受无敌帧优化影响（true = 玩家保留原版无敌帧；false = 玩家也受优化影响）
const EXCLUDE_PLAYER = true;

/**
 * 获取实体的注册 ID（如 "minecraft:arrow"）。
 * @param {Object} entity 实体对象
 * @returns {string|null} 注册 ID，获取失败返回 null
 */
function getEntityRegistryId(entity) {
    if (entity === null || entity === undefined) return null;
    try {
        let key = ForgeRegistries.ENTITY_TYPES.getKey(entity.getType());
        if (key === null) return null;
        return String(key);
    } catch (e) {
        return null;
    }
}

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

        // 玩家默认不受优化影响
        if (EXCLUDE_PLAYER && victim.isPlayer()) return;

        // 仅对抛射体伤害生效（DamageTypeTags.IS_PROJECTILE）
        if (!source.is(DamageTypeTags.IS_PROJECTILE)) return;

        // --- 实体黑名单检查（受伤实体 ID） ---
        let victimId = getEntityRegistryId(victim);
        if (victimId !== null && ENTITY_BLACKLIST.indexOf(victimId) !== -1) {
            return;
        }

        // --- 抛射体黑名单检查（造成伤害的抛射体 ID） ---
        // source.immediate 为直接造成伤害的实体（抛射体本身），source.actual 为射击者
        let projectile = source.immediate;
        if (projectile !== null && projectile !== undefined) {
            let projectileId = getEntityRegistryId(projectile);
            if (projectileId !== null && PROJECTILE_BLACKLIST.indexOf(projectileId) !== -1) {
                return;
            }
        }

        // --- 伤害类型黑名单检查 ---
        let damageType = source.getType();
        if (damageType !== null && damageType !== undefined) {
            let damageTypeStr = String(damageType);
            if (DAMAGE_TYPE_BLACKLIST.indexOf(damageTypeStr) !== -1) {
                return;
            }
        }

        // 立即重置无敌帧，使后续抛射体可继续造成伤害（修复多重射击）
        victim.invulnerableTime = 0;
    } catch (err) {
        console.log(`[抛射体无敌帧] 执行失败: ${err}`);
    }
}
