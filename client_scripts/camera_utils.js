// client_scripts/camera_utils.js
// 视角切换工具函数

ClientEvents.init(event => {
    const Minecraft = Java.loadClass("net.minecraft.client.Minecraft")
    const CameraType = Java.loadClass("net.minecraft.client.CameraType")

    global.setCameraEntity = function(entity) {
        const mc = Minecraft.getInstance()
        const player = mc.player
        if (!entity || !player) return false
        if (entity.isAlive == null || !entity.isAlive()) return false
        if (entity.level !== player.level) return false
        mc.setCameraEntity(entity)
        mc.options.setCameraType(CameraType.THIRD_PERSON_BACK)
        return true
    }

    global.resetCamera = function() {
        const mc = Minecraft.getInstance()
        const player = mc.player
        if (!player) return false
        mc.setCameraEntity(player)
        mc.options.setCameraType(CameraType.THIRD_PERSON_BACK)
        return true
    }

    console.log("Camera utils loaded")
})
