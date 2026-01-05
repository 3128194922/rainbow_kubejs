// priority: 500
// ==========================================
// 🛠️ 客户端事件处理脚本
// ==========================================

// 隐藏 JEI 中的物品
JEIEvents.hideItems(event => {
    // 隐藏我的世界原版结构方块
    event.hide('minecraft:structure_block')
    // 隐藏我的世界原版拼图方块
    event.hide('minecraft:jigsaw')
    // 隐藏我的世界原版屏障
    event.hide('minecraft:barrier')
    // 隐藏我的世界原版调试棒
    event.hide('minecraft:debug_stick')
    // 隐藏我的世界原版命令方块
    event.hide('minecraft:command_block')
    event.hide('minecraft:chain_command_block')
    event.hide('minecraft:repeating_command_block')
    event.hide('minecraft:command_block_minecart')
})

// 添加 JEI 物品信息
JEIEvents.information(event => {
    // 为彩虹大便添加说明
    event.addItem('rainbow:shit', [
        '虽然看起来很恶心，但是很有用',
        '可以作为通用的堆肥原料',
        '也可以用于合成各种奇怪的东西'
    ])
})