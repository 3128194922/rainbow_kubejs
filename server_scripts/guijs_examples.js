// GUIJS 示例脚本（放入游戏实例的 kubejs/server_scripts/ 后 /reload 生效）
// 绑定名: GuiJS （仅 server_scripts 中可用）

// ---------------------------------------------------------------------------
// 1. 原版 GUI（无坐标 = 悬浮打开；不校验真实方块）
// ---------------------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    const { commands } = event

    event.register(
        commands.literal('guijs_open')
            .then(commands.literal('crafting').executes(ctx => {
                GuiJS.openVanilla(ctx.source.player, 'crafting')
                return 1
            }))
            .then(commands.literal('furnace').executes(ctx => {
                GuiJS.openVanilla(ctx.source.player, 'furnace')
                return 1
            }))
            .then(commands.literal('anvil').executes(ctx => {
                GuiJS.openVanilla(ctx.source.player, 'anvil')
                return 1
            }))
            .then(commands.literal('chest').executes(ctx => {
                GuiJS.openVanilla(ctx.source.player, 'chest')
                return 1
            }))
            .then(commands.literal('merchant').executes(ctx => {
                GuiJS.openVanilla(ctx.source.player, 'merchant')
                return 1
            }))
    )
})

// ---------------------------------------------------------------------------
// 2. 绑定真实方块打开（完全功能：容器数据/进度/点击行为全部为真实方块实体的）
//    绑定模式下优先使用该坐标方块实体自己的菜单
// ---------------------------------------------------------------------------
BlockEvents.rightClicked(event => {
    const { player, block } = event
    if (player.crouching) return // 潜行右键跳过

    // 例：右键熔炉时打开工作台
    if (block.id == 'minecraft:furnace') {
        GuiJS.openVanilla(player, 'crafting', block.pos) // 坐标仅为校验上下文
        return
    }

    // 例：右键石头时打开农夫乐事烹饪锅（该坐标必须是真实的烹饪锅方块）
    // GuiJS.open(player, 'farmersdelight:cooking_pot', block.pos)

    // 例：右键任意方块打开 Travelers 背包（打开玩家穿戴的背包）
    // GuiJS.open(player, 'travelersbackpack:backpack_item', buf => {
    //     buf.writeInt(2)   // screenID = WEARABLE_SCREEN_ID
    //     buf.writeInt(-1)  // entityId = -1 → 玩家自己穿戴的背包
    // })
})

// ---------------------------------------------------------------------------
// 3. 自定义行数的箱子（1-6 行，临时容器：关闭后内容不保存）
// ---------------------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    event.register(
        event.commands.literal('guijs_chest').executes(ctx => {
            GuiJS.openChest(ctx.source.player, '我的 6 行箱子', 6)
            return 1
        })
    )
})

// ---------------------------------------------------------------------------
// 4. KubeJS 内置回调式箱子 GUI（按钮/槽位点击事件）
//    button(列x 0-8, 行y 0-rows-1, 物品, 标题, 左键回调)
// ---------------------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    event.register(
        event.commands.literal('guijs_menu').executes(ctx => {
            const player = ctx.source.player

            GuiJS.openChestGUI(player, '技能选择', 3, gui => {
                gui.button(2, 1, 'minecraft:diamond', '攻击技能', click => {
                    player.tell('选择了攻击技能！')
                    player.closeContainer()
                })
                gui.button(4, 1, 'minecraft:emerald', '防御技能', click => {
                    player.tell('选择了防御技能！')
                    player.closeContainer()
                })
                gui.button(6, 1, 'minecraft:barrier', '关闭', click => {
                    player.closeContainer()
                })
            })
            return 1
        })
    )
})

// ---------------------------------------------------------------------------
// 5. 查询所有已注册的菜单（包括所有模组）
// ---------------------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    event.register(
        event.commands.literal('guijs_list').executes(ctx => {
            const player = ctx.source.player
            player.tell('已注册菜单总数: ' + GuiJS.listMenus().length)
            GuiJS.findMenus('pot').forEach(id => player.tell(' - ' + id))
            return 1
        })
    )
})

// ---------------------------------------------------------------------------
// 6. 打开事件监听
// ---------------------------------------------------------------------------
GUIJSEvents.opened(event => {
    console.info(`${event.player.name} 打开了 ${event.menuId}`)
})

// ---------------------------------------------------------------------------
// 7. 自定义 GUI 的按钮点击事件（配合 startup_scripts 里 GuiJS.createGui 定义的按钮）
// ---------------------------------------------------------------------------
GUIJSEvents.button(event => {
    const { player, guiId, buttonId, pos } = event

    if (guiId == 'admin_panel') {
        if (buttonId == 'heal') {
            player.health = player.maxHealth
        } else if (buttonId == 'day') {
            player.server.overworld.dayTime = 1000
        } else if (buttonId == 'close') {
            player.closeContainer()
        }
    }

    if (guiId == 'mini_furnace' && buttonId == 'start') {
        player.tell('熔炉已点火（演示：点火逻辑写在方块实体 tick 中）')
    }
})

// ---------------------------------------------------------------------------
// 8. 手动打开自定义 GUI（无需绑定方块）
// ---------------------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    event.register(
        event.commands.literal('guijs_admin').executes(ctx => {
            // 'admin_panel' 无方块锚点：纯按钮界面
            GuiJS.openCustom(ctx.source.player, 'admin_panel')
            return 1
        })
    )
})

// Create 模组界面示例（装了 Create 后可用）：
// GuiJS.open(player, 'create:package_port', block.pos)          // 直接可用（纯 BlockPos 载荷）
// GuiJS.open(player, 'create:schematic_table', block.pos)       // 内置 pos+NBT 模板
// GuiJS.open(player, 'create:toolbox', block.pos)               // 内置 pos+NBT 模板
// GuiJS.open(player, 'create:stock_keeper_request', block.pos)  // 内置专用模板
// 注意：create:filter 等手持物品界面依赖主手物品校验，不适用通用打开
