// priority: 0
NetworkEvents.dataReceived("primaryCharm", (event) => {
    let player = event.player;
/*
    if (hasCurios(player, "rainbow:mind")) {

        if(player.cooldowns.isOnCooldown("rainbow:mind")) return;

        let yaw = player.getYaw();
        let pitch = player.getPitch();

        let dx = 0;
        let dy = 0;
        let dz = 0;
        let wallDirection = "";

        if (pitch < -60) {
            // 玩家仰头（朝上）
            dy = 2;
            wallDirection = "down";
        } else if (pitch > 60) {
            // 玩家俯视（朝下）
            dy = -2;
            wallDirection = "up";
        } else {
            let yaw360 = yaw < 0 ? yaw + 360 : yaw;

            if (yaw360 >= 45 && yaw360 < 135) {
                dx = -2;
                wallDirection = "east";
            } else if (yaw360 >= 135 && yaw360 < 225) {
                dz = -2;
                wallDirection = "south";
            } else if (yaw360 >= 225 && yaw360 < 315) {
                dx = 2;
                wallDirection = "west";
            } else {
                dz = 2;
                wallDirection = "north";
            }
        }
        wallDirection = reverseDirection(wallDirection);

        let summonX = Math.floor(player.x) + dx;
        let summonY = Math.floor(player.y) + dy;
        let summonZ = Math.floor(player.z) + dz;

        let directionMap = {
            "down": 0,
            "up": 1,
            "north": 2,
            "south": 3,
            "west": 4,
            "east": 5
        };
        let wallDirVal = directionMap[wallDirection];

        event.server.runCommandSilent(
            `execute as ${player.displayName.getString()} at @s run summon domesticationinnovation:psychic_wall ${summonX} ${summonY} ${summonZ} ` +
            `{Lifespan:1200, BlockWidth:5, WallDirection:${wallDirVal}}`
        );

        player.cooldowns.addCooldown("rainbow:mind",SecoundToTick(30))
    }
    if(hasCurios(player,'rainbow:resilience_syringe'))
        {
            //console.log(player.persistentData.getInt("resilience"))
            if(player.persistentData.getInt("resilience") >= 100)
                {
                    //player.persistentData.putInt("resilience",0)
                    player.potionEffects.add("rainbow:resilience",SecoundToTick(7),0,false,false);
                    player.persistentData.putInt("resilience",99)
                    //player.server.runCommandSilent()
                }        
        }
    if(hasCurios(player,'rainbow:rage_syringe'))
        {
            if(!player.cooldowns.isOnCooldown("rainbow:damage_num"))
                {
                    player.potionEffects.add("rainbow:damage_num",SecoundToTick(5),0,false,false);
                    player.cooldowns.addCooldown("rainbow:damage_num",SecoundToTick(10))
                }
        }
    if (hasCurios(player, 'rainbow:monster_charm') && !player.cooldowns.isOnCooldown('rainbow:monster_charm')) {
        // 创建铁傀儡
        let entity = event.player.level.createEntity("minecraft:iron_golem");

        entity.persistentData.OwnerName = player.getUuid().toString();
        entity.persistentData.putBoolean("CanTake", false);
        let pos = player.getBlock().pos;
        entity.setPos(pos.x + 0.5, pos.y, pos.z + 0.5);
        entity.spawn();

        player.cooldowns.addCooldown('rainbow:monster_charm',SecoundToTick(60))
    }*/

// 定义Curio配置数组，每个配置指定要生成的实体类型
const curioConfigs = [
    {
        itemId: 'rainbow:rotten_heart', // 物品ID，用于检查玩家是否佩戴该饰品
        entityId: 'minecraft:zombie'    // 该饰品要生成的实体类型
    },
    {
        itemId: 'rainbow:drowned_heart',
        entityId: 'minecraft:drowned'
    },
    {
        itemId: 'rainbow:gunk_heart',
        entityId: 'dungeonsdelight:rotten_zombie'
    },
    {
        itemId: 'rainbow:gritty_heart',
        entityId: 'minecraft:husk'
    },
    {
        itemId: 'rainbow:frozen_heart',
        entityId: 'windswept:chilled'
    }
];

// 遍历所有配置
curioConfigs.forEach(config => {
    // 检查玩家是否佩戴当前饰品且该饰品的冷却时间已过
    if (hasCurios(player, config.itemId) && !player.cooldowns.isOnCooldown(config.itemId)) {
        let COOLDOWN = SecoundToTick(20);
        // 创建指定的实体
        let entity = event.player.level.createEntity(config.entityId);
        // 设置实体为幼年
        entity.setNbt('{IsBaby:1b}');
        // 记录实体的所有者，避免误伤
        entity.persistentData.OwnerName = player.getUuid().toString();
        // 设置实体不可被拾取
        entity.persistentData.putBoolean("CanTake", false);
        
        // 获取玩家位置，并在其位置生成实体
        let pos = player.getBlock().pos;
        entity.setPos(pos.x + 0.5, pos.y, pos.z + 0.5);
        
        // 为实体装备带有消失诅咒的铁剑和皮革头盔
        let sword = Item.of("minecraft:iron_sword").enchant("minecraft:vanishing_curse", 1);
        let helmet = Item.of("minecraft:leather_helmet").enchant("minecraft:vanishing_curse", 1);
        
        entity.setItemSlot("mainhand", sword);
        entity.setItemSlot("head", helmet);
        // 生成实体
        entity.spawn();
        entity.potionEffects.add("rainbow:off_work_time",COOLDOWN/2,0,false,false)
        // 为该饰品添加冷却时间（20秒）
        player.cooldowns.addCooldown(config.itemId,COOLDOWN);
    }
});
});
