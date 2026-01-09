// 提前加载类，避免每tick反射
const Blocks = Java.loadClass("net.minecraft.world.level.block.Blocks")
const CreateStressRecipeCapability = Java.loadClass("com.lowdragmc.mbd2.integration.create.CreateStressRecipeCapability")
const Float = Java.loadClass("java.lang.Float")

MBDMachineEvents.onTick("mbd2:music_machine", event => {
    let machine = event.getEvent().getMachine()
    let level = machine.getLevel()

    if (level.isClientSide()) return

    // 每20 tick执行一次检测，优化性能
    if (level.getDayTime() %20) return

    let pos = machine.getPos()
    let recordSet = new Set()
    const scanRadius = 1

    // 遍历周围方块，逻辑参考 Registry.js
    for (let dx = -scanRadius; dx <= scanRadius; dx++) {
        for (let dy = -scanRadius; dy <= scanRadius; dy++) {
            for (let dz = -scanRadius; dz <= scanRadius; dz++) {
                let targetPos = pos.offset(dx, dy, dz)
                let state = level.getBlockState(targetPos)

                // 检查是否为唱片机
                if (state.getBlock() == Blocks.JUKEBOX) {
                    let be = level.getBlockEntity(targetPos)
                    if (be) {
                        let nbt = be.saveWithFullMetadata()
                        // 检查是否正在播放音乐并提取唱片 ID
                        if (nbt.getBoolean("IsPlaying")) {
                            let recordItem = nbt.getCompound("RecordItem")
                            let recordId = recordItem.getString("id")
                            if (recordId) {
                                // 强制转换为 JS String
                                let idStr = String(recordId)
                                
                                if(idStr == "minecraft:music_disc_11" || idStr == "rainbow:tem") {
                                    // music_disc_11 特殊处理：视为不同唱片，使用坐标区分，使其不被去重
                                    recordSet.add(idStr + "_" + targetPos.x + "_" + targetPos.y + "_" + targetPos.z)
                                } else {
                                    // 其他唱片：使用 Set 自动去重，实现“两个相同唱片的唱片机视为一个”
                                    recordSet.add(idStr)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 如果满足条件（有唱片播放），启用机器工作（相当于配方为 mbd2:music_machine）
    // 否则禁用机器工作（相当于配方为 mbd2:dummy）
    if(recordSet.size <= 0)
    {
        // 中断当前正在进行的配方
        machine.getRecipeLogic().interruptRecipe()
        machine.getRecipeLogic().setWorkingEnabled(false)
    }
    else
    {
        machine.getRecipeLogic().setWorkingEnabled(true)
        
        // 动态修改配方输出应力
        let lastRecipe = machine.getRecipeLogic().getLastRecipe()
        if (lastRecipe) {
            let CAP = CreateStressRecipeCapability.CAP
            let outputs = lastRecipe.outputs.get(CAP)
            
            if (outputs) {
                outputs.forEach(content => {
                    // 应力与唱片种类数量成正比 (512 * 种类数)
                    content.content = new Float(512.0 * recordSet.size)
                })
            }
        }
    }
    
})
