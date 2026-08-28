// priority: 500
// ==========================================
// 🧠 Ponder (思索) 场景注册脚本
// ==========================================

// 注册 Ponder 标签
Ponder.tags((event) => {
    /**
     * "kubejs:getting_started" -> 标签ID
     * "rainbow:zero"        -> 图标物品
     * "Getting Started"        -> 标题
     * "This is a description"  -> 描述
     * [...items]               -> 默认包含的物品
     */
    event.createTag("kubejs:getting_started", "rainbow:zero", "Getting started.", "We ponder now!", [
        'alexsmobs:capsid',
    ]);
});

// 衣壳体思索场景
Ponder.registry((event) => {
    event.create('alexsmobs:capsid')
        .scene(
            "capsid",
            "衣壳体思索",
            (scene, util) => {
                scene.showStructure();
                scene.idle(10)
                // 在指定位置设置方块
                scene.world.setBlocks(
                    [2.5,1,2.5],
                    'alexsmobs:capsid',
                    true
                );
                scene.world.showSection([2.5,1,2.5], Direction.DOWN)

                scene.text(
                    60,
                    "ItemIntocapsid",
                    [2.5,1,2.5]
                )
                .colored(PonderPalette.WHITE)
                .placeNearTarget()
                .attachKeyFrame();

                scene.showControls(
                    60,
                    [2.5,1,2.5] ,
                    "down"
                )
                .rightClick()
                .withItem("collectorsreap:lime")
                
                scene.idle(20*3)
                scene.idle(20*2)

                scene.text(
                    60,
                    "ItemIntocapsid2",
                    [2.5,1,2.5]
                )
                .colored(PonderPalette.WHITE)
                .placeNearTarget()
                .attachKeyFrame();

                scene.addKeyframe()
            });
});