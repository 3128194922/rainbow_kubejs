// priority: 500
// ==========================================
// 🎭 面具伪装Tick效果脚本
// 根据面具伪装实体执行不同的Tick效果
// ==========================================

PlayerEvents.tick(event => {
    let player = event.player
    if (player.level.isClientSide()) return
    if (player.age % 20) return;
    
    let helmet = player.getItemBySlot("head")
    if (helmet.isEmpty()) return
    if (helmet.id !== "species:wicked_mask") return

    let nbt = helmet.getNbt()
    if (nbt == null) return

    let maskId = nbt.getString("id")
    if (!maskId) return

    switch (maskId) {
        case "minecraft:bat":
            player.potionEffects.add("minecraft:night_vision", 100, 0, false, false)
            break
    }
})
