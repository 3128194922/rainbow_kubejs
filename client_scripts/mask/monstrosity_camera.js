// client_scripts/mask/monstrosity_camera.js
// 烛心面具 - 巨兽技能：玩家处于观察者模式并观战 cataclysm:netherite_monstrosity 时，
// 强制第三人称后背视角，从巨兽身后观战扇形冲击波技能（服务端由 Skillwheel.js 的
// cataclysm:netherite_monstrosity 分支负责召唤/观战/恢复逻辑）

const ForgeRegistries = Java.loadClass("net.minecraftforge.registries.ForgeRegistries")

ClientEvents.tick(event => {
    try {
        let mc = $Minecraft.getInstance()
        let player = mc.player
        if (!player) return

        // 仅观察者模式下生效（服务端技能期间玩家为 spectator）
        let isSpectator = player.isSpectator()

        if (!isSpectator) return

        let cam = mc.getCameraEntity()
        if (!cam) return

        // 判断相机目标实体是否为巨兽（兼容 getType() 返回 String 或 EntityType 两种情况）
        let isMonstrosity = false
        let tid = cam.getType()
        if (typeof tid === 'string') {
            isMonstrosity = (tid === 'cataclysm:netherite_monstrosity')
        } else {
            try {
                let key = ForgeRegistries.ENTITY_TYPES.getKey(tid)
                isMonstrosity = (key != null && key.toString() === 'cataclysm:netherite_monstrosity')
            } catch (e) { }
        }
        if (!isMonstrosity) return

        // 强制第三人称后背视角（视角跟随巨兽，观战扇形冲击波技能）
        if (mc.options.getCameraType() !== $CameraType.THIRD_PERSON_BACK) {
            mc.options.setCameraType($CameraType.THIRD_PERSON_BACK)
        }
    } catch (err) {
        console.log('monstrosity camera error: ' + err)
    }
})