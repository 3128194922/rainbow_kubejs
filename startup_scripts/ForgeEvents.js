// priority: 500
// 玩家放置方块事件
ForgeEvents.onEvent("net.minecraftforge.event.level.BlockEvent$EntityPlaceEvent", event => {
    try {
        let entity = event.getEntity()

        if (entity.level.clientSide) return;

/*
        if (entity && entity.getType && entity.getType() == "minecraft:falling_block" && entity.persistentData.KJS_IceProjectile) {
            let pos = (typeof event.getPos === "function") ? event.getPos() : entity.block.pos
            let radius = 4
            entity.level.getEntitiesWithin(AABB.ofBlock(pos).inflate(radius)).forEach(t => {
                if (!t || !t.isLiving() || !t.isAlive()) return
                if (entity.persistentData.OwnerName && t.isPlayer() && t.getName().getString() == entity.persistentData.OwnerName) return
                t.setTicksFrozen(200)
            })
        }*/
    } catch (e) {
        console.log("玩家放置方块事件出现问题：")
        console.log(e)
    }
})

// 玩家破坏方块速度事件
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.PlayerEvent$BreakSpeed", event => {
    try {
        let block = event.state.getBlock();
        let entity = event.getEntity()

        //if (entity.level.clientSide) return; // 有bug，暂时注释

        if (entity.getItemInHand("main_hand").id == "rainbow:frostium_pickaxe") {
            // 按方块硬度判断（originalSpeed 只与工具相关，与方块无关，不能用它判断慢方块）
            // 注意：1.20.1 的 BreakSpeed 事件没有 getPos()，只有 getPosition() 返回 Optional
            // 硬度≥5 的方块（黑曜石50、远古残骸30、钻石/铁/绿宝石块5）挖掘更快：原始值×16
            let pos = event.getPosition().orElse(entity.block);
            let hardness = event.state.getDestroySpeed(entity.level, pos);
            if (hardness >= 5.0) {
                event.newSpeed = 16 * event.originalSpeed;
            }
        }
        
    } catch (e) {
        console.log("玩家破坏方块事件出现问题：")
        console.log(e)
    }
});

// 玩家右键实体事件
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.PlayerInteractEvent$EntityInteract", event => {
    try {
        let Player = event.getEntity();
        let Item = event.getItemStack();
        let Entity = event.getTarget();

        if (Entity.level.clientSide) return;
        /*
        // 示例：剪刀剪苦力怕（已注释）
        if (Player.isPlayer() && Player.isShiftKeyDown() && Item.getId() == "minecraft:shears" && Entity.getType() == "minecraft:creeper") {
            Entity.block.popItem("rainbow:greenblock")
        }*/
    } catch (e) {
        console.log("玩家右键生物事件出现问题：")
        console.log(e)
    }
});

// 监听实体仇恨变更事件
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingChangeTargetEvent", event => {
    try {
        let entity_A = event.getEntity() // 产生仇恨的实体
        let entity_B = event.getNewTarget() // 新的目标

        if (!entity_B) return

        // 佩戴对应生物面具的玩家不会被该种生物攻击
        if (entity_B.isLiving() && entity_B.isPlayer()) {
            if (entity_B.getItemBySlot("head").id == "species:wicked_mask" && entity_B.getItemBySlot("head").getNbt().getString("id") == entity_A.getType()) {
                event.setNewTarget(null) // 取消仇恨
            }
        }

        // 监守者不会攻击带有幽匿亲和的玩家
        if (entity_A.getType().equals("minecraft:warden") && entity_B.isPlayer()) {
            if (getCuriosItem(entity_B, 'rainbow:sculk_affinity') !== null) {
                event.setNewTarget(null)
            }
        }

        if(entity_B.isLiving() && entity_B.isPlayer() && entity_B.hasEffect('rainbow:invisible'))
        {
            event.setNewTarget(null) // 取消仇恨
        }
    } catch (e) {
        console.log(e);
    }

})

/*
//tag武器（已注释）
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingAttackEvent",event=>{
        let player = event.source.player;
        let monster = event.entity;
        // ...
})
*/

