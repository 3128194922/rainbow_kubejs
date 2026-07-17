// client_scripts/eye_of_satori/camera_follow.js
// 觉之瞳 - 开眼蹲下时相机跟随射线检测到的实体

let isCameraFollowing = false
let currentTargetUUID = null

function setCameraEntity(entity) {
    let mc = $Minecraft.getInstance()
    let player = mc.player
    if (!entity || !player) return false
    if (entity.isAlive == null || !entity.isAlive()) return false
    if (entity.level !== player.level) return false
    mc.setCameraEntity(entity)
    mc.options.setCameraType($CameraType.THIRD_PERSON_BACK)
    return true
}

function resetCamera() {
    let mc = $Minecraft.getInstance()
    let player = mc.player
    if (!player) return false
    mc.setCameraEntity(player)
    mc.options.setCameraType($CameraType.THIRD_PERSON_BACK)
    return true
}

ClientEvents.tick(event => {
    try {
        let mc = $Minecraft.getInstance()
        let player = mc.player
        if (!player) return

        // 检查组是否有觉之瞳且开眼
        let hasEyeOpen = false
        try {
            let curios = player.curiosInventory
            if (curios) {
                for (let slot of curios.curios.values()) {
                    for (let stack of slot.getStacks().getAllItems()) {
                        if (stack.getId().toString() === 'rainbow:eye_of_satori') {
                            if (stack.nbt && stack.nbt.getBoolean('is_open')) {
                                hasEyeOpen = true
                            }
                            break
                        }
                    }
                    if (hasEyeOpen) break
                }
            }
        } catch (e) {
            // client curios inventory not available
        }

        if (!hasEyeOpen) {
            if (isCameraFollowing) {
                resetCamera()
                isCameraFollowing = false
                currentTargetUUID = null
            }
            return
        }

        // 已转移相机时只检测shift松开，不再进行射线检测
        if (isCameraFollowing) {
            if (!player.isShiftKeyDown()) {
                resetCamera()
                isCameraFollowing = false
                currentTargetUUID = null
            }
            return
        }

        // 未转移相机时，按下shift进行射线检测
        if (player.isShiftKeyDown()) {
            let hit = player.rayTrace(64)
            if (hit && hit.type === 'ENTITY' && hit.entity) {
                let target = hit.entity
                if (target.isAlive()) {
                    let targetUUID = target.uuid.toString()
                    if (currentTargetUUID !== targetUUID) {
                        let result = setCameraEntity(target)
                        if (result) {
                            isCameraFollowing = true
                            currentTargetUUID = targetUUID
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log('eye_of_satori camera follow error: ' + err)
    }
})
