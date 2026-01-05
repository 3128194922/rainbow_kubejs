// priority: 500
// ==========================================
// 💡 物品提示信息脚本
// ==========================================

ItemEvents.tooltip(event => {
    // 为彩虹大便添加提示
    event.add('rainbow:shit', '§6这是一坨有味道的物品')
    
    // 为所有带有 "rainbow:food" 标签的物品添加提示
    event.addAdvanced('#rainbow:food', (item, advanced, text) => {
        if (!event.isShiftKeyDown()) {
            text.add(1, '§8[按住 Shift 查看更多信息]')
        } else {
            text.add(1, '§a这是一个被标记为食物的物品')
        }
    })
})