// 监听效果过期事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobEffectEvent$Expired', event => {
    try {
        let entity = event.entity;
        let level = entity.level;
        // 获取效果实例
        let effectInstance = event.getEffectInstance();
        let effectId = effectInstance.getEffect().getDescriptionId();
        let effectCode = global.FORGE_EFFECT_EXPIRED_CODES[effectId];

        // 固定效果 ID 通过表查找后只执行一个处理分支。
        switch (effectCode) {
            // 下班时间到了，实体消失
            case 1:
                entity.discard()
                break;

            // 虚化效果到期，移除油漆层
            case 2:
                entity.server.runCommandSilent("/dyeing paint remove " + entity.uuid + " void_effect")
                break;

            case 3:
            let item = entity.getItemInHand("main_hand");
            if (item.id == 'species:crankbow') {
                if (item.nbt.getBoolean("IsUsing") == true) {
                    item.nbt.putInt("Speed", 0);
                    // 计算朝向与起始位置
                    let viewVector = entity.getViewVector(1.0)
                    let length = Math.sqrt(viewVector.x() * viewVector.x() + viewVector.y() * viewVector.y() + viewVector.z() * viewVector.z())
                    let nor_x = viewVector.x() / length
                    let nor_y = viewVector.y() / length
                    let nor_z = viewVector.z() / length
                    let new_x = entity.x + nor_x * 1.5
                    let new_y = entity.y + entity.getEyeHeight()
                    let new_z = entity.z + nor_z * 1.5

                    let ice_chunk = level.createEntity("savage_and_ravage:ice_chunk")
                    ice_chunk.setPosition(new_x, new_y + 1, new_z)
                    ice_chunk.setMotion(nor_x * 1.3, nor_y * 1.3 + 0.2, nor_z * 1.3)
                    ice_chunk.setCaster(entity)
                    ice_chunk.spawn()
                }
            }
                break;
        }
    }
    catch (e) {
        console.log("监听buff过期出现问题：")
        console.log(e)
    }
});

// 监听效果赋予事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobEffectEvent$Added', event => {
    try {
        let entity = event.entity;
        // 获取效果实例
        let effectInstance = event.getEffectInstance();
        let effectId = effectInstance.getEffect().getDescriptionId();
        let effectCode = global.FORGE_EFFECT_ADDED_CODES[effectId];

        // 虚化效果添加时，显示半透明油漆层（使用效果色的半透明版本）
        if (effectCode === 1) {
            entity.server.runCommandSilent("/dyeing paint add static void_effect " + entity.uuid + " 80FFFFFF")
        }

        // 玩家专用逻辑：防化服免疫中毒/辐照/凋零
        if (!entity.isPlayer()) return;
        if (global.FORGE_HAZMAT_EFFECT_CODES[effectId] === true) {
            if (entity.getItemBySlot("head").id == 'alexscaves:hazmat_mask'
                && entity.getItemBySlot("chest").id == 'alexscaves:hazmat_chestplate'
                && entity.getItemBySlot("legs").id == 'alexscaves:hazmat_leggings'
                && entity.getItemBySlot("feet").id == 'alexscaves:hazmat_boots') {
                event.setCanceled(true);
            }
        }

    }
    catch (e) {
        console.log("监听buff赋予出现问题：")
        console.log(e)
    }
});

// 虚空炼成系统：物品掉入虚空后转化为指定产物
ForgeEvents.onEvent("net.minecraftforge.event.entity.EntityLeaveLevelEvent", (event) => {
    try {
        let { entity, level } = event;
        // 确保是物品掉入虚空
        if (level.clientSide || !entity.item || entity.getY() > level.getMinBuildHeight()) return;

        let inputItemId = entity.item.id;
        let inputCount = entity.item.count;

        // 检查是否有对应配方
        let outputItemId = global.FORGE_VOID_TRANSMUTE_RECIPES[inputItemId];
        if (!outputItemId) return;

        // 创建转化后的掉落物实体，数量对应
        let resultEntity = entity.block.createEntity("item");
        resultEntity.item = Item.of(outputItemId, inputCount);  // 👈 保留原始数量
        resultEntity.y = level.getMinBuildHeight() - 20;

        // 设置向上漂浮运动效果
        let riseSpeed = (entity.fallDistance - 43) / 50;
        resultEntity.setDeltaMovement(new Vec3d(0, riseSpeed, 0));
        resultEntity.setNoGravity(true);
        resultEntity.setGlowing(true);

        resultEntity.spawn();
    } catch (e) {
        console.log("虚空炼成系统出现问题：")
        console.log(e)
    }
});


