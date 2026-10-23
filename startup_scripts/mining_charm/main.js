// 两个绝对角点覆盖箱子所在方块；同维度同坐标复用油漆 ID，刷新 Dyeing 自带计时器。
// WorldPaintRenderer 复用 FULL_BRIGHT 矩形表面渲染，保持透墙常亮且无需实体锚点。
function applyMiningCharmPaint(level, x, y, z) {
    try {
        let paintId = 'rainbow_mining_charm_' + String(level.dimension) + '_' + x + '_' + y + '_' + z
        Dyeing.worldPaint(level, paintId, {
            x1: x,
            y1: y,
            z1: z,
            x2: x + 1,
            y2: y + 1,
            z2: z + 1,
            type: 'static',
            color: 'FFFFC000',
            through_walls: true,
            duration_ticks: 120
        })
    } catch (error) {
        console.log('[猎宝者护符] 更新宝箱透视油漆失败: ' + error)
    }
}

// 猎宝者护符：每 5 秒扫描附近的 Lootr 箱子并刷新透墙常亮矩形油漆。
StartupEvents.registry('item', event => {
    event.create('rainbow:mining_charm')
        .rarity('epic')
        .maxStackSize(1)
        .tag('curios:charm')
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .modifyFortuneLevel((slotContext, lootContext, stack) => 3)
                .addAttribute('forge:entity_reach', 'mining_charm', 2.15, 'addition')
                .addAttribute('attributeslib:mining_speed', 'mining_charm', 0.1, 'multiply_base')
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity()
                    if (entity == null) return false
                    if (hasCurios(entity, 'rainbow:mining_charm')) return false
                    return true
                })
                .curioTick((slotContext, stack) => {
                    let player = slotContext.entity()
                    if (player == null) return
                    if (player.level.isClientSide()) return

                    // 每 5 秒扫描一次，油漆计时器设为 6 秒以覆盖扫描间隔。
                    if (!everyTicks(player, 100)) return

                    let level = player.level
                    let scanBox = new AABB(
                        player.getX() - 10, player.getY() - 5, player.getZ() - 10,
                        player.getX() + 10, player.getY() + 5, player.getZ() + 10
                    )

                    let minX = Math.floor(scanBox.minX)
                    let maxX = Math.floor(scanBox.maxX)
                    let minY = Math.floor(scanBox.minY)
                    let maxY = Math.floor(scanBox.maxY)
                    let minZ = Math.floor(scanBox.minZ)
                    let maxZ = Math.floor(scanBox.maxZ)

                    for (let x = minX; x <= maxX; x++) {
                        for (let y = minY; y <= maxY; y++) {
                            for (let z = minZ; z <= maxZ; z++) {
                                let block = level.getBlock(x, y, z)
                                if (block.id !== 'lootr:lootr_chest') continue

                                applyMiningCharmPaint(level, x, y, z)
                            }
                        }
                    }
                })
        )
})
