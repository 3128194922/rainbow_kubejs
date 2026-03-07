// priority: 0
// ==========================================
// 🖱️ 饰品技能UI交互脚本
// ==========================================

// 技能注册表
let SkillRegistry = {};
let SkillSoundRegistry = {};

/**
 * 注册技能音效
 * @param {string} itemId 饰品ID
 * @param {string} soundId 音效ID
 */
function registerSkillSound(itemId, soundId) {
    SkillSoundRegistry[itemId] = soundId;
}

/**
 * 注册技能处理函数
 * @param {string} itemId 饰品ID
 * @param {function} handler 处理函数 (event, player, itemStack, isSubmenu, submenuIndex) => void
 */
function registerSkill(itemId, handler) {
    SkillRegistry[itemId] = handler;
}

function getPacketItemStack(player, sourceType, slotIndex, slotName, itemId) {
    if (sourceType === "curios") {
        let s = slotName != null ? getCuriosIndex(player, String(slotName), slotIndex) : null;
        if (!s || s.isEmpty() || (itemId && s.id != itemId)) {
            s = getCuriosItem(player, String(itemId));
        }
        return s;
    }
    return getVanillaItem(player, sourceType, slotIndex, slotName);
}

// ==========================================
// 技能逻辑定义区域
// ==========================================

// --- 心脏系列 ---
let heartEntityMap = {
    'rainbow:rotten_heart': 'minecraft:zombie',
    'rainbow:drowned_heart': 'minecraft:drowned',
    'rainbow:gunk_heart': 'dungeonsdelight:rotten_zombie',
    'rainbow:gritty_heart': 'minecraft:husk',
    'rainbow:frozen_heart': 'windswept:chilled'
};

Object.keys(heartEntityMap).forEach(heartId => {
    registerSkill(heartId, (event, player, itemStack, isSubmenu, submenuIndex) => {
        if (player.cooldowns.isOnCooldown(heartId)) return;

        let COOLDOWN = SecoundToTick(20);
        let entityId = heartEntityMap[heartId];

        let entity = player.level.createEntity(entityId);
        if (entity) {
            entity.setNbt('{IsBaby:1b}');
            entity.persistentData.OwnerName = player.getUuid().toString();
            entity.persistentData.putBoolean("CanTake", false);
            
            let pos = player.getBlock().pos;
            entity.setPos(pos.x + 0.5, pos.y, pos.z + 0.5);
            
            let sword = Item.of("minecraft:iron_sword").enchant("minecraft:vanishing_curse", 1);
            let helmet = Item.of("minecraft:leather_helmet").enchant("minecraft:vanishing_curse", 1);
            
            entity.setItemSlot("mainhand", sword);
            entity.setItemSlot("head", helmet);
            
            entity.spawn();
            entity.potionEffects.add("rainbow:off_work_time", COOLDOWN / 2, 0, false, false);
            
            player.cooldowns.addCooldown(heartId, COOLDOWN);
        }
    });
});

