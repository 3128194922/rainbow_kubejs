// priority: 500
// ==========================================
// 👹 实体事件处理脚本
// ==========================================

// 文本粒子 API（server_scripts 作用域无法访问 startup_scripts\CONST.js，需单独加载）
let DiceParticleTextAPI = Java.loadClass('com.uniye.mysticartifacts.util.ParticleTextAPI')

// 监听实体受伤事件
EntityEvents.hurt(event => {
    const { entity, source } = event;

    // 黏液棒攻击逻辑
    if (source.player && entity) {
        // 如果攻击者手持黏液棒
        if (source.player.getMainHandItem().id === "rainbow:slime_rod") {
            // 移除受害者所有护甲（头、胸、腿、脚）
            ["chest", "feet", "head", "legs"].forEach(slot => {
                let armorItem = entity.getItemBySlot(slot);
                if (armorItem && !armorItem.isEmpty()) {
                    entity.popItem(armorItem.id); // 掉落护甲
                    armorItem.shrink(1); // 移除护甲
                }
            });

            // 消耗黏液棒耐久
            source.player.getMainHandItem().shrink(1);
        }
    }
    //撼俑免疫动能伤害（不然会崩溃）
    if(entity.getType() == "species:quake" && source.getType() == "generic")
        {
            event.cancel(); // 取消伤害
        }

    //大哥怒了！
    /*if (source.player) {
        let nbt = entity.nbt;
        let germoniumState = nbt.getString("Germonium");
        let luck = source.player.getAttribute("minecraft:generic.luck").getValue();

        if (germoniumState && germoniumState === "normal" && luck < 0) {
            // 获取玩家幸运值并计算触发概率 (绝对值/100)
            let probability = Math.abs(luck) / 100.0;

            // 只有满足概率才触发
            if (randomBool(probability)) {
                // 50% 概率决定形态
                let isInfernium = randomBool(0.5);
                let newForm = isInfernium ? "infernium" : "celestium";
                
                // 更新 NBT
                entity.mergeNbt({ Germonium: newForm });
                
                Utils.server.scheduleInTicks(1,event=>{
                    // 恢复满血
                    entity.setHealth(entity.getMaxHealth());
                })
            }
        }
    }*/

});

// 大师球 + 莉莉丝拥抱：灵魂替死
EntityEvents.hurt(event => {
    let entity = event.entity;
    if (!entity || !entity.isPlayer()) return;
    if (entity.level.isClientSide()) return;

    let healthAfter = entity.health - event.damage;
    if (healthAfter > 0) return;

    if (!hasCurios(entity, 'rainbow:dead_river')) return;
    if (!hasCurios(entity, 'rainbow:lilith_hug')) return;

    let necklace = getCuriosItem(entity, 'rainbow:dead_river');
    if (!necklace) return;

    let nbt = necklace.getNbt();
    if (!nbt) return;

    let souls = nbt.getInt("Souls");
    if (souls <= 0) return;

    nbt.putInt("Souls", souls - 1);
    event.cancel();
    entity.setHealth(entity.getMaxHealth());
    entity.level.runCommandSilent(`/playsound entity.player.levelup voice ${entity.displayName.string} ${entity.x} ${entity.y} ${entity.z} 0.5 1.2`);
});

