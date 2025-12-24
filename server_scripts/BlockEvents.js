// priority: 500
//统一方块右键事件
BlockEvents.rightClicked(event => {
    let { block, player, hand, item } = event
    let { x, y, z } = block.pos
    let level = event.level

    /**
     * @param {string} blockid 方块
     * @param {string} itemid 手中物品
     * @param {string} entityid 召唤实体的名字
     * @param {boolean} isChangeCount 是否改变物品数量
     */
    function summonBoss(blockid, itemid, entityid, isChangeCount) {
        if (block.id == blockid && item.id == itemid) {
            let entity = block.createEntity(entityid)
            entity.setPosition(x, y, z)
            entity.spawn()
            if (isChangeCount) player.mainHandItem.count--
        }
    }
    /**
     * @param {Number} r 半径
     */
    function onion(r) {
        level.getEntitiesWithin(AABB.ofBlock(block.pos).inflate(r)).forEach(entity => {
            if (entity.getType() == 'minecraft:ghast') {
                entity.attack(1)
                entity.block.popItem('minecraft:ghast_tear')
            }
        })
        let pos = block.pos
        for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
                for (let dz = -r; dz <= r; dz++) {
                    let targetPos = pos.offset(dx, dy, dz)
                    let targetBlock = level.getBlock(targetPos)
                    if (targetBlock.id == 'minecraft:obsidian') {
                        targetBlock.set('minecraft:crying_obsidian')
                    }
                }
            }
        }
    }
    // 判断是否为主手 不是主手就退出
    if (hand != 'MAIN_HAND') return
    //无限机关
    summonBoss("rainbow:organ_core", "rainbow:core_key", "infinitygolem:infinity_golem", true);
    //末影甲壳虫
    summonBoss("rainbow:brood_eetle_core", "rainbow:brood_eetle_key", "endergetic:brood_eetle", true);
    //捏雪球
    if ((block.id == 'minecraft:snow_block' && item.id == 'minecraft:air') || (block.id == 'minecraft:snow' && item.id == 'minecraft:air')) {
        player.addItem('minecraft:snowball')
        player.getFoodData().setFoodLevel(player.getFoodData().getFoodLevel() - 1)
    }
    //切洋葱
    if (block.id == 'farmersdelight:cutting_board') {
        if (block.getEntity().getStoredItem().getItem().toString() == 'onion' && Ingredient.of('#farmersdelight:tools/knives').getItemIds().toArray().indexOf(item.id) != -1) {
            onion(1)
        }
        else if (block.getEntity().getStoredItem().getItem().toString() == 'overweight_onion_block' && Ingredient.of('#minecraft:hoes').getItemIds().toArray().indexOf(item.id) != -1) {
            onion(2)
        }
    }
/*
    //战斗维度
    if (block.id == "minecraft:campfire") {
        if (player.level.name.getString() != "backroom:backroom") {
            if (block.west.id === "dungeonsdelight:living_campfire" && block.east.id === "minecraft:soul_campfire" && block.north.id === "netherexp:ancient_campfire" && block.south.id === "endergetic:ender_campfire") {
                player.teleportTo("backroom:backroom", getRandomInt(-14999992, 14999992), 0, getRandomInt(-14999992, 14999992), player.yaw, 90)
                player.potionEffects.add("rainbow:democratic_save", 10 * 20, 0, false, false)
            }
        }
        else {
            player.teleportTo("minecraft:overworld", 0, 300, 0, player.yaw, player.pitch)
            player.potionEffects.add("rainbow:democratic_save", 10 * 20, 0, false, false)
        }
    }
*/
    if(block.entityId == "skyarena:altar_block_entity")
        {
            block.entity.setRecordItem("rainbow:grinder")
        }
})
//空手调整机动管道 代码来源：https://www.bilibili.com/video/BV1H7jnzJE4A/
BlockEvents.rightClicked("create:encased_fluid_pipe", event => {
    if (event.item.id != "minecraft:air" || event.hand != "MAIN_HAND") { return }
    let currentState = event.block.properties[event.facing] == "true"
    event.level.setBlockAndUpdate(
        event.block.pos,
        event.block.blockState.setValue(
            BlockProperties[event.facing.toString().toUpperCase()],
            Java.loadClass("java.lang.Boolean")[currentState ? "FALSE" : "TRUE"]
        )
    )
    event.server.runCommandSilent(
        `playsound minecraft:block.copper_trapdoor.${currentState ? "close" : "open"}
      master @a ${event.block.x} ${event.block.y} ${event.block.z} 0.5 1`
    );
    event.entity.swing()
})

// 洛阳铲逻辑 - 右键提取考古方块内容
BlockEvents.rightClicked(event => {
    let player = event.getPlayer();
    if(!(player.getItemInHand("main_hand").id == 'rainbow:luoyang_shovel')) return;
    let hand = event.getHand().toString();

    // 只允许主手触发
    if (hand === "OFF_HAND") return;

    let block = event.getBlock();

    // 检查是否为可考古方块
    if (!block.hasTag("rainbow:archaeology")) return;

    // 获取方块实体数据（例如里面的物品）
    let blockEntity = block.getEntityData();
    if (!blockEntity) return;

    let itemData = blockEntity.get("item");
    if (!itemData || !itemData.id) {
        return;
    }

    // 生成物品堆
    let itemStack = Item.of(itemData.id, itemData.Count ?? 1);

    // 在方块位置掉落物品
    block.popItem(itemStack);

    // 播放音效（考古刷出声音）
    block.level.playSound(null, block.getX(), block.getY(), block.getZ(), "minecraft:block.sand.break", "blocks", 1.0, 1.0);

    // 移除方块（相当于挖出来）
    block.set("minecraft:air");
});

// 末影docker绑定
BlockEvents.rightClicked(["rainbow:docker_ender", "rainbow:docker_ender_player"], event => {
    let entity = event.block.entity;
    let player = event.getPlayer();
    let hand = event.getHand().toString();
    // 只触发主手
    if (hand === "OFF_HAND") return;

    // 获取玩家是否蹲下
    let isCrouching = player.isCrouching();

    // 确保 entity.data 存在
    if (!entity.data) {
        entity.data = {};  // 如果没有 entity.data，初始化它
    }

    // 如果玩家处于蹲下状态（绑定模式）
    if (isCrouching) {
        // 绑定模式：将玩家的 UUID 存储到 entity.data 中
        entity.data.uuid = player.getStringUuid();
        player.tell("docker已成功绑定到你的末影箱");
    } else {
        // 所属判定模式：检查该方块是否绑定到当前玩家
        if (entity.data.uuid === player.getStringUuid()) {
            player.tell("这个docker已经绑定到你！");
        } else if (entity.data.uuid) {
            // 如果该方块已经绑定到其他玩家
            let otherPlayer = Server.getPlayerByUUID(entity.data.uuid);
            if (otherPlayer) {
                player.tell("这个docker已经绑定给玩家 " + otherPlayer.getName());
            } else {
                player.tell("这个docker已经绑定，但找不到绑定的玩家");
            }
        } else {
            player.tell("这个docker尚未绑定任何玩家");
        }
    }
});
