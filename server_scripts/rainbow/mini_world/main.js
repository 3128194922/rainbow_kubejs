// 小宇宙物品：服务端右键进入个人世界，个人世界内返回进入前的位置。
const MINI_WORLD_ITEM_ID = 'rainbow:mini_world'
const MINI_WORLD_COOLDOWN_TICKS = 20
const MINI_WORLD_RETURN_VALID = 'MiniWorldReturnValid'
const MINI_WORLD_RETURN_DIMENSION = 'MiniWorldReturnDimension'
const MINI_WORLD_RETURN_X = 'MiniWorldReturnX'
const MINI_WORLD_RETURN_Y = 'MiniWorldReturnY'
const MINI_WORLD_RETURN_Z = 'MiniWorldReturnZ'
const MINI_WORLD_RETURN_YAW = 'MiniWorldReturnYaw'
const MINI_WORLD_RETURN_PITCH = 'MiniWorldReturnPitch'

function getCurrentDimensionId(level) {
    try {
        if (level == null) return null
        let dimension = level.dimension
        if (dimension != null && typeof dimension.location == 'function') {
            return String(dimension.location())
        }
        let value = String(dimension)
        let separator = value.lastIndexOf(' / ')
        if (value.indexOf('ResourceKey[') == 0 && separator >= 0) {
            value = value.substring(separator + 3)
            if (value.endsWith(']')) value = value.substring(0, value.length - 1)
        }
        return value
    } catch (error) {
        console.log('[小宇宙] 获取当前维度失败: ' + error)
        return null
    }
}

function getMiniWorldDimensionId(player) {
    try {
        if (player == null || player.server == null) return null
        let dimensionId = MiniWorldApi.getDimensionId(player.server, player.getUuid())
        if (dimensionId == null) return null
        return String(dimensionId)
    } catch (error) {
        console.log('[小宇宙] 获取个人世界维度失败: ' + error)
        return null
    }
}

function isOwnMiniWorld(player) {
    try {
        let currentDimensionId = getCurrentDimensionId(player.level)
        let miniWorldDimensionId = getMiniWorldDimensionId(player)
        return currentDimensionId != null && miniWorldDimensionId != null && currentDimensionId == miniWorldDimensionId
    } catch (error) {
        console.log('[小宇宙] 判断个人世界失败: ' + error)
        return false
    }
}

function saveReturnPoint(player) {
    try {
        let dimensionId = getCurrentDimensionId(player.level)
        if (dimensionId == null) return false
        let data = player.persistentData
        data.putString(MINI_WORLD_RETURN_DIMENSION, dimensionId)
        data.putDouble(MINI_WORLD_RETURN_X, Number(player.x))
        data.putDouble(MINI_WORLD_RETURN_Y, Number(player.y))
        data.putDouble(MINI_WORLD_RETURN_Z, Number(player.z))
        data.putFloat(MINI_WORLD_RETURN_YAW, Number(player.yaw))
        data.putFloat(MINI_WORLD_RETURN_PITCH, Number(player.pitch))
        data.putBoolean(MINI_WORLD_RETURN_VALID, true)
        return true
    } catch (error) {
        console.log('[小宇宙] 保存返回位置失败: ' + error)
        return false
    }
}

function clearReturnPoint(player) {
    try {
        let data = player.persistentData
        data.remove(MINI_WORLD_RETURN_VALID)
        data.remove(MINI_WORLD_RETURN_DIMENSION)
        data.remove(MINI_WORLD_RETURN_X)
        data.remove(MINI_WORLD_RETURN_Y)
        data.remove(MINI_WORLD_RETURN_Z)
        data.remove(MINI_WORLD_RETURN_YAW)
        data.remove(MINI_WORLD_RETURN_PITCH)
    } catch (error) {
        console.log('[小宇宙] 清除返回位置失败: ' + error)
    }
}

function returnToSavedPoint(player) {
    try {
        let data = player.persistentData
        if (!data.getBoolean(MINI_WORLD_RETURN_VALID)) {
            let fallbackSuccess = MiniWorldApi.returnToOverworld(player)
            if (fallbackSuccess) clearReturnPoint(player)
            return fallbackSuccess
        }

        let dimensionId = data.getString(MINI_WORLD_RETURN_DIMENSION)
        if (dimensionId == null || dimensionId.length <= 0) {
            let fallbackSuccess = MiniWorldApi.returnToOverworld(player)
            if (fallbackSuccess) clearReturnPoint(player)
            return fallbackSuccess
        }

        player.teleportTo(
            dimensionId,
            data.getDouble(MINI_WORLD_RETURN_X),
            data.getDouble(MINI_WORLD_RETURN_Y),
            data.getDouble(MINI_WORLD_RETURN_Z),
            data.getFloat(MINI_WORLD_RETURN_YAW),
            data.getFloat(MINI_WORLD_RETURN_PITCH)
        )
        clearReturnPoint(player)
        return true
    } catch (error) {
        console.log('[小宇宙] 返回进入前位置失败: ' + error)
        return false
    }
}

ItemEvents.rightClicked('rainbow:mini_world', event => {
    let player = event.player
    if (player == null) return
    let success = false

    try {
        let level = player.level
        // KubeJS 6 中必须调用端侧判定方法；直接判断方法对象会让服务端右键也提前退出。
        if (level == null || level.isClientSide()) return
        if (player.cooldowns.isOnCooldown(MINI_WORLD_ITEM_ID)) return

        if (isOwnMiniWorld(player)) {
            success = returnToSavedPoint(player)
        } else {
            let saved = saveReturnPoint(player)
            if (saved) {
                success = MiniWorldApi.enter(player)
                if (!success) clearReturnPoint(player)
            }
        }

        if (success) {
            player.cooldowns.addCooldown(MINI_WORLD_ITEM_ID, MINI_WORLD_COOLDOWN_TICKS)
        }
    } catch (error) {
        console.log('[小宇宙] 右键处理失败: ' + error)
    }

    // cancel 通过抛出 EventExit 正常结束事件，必须放在业务 try/catch 外避免吞掉取消结果。
    if (success) event.cancel()
})
