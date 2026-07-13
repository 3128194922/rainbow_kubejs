// priority: 0
//初始化nbt
PlayerEvents.loggedIn(event => {
    try{
    if (event.level.isClientSide()) return;
    let player = event.player;
        player.persistentData.putBoolean("isStealth",true);
    }catch(e){
        console.log("玩家隐匿初始化失败：" + e);
    }
})
//隐匿检查：每秒检查AABB范围内有无索敌玩家实体，更新isStealth状态
PlayerEvents.tick(event => {
    try {
        let player = event.player;
        if (player.level.isClientSide()) return;
        if (player.age % 20 != 0) return;

        let stealthAttrInst = player.getAttribute("caverns_and_chasms:stealth");
        let entityAttrInst = player.getAttribute("minecraft:generic.follow_range");
        let stealthAttr = stealthAttrInst ? stealthAttrInst.getValue() : 1.0;
        let entityAttr = entityAttrInst ? entityAttrInst.getValue() : 16.0;
        let isSneaking = player.isShiftKeyDown() ? 0.5 : 1.0;
        let isInvisible = player.hasEffect("invisibility");

        // 计算盔甲穿戴数量（0-4）
        let armorCount = 0;
        let armorSlots = player.getInventory().armor;
        for (let i = 0; i < armorSlots.size(); i++) {
            if (!armorSlots.get(i).isEmpty()) armorCount++;
        }

        // 根据隐身状态和盔甲穿戴数量决定乘数
        let armorMult;
        if (isInvisible) {
            armorMult = armorCount == 4 ? 0.70 :
                        armorCount == 3 ? 0.525 :
                        armorCount == 2 ? 0.35 :
                        armorCount == 1 ? 0.175 : 0.07;
        } else {
            armorMult = 1.0;
        }

        let stealthRange = stealthAttr * entityAttr * isSneaking * armorMult;

        // 隐匿检测：检查范围内是否有索敌玩家（target == player）的实体，无则隐匿为true
        let isStealthVal = true;
        let playerAABB = player.boundingBox.inflate(stealthRange);
        let nearbyEntities = player.level.getEntitiesWithin(playerAABB);

        for (let i = 0; i < nearbyEntities.length; i++) {
            let entity = nearbyEntities[i];
            if (!entity || !entity.isAlive()) continue;
            if (entity.target && entity.target == player) {
                isStealthVal = false;
                break;
            }
        }

        player.persistentData.putBoolean("isStealth", isStealthVal);
    } catch (e) {
        console.log("隐匿检查失败：" + e);
    }
})