// --- 念力墙 ---
registerSkill('rainbow:mind', (event, player, itemStack, isSubmenu, submenuIndex) => {
    if (player.cooldowns.isOnCooldown("rainbow:mind")) return;

    let yaw = player.getYaw();
    let pitch = player.getPitch();
    let dx = 0, dy = 0, dz = 0;
    let wallDirection = "";

    if (pitch < -60) {
        dy = 2; wallDirection = "down";
    } else if (pitch > 60) {
        dy = -2; wallDirection = "up";
    } else {
        let yaw360 = yaw < 0 ? yaw + 360 : yaw;
        if (yaw360 >= 45 && yaw360 < 135) { dx = -2; wallDirection = "east"; }
        else if (yaw360 >= 135 && yaw360 < 225) { dz = -2; wallDirection = "south"; }
        else if (yaw360 >= 225 && yaw360 < 315) { dx = 2; wallDirection = "west"; }
        else { dz = 2; wallDirection = "north"; }
    }
    wallDirection = reverseDirection(wallDirection);

    let summonX = Math.floor(player.x) + dx;
    let summonY = Math.floor(player.y) + dy;
    let summonZ = Math.floor(player.z) + dz;

    let directionMap = { "down": 0, "up": 1, "north": 2, "south": 3, "west": 4, "east": 5 };
    let wallDirVal = directionMap[wallDirection];

    event.server.runCommandSilent(
        `execute as ${player.displayName.getString()} at @s run summon domesticationinnovation:psychic_wall ${summonX} ${summonY} ${summonZ} ` +
        `{Lifespan:1200, BlockWidth:5, WallDirection:${wallDirVal}}`
    );

    player.cooldowns.addCooldown("rainbow:mind", SecoundToTick(30));
});
/*
// --- 韧性注射器 ---
registerSkill('rainbow:resilience_syringe', (event, player, itemStack, isSubmenu, submenuIndex) => {
    if (player.persistentData.getInt("resilience") >= 100) {
        player.potionEffects.add("rainbow:resilience", SecoundToTick(7), 0, false, false);
        player.persistentData.putInt("resilience", 99);
    }
});

// --- 狂暴注射器 ---
registerSkill('rainbow:rage_syringe', (event, player, itemStack, isSubmenu, submenuIndex) => {
    if (!player.cooldowns.isOnCooldown("rainbow:damage_num")) {
        player.potionEffects.add("rainbow:damage_num", SecoundToTick(5), 0, false, false);
        player.cooldowns.addCooldown("rainbow:damage_num", SecoundToTick(10));
    }
});
*/
// --- 怪物护符 ---
registerSkill('rainbow:monster_charm', (event, player, itemStack, isSubmenu, submenuIndex) => {
    if (!player.cooldowns.isOnCooldown('rainbow:monster_charm')) {
        //let entity = player.level.createEntity("minecraft:iron_golem");
        let entity = player.level.createEntity("player_mobs:player_mob");
        if (entity) {
            entity.persistentData.OwnerName = player.getUuid().toString();
            entity.persistentData.putBoolean("CanTake", false);
            entity.setUsername(player.getDisplayName().getString())
            let slot = ["chest","feet","head","legs","mainhand","offhand"]
            slot.forEach(string=>{
                entity.setItemSlot(string,player.getItemBySlot(string))
            })
            let pos = player.getBlock().pos;
            entity.setPos(pos.x + 0.5, pos.y, pos.z + 0.5);
            global.attributes.forEach(attribute=>{
                entity.setAttributeBaseValue(attribute,player.getAttributeTotalValue(attribute))
                //console.log(attribute)
            })
            entity.spawn();
            entity.potionEffects.add("rainbow:off_work_time", 20*30, 0, false, false);
            player.potionEffects.add("minecraft:invisibility", 20, 0, false, false);
            player.potionEffects.add("species:snatched", 20, 1, false, false);
            player.cooldowns.addCooldown('rainbow:monster_charm', SecoundToTick(30));
        }
    }
});

// --- 时间神石 ---
registerSkill('rainbow:chronos', (event, player, itemStack, isSubmenu, submenuIndex) => {
    event.server.runCommandSilent(`/execute at ${player.getDisplayName().getString()} run respawningstructures respawnClosestStructure`);
});

