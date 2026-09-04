// 始冰镐客户端提示：手持始冰镐时，在快捷栏正上方显示当前挖掘范围。

const FROSTIUM_HUD_PICKAXE_ID = 'rainbow:frostium_pickaxe'
const FROSTIUM_HUD_MODE_TAG = 'FrostiumMiningMode'
const FROSTIUM_HUD_DEFAULT_MODE = 3

function getFrostiumHudMode(item) {
    try {
        if (item == null || item.id != FROSTIUM_HUD_PICKAXE_ID) return FROSTIUM_HUD_DEFAULT_MODE

        // KubeJS 2001 的客户端 ItemStack 通过 nbt 读取标签。
        let tag = item.nbt
        if (tag != null && tag.contains(FROSTIUM_HUD_MODE_TAG)) {
            let mode = tag.getInt(FROSTIUM_HUD_MODE_TAG)
            if (mode == 3 || mode == 5 || mode == 7) return mode
        }
    } catch (e) {
        console.log('[始冰镐提示] 读取挖掘范围失败：')
        console.log(e)
    }
    return FROSTIUM_HUD_DEFAULT_MODE
}

ClientEvents.tick(event => {
    try {
        let player = event.player
        if (player == null) return

        let item = player.getItemInHand('main_hand')
        let isFrostiumPickaxe = item != null && item.id == FROSTIUM_HUD_PICKAXE_ID
        let mode = getFrostiumHudMode(item)
        let paint = {
            frostium_mode_hud: {
                type: 'text',
                text: '当前挖掘范围：' + mode + '×' + mode,
                x: 0,
                y: -32,
                alignX: 'center',
                alignY: 'bottom',
                color: 'aqua',
                shadow: true,
                draw: 'ingame',
                visible: isFrostiumPickaxe
            }
        }
        player.paint(paint)
    } catch (e) {
        console.log('[始冰镐提示] 绘制挖掘范围失败：')
        console.log(e)
    }
})
