// for 1.18 pls use: onEvent("ponder.tag", event => { ... })
Ponder.tags((event) => {
    /**
     * "kubejs:getting_started" -> the tag name
     * "rainbow:zero"        -> the icon
     * "Getting Started"        -> the title
     * "This is a description"  -> the description
     * [...items]               -> default items
     */
    event.createTag("kubejs:getting_started", "rainbow:zero", "Getting started.", "We ponder now!", [
        // some default items
        'alexsmobs:capsid',
        'minecraft:heart_of_the_sea',
    ]);
});

// 为1.18版本使用事件注册器（KubeJS 5.0+语法）
//onEvent("ponder.registry", event => {
    // 注册一个Ponder场景（交互式教程）
Ponder.registry((event) => {
        // 创建一个以"纸"为图标的Ponder条目
        event.create("rainbow:greenblock")
            .scene(
                "our_first_scene",          // 场景ID（需唯一）
                "First example scene",      // 场景标题（显示在UI中）
                (scene, util) => {          // 场景内容回调函数
                /*-------------------------------------------
                 * 结构展示部分
                 *-----------------------------------------*/
                /**
                 * 显示完整结构（默认5x5范围）
                 * 替代方案：`scene.showBasePlate()` 仅显示基座
                 * 用途：用于动画化结构的不同部分
                 */
                scene.showStructure();
                
                /**
                 * 手动设置结构边界（当自定义结构没有预设边界时使用）
                 * 注意：`showStructure()`会自动设置边界
                 */
                // scene.encapsulateBounds(blockPos)

                /*-------------------------------------------
                 * 时间控制
                 *-----------------------------------------*/
                /**
                 * 等待指定时间（20 ticks = 1秒）
                 * 参数可以是ticks或seconds（如idleSeconds(0.5)）
                 */
                scene.idle(10);

                /*-------------------------------------------
                 * 实体生成
                 *-----------------------------------------*/
                /**
                 * 生成一个苦力怕实体（返回Create模组的实体引用）
                 * 坐标[x, y, z]可以用任何KubeJS支持的格式表示
                 * 警告：不要直接修改该实体！
                 */
                const creeperLink = scene.world.createEntity("creeper", [2.5, 1, 2.5]);

                /*-------------------------------------------
                 * 文本提示
                 *-----------------------------------------*/
                scene.text(
                    60,                     // 显示时长（ticks）
                    "Example text",         // 文本内容
                    [2.0, 2.5, 2.5]        // 文本指向的坐标
                )
                .colored(PonderPalette.RED) // 设置文本颜色（RED/绿色/蓝色等）
                .placeNearTarget()          // 使文本更靠近目标位置
                .attachKeyFrame();          // 添加关键帧（用于动画时序）

                /*-------------------------------------------
                 * 交互控制提示
                 *-----------------------------------------*/
                scene.showControls(
                    60,                     // 显示时长（ticks）
                    [2.5, 3, 2.5],         // 提示指向的坐标
                    "down"                  // 提示方向（"up"/"left"等）
                )
                .rightClick()               // 显示右键点击图标（可选leftClick()）
                .withItem("shears")         // 关联物品图标（显示剪刀）
                .whileSneaking()            // 仅当玩家潜行时显示（与whileCTRL()互斥）
                // .whileCTRL();            // 仅当按住CTRL时显示（与whileSneaking()互斥）
            });
    });

Ponder.registry((event) => {
        // 创建一个以"纸"为图标的Ponder条目
        event.create('alexsmobs:capsid')
            .scene(
                "capsid",          // 场景ID（需唯一）
                "衣壳体思索",      // 场景标题（显示在UI中）
                (scene, util) => {          // 场景内容回调函数
                scene.showStructure();
                scene.idle(10)
                scene.world.setBlocks(
                    [2.5,1,2.5],  // 区域坐标[x1,y1,z1,x2,y2,z2]
                    'alexsmobs:capsid', // 方块
                    true // 生成粒子效果
                );
                scene.world.showSection([2.5,1,2.5], Direction.DOWN)

                scene.text(
                    60,                     // 显示时长（ticks）
                    "ItemIntocapsid",         // 文本内容
                    [2.5,1,2.5]       // 文本指向的坐标
                )
                .colored(PonderPalette.WHITE) // 设置文本颜色（RED/绿色/蓝色等）
                .placeNearTarget()          // 使文本更靠近目标位置
                .attachKeyFrame();          // 添加关键帧（用于动画时序）

                scene.showControls(
                    60,                     // 显示时长（ticks）
                    [2.5,1,2.5] ,         // 提示指向的坐标
                    "down"                  // 提示方向（"up"/"left"等）
                )
                .rightClick()               // 显示右键点击图标（可选leftClick()）
                .withItem("collectorsreap:lime")         // 关联物品图标
                
                scene.idle(20*3)

                scene.idle(20*2)

                scene.text(
                    60,                     // 显示时长（ticks）
                    "ItemIntocapsid2",         // 文本内容
                    [2.5,1,2.5]       // 文本指向的坐标
                )
                .colored(PonderPalette.WHITE) // 设置文本颜色（RED/绿色/蓝色等）
                .placeNearTarget()          // 使文本更靠近目标位置
                .attachKeyFrame();          // 添加关键帧（用于动画时序）

                scene.addKeyframe()
            });
    });

// for 1.18 pls use: onEvent("ponder.registry", event => { ... })
Ponder.registry((event) => {
    event
        .create("minecraft:heart_of_the_sea")
        .scene("heart_of_the_sea", "祈愿池子", "rainbow:heart_of_the_sea", (scene, util) => {
            scene.idle(60);

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
                    60,                     // 显示时长（ticks）
                    "text1",         // 文本内容
                    [1,0,1]       // 文本指向的坐标
                )
                .colored(PonderPalette.WHITE) // 设置文本颜色（RED/绿色/蓝色等）
                .placeNearTarget()          // 使文本更靠近目标位置
                .attachKeyFrame();          // 添加关键帧（用于动画时序）

                scene.text(
                    60,                     // 显示时长（ticks）
                    "text2",         // 文本内容
                    [2,0,2]       // 文本指向的坐标
                )
                .colored(PonderPalette.WHITE) // 设置文本颜色（RED/绿色/蓝色等）
                .placeNearTarget()          // 使文本更靠近目标位置
                .attachKeyFrame();          // 添加关键帧（用于动画时序）

                scene.idle(60);

                scene.text(
                    60,                     // 显示时长（ticks）
                    "text3",         // 文本内容
                    [2,0,2]       // 文本指向的坐标
                )
                .colored(PonderPalette.WHITE) // 设置文本颜色（RED/绿色/蓝色等）
                .placeNearTarget()          // 使文本更靠近目标位置
                .attachKeyFrame();          // 添加关键帧（用于动画时序）

        });
});