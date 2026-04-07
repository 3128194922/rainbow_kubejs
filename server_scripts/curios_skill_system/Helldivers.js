// priority: 0
// ==========================================
// 🖱️ 饰品技能UI交互脚本
// ==========================================

// 技能注册表
let MagicRegistry = {};
let MagicSoundRegistry = {};

/**
 * 注册技能音效
 * @param {string} itemId 饰品ID
 * @param {string} soundId 音效ID
 */
function registerMagicSound(itemId, soundId) {
    MagicSoundRegistry[itemId] = soundId;
}

/**
 * 注册技能处理函数
 * @param {string} itemId 饰品ID
 * @param {function} handler 处理函数 (event, player, itemStack, isSubmenu, submenuIndex) => void
 */
function registerMagic(itemId, handler) {
    MagicRegistry[itemId] = handler;
}

function getPacketItemStack(player, sourceType, slotIndex, slotName, itemId) {
    if (sourceType === "curios") {
        let s = slotName != null ? getCuriosIndex(player, String(slotName), slotIndex) : null;
        if (!s || s.isEmpty() || (itemId && s.id != itemId)) {
            s = getCuriosItem(player, String(itemId));
        }
        return s;
    }
    return getVanillaItem(player, sourceType, slotIndex, slotName);
}


// ==========================================
// 主入口逻辑
// ==========================================

NetworkEvents.dataReceived('helldivers', event => {
    let player = event.player;
    let packetItem = event.data.item;
    console.log(event.data)//{item:"rainbow:fire_magic",player:"Ilker_Uniye",spell:{cd:120,count:2,count_cd:10,runtime_count:0,runtime_full_cd_end:51293L,runtime_next_use:0L}} [net.minecraft.nbt.CompoundTag]

    if (!packetItem) return;

    // 获取物品ID
    let itemId = packetItem.id;

    // 播放音效
    let soundId = MagicSoundRegistry[itemId] || "rainbow:voice.Magicwheel";
    player.level.playSound(null, player.getX(), player.getY(), player.getZ(), soundId, "voice", 1, 1)

    let handler = MagicRegistry[itemId];
    if (!handler) return;
    try {
        handler(event, player, itemStack, isSubmenu, submenuIndex);
    } catch (error) {
        console.error(`Error executing Magic for ${itemId}: ${error}`);
        player.tell(Text.red(`技能执行出错: ${error}`));
    }
});
