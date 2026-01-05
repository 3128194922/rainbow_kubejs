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
        'minecraft:heart_of_the_sea',
    ]);
});

// 注册 Ponder 场景
Ponder.registry((event) => {
    // 示例场景：绿色方块
    event.create("rainbow:greenblock")
        .scene(
            "our_first_scene",          // 场景ID
            "First example scene",      // 场景标题
            (scene, util) => {          // 场景脚本
                /*-------------------------------------------
                 * 结构展示
                 *-----------------------------------------*/
                scene.showStructure(); // 显示结构

                /*-------------------------------------------
                 * 动画与逻辑
                 *-----------------------------------------*/
                scene.idle(10); // 等待 0.5 秒

                // 生成苦力怕实体
                const creeperLink = scene.world.createEntity("creeper", [2.5, 1, 2.5]);

                // 文本提示
                scene.text(
                    60,                     // 时长
                    "Example text",         // 文本
                    [2.0, 2.5, 2.5]         // 位置
                )
                .colored(PonderPalette.RED)
                .placeNearTarget()
                .attachKeyFrame();

                // 操作提示
                scene.showControls(
                    60,
                    [2.5, 3, 2.5],
                    "down"
                )
                .rightClick()
                .withItem("shears")
                .whileSneaking();
            });
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

// 海洋之心（祈愿池）场景
Ponder.registry((event) => {
    event
        .create("minecraft:heart_of_the_sea")
        .scene("heart_of_the_sea", "祈愿池子", "rainbow:heart_of_the_sea", (scene, util) => {
            scene.idle(60);

            // 逐层显示结构
            for (let x = 0; x < 5; x++) {
                for (let z = 0; z < 5; z++) {
                    scene.world.showSection([x, 0, z], Facing.DOWN);
                }
                scene.idle(6);
            }

            for(let n = 1; n < 6; n++)
                {
                    scene.world.showSection([2, n, 2], Facing.DOWN);
                    scene.idle(6);
                }

            scene.text(
                60,
                "text1",
                [1,0,1]
            )
            .colored(PonderPalette.WHITE)
            .placeNearTarget()
            .attachKeyFrame();

            scene.text(
                60,
                "text2",
                [2,0,2]
            )
            .colored(PonderPalette.WHITE)
            .placeNearTarget()
            .attachKeyFrame();

            scene.idle(60);

            scene.text(
                60,
                "text3",
                [2,0,2]
            )
            .colored(PonderPalette.WHITE)
            .placeNearTarget()
            .attachKeyFrame();
        });
});