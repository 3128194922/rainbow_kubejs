// priority: 0
StartupEvents.registry("block", event => {
    //隐藏房门
    event.create("rainbow:fake_block", "basic")
    .displayName("后室")
    .unbreakable()
    .hardness(-1)
    .noDrops()
    .model("minecraft:block/yellow_concrete")
    .noCollision()

    //基岩黄色粘土
    event.create("rainbow:bedrock_block", "basic")
    .displayName("后室")
    .unbreakable()
    .hardness(-1)
    .noDrops()
    .model("minecraft:block/yellow_concrete")
    

    //基岩海晶灯
    event.create("rainbow:bedrock_sea_lantern", "basic")
    .displayName("后室")
    .unbreakable()
    .hardness(-1)
    .noDrops()
    .model("minecraft:block/sea_lantern")
    .lightLevel(1.0)

})