// priority: 5000
// ==========================================
// 圣主之血（rainbow:holy_blood） - 火焰易伤强制附着
// ==========================================
// 功能：
//   1. 圣主之血光环每秒向周围 5 格实体施加 rainbow:fire_vulnerability
//      （光环逻辑在 accessory_rebalance/main.js 的 holyBloodAura）。
//   2. 免疫实体分两类，依赖 morecallback 双事件覆盖（均在 main.js 注册本处理函数）：
//      a) 覆写 canBeAffected 的实体（灾变等模组Boss）→ MobEffectImmuneEvent，
//         setForceApply 走 forceAddEffect 直写路径；
//      b) 覆写 addEffect 直接丢弃有害效果的实体（安卡顽敌 anka_mobs 的 Boss，
//         基类 vzling BossEntity 仅放行有益效果，连 LivingEntity 路径都不走）
//         → MobEffectHighPriorityEvent，注入覆写内部最先回传并直写。
// 边界：
//   - 按效果ID过滤，其他药水（中毒、凋零等）的免疫判定不受影响；
//   - 非免疫实体原本就 allowed，不设置 forceApply，维持原版判定路径；
//   - 旧 CanBeAffectedEvent 在实体免疫时已不会触发（头部先被拒），勿回退使用；
//   - 强制写入会取消原方法，两个事件不会对同一附着重复生效。
// ==========================================

const HOLY_BLOOD_EFFECT_ID = 'rainbow:fire_vulnerability';

function handleHolyBloodForceAttach(event) {
    try {
        // getEffectId() 返回 Java String，用 String() 归一化后再比较。
        // MobEffectImmuneEvent 与 MobEffectHighPriorityEvent 均提供该 API。
        if (String(event.getEffectId()) == HOLY_BLOOD_EFFECT_ID) {
            event.setForceApply(true);
        }
    } catch (e) { console.log('[圣主之血] 强制附着判定失败: ' + e); }
}