// 监听左键空击事件（已注释大部分逻辑）
/*
// 剑气/投射物逻辑
// ...
*/

// 监听效果移除事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobEffectEvent$Remove', event => {
    try {
        let entity = event.getEntity();
        let effectInstance = event.getEffectInstance();
        if (!effectInstance) return;
        let buffId = effectInstance.getDescriptionId();
        let effectCode = global.FORGE_EFFECT_REMOVED_CODES[buffId];

        // 固定效果 ID 通过表查找后只执行对应逻辑。
        switch (effectCode) {
            // 虚化效果被移除时，移除油漆层
            case 1:
                entity.server.runCommandSilent("/dyeing paint remove " + entity.uuid + " void_effect")
                break;

            // 嗜血效果移除逻辑：如果没有打伞，则会被点燃
            case 2:
                if (!entity.isPlayer()) break;

                let item_main = entity.getItemInHand("main_hand").getId();
                let item_off = entity.getItemInHand("off_hand").getId();
                if (item_main == 'artifacts:umbrella' || item_off == 'artifacts:umbrella') {
                    event.setCanceled(true);
                }
                else {
                    entity.secondsOnFire = 100;
                    event.setCanceled(true);
                }
                break;
        }

    } catch (e) {
        console.log("监听玩家获取buff出现问题：")
        console.log(e)
    }
})

// 监听睡觉事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerSleepInBedEvent', event => {
    try {
        let player = event.getEntity();
        if (!player.isPlayer()) return;
        // 10% 概率做噩梦
        if (randomBool(0.1)) {
            player.tell("你做了个噩梦")
        }
    }
    catch (e) {
        console.log("监听睡觉出现问题：")
        console.log(e)
    }
});

// 监听死亡事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
    try {
        let player = event.getSource().getPlayer();
        if (event.getEntity().getLevel().isClientSide()) return;
        if (!player || !player.isPlayer()) return;
        // 同一次死亡事件只构建一次饰品索引，供三个击杀效果复用。
        let curioIndex = buildCurioIndex(player);

        // 宝箱吊坠：击杀计数逻辑
        let item = curioIndex["rainbow:treasure_necklace"];
        if (item) {
            let nbt = item.getOrCreateTag();

            // 读取计数
            let kills = nbt.getInt("kill");

            if (kills < 100) {
                nbt.putInt("kill", kills + 1);
            } else {
                nbt.putInt("kill", 0);
                item.setDamageValue(item.getDamageValue() + Integer.valueOf("100"))
                // 宝箱吊坠满 100 击杀：从战利品表生成奖励
                try {
                    let pos = player.block.getPos();
                    player.server.runCommandSilent("loot spawn " + pos.getX() + " " + pos.getY() + " " + pos.getZ() + " loot rainbow:treasure_necklace");
                } catch (lootErr) {
                    console.log("宝箱吊坠战利品生成出现问题：");
                    console.log(lootErr);
                }
            }
        }

        // 大师球储存灵魂
        let soulItem = curioIndex["rainbow:dead_river"];
        if (soulItem && player.getItemInHand("main_hand").id != 'species:spectralibur') {
            let nbt = soulItem.getOrCreateTag();

            let Souls = nbt.getInt("Souls");

            if (Souls == null) {
                nbt.putInt("Souls", 0)
            }
            else {
                nbt.putInt("Souls", Souls + 1)
            }
        }

        // 兽性面具：击杀敌人治疗自己
        if (curioIndex["rainbow:beast_mask"] != null) {
            player.heal(4);
        }
    } catch (e) {
        console.log("[兽性面具] 击杀治疗出错: " + e);
    }
});

