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
registerSkill('rainbow:soul_diamond', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
    if (player.cooldowns.isOnCooldown("rainbow:soul_diamond")) return;

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

    player.cooldowns.addCooldown("rainbow:soul_diamond", SecoundToTick(30));
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

// --- 烟雾弹 ---
// 参考 Species SmokeBombItem 源码：use() 仅开始蓄力，releaseUsing() 才有烟雾/隐身/加速效果。
// 饰品格右键无法让玩家真的按住0.5秒，故模拟"强制蓄力成功"，点击即触发全部效果。
registerSkillSound('species:smoke_bomb', 'species:item.smoke_bomb.charge');
registerSkill('species:smoke_bomb', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
    try{
            if (!itemStack || itemStack.isEmpty()) return;
    if (player.cooldowns.isOnCooldown("species:smoke_bomb")) return;

    // 1. 模拟右键：临时将该物品装备到主/副手，调用物品 use()（内部播放蓄力音效并启动使用流程）
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
        // 立即停止蓄力使用状态，避免玩家残留"正在使用"状态
        player.stopUsingItem();
        if (needTempEquip) {
            player.setItemSlot(slotName, prev);
        }
    }

    // 2. 判定蓄力成功（原版要求 >= 10 tick），播放释放音效并执行整套烟雾弹效果
    let x = player.getX();
    let y = player.getY();
    let z = player.getZ();
    player.level.playSound(null, x, y, z, "species:item.smoke_bomb.use", "players", 1.0, 1.0);

    // 3. 粒子：species 专属 poof（身体下沿）+ 原版 poof 大团烟雾（头上方）
    event.server.runCommandSilent(`/particle species:poof ${x} ${y + 0.01} ${z} 0 0 0 0.5 1`);
    event.server.runCommandSilent(`/particle minecraft:poof ${x} ${y + 1} ${z} 0 0 0 0.15 100`);

    // 4. 效果加成：隐身 15 秒（300 tick）+ 移速 III 2 秒（40 tick），与 SmokeBombItem 的一致
    player.potionEffects.add("minecraft:invisibility", 20 * 15, 0, true, true);
    player.potionEffects.add("minecraft:speed", 20 * 2, 2, true, true);

    // 5. 烟雾笼罩：清除 36 格范围内所有实体的索敌目标（setTarget(null)），使其迷失目标（排除非活实体与玩家）
    let smokeAABB = player.boundingBox.inflate(36);
    player.level.getEntitiesWithin(smokeAABB).forEach(targetEntity => {
        if (!targetEntity) return;
        if (!targetEntity.isLiving() || !targetEntity.isAlive()) return;
        if (targetEntity.isPlayer()) return;
        try { targetEntity.setTarget(null);
            targetEntity.setNoAI(true); // 禁用 AI，避免被玩家攻击后立刻重新锁定目标
            targetEntity.setNoAI(false);
         } catch (e) { console.log("烟雾弹清索敌失败:", e); }
    });

    // 6. 非创造模式消耗 1 个烟雾弹
    if (!player.isCreative()) {
        itemStack.shrink(1);
    }

    // 7. 冷却 2 秒（40 tick），与原版 releaseUsing 一致
    player.cooldowns.addCooldown("species:smoke_bomb", 40);
    }catch(e){
        console.error("烟雾弹技能执行异常:", e);
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

// --- 鸦羽骨哨 ---
registerSkillSound('rainbow:whistle', 'rainbow:voice.whistle');
registerSkill('rainbow:whistle', (event, player, itemStack, isSubmenu, submenuIndex,shiftDown) => {
    if (player.isClientSide) return;
    if (!itemStack) return;
    try {
        // 主动技能开启：为饰品写入 endtick（当前游戏时间 + 20秒/400 tick）
        // 由 Registry_curios.js 的 curioTick 检测是否过期，未过期则增加伤害与防御
        if (itemStack.nbt == null) {
            itemStack.nbt = {};
        }
        let now = player.level.gameTime;
        itemStack.nbt.putLong("endtick", now + 20 * 20);
        player.tell(Text.gray("鸦羽骨哨生效：20 秒内攻击力与护甲 +5"));

        // 玩家身上召唤缩放4的半透明黑色油漆层（ARGB=0x80000000，50%透明度），10s后移除
        let server = player.server;
        let uuid = player.uuid.toString();
        let paintId = "whistle_effect";
        server.runCommandSilent("/dyeing paint add static " + paintId + " " + uuid + " 80000000 4.0");
        server.scheduleInTicks(20*10, function() {
            try {
                server.runCommandSilent("/dyeing paint remove " + uuid + " " + paintId);
            } catch (err) {
                console.log("[鸦羽骨哨] 移除油漆层错误: " + err);
            }
        });
    } catch (err) {
        console.log("[鸦羽骨哨] 错误: " + err);
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
    if (itemStack && !player.cooldowns.isOnCooldown("rainbow:mini_moon"))
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

        player.cooldowns.addCooldown("rainbow:mini_moon", SecoundToTick(15));
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

    player.cooldowns.addCooldown('rainbow:the_bible', SecoundToTick(90));
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

// --- 死河 ---
registerSkillSound('rainbow:dead_river', 'rainbow:voice.null');
registerSkill('rainbow:dead_river', (event, player, itemStack, isSubmenu, submenuIndex, shiftDown) => {
    if (player.cooldowns.isOnCooldown("rainbow:dead_river")) return;
    if (player.level.clientSide) return;
    //if (!hasCurios(player, "rainbow:lilith_hug")) return;

    let nbt = itemStack.nbt;
    if (!nbt) return;

    let souls = nbt.getInt("Souls") || 0;
    if (souls <= 0) {
        player.tell(Text.gray("死河中没有任何灵魂。"));
        return;
    }

    let pos = player.getBlock().pos;
    let serverLevel = player.level;
    let totalConsumed = 0;

    // 优先召唤高消耗变种，花光所有灵魂
    // HULKING_SPECTRE (消耗 3) > JOUSTING_SPECTRE (消耗 2) > SPECTRE (消耗 1)
    while (souls >= 3) {
        let bp = new $BlockPosSp(pos.x + 0.5 + (Math.random() * 2 - 1), pos.y + 1, pos.z + 0.5 + (Math.random() * 2 - 1));
        $Spectre.spawnSpectre(serverLevel, player, bp, $Spectre.Type.HULKING_SPECTRE, true);
        souls -= 3;
        totalConsumed += 3;
    }

    while (souls >= 2) {
        let bp = new $BlockPosSp(pos.x + 0.5 + (Math.random() * 2 - 1), pos.y + 1, pos.z + 0.5 + (Math.random() * 2 - 1));
        $Spectre.spawnSpectre(serverLevel, player, bp, $Spectre.Type.JOUSTING_SPECTRE, true);
        souls -= 2;
        totalConsumed += 2;
    }

    while (souls >= 1) {
        let bp = new $BlockPosSp(pos.x + 0.5 + (Math.random() * 2 - 1), pos.y + 1, pos.z + 0.5 + (Math.random() * 2 - 1));
        $Spectre.spawnSpectre(serverLevel, player, bp, $Spectre.Type.SPECTRE, true);
        souls -= 1;
        totalConsumed += 1;
    }

    // 消耗所有灵魂
    nbt.putInt("Souls", 0);
    player.tell(Text.aqua("死河释放了 " + totalConsumed + " 个灵魂。"));
    player.cooldowns.addCooldown("rainbow:dead_river", SecoundToTick(10));
});

// --- 捕梦网 ---
registerSkillSound('windswept:dream_catcher', 'rainbow:voice.null');
registerSkill('windswept:dream_catcher', (event, player, itemStack, isSubmenu, submenuIndex, shiftDown) => {
    if (player.cooldowns.isOnCooldown("windswept:dream_catcher")) return;
    if (player.level.clientSide) return;
    //if (!hasCurios(player, "windswept:dream_catcher")) return;

    // 切换为观察者模式，3 秒后返回生存模式
    player.runCommandSilent(`gamemode spectator`);
    event.server.scheduleInTicks(60, function() {
        if (player && player.isAlive()) {
            player.runCommandSilent(`gamemode survival`);
        }
    });

    player.cooldowns.addCooldown("windswept:dream_catcher", SecoundToTick(10));
});

// --- 闪电瓶 ---
registerSkillSound('rainbow:bottled_lightning', 'rainbow:voice.null');
registerSkill('rainbow:bottled_lightning', (event, player, itemStack, isSubmenu, submenuIndex, shiftDown) => {
    if (player.cooldowns.isOnCooldown("rainbow:bottled_lightning")) return;
    if (player.level.clientSide) return;
    //if (!hasCurios(player, "rainbow:bottled_lightning")) return;

    let playerUuid = player.getUuid().toString();
    let durationTicks = 100; // 5 秒
    let pulseInterval = 15;  // 每次脉冲间隔 tick
    let radius = 10;

    // 0. 调整天气为雨天
    event.server.runCommandSilent(`weather rain`);

    // 1. Dyeing 矩形警示范围（静态满尺寸，仅Y轴旋转）
    event.server.runCommandSilent(
        `/dyeing area add static bottled_lightning_warn ${playerUuid} -${radius} 0 -${radius} ${radius} 4 ${radius} 4040C0FF 1.0 12 -1`
    );

    // 2. 给予玩家 2 秒漂浮效果
    player.potionEffects.add("minecraft:levitation", 100, 0, false, false);
    //player.potionEffects.add("delighto_flight:arc", 100, 0, false, false);

    // 3. 周期性脉冲：AABB 扫荡召唤闪电
    let elapsed = 0;
    let pulse = () => {
        if (!player || !player.isAlive()) {
            event.server.runCommandSilent(`/dyeing area remove ${playerUuid} bottled_lightning_warn`);
            return;
        }

        if (elapsed >= durationTicks) {
            event.server.runCommandSilent(`/dyeing area remove ${playerUuid} bottled_lightning_warn`);
            return;
        }

        // AABB 检测周围实体
        let area = player.boundingBox.inflate(radius);
        player.level.getEntitiesWithin(area).forEach(entity => {
            if (!entity) return;
            if (!entity.isLiving() || !entity.isAlive()) return;
            if (entity == player) return;

            // 跳过友军（已驯服宠物/佣兵）
            let OwnerName = entity.persistentData.OwnerName;
            if (OwnerName && OwnerName == playerUuid) return;
            if (entity.owner && entity.owner == player) return;

            // 给敌方实体 5 秒漂浮
            entity.potionEffects.add("minecraft:levitation", 20, 0, false, false);

            // 在非友军位置召唤闪电
            try {
                let lightning = player.level.createEntity("minecraft:lightning_bolt");
                if (lightning) {
                    lightning.setPos(entity.getX(), entity.getY(), entity.getZ());
                    lightning.spawn();
                }
            } catch(e) {
                console.error("闪电瓶召唤闪电失败: " + e);
            }
        });

        // 播放雷声
        player.level.playSound(null, player.getX(), player.getY(), player.getZ(), "minecraft:entity.lightning_bolt.thunder", "weather", 1.0, 1.0);

        elapsed += pulseInterval;
        event.server.scheduleInTicks(pulseInterval, pulse);
    };

    event.server.scheduleInTicks(pulseInterval, pulse);

    player.cooldowns.addCooldown("rainbow:bottled_lightning", SecoundToTick(30));
});

// --- 女巫坩埚 ---
registerSkillSound('mysticartifacts:witch_pot', 'rainbow:voice.null');
registerSkill('mysticartifacts:witch_pot', (event, player, itemStack, isSubmenu, submenuIndex, shiftDown) => {
    if (player.cooldowns.isOnCooldown('mysticartifacts:witch_pot')) return;
    if (player.level.clientSide) return;

    // 获取玩家末影箱
    let enderChest = player.enderChestInventory;
    if (!enderChest) return;

    // 获取玩家准心方向向量
    let look = player.getLookAngle();
    if (!look) return;
    let lx = look.x();
    let ly = look.y();
    let lz = look.z();

    let speed = 1.5;
    let INTERVAL_TICKS = 5; // 0.25s

    // 第一步：收集每格药水数据（按格存储剩余数量），清空末影箱
    let slots = [];
    for (let i = 0; i < 27; i++) {
        let stack = enderChest.getItem(i);
        if (!stack || stack.isEmpty()) continue;

        let id = stack.getId();
        if (id !== 'minecraft:splash_potion' && id !== 'minecraft:lingering_potion') continue;

        let count = stack.getCount();
        let potionNbt = stack.getNbt();

        slots.push({ id: id, nbt: potionNbt, remaining: count });
        enderChest.setItem(i, ItemStack.EMPTY);
    }

    if (slots.length <= 0) {
        player.tell(Text.gray('末影箱中没有喷溅型或滞留型药水。'));
        return;
    }

    let total = slots.reduce(function(sum, s) { return sum + s.remaining; }, 0);
    let thrownCount = 0;
    let slotIndex = 0;

    // 第二步：每 5 tick 轮询各格，每格每次只丢 1 瓶
    let throwNext = function() {
        if (!player || !player.isAlive()) return;

        // 找下一个还有剩余药水的格子
        let tries = 0;
        while (tries < slots.length) {
            let s = slots[slotIndex];
            if (s.remaining > 0) break;
            slotIndex = (slotIndex + 1) % slots.length;
            tries++;
        }

        if (tries >= slots.length) {
            player.tell(Text.aqua('女巫坩埚从末影箱中投掷了 ' + thrownCount + ' 瓶药水！'));
            return;
        }

        let data = slots[slotIndex];
        data.remaining--;
        thrownCount++;

        try {
            let thrownPotion = player.level.createEntity('minecraft:potion');
            if (thrownPotion) {
                thrownPotion.setPos(player.getX(), player.getY() + player.getEyeHeight(), player.getZ());

                let itemData = { id: data.id, Count: 1 };
                if (data.nbt) {
                    itemData.tag = data.nbt;
                }
                thrownPotion.mergeNbt({ Item: itemData });

                let spread = 0.05;
                let dx = lx + (Math.random() - 0.5) * spread;
                let dy = ly + (Math.random() - 0.5) * spread;
                let dz = lz + (Math.random() - 0.5) * spread;
                thrownPotion.setDeltaMovement(new Vec3d(dx * speed, dy * speed, dz * speed));

                thrownPotion.spawn();
            }
        } catch (e) {
            console.error('女巫坩埚投掷药水失败: ' + e);
        }

        // 移到下一格，继续调度
        slotIndex = (slotIndex + 1) % slots.length;
        event.server.scheduleInTicks(INTERVAL_TICKS, throwNext);
    };

    event.server.scheduleInTicks(1, throwNext);

    player.cooldowns.addCooldown('mysticartifacts:witch_pot', SecoundToTick(30));
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

// --- 烛心面具 ---
// 伪装 id → 技能处理函数映射表（参考心脏系列 heartEntityMap 结构）
// 每个处理函数签名：(ctx) => void，ctx 包含 event/player/itemStack/isSubmenu/submenuIndex/shiftDown
let wickedMaskSkillMap = {
    'cataclysm:the_harbinger': (ctx) => {
        let { event, player, itemStack } = ctx;

        // 加载 Cataclysm 抛射体类（构造函数均为 public，可直接 new）
        let $Wither_Homing_Missile_Entity = Java.loadClass('com.github.L_Ender.cataclysm.entity.projectile.Wither_Homing_Missile_Entity');
        let $Wither_Missile_Entity = Java.loadClass('com.github.L_Ender.cataclysm.entity.projectile.Wither_Missile_Entity');
        let $LivingEntity = Java.loadClass('net.minecraft.world.entity.LivingEntity');

        let HOMING_MISSILE_DAMAGE = 12.0;
        let MISSILE_DAMAGE = 10.0;
        let DURATION_TICKS = SecoundToTick(5); // 持续 5 秒火力输出
        let INTERVAL_TICKS = 4;                // 每 0.2 秒发射一次
        let elapsed = 0;
        let homingCount = 0;                   // 追踪导弹已发射次数（决定 eyeX 偏移交替）
        let missileCount = 0;                  // 导弹已发射次数（决定 eyeX 偏移交替）

        // 递归计时：每次发射后调度下一帧，直到持续时长耗尽
        let fireShot = () => {
            if (!player || !player.isAlive()) return;
            if (elapsed >= DURATION_TICKS) return;

            // 每次重新读取视角方向，允许玩家在火力输出期间转动视角
            let dir = player.getLookAngle();
            if (dir) {
                let baseX = player.getX();
                let baseY = player.getEyeY() + 1;
                let baseZ = player.getZ();
                let dx = dir.x(), dy = dir.y(), dz = dir.z();
                let horizDist = Math.sqrt(dx * dx + dz * dz);
                // cataclysm 抛射体的渲染朝向约定与原版 shoot() 不同：
                // rotateTowardsMovement 用 yRot=atan2(z,x)+90, xRot=atan2(horizDist,y)-90
                // 而原版 shoot() 用 yRot=atan2(x,z), xRot=atan2(y,horizDist)，两者数值不同
                // 必须手动用 cataclysm 的公式设置朝向，否则第一帧渲染朝向错误
                let yRot = Math.atan2(dz, dx) * (180 / Math.PI) + 90;
                let xRot = Math.atan2(horizDist, dy) * (180 / Math.PI) - 90;
                try {
                    // 追踪导弹与普通导弹交替发射
                    let isHomingTurn = (homingCount + missileCount) % 2 === 0;
                    if (isHomingTurn) {
                        // 追踪导弹：必须有 LivingEntity 目标，否则会立即自爆
                        // 优先用准心射线找目标，找不到则用视线方向 AABB 搜索最近敌对生物
                        let target = null;
                        let rayHit = player.rayTrace(64, false);
                        if (rayHit && rayHit.entity && rayHit.entity.isLiving() && rayHit.entity.isAlive() && rayHit.entity != player) {
                            target = rayHit.entity;
                        } else {
                            // AABB 搜索视线方向上的最近 LivingEntity
                            let eyePos = player.getEyePosition();
                            let searchBox = player.boundingBox.inflate(64);
                            let nearestDist = Double.MAX_VALUE;
                            player.level.getEntitiesWithin(searchBox).forEach(e => {
                                if (!e || !e.isLiving() || !e.isAlive()) return;
                                if (e == player) return;
                                try {
                                    if (!(e instanceof $LivingEntity)) return;
                                } catch (err) { return; }
                                // 判断实体是否在视线方向附近（投影到视线上的距离 + 垂直距离）
                                let toEntity = e.position().subtract(eyePos);
                                let projDist = toEntity.dot(dir);
                                if (projDist <= 0 || projDist > 64) return;
                                let perpendicular = toEntity.subtract(dir.scale(projDist));
                                let perpDist = perpendicular.length();
                                if (perpDist > 3) return;
                                let dist = Math.sqrt(projDist * projDist + perpDist * perpDist);
                                if (dist < nearestDist) {
                                    nearestDist = dist;
                                    target = e;
                                }
                            });
                        }

                        if (target) {
                            // 追踪导弹：基础点 (getX, getEyeY+1, getZ)，eyeX ±1，首次 +1，之后交替
                            let offsetX = (homingCount % 2 === 0) ? 1.5 : -1.5;
                            let homing = new $Wither_Homing_Missile_Entity(player, dir, player.level, HOMING_MISSILE_DAMAGE, target);
                            homing.setPositionAndRotation(baseX, baseY, baseZ + offsetX, yRot, xRot);
                            player.level.addFreshEntity(homing);
                            player.level.playSound(null, baseX + offsetX, baseY, baseZ, "cataclysm:rocket_launch", "hostile", 1.0, 1.0);
                            homingCount++;
                        }
                        // 无目标时跳过本次发射，不消耗计数
                    } else {
                        // 导弹：基础点 (getX, getEyeY+1, getZ+1)，eyeX ±1，首次 -1，之后交替
                        let offsetX = (missileCount % 2 === 0) ? -1 : 1;
                        let missile = new $Wither_Missile_Entity(player, dir, player.level, MISSILE_DAMAGE);
                        missile.setPositionAndRotation(baseX + 1, baseY, baseZ + offsetX, yRot, xRot);
                        player.level.addFreshEntity(missile);
                        player.level.playSound(null, baseX + offsetX, baseY + 1, baseZ + 1, "cataclysm:rocket_launch", "hostile", 1.0, 1.0);
                        missileCount++;
                    }
                } catch (e) {
                    console.error("[烛心面具] 发射抛射体失败: " + e);
                }
            }

            elapsed += INTERVAL_TICKS;
            if (elapsed < DURATION_TICKS) {
                event.server.scheduleInTicks(INTERVAL_TICKS, fireShot);
            }
        };

        fireShot();
        player.cooldowns.addCooldown("species:wicked_mask", SecoundToTick(10));
    },
    // 皇家僵尸：召唤 2 名僵尸（参考心脏系列 heartEntityMap 的 minecraft:zombie 召唤方法）
    'royalvariations:royal_zombie': (ctx) => {
        let { event, player, itemStack } = ctx;

        let COOLDOWN = SecoundToTick(60);
        // 循环召唤 2 名僵尸
        for (let i = 0; i < 2; i++) {
            let entity = player.level.createEntity("minecraft:zombie");
            if (entity) {
                //entity.setNbt('{IsBaby:1b}');
                entity.persistentData.OwnerName = player.getUuid().toString();
                //entity.persistentData.putBoolean("CanTake", false);

                let pos = player.getBlock().pos;
                // 第二只错开 1 格，避免重叠
                let offsetX = (i === 1) ? 1 : 0;
                entity.setPos(pos.x + 0.5 + offsetX, pos.y, pos.z + 0.5);

                let sword = Item.of("minecraft:iron_sword").enchant("minecraft:vanishing_curse", 1);
                // 皇家骑士头盔护甲
                let helmet = Item.of("royalvariations:royal_knight_helmet").enchant("minecraft:vanishing_curse", 1);

                entity.setItemSlot("mainhand", sword);
                entity.setItemSlot("head", helmet);

                entity.spawn();
                // 下线时间：字符串ID调用KubeJS add()不可靠，改为解析MobEffect对象后添加
                let offWorkEffect = ForgeRegistries.MOB_EFFECTS.getValue(new ResourceLocation("rainbow", "off_work_time"));
                if (offWorkEffect) {
                    entity.potionEffects.add(offWorkEffect, COOLDOWN / 2, 0, false, false);
                }
            }
        }
        player.cooldowns.addCooldown("species:wicked_mask", COOLDOWN);

        // 额外效果：为 16 格范围内敌方实体（Monster 类别）添加 chosen_victim 药水效果
        let RANGE = 16;                   // 影响范围 16 格
        let DURATION = SecoundToTick(10); // 持续 10 秒
        let playerUuid = player.getUuid().toString();
        let affectedCount = 0;
        let area = player.boundingBox.inflate(RANGE);
        try {
            player.level.getEntitiesWithin(area).forEach(entity => {
                if (!entity) return;
                if (!entity.isLiving() || !entity.isAlive()) return;
                if (entity == player) return;
                if (entity.isPlayer()) return;
                // 跳过友军（已驯服宠物/佣兵）
                if (entity.persistentData.OwnerName && entity.persistentData.OwnerName == playerUuid) return;
                if (entity.owner && entity.owner == player) return;
                // 仅对敌对生物生效（注意：KubeJS 中 entity.getType() 返回 String，不能用其取 MobCategory，改用 instanceof Monster 判定）
                try {
                    if (!(entity instanceof $Monster)) return;
                } catch (err) { return; }

                // 解析效果对象后添加（KubeJS 的 potionEffects.add 只接受 MobEffect 对象）
                let chosenVictimEffect = ForgeRegistries.MOB_EFFECTS.getValue(new ResourceLocation("royalvariations", "chosen_victim"));
                if (chosenVictimEffect) {
                    entity.potionEffects.add(chosenVictimEffect, DURATION, 0, false, false);
                    affectedCount++;
                }
            });
            console.log("[烛心面具] 皇家僵尸 chosen_victim 影响实体数: " + affectedCount);
        } catch (e) {
            console.error("[烛心面具] 皇家僵尸召唤技能执行异常: " + e);
        }
    },
    // 皇家苦力怕：为 16 格范围内敌方实体（MONSTER 类别）添加 time_bomb 药水效果，并在玩家位置生成来源玩家的不破坏方块爆炸
    'royalvariations:royal_creeper': (ctx) => {
        let { event, player, itemStack } = ctx;

        let RANGE = 16;                    // 影响范围 16 格
        let DURATION = SecoundToTick(10);  // 持续 10 秒
        let COOLDOWN = SecoundToTick(20);  // 冷却 20 秒
        let RADIUS = 4.0;                  // 爆炸强度（半径）
        let playerUuid = player.getUuid().toString();

        // 1. 为范围内敌方实体添加 time_bomb 药水效果
        let area = player.boundingBox.inflate(RANGE);
        let affectedCount = 0;
        try {
            player.level.getEntitiesWithin(area).forEach(entity => {
                if (!entity) return;
                if (!entity.isLiving() || !entity.isAlive()) return;
                if (entity == player) return;
                if (entity.isPlayer()) return;
                // 跳过友军（已驯服宠物/佣兵）
                if (entity.persistentData.OwnerName && entity.persistentData.OwnerName == playerUuid) return;
                if (entity.owner && entity.owner == player) return;
                // 仅对敌对生物生效（注意：KubeJS 中 entity.getType() 返回 String，不能用其取 MobCategory，改用 instanceof Monster 判定）
                try {
                    if (!(entity instanceof $Monster)) return;
                } catch (err) { return; }

                // 解析效果对象后添加（KubeJS 的 potionEffects.add 只接受 MobEffect 对象）
                let timeBombEffect = ForgeRegistries.MOB_EFFECTS.getValue(new ResourceLocation("royalvariations", "time_bomb"));
                if (timeBombEffect) {
                    entity.potionEffects.add(timeBombEffect, DURATION, 0, false, false);
                    affectedCount++;
                }
            });
            console.log("[烛心面具] 皇家苦力怕 time_bomb 影响实体数: " + affectedCount);
        } catch (e) {
            console.error("[烛心面具] 皇家苦力怕药水效果执行异常: " + e);
        }

        // 2. 玩家位置生成来源玩家的不破坏方块爆炸
        try {
            player.level.createExplosion(player.getX(), player.getY(), player.getZ())
                .strength(RADIUS)
                .causesFire(false)
                .exploder(player)
                .explosionMode("none")
                .explode();
        } catch (e) {
            console.error("[烛心面具] 皇家苦力怕爆炸执行异常: " + e);
        }

        player.cooldowns.addCooldown("species:wicked_mask", COOLDOWN);
    },
    // 皇家末影人：为 16 格范围内敌方实体（MONSTER 类别）添加 pressing_gaze 与 heaviness_of_the_end 药水效果
    'royalvariations:royal_enderman': (ctx) => {
        let { event, player, itemStack } = ctx;

        let RANGE = 16;                    // 影响范围 16 格
        let DURATION = SecoundToTick(10);  // 持续 10 秒
        let COOLDOWN = SecoundToTick(20);  // 冷却 20 秒
        let playerUuid = player.getUuid().toString();

        let area = player.boundingBox.inflate(RANGE);
        let affectedCount = 0;
        try {
            player.level.getEntitiesWithin(area).forEach(entity => {
                if (!entity) return;
                if (!entity.isLiving() || !entity.isAlive()) return;
                if (entity == player) return;
                if (entity.isPlayer()) return;
                // 跳过友军（已驯服宠物/佣兵）
                if (entity.persistentData.OwnerName && entity.persistentData.OwnerName == playerUuid) return;
                if (entity.owner && entity.owner == player) return;
                // 仅对敌对生物生效（注意：KubeJS 中 entity.getType() 返回 String，不能用其取 MobCategory，改用 instanceof Monster 判定）
                try {
                    if (!(entity instanceof $Monster)) return;
                } catch (err) { return; }

                // 同时施加 凝视压制 与 末地沉重 两种药水效果（解析 MobEffect 对象后添加）
                let gazeEffect = ForgeRegistries.MOB_EFFECTS.getValue(new ResourceLocation("royalvariations", "pressing_gaze"));
                let heavinessEffect = ForgeRegistries.MOB_EFFECTS.getValue(new ResourceLocation("royalvariations", "heaviness_of_the_end"));
                if (gazeEffect) {
                    entity.potionEffects.add(gazeEffect, DURATION, 0, false, false);
                    affectedCount++;
                }
                if (heavinessEffect) {
                    entity.potionEffects.add(heavinessEffect, DURATION, 0, false, false);
                    affectedCount++;
                }
            });
            console.log("[烛心面具] 皇家末影人 药水效果影响实体数: " + affectedCount);
        } catch (e) {
            console.error("[烛心面具] 皇家末影人技能执行异常: " + e);
        }

        player.cooldowns.addCooldown("species:wicked_mask", COOLDOWN);
    },
    // 皇家骷髅：为 16 格范围内敌方实体（MONSTER 类别）添加 trapped 陷阱药水效果
    'royalvariations:royal_skeleton': (ctx) => {
        let { event, player, itemStack } = ctx;

        let RANGE = 16;                    // 影响范围 16 格
        let DURATION = SecoundToTick(10);  // 陷阱持续 10 秒
        let COOLDOWN = SecoundToTick(20);  // 冷却 20 秒
        let playerUuid = player.getUuid().toString();

        let area = player.boundingBox.inflate(RANGE);
        let affectedCount = 0;
        try {
            player.level.getEntitiesWithin(area).forEach(entity => {
                if (!entity) return;
                if (!entity.isLiving() || !entity.isAlive()) return;
                if (entity == player) return;
                if (entity.isPlayer()) return;
                // 跳过友军（已驯服宠物/佣兵）
                if (entity.persistentData.OwnerName && entity.persistentData.OwnerName == playerUuid) return;
                if (entity.owner && entity.owner == player) return;
                // 仅对敌对生物生效（注意：KubeJS 中 entity.getType() 返回 String，不能用其取 MobCategory，改用 instanceof Monster 判定）
                try {
                    if (!(entity instanceof $Monster)) return;
                } catch (err) { return; }

                // 解析效果对象后添加（KubeJS 的 potionEffects.add 只接受 MobEffect 对象）
                let trappedEffect = ForgeRegistries.MOB_EFFECTS.getValue(new ResourceLocation("royalvariations", "trapped"));
                if (trappedEffect) {
                    entity.potionEffects.add(trappedEffect, DURATION, 0, false, false);
                    affectedCount++;
                }
            });
            console.log("[烛心面具] 皇家骷髅 trapped 影响实体数: " + affectedCount);
        } catch (e) {
            console.error("[烛心面具] 皇家骷髅技能执行异常: " + e);
        }

        player.cooldowns.addCooldown("species:wicked_mask", COOLDOWN);
    },
    // 灾难潜伏者（cataclysm:the_prowler）：从玩家视角发射同款死亡激光（Death_Laser_Beam_Entity），并播放激光音效
    'cataclysm:the_prowler': (ctx) => {
        let { event, player, itemStack } = ctx;

        // Math.PI 在 KubeJS Rhino 中返回 undefined，需硬编码
        let PI = 3.141592653589793;
        let DURATION = 28;      // 激光持续 tick（与 Prowler 同款 28，发射后约 0.4 秒开始结算伤害、共约 2.4 秒）
        let DAMAGE = 5.0;       // 激光基础伤害（与 Prowler 默认配置一致，可按需调整）
        let HP_DAMAGE = 0.05;   // 激光最大生命百分比伤害（同款默认 5%，可按需调整）
        let COOLDOWN = SecoundToTick(20);  // 冷却 20 秒

        try {
            // 1. 解析激光实体类型（cataclysm:death_laser_beam，mod 已注册客户端渲染器，可直接渲染）
            let laserType = ForgeRegistries.ENTITY_TYPES.getValue(new ResourceLocation("cataclysm", "death_laser_beam"));
            if (!laserType) {
                console.error("[烛心面具] 死亡激光实体类型不存在: cataclysm:death_laser_beam");
                return;
            }

            // 2. 从玩家视角计算激光朝向（注意：KubeJS 环境下 player.getXRot()/getYHeadRot() 不可用，
            //    改用 getLookAngle() 换算，与 Prowler 源码 yaw=(yHeadRot+90)*PI/180、pitch=-xRot*PI/180 严格等价：
            //    yaw = atan2(lookZ, lookX) + 90°，pitch = asin(lookY)）
            let dir = player.getLookAngle();
            let yaw = Math.atan2(dir.z(), dir.x()) + PI / 2;
            let pitch = Math.asin(dir.y());

            // 3. 构造死亡激光实体（完整构造函数，caster 为玩家），从玩家眼睛高度向视角方向发射
            let beam = new $DeathLaserBeam(laserType, player.level, player,
                player.getX(), player.getEyeY(), player.getZ(),
                yaw, pitch, DURATION, DAMAGE, HP_DAMAGE);
            player.level.addFreshEntity(beam);

            // 4. 播放激光音效（与 Prowler 发射同款 cataclysm:death_laser）
            player.level.playSound(null, player.getX(), player.getY(), player.getZ(),
                ForgeRegistries.SOUND_EVENTS.getValue(new ResourceLocation("cataclysm", "death_laser")),
                SoundSource.PLAYERS, 1.0, 1.0);
        } catch (e) {
            console.error("[烛心面具] 潜伏者激光技能执行异常: " + e);
        }

        player.cooldowns.addCooldown("species:wicked_mask", COOLDOWN);
    },
    // 灾难巨兽（cataclysm:netherite_monstrosity）：在玩家位置召唤巨兽并释放原版 OverPower 扇形冲击波技能，
    // 期间玩家切观察者模式并从巨兽第三人称视角观战；技能结束（约 4 秒）后巨兽消失、玩家恢复原模式
    'cataclysm:netherite_monstrosity': (ctx) => {
        let { event, player, itemStack } = ctx;

        let COOLDOWN = SecoundToTick(60);  // 冷却 60 秒（Boss 级大招，可按需调整）

        let oldGameMode = 'survival';
        let monstrosity = null;
        try {
            // 0. 记录玩家当前游戏模式（技能结束后恢复；读取失败默认 survival）
            try {
                oldGameMode = player.gameMode.getGameModeForPlayer().getName();
            } catch (e) {
                oldGameMode = 'survival';
            }

            // 1. 解析巨兽实体类型
            let type = ForgeRegistries.ENTITY_TYPES.getValue(new ResourceLocation("cataclysm", "netherite_monstrosity"));
            if (!type) {
                console.error("[烛心面具] 巨兽实体类型不存在: cataclysm:netherite_monstrosity");
                return;
            }

            // 2. 玩家先切观察者模式（避免被巨兽生成时碰撞挤开，也免疫巨兽技能自身伤害）
            try {
                player.server.runCommandSilent("gamemode spectator " + player.username);
            } catch (e) {
                console.error("[烛心面具] 切换观察者模式失败: " + e);
            }

            // 3. 在玩家位置召唤巨兽，朝向玩家视线方向
            //    （createEntity 仅创建不加入世界，需 spawn() 加入；参考心脏系列 entity.spawn() 用法）
            //    注意：KubeJS Rhino 对 Entity 的 setYRot()/getXRot() 等方法查找失败（受 KubeJS mixin 影响），
            //    改用 public 字段直接赋值（yRot/yBodyRot 均为 public 字段，字段访问不受影响）
            monstrosity = player.level.createEntity(type);
            monstrosity.setPos(player.getX(), player.getY(), player.getZ());
            monstrosity.yRot = player.yRot;
            monstrosity.yBodyRot = player.yRot;  // 扇形冲击波朝玩家视线方向（原版 StompDamage 用 yBodyRot 计算朝向）
            monstrosity.setIsAwaken(true);       // 标记已唤醒：防止睡眠 AI（NMDoNothingGoal）打断技能（唤醒动画由 setAttackState 触发，此处仅置标志）
            monstrosity.spawn();

            // 4. 直接触发原版 OverPower 技能（攻击状态 9）：
            //    attackTicks 由基类 tick() 自动每 tick 推进，aiStep() 会在 31~41 tick 自动释放 6 波
            //    扇形冲击波（StompDamage：108° 扇形、逐层扩散、击退+破地形+音效粒子全由原版处理）
            monstrosity.setAttackState(9);

            // 5. 玩家观战巨兽（第三人称视角由客户端脚本 mask/monstrosity_camera.js 强制切换）
            try {
                player.setCamera(monstrosity);
            } catch (e) {
                console.error("[烛心面具] 观战巨兽失败（不影响技能释放）: " + e);
            }

            // 6. 递归计时：技能持续 5 秒（100 tick），每 tick 推进一次；5 秒到点后取消巨兽并恢复玩家
            let MONSTROSITY_DURATION_TICKS = SecoundToTick(4);
            let elapsedTicks = 0;
            let finishSkill = () => {
                if (elapsedTicks >= MONSTROSITY_DURATION_TICKS) {
                    // 5 秒到点：移除巨兽（先清 BossBar 观众避免残留）并恢复玩家模式/视角
                    try {
                        if (monstrosity != null) {
                            // 逐个移除 BossBar 观众（实体移除不会自动清理 BossBar）
                            try {
                                let viewers = player.server.getPlayerList().getPlayers();
                                for (let p of viewers) {
                                    try { monstrosity.stopSeenByPlayer(p); } catch (e) { }
                                }
                            } catch (e) { }
                            try { monstrosity.setAttackState(0); } catch (e) { }
                            try { monstrosity.discard(); } catch (e) { }
                        }
                        if (player.isAlive()) {
                            try { player.setCamera(player); } catch (e) { }
                            try { player.server.runCommandSilent("gamemode " + oldGameMode + " " + player.username); } catch (e) { }
                        }
                    } catch (e) {
                        console.error("[烛心面具] 巨兽技能收尾异常: " + e);
                    }
                    return;
                }
                // 玩家中途死亡/掉线：提前取消巨兽（玩家恢复逻辑交给服务端玩家管理）
                if (!player.isAlive() && monstrosity != null && monstrosity.isAlive()) {
                    try { monstrosity.discard(); } catch (e) { }
                    return;
                }
                elapsedTicks++;
                event.server.scheduleInTicks(1, finishSkill);
            };
            event.server.scheduleInTicks(1, finishSkill);
        } catch (e) {
            // 执行异常：立即清理巨兽并恢复玩家模式/视角
            try {
                if (monstrosity != null && monstrosity.isAlive()) {
                    monstrosity.discard();
                }
            } catch (e2) { }
            try {
                if (player != null && player.isAlive()) {
                    player.setCamera(player);
                    player.server.runCommandSilent("gamemode " + oldGameMode + " " + player.username);
                }
            } catch (e2) { }
            console.error("[烛心面具] 巨兽技能执行异常: " + e);
        }

        player.cooldowns.addCooldown("species:wicked_mask", COOLDOWN);
    }
    // 未来新增伪装类型在此追加，例如：
    // 'minecraft:zombie': (ctx) => { ... },
};

registerSkillSound('species:wicked_mask', 'rainbow:voice.eye_of_satori');
registerSkill('species:wicked_mask', (event, player, itemStack, isSubmenu, submenuIndex, shiftDown) => {
    if (!itemStack) return;
    let Nbt = itemStack.nbt;
    if (!Nbt) return;
    if (player.level.clientSide) return;

    // 主进程统一检测面具全局冷却
    if (player.cooldowns.isOnCooldown("species:wicked_mask")) return;

    // 根据伪装生物 id 分发到对应技能处理函数
    let disguiseId = Nbt.getString("id");
    if (!disguiseId) return;

    let handler = wickedMaskSkillMap[disguiseId];
    if (!handler) return;

    handler({ event: event, player: player, itemStack: itemStack, isSubmenu: isSubmenu, submenuIndex: submenuIndex, shiftDown: shiftDown });
});