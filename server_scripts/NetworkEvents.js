// priority: 0
// ==========================================
// 📡 网络包接收处理脚本
// ==========================================
/*
// 接收 "projectlie" 数据包：处理射弹逻辑
NetworkEvents.dataReceived("projectlie", (event) => {
    let x = event.data.x
    let y = event.data.y
    let z = event.data.z
    let viewX = event.data.viewX
    let viewY = event.data.viewY
    let viewZ = event.data.viewZ
    let projectlieName = event.data.name

    // 如果玩家手持泰拉刃
    if (event.player.isHolding("rainbow:terasword")) {
        let projectlie = event.level.createEntity(projectlieName) //创建发射物
        projectlie.setPosition(x, y, z) //设置发射位置
        projectlie.setMotion(viewX * 3, viewY * 3, viewZ * 3) //设置发射速度
        projectlie.setOwner(event.player) //设置发射者
        projectlie.spawn() //生成发射物
        //event.server.runCommandSilent(`/playsound cataclysm:harbinger_laser voice @p ${x} ${y} ${z}`)
    }
    // 如果玩家手持木棍 (测试/调试用)
    if (event.player.isHolding("minecraft:stick")) {
        // 定义随机偏移范围（单位：方块）
        let offsetRange = 0.5; // 可以在0.5格范围内随机偏移
        
        // 为每个坐标轴生成随机偏移
        let randomOffsetX = (Math.random() - 0.5) * 2 * offsetRange; // -0.5到+0.5
        let randomOffsetY = (Math.random() - 0.5) * 2 * offsetRange;
        let randomOffsetZ = (Math.random() - 0.5) * 2 * offsetRange;
        
        // 应用随机偏移到发射位置
        let projectlie = event.level.createEntity(projectlieName);
        projectlie.setPosition(x + randomOffsetX, y + randomOffsetY, z + randomOffsetZ);
        projectlie.setMotion(viewX * 3, viewY * 3, viewZ * 3);
        projectlie.setOwner(event.player);
        projectlie.spawn();
    }
})*/