//DamageSorce()

// ==========================================
// 写轮眼（rainbow:sharingan）：盾反/完美闪避时恢复冷却
// 每次触发减少 主副手 + Curios 饰品栏 中处于冷却物品 当前剩余冷却的 25%
// （如剩 40s 时触发一次 → 剩 30s）
// 冷却读取/恢复依赖 startup_scripts/Utils.js 的 restoreCooldownByRemaining（按当前剩余折算）
// ==========================================
function sharinganRestoreCooldowns(player, ratio) {
    try {
        // console.log("[写轮眼] 阶段0-触发: 玩家=" + player.username + ", 恢复比例=" + ratio);
        let done = {};   // 按物品ID去重，避免同一物品在主副手/饰品栏多处重复恢复
        let count = 0;
        let tryRestore = function (stack) {
            try {
                if (!stack || stack.isEmpty()) return;
                let id = null;
                try { id = String(stack.getId()); } catch (ignored) {}
                if (id != null) {
                    if (done[id]) {
                        // console.log("[写轮眼] 阶段A-跳过重复物品: " + id);
                        return;
                    }
                    done[id] = true;
                }
                // console.log("[写轮眼] 阶段A-尝试恢复: " + id);
                if (restoreCooldownByRemaining(player, stack, ratio)) count++;
            } catch (ignored) {
                // console.log("[写轮眼] 阶段A-单物品处理异常(已忽略): " + ignored);
            }
        };

        // 主副手
        // console.log("[写轮眼] 阶段B-遍历主副手");
        tryRestore(player.getItemInHand("main_hand"));
        tryRestore(player.getItemInHand("off_hand"));

        // Curios 饰品栏（curiosInventory 由 KubeJS-Curios 的 LivingEntityMixin 注入）
        // console.log("[写轮眼] 阶段C-遍历Curios饰品栏");
        let curios = player.curiosInventory;
        if (curios == null) {
            // console.log("[写轮眼] 阶段C-警告: curiosInventory 为 null（KubeJS-Curios 未注入或实体无饰品栏）");
        } else {
            for (let handler of curios.getCurios().values()) {
                let stacks = handler.getStacks();
                let size = stacks.getSlots();
                for (let i = 0; i < size; i++) {
                    tryRestore(stacks.getStackInSlot(i));
                }
            }
        }
        // console.log("[写轮眼] 阶段D-完成: 共恢复 " + count + " 个物品的冷却");
        return count;
    } catch (e) {
        console.log("[写轮眼] 冷却恢复出错: " + e);
        return 0;
    }
}