// --- 信标球 ---
registerSkill('rainbow:beacon_ball', (event, player, itemStack, isSubmenu, submenuIndex) => {
    if (player.cooldowns.isOnCooldown("rainbow:beacon_ball")) return;

    if (!itemStack.nbt || !itemStack.nbt.contains("X")) {
        player.tell(Text.gray("该信标球尚未绑定任何机器。"));
        return;
    }

    let hit = player.rayTrace(32);
    if (hit && hit.block) {
        let x = hit.block.x;
        let y = hit.block.y;
        let z = hit.block.z;

        let bx = itemStack.nbt.getInt("X");
        let by = itemStack.nbt.getInt("Y");
        let bz = itemStack.nbt.getInt("Z");

        let boundBlock = player.level.getBlock(bx, by, bz);
        let boundBlockId = boundBlock.id;

        if (itemStack.nbt.getString("MACHINE") != boundBlockId) {
            player.tell(Text.gray("绑定机器不对应！"));
        } else {
            switch (boundBlockId) {
                case 'mbd2:nuke_machine':
                    let data = boundBlock.getEntityData();
                    let state = data ? data.getString("machineState") : "";
                    if (state == "formed" && boundBlock.inventory.getStackInSlot(0).id == "alexscaves:nuclear_bomb") {
                        event.server.runCommandSilent(`/summon alexscaves:nuclear_bomb ${x} ${y + 1} ${z}`);
                        event.server.runCommandSilent(`/particle minecraft:explosion ${bx} ${by} ${bz} 10 3 10 0.5 200`);
                        event.server.runCommandSilent(`/playsound alexscaves:large_nuclear_explosion voice @a ${bx} ${by} ${bz}`);
                        event.server.runCommandSilent(`/playsound alexscaves:nuclear_siren voice @a ${x} ${y} ${z}`);
                        boundBlock.inventory.getStackInSlot(0).shrink(1);
                        event.server.runCommandSilent(`/photon fx photon:blue_laser block ${x} ${y} ${z}`);
                        event.server.scheduleInTicks(100, () => {
                            event.server.runCommandSilent(`/photon fx remove block ${x} ${y} ${z}`);
                        });

                        player.cooldowns.addCooldown('rainbow:beacon_ball', SecoundToTick(5));
                    } else {
                        player.tell(Text.gray(`该核装置未组装完成或没有核弹！`));
                    }
                    break;
            }
        }
    }
});

// --- 装填核心 ---
registerSkill('rainbow:reload_core', (event, player, itemStack, isSubmenu, submenuIndex) => {
    let reloadEnergy = itemStack.nbt ? (itemStack.nbt.getFloat("Energy") || 0) : 0;
    if (reloadEnergy >= 100 && !player.cooldowns.isOnCooldown("rainbow:reload_core")) {
        player.potionEffects.add("rainbow:reload_buff", 200, 0, false, false);
        if (!itemStack.nbt) itemStack.nbt = {};
        itemStack.nbt.putDouble("Energy", 0);
        player.cooldowns.addCooldown("rainbow:reload_core", 200);
        event.server.runCommandSilent(`/playsound minecraft:entity.experience_orb.pickup player @p ${player.x} ${player.y} ${player.z} 1 1`);
    }
});

// --- 连射核心 ---
registerSkill('rainbow:short_core', (event, player, itemStack, isSubmenu, submenuIndex) => {
    let shortEnergy = itemStack.nbt ? (itemStack.nbt.getFloat("Energy") || 0) : 0;
    if (shortEnergy >= 100 && !player.cooldowns.isOnCooldown("rainbow:short_core")) {
        player.potionEffects.add("rainbow:short_buff", 200, 0, false, false);
        if (!itemStack.nbt) itemStack.nbt = {};
        itemStack.nbt.putDouble("Energy", 0);
        player.cooldowns.addCooldown("rainbow:short_core", 200);
        event.server.runCommandSilent(`/playsound minecraft:entity.experience_orb.pickup player @p ${player.x} ${player.y} ${player.z} 1 1`);
    }
});

// --- 幻影之躯 ---
/*registerSkill('rainbow:phantom_body', (event, player, itemStack, isSubmenu, submenuIndex) => {
    let headItem = player.getItemBySlot("head");
    if (headItem && headItem.nbt) {
        let maskId = headItem.nbt.getString("id");
        switch (maskId) {
            case "minecraft:iron_golem":
                player.tell("触发幻影之躯效果");
                break;
        }
    }
});*/

