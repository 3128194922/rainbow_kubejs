// ============================================================
// GUIJS 全功能演示（startup_scripts，需重启游戏）
// 基于 KubeJS 2001.6.5 原生 API；GUIJS 自动补齐容器能力：
//   漏斗/管道兼容（Forge capability）、破坏方块时掉落内容物
// 注意：上游 KubeJS 没有 comparatorOutput / neighborChanged / signal /
//   onLoad / onUnload 方块实体回调（那些是补丁版能力），
//   本演示的红石感知改为在 serverTick 中轮询 getBestNeighborSignal
// ============================================================

StartupEvents.registry('block', event => {

    // --------------------------------------------------------
    // 1. 红石机器 —— 原生 enableSync + serverTick 演示
    //    每 20 tick 轮询邻居红石信号：通电时进度条满格，标签显示信号强度
    // --------------------------------------------------------
    event.create('redstone_machine', 'basic')
        .hardness(2.0)
        .blockEntity(info => {
            info.inventory(1, 2, Ingredient.of('#forge:ingots'))   // 2 格，漏斗只进锭
            info.enableSync()   // 【原生能力】data 标签自动同步到客户端

            // 每 20 tick 轮询红石（替代补丁版的 neighborChanged 回调）
            info.serverTick(20, 0, entity => {
                try {
                    const level = entity.getBlock().getLevel()
                    const pos = entity.getBlock().pos
                    const signal = level.getBestNeighborSignal(pos)

                    // GUI 动态数据桥：guijs0=供电进度(0..10000) guijs1=红石信号强度(0..15)
                    entity.data.putBoolean('powered', signal > 0)
                    entity.data.putInt('guijs0', signal > 0 ? 10000 : 0)
                    entity.data.putInt('guijs1', signal)
                    entity.save()
                } catch (e) {
                    console.log(`[redstone_machine] tick 异常: ${e}`)
                }
            })
        })

    // --------------------------------------------------------
    // 2. JS 木桶 —— 漏斗/管道兼容 + 破坏掉落（GUIJS 自动补齐）
    // --------------------------------------------------------
    event.create('js_barrel', 'basic')
        .hardness(1.5)
        .blockEntity(info => {
            // 3x4=12 格：0-8 主容器 + 9 为锁定奖励槽；inputFilter 三条路径统一只收原木
            info.inventory(3, 4, Ingredient.of('#minecraft:logs'))

            // 每 20 tick 把桶内物品总数写入 guijs0（GUI 标签读取）
            info.serverTick(20, 0, entity => {
                try {
                    const inv = entity.inventory
                    let count = 0
                    for (let i = 0; i < inv.getContainerSize(); i++) {
                        count += inv.getItem(i).count
                    }
                    entity.data.putInt('guijs0', count)
                } catch (e) {
                    console.log(`[js_barrel] tick 异常: ${e}`)
                }
            })
        })

    // --------------------------------------------------------
    // 3. 注册方块完成 —— 右键绑定 GUI（见下方 GUI 定义）
    // --------------------------------------------------------
})

// ============================================================
// 自定义 GUI 定义（模块化锚点布局 + Java 级槽位控制）
// ============================================================

// 红石机器状态面板：动态文本 + 进度条 + 手动槽位
GuiJS.createGui('redstone_machine', gui => {
    gui.title('红石机器')
    gui.size(176, 120)

    gui.anchor('center', 'top')
    gui.grid(0, 1, 2, 0, 20)                            // 容器槽 0-1（只收锭）
    gui.progress('power', 0, 62, 100, 12, 0)            // 供电状态（data.guijs0）
    gui.dataLabel(0, 80, 1, '红石信号强度: ')            // 动态数值文本（data.guijs1）

    gui.playerInventory()
})

// JS 木桶 GUI：槽位过滤 + 锁定奖励槽 + 取出回调
GuiJS.createGui('js_barrel', gui => {
    gui.title('JS 木桶')
    gui.size(176, 150)

    gui.anchor('center', 'top')
    gui.grid(0, 3, 3, 0, 18)                            // 9 格主容器
        .filter(Ingredient.of('#minecraft:logs'))       // 与 inputFilter 一致

    gui.slot(9, 0, 78)                                  // 奖励槽（容器索引 9 需扩展容器；此处演示锁定槽）
        .locked()
        .onTake(event => {
            event.player.give('minecraft:emerald')
            event.player.tell('领取了奖励！')
        })

    gui.dataLabel(0, 100, 0, '桶内物品数: ')
    gui.playerInventory()
})

// 管理面板：按钮直接绑定 JS 函数
GuiJS.createGui('admin_panel', gui => {
    gui.title('管理面板')
    gui.size(200, 110)
    gui.anchor('center', 'top')
    gui.button('heal', 0, 25, 80, 18, '回满血', event => {
        event.player.health = event.player.maxHealth
    })
    gui.button('day', 0, 50, 80, 18, '设置白天', event => {
        event.player.server.overworld.dayTime = 1000
    })
    gui.button('close', 0, 75, 80, 18, '关闭', event => {
        event.player.closeContainer()
    })
})

// 右键绑定：直接打开对应 GUI
GuiJS.bindBlock('kubejs:redstone_machine', 'redstone_machine')
GuiJS.bindBlock('kubejs:js_barrel', 'js_barrel')
