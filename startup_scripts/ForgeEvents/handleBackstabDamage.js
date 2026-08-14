// priority: 10000
// ==========================================
// 背刺判定 - 最高优先级处理
// Backstab Judgment - highest priority handler
// ==========================================
// 逻辑：当玩家处于隐匿状态（isStealth）且从目标背后攻击（背刺角度判定）时，伤害 ×2。
// 隐匿状态读取：global.getStealthState（startup_scripts/stealth_system/main.js）
// 背面判定：复用 FarmersDelight 背刺附魔的静态方法
//   BackstabbingEnchantment.isLookingBehindTarget(target, attackerPosition)，
//   判定水平夹角 > 120°（点积 < -0.5）。
// 位置：LivingHurtEvent（玩家受伤时主入口）中第一个执行，防止被后续伤害组乘影响。
// ==========================================

/**
 * 背刺伤害处理（最高优先级）。
 * @param {Object} event    LivingHurtEvent 事件对象
 * @param {Object} attacker 攻击者实体
 * @param {Object} victim   受害者实体
 */
function handleBackstabDamage(event, attacker, victim) {
    try {
        // 未加载到 FarmersDelight 类（未装 mod）时直接跳过
        if (BackstabbingEnchantment === null) return;
        if (BackstabbingEnchantment === undefined) return;

        // 攻击者必须是玩家
        if (attacker === null) return;
        if (attacker === undefined) return;
        if (typeof attacker.isPlayer !== 'function') return;
        if (!attacker.isPlayer()) return;

        // 玩家必须处于隐匿状态（非隐匿不做背刺判定）
        if (global.getStealthState(attacker) !== true) return;

        // 背刺背面判定：攻击者在目标正背后 ±60° 水平锥形内
        let isBackstab = BackstabbingEnchantment.isLookingBehindTarget(victim, attacker.position());
        if (!isBackstab) return;

        // 满足条件：伤害 ×2
        let originalAmount = event.getAmount();
        event.setAmount(originalAmount * 2);

        // 泣血之刃：背刺时恢复背刺伤害50%的血量
        if (hasCurios(attacker, 'rainbow:bloody_blade')) {
            let healAmount = event.getAmount() * 0.5;
            attacker.heal(healAmount);
        }
        //console.log(`[背刺判定] ${String(attacker.getName())} 隐匿背刺 ${String(victim.getName())}，伤害 ${originalAmount} -> ${event.getAmount()}`);
    } catch (err) {
        console.log(`[背刺判定] 执行失败: ${err}`);
    }
}