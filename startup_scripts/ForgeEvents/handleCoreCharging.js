// Priority: 5000
// ==========================================
// ⚡ 饰品充能事件处理脚本
// ==========================================

// 充能处理注册表
let CoreChargingRegistry = {};

/**
 * 注册饰品充能处理函数
 * @param {string} itemId 饰品ID
 * @param {function} handler 处理函数 (event, player, amount, victim) => void
 */
function registerCoreCharging(itemId, handler) {
    CoreChargingRegistry[itemId] = handler;
}

// ==========================================
// 充能逻辑定义区域
// ==========================================

// --- 充能配置表：itemId → 能量 NBT 字段名 ---
// 受击造成伤害时累计能量到饰品 NBT 字段，满 MAX_ENERGY 后停止累计并播放提示音效
// 满能量后由 Skillwheel.js 主动触发技能，触发时清零能量
const MAX_ENERGY = 100;
let CoreChargingConfig = {
    'rainbow:reload_core': 'Energy',
    'rainbow:short_core': 'Energy',
    'rainbow:fury_mask': 'Energy'
};

Object.keys(CoreChargingConfig).forEach(itemId => {
    registerCoreCharging(itemId, (event, player, amount, victim) => {
        if (player.cooldowns.isOnCooldown(itemId)) return;

        let stack = getCuriosItem(player, itemId);
        if (!stack) return;

        let nbt = stack.getOrCreateTag();
        let energyTag = CoreChargingConfig[itemId];
        let energy = nbt.getFloat(energyTag) || 0;
        if (energy < MAX_ENERGY) {
            nbt.putFloat(energyTag, Math.min(MAX_ENERGY, energy + amount));
        } else if (victim) {
            // 能量已满，播放提示音效（使用 victim 的位置）
            player.level.playSound(null, victim.getX(), victim.getY(), victim.getZ(), "minecraft:ui.button.click", "voice", 1, 1);
        }
    });
});

// ==========================================
// 主入口函数
// ==========================================
/**
 * 处理玩家造成伤害时为特定饰品充能
 * @param {Internal.LivingHurtEvent} event
 * @param {Internal.Entity} attacker 伤害来源的致因实体 (如玩家)
 * @param {Internal.Entity} victim 受害者实体
 */
function handleCoreCharging(event, attacker, victim, source, range_damage, thrown_damage, soure_magic, boom_damage) {
    if (!attacker || !attacker.isAlive()) return;

    let amount = event.getAmount();

    // 解析实际造成伤害的玩家（直接伤害或投射物所有者）
    let directEntity = source.immediate;
    let chargingPlayer = null;
    if (attacker.isPlayer()) {
        chargingPlayer = attacker;
    } else if (directEntity != null && directEntity.owner != null && directEntity.owner.isPlayer()) {
        chargingPlayer = directEntity.owner;
    }
    if (chargingPlayer == null) return;

    // 遍历已注册的充能处理函数
    Object.keys(CoreChargingRegistry).forEach(itemId => {
        if (!hasCurios(chargingPlayer, itemId)) return;
        CoreChargingRegistry[itemId](event, chargingPlayer, amount, victim);
    });
}
