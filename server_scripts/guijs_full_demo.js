// ============================================================
// GUIJS 全功能演示（server_scripts，/reload 生效）
// 打开已有 GUI：原版 19 种 / 任意模组菜单 / Create 兼容
// 事件监听：opened / button（全局）
// ============================================================

// ------------------------------------------------------------
// 统一演示命令 /guijs_demo <类型>
// ------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    const { commands } = event

    const openVanillaDemo = name => commands.literal(name).executes(ctx => {
        GuiJS.openVanilla(ctx.source.player, name)      // 原版 GUI 全家桶（19 种）
        return 1
    })

    event.register(
        commands.literal('guijs_demo')
            // 原版 GUI（示例 4 种，其余：blast_furnace smoker anvil smithing enchanting_table
            // brewing_stand dispenser hopper shulker_box beacon lectern loom grindstone
            // cartography_table merchant 同理）
            .then(openVanillaDemo('crafting'))
            .then(openVanillaDemo('furnace'))
            .then(openVanillaDemo('chest'))
            .then(openVanillaDemo('stonecutter'))
            // 自定义行数箱子
            .then(commands.literal('bigchest').executes(ctx => {
                GuiJS.openChest(ctx.source.player, '6 行大箱子', 6)
                return 1
            }))
            // 管理面板（自定义 GUI，无锚点方块）
            .then(commands.literal('admin').executes(ctx => {
                GuiJS.openCustom(ctx.source.player, 'admin_panel')
                return 1
            }))
    )
})

// ------------------------------------------------------------
// 打开任意模组的 GUI（按菜单类型 ID，装了对应模组才可用）
// 坐标绑定真实方块 → 完全功能；内置模板覆盖 Create 等特殊载荷
// ------------------------------------------------------------
BlockEvents.rightClicked(event => {
    const { player, block } = event
    if (player.crouching) return

    // 农夫乐事烹饪锅（绑定真实方块 → 原厂菜单，完全功能）
    // GuiJS.open(player, 'farmersdelight:cooking_pot', block.pos)

    // Create（6.0.8）：以下菜单可直接打开
    // GuiJS.open(player, 'create:package_port', block.pos)        // 纯 BlockPos 载荷
    // GuiJS.open(player, 'create:schematic_table', block.pos)     // 内置 pos+NBT 模板
    // GuiJS.open(player, 'create:toolbox', block.pos)             // 内置 pos+NBT 模板
    // GuiJS.open(player, 'create:stock_keeper_request', block.pos)// 内置专用模板

    // 手写网络载荷示例：打开玩家穿戴的 Travelers 背包
    // GuiJS.open(player, 'travelersbackpack:backpack_item', buf => {
    //     buf.writeInt(2)    // screenID = 穿戴界面
    //     buf.writeInt(-1)   // entityId = -1 → 玩家自己
    // })
})

// ------------------------------------------------------------
// 全局事件：菜单打开 / 按钮点击（按钮也可用 createGui 里的直接回调）
// ------------------------------------------------------------
GUIJSEvents.opened(event => {
    console.info(`[demo] ${event.player.name} 打开了 ${event.menuId}`)
})

GUIJSEvents.button(event => {
    // 没有直接回调的按钮会走到这里（两种方式可混用）
    if (event.guiId == 'admin_panel' && event.buttonId == 'day') {
        console.info('[demo] 通过全局事件处理白天按钮')
    }
})

// ------------------------------------------------------------
// 查询：所有已注册菜单（含全部模组）
// ------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    event.register(
        event.commands.literal('guijs_list').executes(ctx => {
            const player = ctx.source.player
            player.tell('已注册菜单总数: ' + GuiJS.listMenus().length)
            GuiJS.findMenus('create').forEach(id => player.tell(' - ' + id))
            return 1
        })
    )
})
