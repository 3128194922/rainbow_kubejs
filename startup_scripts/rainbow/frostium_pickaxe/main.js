// 始冰镐：潜行右键切换 1x1/3x3/5x5/7x7，并在破坏事件中执行范围挖掘。

const FROSTIUM_PICKAXE_ID = 'rainbow:frostium_pickaxe'
const FROSTIUM_MODE_TAG = 'FrostiumMiningMode'
const FROSTIUM_AOE_GUARD_TAG = 'FrostiumAoeBreaking'
const FROSTIUM_PICKAXE_MINEABLE_TAG = 'minecraft:mineable/pickaxe'

function getFrostiumMode(item) {
    try {
        // KubeJS 2001 的 ItemStack 包装对象通过 nbt 读取标签，不支持 getTag()。
        let tag = item.nbt
        if (tag != null && tag.contains(FROSTIUM_MODE_TAG)) {
            let mode = tag.getInt(FROSTIUM_MODE_TAG)
            if (FROSTIUM_PICKAXE_MODES.indexOf(mode) >= 0) return mode
        }
    } catch (e) {
        console.log('读取始冰镐挖掘模式失败：')
        console.log(e)
    }
    return 1
}

function setFrostiumMode(item, mode) {
    try {
        // getOrCreateTag() 会直接修改原物品，不需要调用 KubeJS 中不存在的 setTag()。
        let tag = item.getOrCreateTag()
        tag.putInt(FROSTIUM_MODE_TAG, mode)
    } catch (e) {
        console.log('保存始冰镐挖掘模式失败：')
        console.log(e)
    }
}

function handleFrostiumModeSwitch(event) {
    try {
        let player = event.getEntity()
        let level = player.level
        let item = event.getItemStack()

        if (level.isClientSide()) return
        if (event.getHand() != InteractionHand.MAIN_HAND) return
        if (item == null || item.id != FROSTIUM_PICKAXE_ID) return
        if (!player.isShiftKeyDown()) return

        let currentMode = getFrostiumMode(item)
        let nextMode = getNextFrostiumMode(currentMode)
        setFrostiumMode(item, nextMode)
        // 只在实际切换时使用 KubeJS 内置 ActionBar 接口显示范围。
        player.setStatusMessage('§b始冰镐挖掘范围：§f' + nextMode + '×' + nextMode)

        event.setCancellationResult(InteractionResult.SUCCESS)
        event.setCanceled(true)
    } catch (e) {
        console.log('始冰镐切换挖掘范围失败：')
        console.log(e)
    }
}

function isFrostiumMineableBlock(level, targetPos) {
    try {
        // 范围挖掘只处理带有原版镐子挖掘标签的方块。
        let block = level.getBlock(targetPos)
        if (block == null || !block.hasTag(FROSTIUM_PICKAXE_MINEABLE_TAG)) return false

        // 负硬度代表方块不可破坏，例如基岩和屏障方块。
        let state = level.getBlockState(targetPos)
        if (state == null) return false
        return state.getDestroySpeed(level, targetPos) >= 0
    } catch (e) {
        console.log('判断始冰镐范围目标是否可挖掘失败：')
        console.log(e)
        return false
    }
}

// 对着空气右键时触发。
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent$RightClickItem', event => {
    handleFrostiumModeSwitch(event)
})

// 对着方块右键时补充监听，避免方块交互吞掉切换操作。
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent$RightClickBlock', event => {
    handleFrostiumModeSwitch(event)
})

ForgeEvents.onEvent('net.minecraftforge.event.level.BlockEvent$BreakEvent', event => {
    try {
        let level = event.getLevel()
        let player = event.getPlayer()
        if (level.isClientSide()) return
        if (player == null || !player.isPlayer()) return

        let item = player.getItemInHand('main_hand')
        if (item == null || item.id != FROSTIUM_PICKAXE_ID) return

        let persistentData = player.persistentData
        if (persistentData != null && persistentData.getBoolean(FROSTIUM_AOE_GUARD_TAG)) return
        if (event.isCanceled()) return

        let mode = getFrostiumMode(item)
        let center = event.getPos()
        let viewVector = player.getViewVector(1.0)
        let plane = null
        let hit = player.rayTrace(16, false)
        if (hit != null && hit.facing != null) {
            plane = getFrostiumPlaneFromFace(String(hit.facing.getName()))
        }
        if (plane == null) {
            plane = getFrostiumPlane({ x: viewVector.x(), y: viewVector.y(), z: viewVector.z() })
        }
        let targets = getFrostiumTargets(
            { x: center.getX(), y: center.getY(), z: center.getZ() },
            mode,
            plane
        )

        let centerPos = new BlockPos(center.getX(), center.getY(), center.getZ())
        if (!isFrostiumMineableBlock(level, centerPos)) return

        if (persistentData != null) persistentData.putBoolean(FROSTIUM_AOE_GUARD_TAG, true)
        event.setCanceled(true)

        try {
            for (let i = 0; i < targets.length; i++) {
                let target = targets[i]
                let targetPos = new BlockPos(target.x, target.y, target.z)
                if (targetPos.getY() < level.getMinBuildHeight() || targetPos.getY() >= level.getMaxBuildHeight()) continue
                if (!isFrostiumMineableBlock(level, targetPos)) continue
                player.gameMode.destroyBlock(targetPos)
            }
        } finally {
            if (persistentData != null) persistentData.putBoolean(FROSTIUM_AOE_GUARD_TAG, false)
        }
    } catch (e) {
        console.log('始冰镐范围挖掘失败：')
        console.log(e)
    }
})
