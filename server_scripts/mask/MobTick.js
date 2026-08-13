// priority: 500
// ==========================================
// 🎭 面具伪装Tick效果脚本
// 根据面具伪装实体执行不同的Tick效果
// ==========================================

// 面具Tick效果注册表
let MaskTickRegistry = {};

/**
 * 注册面具Tick效果处理函数
 * @param {string} maskId 面具ID
 * @param {function} handler 处理函数 (event, player) => void
 */
function registerMaskTick(maskId, handler) {
    MaskTickRegistry[maskId] = handler;
}

// --- 蝙蝠面具 ---
// 每1秒刷新夜视效果
registerMaskTick("minecraft:bat", (event, player) => {
    player.potionEffects.add("minecraft:night_vision", 400, 0, false, false);
});

PlayerEvents.tick(event => {
    let player = event.player
    if (player.level.isClientSide()) return
    if (player.age % 20 != 0) return;
    
    let helmet = player.getItemBySlot("head")
    if (helmet.isEmpty()) return
    if (helmet.id !== "species:wicked_mask") return

    let nbt = helmet.getNbt()
    if (nbt == null) return

    let maskId = nbt.getString("id")
    if (!maskId) return

    // 从注册表查表执行对应面具的Tick效果
    let handler = MaskTickRegistry[maskId];
    if (!handler) return;
    try {
        handler(event, player);
    } catch (error) {
        console.error(`面具Tick效果执行出错 [${maskId}]: ${error}`);
    }
});