// 实体死亡事件
EntityEvents.death(event => {
    const server = event.getServer();
    const entity = event.getEntity();
    const attacker = event.getSource().getPlayer();

    // --- 自爆背包逻辑 ---
    // 检查玩家或实体背部饰品栏是否有爆炸物，死后触发爆炸
    if (hasCurios(entity, "minecraft:tnt")) {
        server.runCommandSilent(`/summon minecraft:tnt ${entity.x} ${entity.y} ${entity.z}`);
        entity.getCuriosStacksHandler("back").get().getStacks().setStackInSlot(0, "minecraft:air");
    } else if (hasCurios(entity, "oreganized:shrapnel_bomb")) {
        server.runCommandSilent(`/summon oreganized:shrapnel_bomb ${entity.x} ${entity.y} ${entity.z}`);
        entity.getCuriosStacksHandler("back").get().getStacks().setStackInSlot(0, "minecraft:air");
    } else if (hasCurios(entity, "savage_and_ravage:spore_bomb")) {
        server.runCommandSilent(`/summon savage_and_ravage:spore_bomb ${entity.x} ${entity.y} ${entity.z}`);
        entity.getCuriosStacksHandler("back").get().getStacks().setStackInSlot(0, "minecraft:air");
    }else if(hasCurios(entity,'alexscaves:nuclear_bomb'))
    {
        // 核弹背包
        server.runCommandSilent(`/summon alexscaves:nuclear_bomb ${entity.x} ${entity.y} ${entity.z}`);
        entity.getCuriosStacksHandler("back").get().getStacks().setStackInSlot(0, "minecraft:air");
        server.runCommandSilent(`/playsound alexscaves:nuclear_siren voice @a ~ ~ ~`)
    }
    
    // --- 攻击者触发逻辑 ---
    if (!attacker) return;

    // 赌徒骰子：击杀时随机减少冷却中饰品/主副手 当前剩余冷却的 0%~25%
    // 暴击率与幸运值绑定（幸运25=100%暴击），暴击使减少百分比×2
    // 有趣的设定：摇出 0% 时依旧会暴击 → 会出现「暴击 0%」
    // 骰子自身有 5 秒触发冷却，冷却期间击杀不生效
    // 冷却读取/恢复使用 global.getItemCooldownInfo / global.restoreCooldownByRemaining（startup_scripts/Utils.js 注册，按当前剩余折算）
    if (hasCurios(attacker, "rainbow:dice") && !attacker.cooldowns.isOnCooldown("rainbow:dice")) {
        try {
            // 收集主副手 + Curios 饰品栏中处于冷却的物品（按物品ID去重）
            let cooled = [];
            let seen = {};
            let collect = function (stack) {
                try {
                    if (!stack || stack.isEmpty()) return;
                    let id = String(stack.getId());
                    if (seen[id]) return;
                    seen[id] = true;
                    let info = global.getItemCooldownInfo ? global.getItemCooldownInfo(attacker, stack) : null;
                    if (info && info.remaining > 0) cooled.push(stack);
                } catch (ignored) {}
            };
            collect(attacker.getItemInHand("main_hand"));
            collect(attacker.getItemInHand("off_hand"));
            listCuriosStack(attacker).forEach(function (stack) { collect(stack); });

            // 没有任何冷却中的物品时不触发、不进入冷却（避免空反馈和浪费触发）
            if (cooled.length > 0) {
                // 触发成功，进入 5 秒自身冷却
                attacker.cooldowns.addCooldown("rainbow:dice", SecoundToTick(5));
                // 掷骰：随机减少百分比 0%~25%
                let pct = Math.random() * 0.25;
                // 暴击判定：幸运值/25（幸运≥25必定暴击，幸运<0不暴击）
                let luckAttr = attacker.getAttribute("minecraft:generic.luck");
                let lucky = luckAttr ? luckAttr.getValue() : 0;
                let crit = lucky >= 0 && randomBool(lucky / 25.0);
                // 暴击使减少百分比×2（0% 暴击后数值依然是 0%，但会显示「暴击 0%」）
                let effPct = crit ? pct * 2 : pct;

                if (effPct > 0) {
                    cooled.forEach(function (stack) {
                        if (global.restoreCooldownByRemaining) global.restoreCooldownByRemaining(attacker, stack, effPct);
                    });
                }

                // 反馈：原版经验音效（暴击高音调）+ 文本粒子（暴击显示"暴击"前缀，未暴击只显示百分比）
                let pctText = Math.round(effPct * 100) + "%";
                let msg = crit ? "暴击 -" + pctText : "-" + pctText;
                server.runCommandSilent(`/playsound minecraft:entity.experience_orb.pickup player @a ${attacker.x} ${attacker.y} ${attacker.z} 1 ${crit ? 1.5 : 1.0}`);
                DiceParticleTextAPI.sendInFront(attacker, msg, crit ? 0xFFAA00 : 0x55FFFF);
            }
        } catch (e) {
            console.log("[赌徒骰子] 触发出错: " + e);
        }
    }
})
