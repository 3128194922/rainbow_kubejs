// priority: 1000
// ==========================================
// 💧 注册流体
// ==========================================
StartupEvents.registry("fluid", event => {
    // 黄铜液体：自定义纹理颜色，无桶，无方块
    //event.create("rainbow:brass_fluid").thickTexture(0xF3E03B).noBucket().noBlock()
    // 铜液体：自定义纹理颜色，无桶，无方块
    //event.create("rainbow:copper_fluid").thickTexture(0xFA842B).noBucket().noBlock()
    // 石油 (710液体)：黑色纹理，高密度，高粘度，稀有，无方块
    event.create("rainbow:oil").thickTexture("BLACK")
        .density(2200)
        .viscosity(2200)
        .rarity('rare')
        .noBlock()

    // 液态逻辑：自定义纹理，高温度，高粘度，高密度，绿色桶，稀有，无方块
    event.create("rainbow:number_water")
        .thickTexture("GREEN")
        .temperature(1000)
        .viscosity(1500)
        .density(6000)
        .bucketColor("GREEN")
        .noBlock()
        .rarity('rare')
})