// --- 共生徽章 ---
registerSkill('rainbow:ccb', (event, player, itemStack, isSubmenu, submenuIndex) => {
    let ccbHit = player.rayTrace(5, false);
    if (ccbHit && ccbHit.entity && ccbHit.entity.isLiving()) {
        let target = ccbHit.entity;
        let BLACKLIST = ['minecraft:wither', 'minecraft:ender_dragon'];

        if (BLACKLIST.includes(target.type.toString())) {
            player.tell(Text.red("该生物无法被寄生！"));
        } else {
            let lastUUID = player.persistentData.getString("SymbiosisLastVehicleUUID");
            let HEALTH_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c801");
            let ARMOR_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c802");
            let DAMAGE_UUID = UUID.fromString("c8c8c8c8-c8c8-c8c8-c8c8-c8c8c8c8c803");

            if (lastUUID) {
                try {
                    let oldTarget = player.level.getEntity(UUID.fromString(lastUUID));
                    if (oldTarget && oldTarget.isLiving()) {
                        let hAttr = oldTarget.getAttribute("minecraft:generic.max_health");
                        if (hAttr) hAttr.removeModifier(HEALTH_UUID);
                        let aAttr = oldTarget.getAttribute("minecraft:generic.armor");
                        if (aAttr) aAttr.removeModifier(ARMOR_UUID);
                        let dAttr = oldTarget.getAttribute("minecraft:generic.attack_damage");
                        if (dAttr) dAttr.removeModifier(DAMAGE_UUID);
                    }
                } catch (e) { }
            }

            player.persistentData.putString("SymbiosisLastVehicleUUID", target.getUuid().toString());

            event.server.scheduleInTicks(1, callback => {
                if (player.isAlive() && target.isAlive()) {
                    player.startRiding(target, true);
                }
            });
        }
    }
});

// --- 皇家法杖 ---
registerSkill('royalvariations:royal_staff', (event, player, itemStack, isSubmenu, submenuIndex) => {
    if (itemStack) {
        let InteractionHand = Java.loadClass("net.minecraft.world.InteractionHand");
        let hand = InteractionHand.MAIN_HAND;
        let src = event.data ? event.data.getString("sourceType") : "";
        if (src === "vanilla_offhand") {
            hand = InteractionHand.OFF_HAND;
        }
        let slotName = hand === InteractionHand.OFF_HAND ? "offhand" : "mainhand";
        let prev = player.getItemBySlot(slotName);
        let needTempEquip = (!prev || prev.isEmpty() || prev.id !== itemStack.id);
        if (needTempEquip) {
            let temp = Item.of(itemStack.id, itemStack.count, itemStack.nbt);
            player.setItemSlot(slotName, temp);
        }
        try {
            let result = itemStack.use(player.level, player, hand);
        } finally {
            if (needTempEquip) {
                player.setItemSlot(slotName, prev);
            }
        }
    }
});

// --- 觉之瞳 ---
registerSkillSound('rainbow:eye_of_satori', 'rainbow:voice.eye_of_satori');
registerSkill('rainbow:eye_of_satori', (event, player, itemStack, isSubmenu, submenuIndex) => {
    if (itemStack) {
        let Nbt = itemStack.nbt;
        if(Nbt)
            {
                itemStack.nbt.putBoolean("is_open",!itemStack.nbt.getBoolean("is_open"))
            }
    }
});

// --- 战壕哨 ---
registerSkillSound('rainbow:whistle', 'rainbow:voice.whistle');
registerSkill('rainbow:whistle', (event, player, itemStack, isSubmenu, submenuIndex) => {
    if (itemStack) {
        
        if(player.isClientSide) return;
    
        // 否则重新找目标
        let AABB = player.boundingBox.inflate(16)
        player.level.getEntitiesWithin(AABB).forEach(entity => {
            if (!entity) return;
            if (!entity.isLiving() || !entity.isAlive()) return;
            if (entity == player) return;
        
            let OwnerName = entity.persistentData.OwnerName;
            let Owner = entity.owner;
        
            if ((OwnerName && OwnerName == player.getUuid().toString()) || (entity.owner && entity.owner == player))
                {
                    entity.potionEffects.add("rainbow:killing_desire", 20*10, 0, false, true)
                }
            else
            {
                entity.potionEffects.add("minecraft:glowing", 20*10, 0, false, true)
            }
        })
    }
});

