// priority: 0
// ==========================================
// 🖱️ 饰品技能UI交互脚本
// ==========================================

// 监听物品右键
ItemEvents.rightClicked(event => {
    SkillUi(event)
})

// 监听方块右键
BlockEvents.rightClicked(event => {
    SkillUi(event)
})

// 监听实体交互
ItemEvents.entityInteracted(event => {
    SkillUi(event)
})

/**
 * 处理饰品技能触发逻辑 (统一入口)
 * @param {Internal.ItemClickedEventJS} event 事件对象
 */
function SkillUi(event)
{
    let player = event.getPlayer();
    let item = event.getItem();
    let server = event.getServer();

    // --- 念力墙 (rainbow:mind) ---
    if(item.id == 'rainbow:mind')
        {
            
        if(player.cooldowns.isOnCooldown("rainbow:mind")) return;

        let yaw = player.getYaw();
        let pitch = player.getPitch();

        let dx = 0;
        let dy = 0;
        let dz = 0;
        let wallDirection = "";

        // 计算生成方向
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

        // 召唤念力墙
        server.runCommandSilent(
            `execute as ${player.displayName.getString()} at @s run summon domesticationinnovation:psychic_wall ${summonX} ${summonY} ${summonZ} ` +
            `{Lifespan:1200, BlockWidth:5, WallDirection:${wallDirVal}}`
        );

        player.cooldowns.addCooldown("rainbow:mind",SecoundToTick(30))
        return;
    }

    // --- 韧性注射器 (rainbow:resilience_syringe) ---
    if(item.id == 'rainbow:resilience_syringe')
        {
            //console.log(player.persistentData.getInt("resilience"))
            if(player.persistentData.getInt("resilience") >= 100)
                {
                    //player.persistentData.putInt("resilience",0)
                    player.potionEffects.add("rainbow:resilience",SecoundToTick(7),0,false,false);
                    player.persistentData.putInt("resilience",99)
                    //player.server.runCommandSilent()
                    return;
                }        
        }

    // --- 狂暴注射器 (rainbow:rage_syringe) ---
    if(item.id == 'rainbow:rage_syringe')
        {
            if(!player.cooldowns.isOnCooldown("rainbow:damage_num"))
                {
                    player.potionEffects.add("rainbow:damage_num",SecoundToTick(5),0,false,false);
                    player.cooldowns.addCooldown("rainbow:damage_num",SecoundToTick(10))
                    return;
                }
        }

    // --- 怪物护符 (rainbow:monster_charm) ---
    if (item.id == 'rainbow:monster_charm') {
        let COOLDOWN = SecoundToTick(60);
        if(player.cooldowns.isOnCooldown("rainbow:monster_charm")) return;
        // 创建铁傀儡
        let entity = event.player.level.createEntity("minecraft:iron_golem");

        entity.persistentData.OwnerName = player.getUuid().toString();
        entity.persistentData.putBoolean("CanTake", false);
        let pos = player.getBlock().pos;
        entity.setPos(pos.x + 0.5, pos.y, pos.z + 0.5);
        entity.spawn();
        entity.potionEffects.add("rainbow:off_work_time",COOLDOWN/2,0,false,false)
        player.cooldowns.addCooldown('rainbow:monster_charm',COOLDOWN)
        return;
    }

    // --- 时间神石 (rainbow:chronos) ---
    if(item.id == "rainbow:chronos")
        {
            server.runCommandSilent(`/execute at ${player.getDisplayName().getString()} run respawningstructures respawnClosestStructure`)
            return;
        }

    
    // --- 信标球 (rainbow:beacon_ball) ---
        if (item.id == "rainbow:beacon_ball" && !player.cooldowns.isOnCooldown("rainbow:beacon_ball")) {
            let player = event.player;
            let server = player.server;
            let level = player.level;
            let hand = event.getHand();
            let hit = player.rayTrace(32);
            if (!hit || !hit.block) return;
        
            let x = hit.block.x;
            let y = hit.block.y;
            let z = hit.block.z;
            let blockId = hit.block.id;
        
            // 支持的机器列表
            let machines = ['mbd2:nuke_machine'];
        
            // 绑定逻辑：如果命中方块在 machines 且潜行主手点击 → 绑定坐标
            if (machines.includes(blockId) && player.shiftKeyDown && hand.toString() == "MAIN_HAND") {
                if (!item.nbt) item.nbt = {};
                item.nbt.putInt("X", x);
                item.nbt.putInt("Y", y);
                item.nbt.putInt("Z", z);
                item.nbt.putString("MACHINE", blockId);
                player.tell(Text.red(`⚠ 已绑定装置 (${x}, ${y}, ${z})！请谨慎操作。`));
                return;
            }
        
            // 如果物品没有绑定坐标则不执行任何机器操作
            if (!item.nbt || !item.nbt.contains("X") || !item.nbt.contains("Y") || !item.nbt.contains("Z")) {
                player.tell(Text.gray("该信标球尚未绑定任何机器。"));
                return;
            }
        
            // 从NBT读取绑定坐标
            let bx = item.nbt.getInt("X");
            let by = item.nbt.getInt("Y");
            let bz = item.nbt.getInt("Z");
        
            // 获取绑定位置方块ID
            let boundBlock = level.getBlock(bx, by, bz);
            let boundBlockId = boundBlock.id;
    
            // 校验机器是否对应
            if(item.nbt.getString("MACHINE") != boundBlockId)
                {
                    player.tell(Text.gray("绑定机器不对应！"));
                    return;
                }
        
            // 🎯 不同机器触发逻辑
            switch (boundBlockId) {
                case 'mbd2:nuke_machine': // 核弹发射井
                    let data = boundBlock.getEntityData();
                    let state = data ? data.getString("machineState") : "";
                    // 检查机器状态和是否有核弹
                    if (state == "formed" && boundBlock.inventory.getStackInSlot(0).id == "alexscaves:nuclear_bomb") {
                        server.runCommandSilent(`/summon alexscaves:nuclear_bomb ${x} ${y + 1} ${z}`);
                        server.runCommandSilent(`/particle minecraft:explosion ${bx} ${by} ${bz} 10 3 10 0.5 200`);
                        server.runCommandSilent(`/playsound alexscaves:large_nuclear_explosion voice @a ${bx} ${by} ${bz}`);
                        server.runCommandSilent(`/playsound alexscaves:nuclear_siren voice @a ${x} ${y} ${z}`);
                        boundBlock.inventory.getStackInSlot(0).shrink(1);
                        // 光柱效果（命中位置）
                        server.runCommandSilent(`/photon fx photon:blue_laser block ${x} ${y} ${z}`);
                        server.scheduleInTicks(100, () => {
                        server.runCommandSilent(`/photon fx remove block ${x} ${y} ${z}`);
                        });
                    } else {
                        player.tell(Text.gray(`该核装置未组装完成或没有核弹！`));
                    }
                    break;
            }
            player.cooldowns.addCooldown('rainbow:beacon_ball',SecoundToTick(5))
            return;
        }

    // --- 心脏系列饰品 ---
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

    // 遍历所有配置，右键触发召唤
    curioConfigs.forEach(config => {
        // 检查玩家是否佩戴当前饰品且该饰品的冷却时间已过
        if (item.id == config.itemId && !player.cooldowns.isOnCooldown(config.itemId)) {
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
            player.cooldowns.addCooldown(config.itemId, COOLDOWN);
            return;
        }
    })
}