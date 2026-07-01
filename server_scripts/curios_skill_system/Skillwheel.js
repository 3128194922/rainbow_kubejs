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
 * @param {function} handler 处理函数 (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => void
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
    registerSkill(heartId, (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
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
registerSkill('rainbow:mind', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
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
registerSkill('rainbow:resilience_syringe', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
    if (player.persistentData.getInt("resilience") >= 100) {
        player.potionEffects.add("rainbow:resilience", SecoundToTick(7), 0, false, false);
        player.persistentData.putInt("resilience", 99);
    }
});

// --- 狂暴注射器 ---
registerSkill('rainbow:rage_syringe', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
    if (!player.cooldowns.isOnCooldown("rainbow:damage_num")) {
        player.potionEffects.add("rainbow:damage_num", SecoundToTick(5), 0, false, false);
        player.cooldowns.addCooldown("rainbow:damage_num", SecoundToTick(10));
    }
});
*/

function uuidToIntArray(uuidString) {
    // 去掉横杠
    let hex = uuidString.replace(/-/g, "").toLowerCase()
    
    // 分成 4 段，每段 8 个十六进制字符
    let part1 = parseInt(hex.substring(0, 8), 16)
    let part2 = parseInt(hex.substring(8, 16), 16)
    let part3 = parseInt(hex.substring(16, 24), 16)
    let part4 = parseInt(hex.substring(24, 32), 16)
    
    // 转换为有符号 32 位整数（超过 2147483647 的减去 4294967296）
    part1 = part1 > 2147483647 ? part1 - 4294967296 : part1
    part2 = part2 > 2147483647 ? part2 - 4294967296 : part2
    part3 = part3 > 2147483647 ? part3 - 4294967296 : part3
    part4 = part4 > 2147483647 ? part4 - 4294967296 : part4
    
    // 返回 NBT IntArray 格式
    return `[I;${part1},${part2},${part3},${part4}]`
}

// --- 怪物护符 ---
registerSkill('rainbow:monster_charm', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
    if (!player.cooldowns.isOnCooldown('rainbow:monster_charm')) {
        let entity = player.level.createEntity("easy_npc:humanoid");
        if (entity) {
            let PlayerName = player.getDisplayName().getString();
            let entityUUID = entity.uuid.toString();
            
            entity.setCustomName(Text.of(`${PlayerName}`));
            entity.setPositionAndRotation(player.x, player.y, player.z, player.yaw, player.pitch);
            entity.mergeNbt({
                ObjectiveData: {
                    HasObjectives: true,
                    ObjectiveDataSet: [
                        { Type: "FOLLOW_OWNER", Prio: 2 },
                        { Type: "MELEE_ATTACK", Prio: 2 },
                        { Type: "OWNER_HURT_BY_TARGET", Prio: 2 },
                        { Type: "HURT_BY_TARGET", Prio: 2 }
                    ]
                }
            })
            entity.spawn();
            
            let level = player.level;
            
            // 设置 Type
            level.getServer().runCommandSilent(
                `/data modify entity ${entityUUID} SkinData.Type set value "PLAYER_SKIN"`
            );
            
            // 复制玩家的 UUID 到 NPC（最关键的一步）
            // Minecraft 命令可以直接从一个实体的 UUID 复制到另一个实体的 NBT
            level.getServer().runCommandSilent(
                `/data modify entity ${entityUUID} SkinData.UUID set from entity ${player.stringUuid} UUID`
            );
            
            // 设置 Timestamp
            level.getServer().runCommandSilent(
                `/data modify entity ${entityUUID} SkinData.Timestamp set value ${Date.now()}`
            );
            
            // 同步客户端
            level.getServer().runCommandSilent(
                `/execute as ${entityUUID} at @s run tp @s ~ ~ ~ ~ ~`
            );
            
            // 设置主人
            level.getServer().runCommandSilent(
                `/easy_npc owner set ${entityUUID} ${PlayerName}`
            );

            // 设置 TargetOwnerUUID（从玩家复制）
            level.getServer().runCommandSilent(
                `/data modify entity ${entityUUID} ObjectiveData.ObjectiveDataSet[0].TargetOwnerUUID set from entity ${player.stringUuid} UUID`
            )
        }
    }
});

// --- 时间神石 ---
registerSkill('rainbow:chronos', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
    if(player.cooldowns.isOnCooldown("rainbow:chronos")) return;
    if (!itemStack || !itemStack.nbt || !itemStack.nbt.history || itemStack.nbt.history.length <= 0) {
        player.tell(Text.gray("发条怀表尚未记录到足够的时间信息。"));
        return;
    }
    if (player.persistentData.getBoolean("ChronosRewinding")) return;

    let history = [];
    let rawHistory = itemStack.nbt.history;
    let maxCount = Math.min(rawHistory.length, 5);
    // 先把 NBT ListTag 拷贝成纯 JS 对象数组，后续插值时就不用直接操作 NBT 容器。
    for (let i = 0; i < maxCount; i++) {
        let snapshot = rawHistory[i];
        if (!snapshot) continue;
        history.push({
            secondsAgo: snapshot.secondsAgo,
            x: snapshot.x,
            y: snapshot.y,
            z: snapshot.z,
            hp: snapshot.hp,
            maxHp: snapshot.maxHp,
            food: snapshot.food,
            saturation: snapshot.saturation,
            dimension: String(snapshot.dimension),
            yaw: snapshot.yaw,
            pitch: snapshot.pitch
        });
    }
    if (history.length <= 0) {
        player.tell(Text.gray("发条怀表尚未记录到可回溯的位置。"));
        return;
    }

    // 每个历史点之间用 4 tick 线性插值，形成“快速倒带”观感。
    let ticksPerSegment = 4;

    let lerpAngle = (from, to, progress) => {
        let delta = ((to - from + 540) % 360) - 180;
        return from + delta * progress;
    };

    let applyChronosState = snapshot => {
        if (!snapshot) return;
        // 每 tick 都用传送强制覆盖玩家位置和朝向，避免玩家输入打断回溯。
        player.teleportTo(String(snapshot.dimension), snapshot.x, snapshot.y, snapshot.z, snapshot.yaw, snapshot.pitch);
        player.setDeltaMovement(new Vec3d(0, 0, 0));
        player.hurtMarked = true;

        // 到达历史点后同步生命和饱食度，让状态也回到该时刻。
        if (snapshot.hp != null) {
            player.setHealth(Math.min(snapshot.hp, player.maxHealth));
        }
        if (player.foodData) {
            if (snapshot.food != null) player.foodData.setFoodLevel(snapshot.food);
            if (snapshot.saturation != null) player.foodData.setSaturation(snapshot.saturation);
        }
    };

    let finishChronos = () => {
        player.persistentData.remove("ChronosRewinding");
        player.setDeltaMovement(new Vec3d(0, 0, 0));
        player.hurtMarked = true;
    };

    let rewindToIndex = index => {
        if (!player || !player.isAlive()) {
            finishChronos();
            return;
        }
        if (index >= history.length) {
            finishChronos();
            return;
        }

        let target = history[index];
        let previous = index == 0 ? {
            dimension: player.level.dimension.toString(),
            x: player.x,
            y: player.y,
            z: player.z,
            yaw: player.getYaw(),
            pitch: player.getPitch()
        } : history[index - 1];

        // 跨维度时不做插值，直接跳到目标维度，再继续后续历史点。
        if (String(previous.dimension) != String(target.dimension)) {
            applyChronosState(target);
            event.server.scheduleInTicks(1, () => rewindToIndex(index + 1));
            return;
        }

        let tick = 0;
        let moveStep = () => {
            if (!player || !player.isAlive()) {
                finishChronos();
                return;
            }

            tick++;
            let progress = tick / ticksPerSegment;
            // 当前位置到目标历史点做线性插值，分多 tick 推进，制造连续倒带的轨迹。
            let x = previous.x + (target.x - previous.x) * progress;
            let y = previous.y + (target.y - previous.y) * progress;
            let z = previous.z + (target.z - previous.z) * progress;
            let yaw = lerpAngle(previous.yaw, target.yaw, progress);
            let pitch = previous.pitch + (target.pitch - previous.pitch) * progress;

            player.teleportTo(String(target.dimension), x, y, z, yaw, pitch);
            player.setDeltaMovement(new Vec3d(0, 0, 0));
            player.hurtMarked = true;

            if (tick >= ticksPerSegment) {
                applyChronosState(target);
                // 当前历史点完成后，链式调度下一个历史点，直到 5s 前全部回放结束。
                event.server.scheduleInTicks(1, () => rewindToIndex(index + 1));
            } else {
                event.server.scheduleInTicks(1, moveStep);
            }
        };

        event.server.scheduleInTicks(1, moveStep);
    };

    player.persistentData.putBoolean("ChronosRewinding", true);
    event.server.runCommandSilent(`/execute at ${player.getDisplayName().getString()} run respawningstructures respawnClosestStructure`);
    rewindToIndex(0);
    player.cooldowns.addCooldown("rainbow:chronos",200)
});
/*
// --- 信标球 ---
registerSkill('rainbow:beacon_ball', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
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
*/
// --- 装填核心 ---
registerSkill('rainbow:reload_core', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
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
registerSkill('rainbow:short_core', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
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
/*registerSkill('rainbow:phantom_body', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
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
registerSkill('rainbow:ccb', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
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
registerSkill('royalvariations:royal_staff', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
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
registerSkill('rainbow:eye_of_satori', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
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
registerSkill('rainbow:whistle', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
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
registerSkill('alexsmobs:void_worm_eye', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
    if (itemStack) 
    {
        if(player.isClientSide) return;
    
        player.potionEffects.add("rainbow:void",20,0,false,false)
    }
});

// --- 天琴座 ---
registerSkillSound('rainbow:lyre', 'rainbow:voice.null');
registerSkill('rainbow:lyre', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
    player.tell(submenuIndex)
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

// --- 重力符文 ---
registerSkill('rainbow:gravity_core', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
    if (itemStack) 
    {
        if(player.isClientSide) return;
    
        player.setDeltaMovement(new Vec3d(0,10,0))
        player.hurtMarked = true;
    }
});

// --- 迷你月球 ---
registerSkillSound('rainbow:mini_moon', 'rainbow:voice.tenshi');
registerSkill('rainbow:mini_moon', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
    if (itemStack) 
    {
        if(player.isClientSide) return;

        let radius = 5;
        let centerX = player.getX();
        let centerY = player.getY() + 0.5;
        let centerZ = player.getZ();
        let area = player.boundingBox.inflate(radius);
        let playerUuid = player.getUuid().toString();
        let areaColor = "80FFFFFF";

        if (shiftDown) {
            event.server.runCommandSilent(`/dyeing area add scale mini_moon_aura ${playerUuid} -5 0 -5 5 2 5 ${areaColor} 1.0 0.2 1.0 1.0 12 1 remove`);
        } else {
            event.server.runCommandSilent(`/dyeing area add scale mini_moon_aura ${playerUuid} -5 0 -5 5 2 5 ${areaColor} 0.2 1.0 1.0 1.0 12 1 remove`);
        }

        player.level.getEntitiesWithin(area).forEach(entity => {
            if (!entity) return;
            if (!entity.isLiving() || !entity.isAlive()) return;
            if (entity == player) return;

            let dx = entity.getX() - centerX;
            let dy = entity.getY() - centerY;
            let dz = entity.getZ() - centerZ;
            let distanceSq = dx * dx + dy * dy + dz * dz;
            if (distanceSq <= 0 || distanceSq > radius * radius) return;

            let distance = Math.sqrt(distanceSq);
            let motionX = dx / distance;
            let motionY = dy / distance;
            let motionZ = dz / distance;

            if (shiftDown) {
                entity.setDeltaMovement(new Vec3d(-motionX * 1.2, 0.2 - motionY * 0.2, -motionZ * 1.2));
            } else {
                entity.setDeltaMovement(new Vec3d(motionX * 1.4, 0.35 + Math.max(motionY * 0.15, 0), motionZ * 1.4));
                entity.attack(player.damageSources().playerAttack(player), 6);
            }
            entity.hurtMarked = true;
        })
    }
});

// --- 圣经 ---
registerSkillSound('rainbow:the_bible', 'rainbow:voice.prayer');
registerSkill('rainbow:the_bible', (event, player, itemStack, isSubmenu, submenuIndex, shiftDown) => {
    if (player.cooldowns.isOnCooldown('rainbow:the_bible')) return;
    if (player.level.clientSide) return;

    let playerUuid = player.getUuid().toString();
    let durationTicks = 200; // 10 秒持续时间
    let pulseInterval = 15; // 每次脉冲间隔 tick

    // 1. 金色油漆层（组合动画：金色呼吸光效）
    event.server.runCommandSilent(`/dyeing paint add combo bible_glow ${playerUuid} 80FFD700 80FFFF00 1.0 1.3 0.8 1.0 20 20 -1 end -1 end`);

    // 2. 向外快速扩散的矩形区域（无限循环，每次回到起点重新扩散）
    event.server.runCommandSilent(`/dyeing area add scale bible_wave ${playerUuid} -4 0 -4 4 3 4 80FFD700 0.3 2.5 0.6 0.0 15 -1 start`);

    // 3. 周期性脉冲：推开实体 + 恢复血量
    let elapsed = 0;
    let pulse = () => {
        if (!player || !player.isAlive()) {
            event.server.runCommandSilent(`/dyeing paint remove ${playerUuid} bible_glow`);
            event.server.runCommandSilent(`/dyeing area remove ${playerUuid} bible_wave`);
            return;
        }

        if (elapsed >= durationTicks) {
            event.server.runCommandSilent(`/dyeing paint remove ${playerUuid} bible_glow`);
            event.server.runCommandSilent(`/dyeing area remove ${playerUuid} bible_wave`);
            return;
        }

        // 推开周围实体（类似 mini_moon 机制）
        let radius = 7;
        let centerX = player.getX();
        let centerY = player.getY() + 0.5;
        let centerZ = player.getZ();
        let area = player.boundingBox.inflate(radius);

        player.level.getEntitiesWithin(area).forEach(entity => {
            if (!entity || !entity.isLiving() || !entity.isAlive() || entity == player) return;

            let dx = entity.getX() - centerX;
            let dy = entity.getY() - centerY;
            let dz = entity.getZ() - centerZ;
            let distanceSq = dx * dx + dy * dy + dz * dz;
            if (distanceSq <= 0 || distanceSq > radius * radius) return;

            let distance = Math.sqrt(distanceSq);
            entity.setDeltaMovement(new Vec3d(
                (dx / distance) * 2.0,
                0.5 + Math.max(dy / distance * 0.15, 0),
                (dz / distance) * 2.0
            ));
            entity.hurtMarked = true;
        });

        // 播放音效（复用 mini_moon 的音效）
        player.level.playSound(null, player.getX(), player.getY(), player.getZ(), "rainbow:voice.prayer", "voice", 1, 1);

        // 每次触发推开恢复 100 血量
        player.heal(100);

        elapsed += pulseInterval;
        event.server.scheduleInTicks(pulseInterval, pulse);
    };

    event.server.scheduleInTicks(pulseInterval, pulse);

    player.cooldowns.addCooldown('rainbow:the_bible', SecoundToTick(30));
});

// --- 烟花拳套 ---
// 常量定义（需与 handleFireworkDash.js 一致）
const FW_DASH_SPEED = 1.6;
const FW_DASH_TICKS_TAG = "FireworkDashTicks";
const FW_DASH_FLIGHT_TAG = "FireworkDashFlight";
const FW_DASH_X_TAG = "FireworkDashX";
const FW_DASH_Y_TAG = "FireworkDashY";
const FW_DASH_Z_TAG = "FireworkDashZ";

function clearFireworkDashData(data) {
    data.remove(FW_DASH_TICKS_TAG);
    data.remove(FW_DASH_FLIGHT_TAG);
    data.remove(FW_DASH_X_TAG);
    data.remove(FW_DASH_Y_TAG);
    data.remove(FW_DASH_Z_TAG);
}

registerSkill('minecraft:firework_rocket', (event, player, itemStack, isSubmenu, submenuIndex, shiftDown) => {
    if (player.cooldowns.isOnCooldown("rainbow:firework_dash")) return;
    //if (player.level.isClientSide()) return;
    //console.log("firework dash skill triggered");
    let existingTicks = player.persistentData.getInt(FW_DASH_TICKS_TAG);
    //console.log("firework dash existing ticks: " + existingTicks);
    if (existingTicks > 0) {
        console.log("firework dash blocked by existing ticks, clearing stale data");
        clearFireworkDashData(player.persistentData);
    }
    //console.log("firework dash skill triggered2");
    if (!itemStack || itemStack.isEmpty()) return;
    //console.log("firework dash skill triggered3");
    // 读取自身 Flight 值（1-3），默认 3
    let flight = 3;
    try {
        let tag = itemStack.getNbt();
        if (tag && tag.contains("Fireworks", 10)) {
            let fireworks = tag.getCompound("Fireworks");
            if (fireworks.contains("Flight", 1)) {
                let rawFlight = fireworks.getByte("Flight");
                if (rawFlight > 0) {
                    flight = Math.max(1, rawFlight);
                }
            }
        }
    } catch (e) {
        console.error("firework dash read nbt error: " + e);
    }

    let dashTicks = flight * 20;

    // 获取冲刺方向（视线方向）
    let look = player.getLookAngle();
    if (!look) return;
    let lx = look.x();
    let ly = look.y();
    let lz = look.z();

    // 存储冲刺状态
    let data = player.persistentData;
    data.putInt(FW_DASH_TICKS_TAG, dashTicks);
    data.putInt(FW_DASH_FLIGHT_TAG, flight);
    data.putDouble(FW_DASH_X_TAG, lx);
    data.putDouble(FW_DASH_Y_TAG, ly);
    data.putDouble(FW_DASH_Z_TAG, lz);

    // 消耗 1 个烟花火箭（放最后，避免干扰状态设置）
    itemStack.shrink(1);

    // 立即应用第一帧速度
    let speed = FW_DASH_SPEED;
    player.setDeltaMovement(new Vec3d(lx * speed, ly * speed + 0.1, lz * speed));
    player.fallDistance = 0.0;
    player.hurtMarked = true;

    // 播放音效
    player.level.playSound(null, player.getX(), player.getY(), player.getZ(), "minecraft:entity.firework_rocket.launch", "players", 1.0, 1.0);
    player.cooldowns.addCooldown("rainbow:firework_dash", SecoundToTick(6));

    // 后续每 tick 继续冲刺
    let tickDash = () => {
        if (!player || !player.isAlive()) {
            clearFireworkDashData(player.persistentData);
            return;
        }

        let currentTicks = player.persistentData.getInt(FW_DASH_TICKS_TAG);
        if (currentTicks <= 0) {
            clearFireworkDashData(player.persistentData);
            player.setDeltaMovement(new Vec3d(0, 0, 0));
            player.hurtMarked = true;
            return;
        }

        if (player.horizontalCollision) {
            clearFireworkDashData(player.persistentData);
            player.setDeltaMovement(new Vec3d(0, 0, 0));
            player.hurtMarked = true;
            return;
        }

        // 应用冲刺速度
        let dx = player.persistentData.getDouble(FW_DASH_X_TAG);
        let dy = player.persistentData.getDouble(FW_DASH_Y_TAG);
        let dz = player.persistentData.getDouble(FW_DASH_Z_TAG);
        player.setDeltaMovement(new Vec3d(dx * speed, dy * speed + 0.1, dz * speed));
        player.fallDistance = 0.0;
        player.hurtMarked = true;

        // 检测碰撞实体
        let collideBox = player.boundingBox.inflate(0.6, 0.3, 0.6);
        let targets = player.level.getEntitiesWithin(collideBox);

        for (let i = 0; i < targets.size(); i++) {
            let target = targets.get(i);
            if (!target) continue;
            if (!target.isLiving() || !target.isAlive()) continue;
            if (target.equals(player)) continue;

            let damage = 4.0 * player.persistentData.getInt(FW_DASH_FLIGHT_TAG);
            target.attack(player.damageSources().playerAttack(player), damage);

            // 初始击飞速度
            target.setDeltaMovement(new Vec3d(dx * 2.5, 0.5, dz * 2.5));
            target.hurtMarked = true;

            let targetData = target.persistentData;
            targetData.putInt("FireworkDashImpactTicks", 10);
            targetData.putDouble("FireworkDashImpactDx", dx);
            targetData.putDouble("FireworkDashImpactDz", dz);
            targetData.putFloat("FireworkDashImpactDamage", damage);
            targetData.putInt("FireworkDashImpactSrcId", player.getId());

            clearFireworkDashData(player.persistentData);
            player.setDeltaMovement(new Vec3d(0, 0, 0));
            player.hurtMarked = true;
            return;
        }

        player.persistentData.putInt(FW_DASH_TICKS_TAG, currentTicks - 1);
        event.server.scheduleInTicks(1, tickDash);
    };

    event.server.scheduleInTicks(1, tickDash);
});

// ==========================================
// 主入口逻辑
// ==========================================

NetworkEvents.dataReceived('skillwheel', event => {
    let player = event.player;
    let packetItem = event.data.item;
    let isSubmenu = event.data.getBoolean("isSubmenu");
    let submenuIndex = event.data.getInt("submenuIndex");
    let shiftDown = event.data.getBoolean("shiftDown");

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
        handler(event, player, itemStack, isSubmenu, submenuIndex,shiftDown);
    } catch (error) {
        console.error(`Error executing skill for ${itemId}: ${error}`);
        player.tell(Text.red(`技能执行出错: ${error}`));
    }
});