// --- 虚空之眼 ---
registerSkill('alexsmobs:void_worm_eye', (event, player, itemStack, isSubmenu, submenuIndex) => {
    if (itemStack) 
    {
        if(player.isClientSide) return;
    
        player.potionEffects.add("rainbow:void",20,0,false,false)
    }
});

// --- 天琴座 ---
registerSkillSound('rainbow:lyre', 'rainbow:voice.null');
registerSkill('rainbow:lyre', (event, player, itemStack, isSubmenu, submenuIndex) => {
    if (itemStack && isSubmenu) 
    {
        if(player.cooldowns.isOnCooldown(itemStack.id))
            return;
        let nbt = itemStack.nbt;
        let cooldowns = [20*1,20*1,20*1,20*1];
        let lyreSkill= {
            1:(player,entity,nbt)=>{
                if(!entity.potionEffects) return;
                entity.potionEffects.add("minecraft:resistance",20*10,0,false,false);
                nbt.putInt("the_end",nbt.getInt("the_end")+1);
                player.level.playSound(null, player.getX(), player.getY(), player.getZ(), "rainbow:voice.inspiration", "voice", 1, 1)
            },
            2:(player,entity,nbt)=>{
                if(!entity.potionEffects) return;
                entity.potionEffects.add("runiclib:lesser_strength",20*10,0,false,false);
                nbt.putInt("the_end",nbt.getInt("the_end")+1);
                player.level.playSound(null, player.getX(), player.getY(), player.getZ(), "rainbow:voice.improvement", "voice", 1, 1)
            },
            3:(player,entity,nbt)=>{
                if(!entity.potionEffects) return;
                entity.potionEffects.add("minecraft:instant_health",1,0,false,false);
                nbt.putInt("the_end",nbt.getInt("the_end")+1);
                player.level.playSound(null, player.getX(), player.getY(), player.getZ(), "rainbow:voice.sonatina", "voice", 1, 1)
            },
            4:(player,entity,nbt)=>{
                if(!entity.isAlive()) return;
                if(entity == player) return;
                entity.attack(player.damageSources().playerAttack(player),(nbt.getInt("the_end")+1)*10)
                player.level.playSound(null, player.getX(), player.getY(), player.getZ(), "rainbow:voice.the_end", "voice", 1, 1)
            }
        };
        let AABB = player.boundingBox.inflate(16)
        player.level.getEntitiesWithin(AABB).forEach(entity => {
            lyreSkill[submenuIndex](player,entity,nbt);
        })
        player.cooldowns.addCooldown(itemStack.id,cooldowns[submenuIndex-1])
    }
});

// ==========================================
// 主入口逻辑
// ==========================================

NetworkEvents.dataReceived('skillwheel', event => {
    let player = event.player;
    let packetItem = event.data.item;
    let isSubmenu = event.data.getBoolean("isSubmenu");
    let submenuIndex = event.data.getInt("submenuIndex");

    //console.log(event.data)

    if (!packetItem) return;

    // 获取物品ID
    let itemId = packetItem.id;

    // 播放音效
    let soundId = SkillSoundRegistry[itemId] || "rainbow:voice.skillwheel";
    player.level.playSound(null, player.getX(), player.getY(), player.getZ(), soundId, "voice", 1, 1)

    // 从发包数据获取 source 类型和 slot 索引
    let sourceType = event.data.getString("sourceType");
    let slotIndex = event.data.getInt("slotIndex");
    let slotName = event.data.getString("slotName");

    let itemStack = null;
    if (sourceType === "vanilla_armor") {
        itemStack = player.getInventory().armor[slotIndex];
    } else {
        itemStack = getPacketItemStack(player, sourceType, slotIndex, slotName, itemId);
    }

    if (!itemStack || itemStack.isEmpty() || (itemId && itemStack.id != itemId)) {
        return;
    }

    let handler = SkillRegistry[itemId];
    if (!handler) return;
    try {
        handler(event, player, itemStack, isSubmenu, submenuIndex);
    } catch (error) {
        console.error(`Error executing skill for ${itemId}: ${error}`);
        player.tell(Text.red(`技能执行出错: ${error}`));
    }
});