//极限闪避事件
ForgeEvents.onEvent("cc.sighs.extremeevasion.event.ExtremeEvasionTriggeredEvent", event => {
    // console.log("[极限闪避] 事件触发");
    let player = event.getPlayer();
    if(player.level.isClientSide()) return;
    let attacker = event.getDamageSource().getActual();

    if (!player || !player.isPlayer()) {
        // console.log("[极限闪避] 阶段E-跳过: player无效或非玩家 (player=" + (player != null) + ")");
        return;
    }
    // console.log("[极限闪避] 阶段E-玩家有效: " + player.username);

    // 极限闪避触发反馈：播放原版经验升级音效 + 武士刀（村正）同款悬浮字幕粒子
    global.sendParticleTextInFront(player, "完美闪避！", 0xFFAA00);
    player.server.runCommandSilent(`/playsound minecraft:entity.player.levelup player @a ${player.getX()} ${player.getY()} ${player.getZ()} 1.0 1.0`);

    // 强制播放完美闪避动画（assets/rainbow/player_animation/完美闪避.json，注册 ID 为内部名 perfect_dodge）
    // 快速淡入 3 tick 保证闪避反馈的即时性；global.playPlayerAnim 由 server_scripts/player_animator/main.js 注册
    if (typeof global.playPlayerAnim === "function") {
        global.playPlayerAnim(player, "rainbow:perfect_dodge", 3);
    } else {
        console.log("[极限闪避] global.playPlayerAnim 未定义，跳过动画播放");
    }


    // 第三阶段：极限闪避事件内复用一次饰品索引，避免三个饰品分别扫描 Curios 槽位。
    let evasionCurioIndex = null;
    try {
        evasionCurioIndex = buildCurioIndex(player);
    } catch (e) {
        console.log("[极限闪避] 饰品索引构建失败: " + e);
    }

    if(evasionCurioIndex != null && evasionCurioIndex["rainbow:dismas_scarf"] != null)
    {
        if (attacker && attacker.isAlive()) {
            // 1.20.1 中 DamageSource 无 setBypassArmor/setBypassMagic，需使用自定义伤害类型（见 server_scripts/rainbow/dismas_scarf.js）
            // DamageSource / Registries / ResourceKey / ResourceLocation 已在 CONST.js 定义为 const
            let registry = player.getLevel().registryAccess().registryOrThrow(Registries.DAMAGE_TYPE);
            let holder = registry.getHolderOrThrow(ResourceKey.create(Registries.DAMAGE_TYPE, new ResourceLocation('rainbow', 'dismas_scarf')));
            let source = new DamageSource(holder, player, player);
            attacker.attack(source, 12);

            // 反击命中反馈：在攻击者（对方实体）位置生成横扫粒子 + 播放横扫音效
            let ax = attacker.getX();
            let ay = attacker.getY() + attacker.getBbHeight() * 0.5;
            let az = attacker.getZ();
            let server = player.server;
            // sweep_attack 粒子第一个 delta 为横扫弧度（1.0≈57°），0 0 0 速度、0 数量
            server.runCommandSilent(`/particle minecraft:sweep_attack ${ax} ${ay} ${az} 1.0 0.0 0.0 0.0 0`);
            server.runCommandSilent(`/playsound minecraft:entity.player.attack.sweep player @a ${ax} ${ay} ${az} 0.8 1.0`);
        }
    }
    if(evasionCurioIndex != null && evasionCurioIndex["rainbow:beast_mask"] != null)
    {
        player.heal(4);
    }
    if(evasionCurioIndex != null && evasionCurioIndex["rainbow:sharingan"] != null)
    {
        // 写轮眼：完美闪避时恢复主副手 + Curios 饰品 总冷却时长 25% 的冷却
        // console.log("[极限闪避] 阶段F-检测到写轮眼, 开始恢复冷却");
        sharinganRestoreCooldowns(player, 0.25);
    }
});

// 旧盾反监听占位：实际逻辑已迁移到 startup_scripts/shield_parry/main.js。
ForgeEvents.onEvent('com.shiledattack.event.ShieldParriedEvent', event => {
    // 盾反逻辑已迁移到 startup_scripts/shield_parry/main.js，保留旧块避免影响历史注释上下文。
    return;
    // console.log("[盾反] 事件触发");
    let player = event.player;          // ServerPlayer 盾反玩家（非玩家格挡时为 null）
    if(player.level.isClientSide()) return;

    // 修复：原判断 isAlive() && isPlayer() 时 return 写反了，导致玩家盾反逻辑从未执行
    if(!player || !player.isAlive()) {
        // console.log("[盾反] 阶段E-跳过: player为null或已死亡 (player=" + (player != null) + ")");
        return; // 只处理玩家盾反
    }
    // console.log("[盾反] 阶段E-玩家有效: " + player.username);

    let attacker = event.attacker;      // LivingEntity 被盾反击退的攻击者（可能为 null）
    let source = event.damageSource;    // DamageSource 被格挡的伤害来源
    let dmg = event.blockedDamage;      // float 被盾反格挡的伤害量

    let px = player.getX();
    let py = player.getY();
    let pz = player.getZ();
    let server = player.server;

    global.sendParticleTextInFront(player, "盾反！", 0xFFAA00);

    // ===== 打击感反馈 =====
    // 音效三连：高频金属瞬态(铁砧) + 盾牌格挡 + 重击闷响，音高随机微调让每次盾反有变化
    let clangPitch = 1.7 + Math.random() * 0.3;
    server.runCommandSilent(`/playsound minecraft:block.anvil.land player @a ${px} ${py} ${pz} 0.35 ${clangPitch}`);
    server.runCommandSilent(`/playsound minecraft:item.shield.block player @a ${px} ${py} ${pz} 1.0 1.2`);
    server.runCommandSilent(`/playsound minecraft:entity.player.attack.knockback player @a ${px} ${py} ${pz} 0.5 0.9`);

    // 粒子三连：中心爆闪 + 暴击火花 + 环形冲击波（低扩散速度形成扩散环）
    server.runCommandSilent(`particle minecraft:explosion ${px} ${py + 1.2} ${pz} 0.3 0.3 0.3 0.1 3`);
    server.runCommandSilent(`particle minecraft:crit ${px} ${py + 1} ${pz} 0.6 0.6 0.6 0.6 40`);
    server.runCommandSilent(`particle minecraft:cloud ${px} ${py + 0.8} ${pz} 1.3 0.1 1.3 0.25 25`);

    // 武士刀（村正）同款悬浮字幕粒子
    global.sendParticleTextInFront(player, "盾反！", 0xFFAA00);

    if(hasCurios(player,"rainbow:sharingan"))
        {
            // 写轮眼：盾反时恢复主副手 + Curios 饰品 总冷却时长 25% 的冷却
            // console.log("[盾反] 阶段F-检测到写轮眼, 开始恢复冷却");
            sharinganRestoreCooldowns(player, 0.25);
        }

    if(hasCurios(player,"rainbow:reload_core"))
        {
            // 装填核心被动：盾反成功时，两把霰弹枪当前剩余冷却 -33%（自身1秒触发冷却）
            // 主动技能（10秒冷却）期间此被动不触发；仅在真正削减了冷却时才进入1秒冷却
            if (!player.cooldowns.isOnCooldown("rainbow:reload_core")) {
                let cutA = restoreCooldownByRemaining(player, Item.of('netherexp:shotgun_fist'), 0.33);
                let cutB = restoreCooldownByRemaining(player, Item.of('netherexp:pump_charge_shotgun'), 0.33);
                if (cutA || cutB) {
                    player.cooldowns.addCooldown("rainbow:reload_core", SecoundToTick(1));
                }
            }
        }
});

/*getDamageSource()	DamageSource	这次攻击的伤害来源
getOriginalBlockedDamage()	float	原始格挡伤害值（等于原始攻击伤害）
getBlockedDamage()	float	当前实际格挡的伤害值（可被 setter 修改）
shieldTakesDamage()	boolean	盾牌是否受耐久损耗
setBlockedDamage(float)	void	修改格挡伤害量（不可低于 0 或超过原始值）
setShieldTakesDamage(boolean)	void	控制盾牌是否掉耐久*/
// 无法格挡的伤害类型列表（msgId，模组伤害类型可能带"."，如 "alexscaves.irradiated"）
/*const UNBLOCKABLE_DAMAGE_TYPES = [
    "magic",              // 魔法伤害（喷溅药水等）
    "indirect_magic",     // 间接魔法伤害（唤魔者尖刺等）
    "sonic_boom",         // 监守者音波
]

// 获取伤害类型ID：参考 Utils.js 的 DamageSorce()（source.getType()），失败时从 toString() 解析
function getDamageTypeId(ds) {
    try {
        let t = ds.getType()
        if (t) return String(t)
    } catch (ignored) {}
    try {
        let m = ds.getMsgId()
        if (m) return String(m)
    } catch (ignored) {}
    // 回退：toString() 格式为 "DamageSource (arrow)"，括号内即伤害类型
    let s = String(ds)
    return s.substring(s.lastIndexOf("(") + 1, s.lastIndexOf(")"))
}*/
/*
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.ShieldBlockEvent', event => {
    try {
        let player = event.getEntity();
        if (!player.isPlayer()) return;
        if (player.level.clientSide) return;

        // 列表内的伤害类型无法被盾牌格挡
        /*let damageType = getDamageTypeId(event.getDamageSource());
        if (UNBLOCKABLE_DAMAGE_TYPES.indexOf(damageType) >= 0) {
            event.setBlockedDamage(0);
            event.setShieldTakesDamage(false);
            return;
        }

        // 举盾不超过10tick → 盾反
        if (player.getTicksUsingItem() <= 10) {
            //player.tell("盾反成功！");
            /*event.setShieldTakesDamage(false);

            let px = player.getX();
            let py = player.getY();
            let pz = player.getZ();
            let server = player.server;

            // ===== 打击感反馈 =====
            // 音效三连：高频金属瞬态(铁砧) + 盾牌格挡 + 重击闷响，音高随机微调让每次盾反有变化
            let clangPitch = 1.7 + Math.random() * 0.3;
            server.runCommandSilent(`/playsound minecraft:block.anvil.land player @a ${px} ${py} ${pz} 0.35 ${clangPitch}`);
            server.runCommandSilent(`/playsound minecraft:item.shield.block player @a ${px} ${py} ${pz} 1.0 1.2`);
            server.runCommandSilent(`/playsound minecraft:entity.player.attack.knockback player @a ${px} ${py} ${pz} 0.5 0.9`);

            // 粒子三连：中心爆闪 + 暴击火花 + 环形冲击波（低扩散速度形成扩散环）
            server.runCommandSilent(`particle minecraft:explosion ${px} ${py + 1.2} ${pz} 0.3 0.3 0.3 0.1 3`);
            server.runCommandSilent(`particle minecraft:crit ${px} ${py + 1} ${pz} 0.6 0.6 0.6 0.6 40`);
            server.runCommandSilent(`particle minecraft:cloud ${px} ${py + 0.8} ${pz} 1.3 0.1 1.3 0.25 25`);

            // 白色快速扩散光环（dyeing，同迷你月球用法）
            //server.runCommandSilent(`/dyeing area add scale shield_parry ${player.getUuid().toString()} -2 0 -2 2 2 2 90FFFFFF 0.4 2.0 1.0 1.0 4 1 remove`);

            // 击退范围内敌人（参考 Skillwheel.js 迷你月球）
            let radius = 4;
            let centerX = px;
            let centerY = py + 0.5;
            let centerZ = pz;
            let area = player.boundingBox.inflate(radius);
            player.level.getEntitiesWithin(area).forEach(entity => {
                if (!entity) return;
                if (!entity.isLiving() || !entity.isAlive()) return;
                if (entity == player) return;
                if (!isEnemy(player, entity)) return;

                let dx = entity.getX() - centerX;
                let dy = entity.getY() - centerY;
                let dz = entity.getZ() - centerZ;
                let distanceSq = dx * dx + dy * dy + dz * dz;
                if (distanceSq <= 0 || distanceSq > radius * radius) return;

                let distance = Math.sqrt(distanceSq);
                let motionX = dx / distance;
                let motionZ = dz / distance;
                // 水平推开 + 轻微上抛
                entity.setDeltaMovement(new Vec3d(motionX * 1.4, 0.35, motionZ * 1.4));
                entity.hurtMarked = true;
                // 反伤：受击红闪 + 受击音，强化命中反馈
                entity.attack(player.damageSources().playerAttack(player), 3);
                // 短暂硬直：1秒缓慢IV，敌人被盾反后明显顿住
                server.runCommandSilent(`effect give ${entity.getUuid()} minecraft:slowness 1 3 true`);
            })

        if(hasCurios(player,"rainbow:sharingan"))
        {
            let mainHandItem = player.getItemInHand("main_hand").getId();
            //let offHandItem = attacker.getItemInHand("off_hand").getId();
            player.cooldowns.removeCooldown(mainHandItem);
            //attacker.cooldowns.removeCooldown(offHandItem);
        }
    } catch (e) {
        console.log("盾反判定出现问题：");
        console.log(e);
    }
});*/
