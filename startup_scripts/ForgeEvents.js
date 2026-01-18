// priority: 500
// =============================================
// 🛠️ Forge 事件处理脚本
// 作用：处理底层的 Forge 事件，包括玩家伤害、方块交互、属性修改、实体AI等
// =============================================

// =============================================
// 🧱 模块1：防御逻辑（受击方）
// 处理玩家受到伤害时的减免、特效触发等逻辑
// =============================================
function handleVictimDefense(event, victim, source, EquipmentSlot, UUID) {
    if (!victim.isPlayer()) return;

    // --- 防化服套装效果 ---
    if(victim.getItemBySlot("head").id == 'alexscaves:hazmat_mask' 
    && victim.getItemBySlot("chest").id == 'alexscaves:hazmat_chestplate' 
    && victim.getItemBySlot("legs").id == 'alexscaves:hazmat_leggings' 
    && victim.getItemBySlot("feet").id == 'alexscaves:hazmat_boots')
    {
        if(source.getType() == "poison_cloud" || source.getType() == "wither")
            {
                event.setCanceled(true)
            }
    }

    // --- 民主甲套装效果 ---
    // 只有穿戴全套民主装备时生效
    if (
        victim.getItemBySlot("chest").id == "uniyesmod:democracy_chestplate" &&
        victim.getItemBySlot("feet").id == "uniyesmod:democracy_boots" &&
        victim.getItemBySlot("head").id == "uniyesmod:democracy_helmet" &&
        victim.getItemBySlot("legs").id == "uniyesmod:democracy_leggings"
    ) {
        // 检查背罐中的空气量
        /*let tank = global.backtankUtils.getFirstTank(victim);
        if (tank && global.backtankUtils.hasAirRemaining(tank)) {
            let currentAir = global.backtankUtils.getAir(tank);
            let damage = event.getAmount();

            // 每点伤害需要消耗的气量（例如 10）
            let airPerDamage = 10;
            let requiredAir = damage * airPerDamage;

            if (currentAir >= requiredAir) {
                // 气量充足 → 消耗气量并完全免伤
                global.backtankUtils.consumeAir(victim, tank, requiredAir);
                event.setAmount(0);
            } else if (currentAir > 10) {
                // 气量不足但仍有剩余 → 抵消部分伤害并耗尽气量
                let reducedDamage = damage * (1 - currentAir / requiredAir);
                event.setAmount(reducedDamage);
                global.backtankUtils.consumeAir(victim, tank, currentAir); // 用光剩余气体
            }
        }*/
        let tank = getCuriosItem(victim, 'create:copper_backtank')?getCuriosItem(victim, 'create:copper_backtank'):getCuriosItem(victim, 'create:netherite_backtank');
        let currentAir = tank.nbt.getInt("Air");
        if (tank && currentAir > 0) {
            let damage = event.getAmount();
            let airPerDamage = 5;
            let requiredAir = damage * airPerDamage;

            if(currentAir >= requiredAir)
                {
                    tank.nbt.putInt("Air",tank.nbt.getInt("Air") - requiredAir);
                    event.setAmount(0);
                    victim.level.runCommandSilent(`playsound create:steam voice ${victim.displayName.string} ${victim.x} ${victim.y} ${victim.z} 100 1`)
                }
            else
                {
                    // 气量不足但仍有剩余 → 抵消部分伤害并耗尽气量
                    let reducedDamage = damage * (1 - currentAir / requiredAir);
                    event.setAmount(reducedDamage);
                    tank.nbt.putInt("Air",0);
                    victim.level.runCommandSilent(`playsound create:steam voice ${victim.displayName.string} ${victim.x} ${victim.y} ${victim.z} 100 1`)
                }
        }
    }


    // --- 古代庇护饰品 ---
    // 转移伤害给绑定的玩家
    if (hasCurios(victim, "rainbow:ancientaegis")) {
        let item = getCuriosItem(victim, "rainbow:ancientaegis");
        if (item && item.nbt) {
            let uuidStr = item.nbt.getString("UUID");
            if (uuidStr) {
                try {
                    let uuid = UUID.fromString(uuidStr);
                    let targetPlayer = victim.level.getPlayerByUUID(uuid);
                    if (targetPlayer) {
                        // 将伤害转移给绑定目标，自身免伤
                        targetPlayer.attack(targetPlayer.damageSources().magic(), event.getAmount());
                        event.setAmount(0);
                    }
                } catch (err) {
                    console.log("UUID 解析失败: " + err);
                }
            }
        }
    }

    // --- 韧性注射器 ---
    // 根据韧性值百分比减免伤害
    if (victim.persistentData.getInt("resilience") > 0 &&
        event.getAmount() != 0 &&
        hasCurios(victim, "rainbow:resilience_syringe")) {
        event.setAmount(event.getAmount() * (100 - victim.persistentData.getInt("resilience")) / 100);
        // 消耗掉韧性值（一次性生效）
        victim.persistentData.putInt("resilience", 0);
    }

    // --- 伤害积蓄 ---
    // 积累伤害，达到阈值后释放爆炸
    if (victim.hasEffect("rainbow:damage_num")) {
        let dmg = victim.persistentData.getFloat("damage_num") + event.getAmount();
        if (dmg < 100) {
            victim.persistentData.putFloat("damage_num", dmg);
        } else {
            // 伤害超过100，触发爆炸
            victim.server.runCommandSilent(`/playsound rainbow:voice.fte voice @a ${victim.x} ${victim.y} ${victim.z}`);
            victim.level.createExplosion(victim.x, victim.y, victim.z)
                .exploder(victim)
                .strength(dmg / 10)
                .explosionMode('none')
                .explode();
            victim.persistentData.putFloat("damage_num", 0);
        }
    }

    // --- 大胃王饰品 ---
    // 消耗饱和度抵消伤害
    if (hasCurios(victim, "rainbow:big_stomach")) {
        if (victim.getFoodData().getSaturationLevel() > 0) {
            victim.getFoodData().setSaturation(
                Math.max(victim.getFoodData().getSaturationLevel() - event.getAmount(), 0)
            );
            event.setAmount(0);
        }
    }

    // --- 暴食护符（免饥饿伤害） ---
    if (source.getType() == "starve" && hasCurios(victim, "rainbow:gluttony_charm")) {
        event.setCanceled(true);
    }
}


// =============================================
// ⚔️ 模块2：武器伤害逻辑
// 处理玩家攻击时的特殊武器效果
// =============================================
function handleWeaponEffects(event, attacker, victim, source, range_damage) {
    const mainHand = attacker.getItemInHand("main_hand");
    const offHand = attacker.getItemInHand("off_hand");

    // 提尔锋：按目标护甲值增加伤害
    if (mainHand.id == "rainbow:tyrfing" && range_damage.indexOf(source.getType()) == -1) {
        event.setAmount(event.getAmount() + event.getAmount() * victim.getArmorValue());
    }

    // 重锤：下落动能增伤（根据垂直速度）
    if (mainHand.id == "rainbow:heavy_axe" && range_damage.indexOf(source.getType()) == -1) {
        event.setAmount(event.getAmount() + ((Math.abs(attacker.getDeltaMovement().y()).toFixed(1) - 0.1) * 40));
        attacker.fallDistance = 0;
    }

    // 巨寒霜剑：给予冰冻效果，对特定生物（水生、防火、末影人）伤害加成
    if (mainHand.id == "legendary_monsters:the_great_frost" && range_damage.indexOf(source.getType()) == -1) {
        victim.potionEffects.add("legendary_monsters:freeze", SecoundToTick(3), 0, false, false);
        if (victim.isWaterCreature() || victim.fireImmune() || victim.getType() == "minecraft:enderman") {
            event.setAmount(event.getAmount() * 1.5);
        }
    }

    // 盈泪之剑：点燃 + 概率性悲伤效果
    if (mainHand.id == "rainbow:teardrop_sword" && range_damage.indexOf(source.getType()) == -1 ||
        (offHand.id == "rainbow:teardrop_sword" && mainHand.id == "rainbow:frostium_sword")) {
        victim.setSecondsOnFire(15);
        if (randomBool(0.33)) {
            victim.potionEffects.add("rainbow:temporal_sadness", SecoundToTick(5), 0, true, true);
        }
    }

    // 万能钥匙斧：气罐触发额外伤害
    if (mainHand.id == "uniyesmod:master_key" && range_damage.indexOf(source.getType()) == -1) {
        let tank = global.backtankUtils.getFirstTank(attacker);
        if (tank && global.backtankUtils.hasAirRemaining(tank)) {
            global.backtankUtils.consumeAir(attacker, tank, 10); // 消耗10气
            event.setAmount(event.getAmount() + 6); // 增加伤害
            attacker.level.playSound(null, attacker.blockPosition(), "create:whistle_low", "players", 1.0, 1.0);
        }
    }
}


// =============================================
// 💍 模块3：饰品与状态逻辑
// 处理攻击者佩戴饰品或拥有特定状态时的效果
// =============================================
function handleCuriosEffects(event, attacker, victim, source, range_damage) {
    const mainHand = attacker.getItemInHand("main_hand");
    const offHand = attacker.getItemInHand("off_hand");

    // 牢大饮料/曼巴效果：速度加成伤害倍率
    if (hasCurios(attacker, "rainbow:ice_tea") || attacker.hasEffect("rainbow:manba")) {
        event.setAmount(event.getAmount() * attacker.getSpeed().toFixed(2) * 10);
        attacker.server.runCommandSilent(`/playsound rainbow:voice.man voice @p ${victim.x} ${victim.y} ${victim.z}`);
    }

    // 屠夫之钉：远程攻击暴击引发爆炸
    if (hasCurios(attacker, "rainbow:clawofhorus") &&
        range_damage.indexOf(source.getType()) != -1 &&
        !attacker.cooldowns.isOnCooldown("rainbow:clawofhorus")) {

        // 幸运值影响触发概率
        if (randomBool(attacker.getAttribute("generic.luck").getValue() / 10.0)) {
            attacker.level.createExplosion(victim.x, victim.y + 1, victim.z)
                .causesFire(false)
                .exploder(attacker)
                .explosionMode("none")
                .strength(0)
                .explode();
            attacker.cooldowns.addCooldown("rainbow:clawofhorus", SecoundToTick(6));
            attacker.cooldowns.removeCooldown(offHand.id);
        }
    }

    // 决斗剑：对已记录类型的生物造成额外伤害
    if (mainHand.id == "rainbow:duel") {
        if (mainHand.nbt.type == victim.getType()) {
            event.setAmount(event.getAmount() * 1.5);
        } else {
            mainHand.nbt.type = victim.getType();
        }
    }

    // 链式闪电饰品：攻击时触发链式闪电
    if (hasCurios(attacker, "rainbow:lightning")) {
        let lightning = attacker.level.createEntity('domesticationinnovation:chain_lightning');
        lightning.setCreatorEntityID(attacker.getId());
        lightning.setFromEntityID(attacker.getId());
        lightning.setToEntityID(victim.getId());
        lightning.setChainsLeft(5);
        victim.level.addFreshEntity(lightning);
        attacker.server.runCommandSilent(`/playsound domesticationinnovation:chain_lightning voice @p ${attacker.x} ${attacker.y} ${attacker.z}`);
    }

    // 被标记目标（tag）受到远程攻击双倍伤害
    if (victim.hasEffect("rainbow:tag") && range_damage.indexOf(source.getType().toString()) != -1) {
        event.setAmount(event.getAmount() * 2);
    }
}

// =============================================
// ⚔️ 玩家受伤事件（主入口）
// =============================================
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingHurtEvent", event => {
    const victim = event.entity;
    const attacker = event.source.player;
    const source = event.getSource();
    const EquipmentSlot = Java.loadClass("net.minecraft.world.entity.EquipmentSlot");
    const UUID = Java.loadClass("java.util.UUID");
    
    // 定义远程伤害类型列表
    const range_damage = [
        'atmospheric.passionFruitSeed',
        'thrown',
        'soulBullet',
        'arrow',
        'trident',
        'lead_bolt',
        'create.potato_cannon'
    ];
    const soure_magic = ["indirectMagic", "magic"];

    try {
        // ========= 魔法与防御逻辑 =========
        handleVictimDefense(event, victim, source, EquipmentSlot, UUID);
    } catch(e) {
        console.log("handleVictimDefense出现问题:")
        console.log(e)
    }

    try {
        // ========= 攻击者过滤与攻击逻辑 =========
        if (!attacker || !attacker.isPlayer()) return;
        if (attacker.level.isClientSide()) return;
    
        // 执行攻击特效模块
        handleCuriosEffects(event, attacker, victim, source, range_damage);
        handleWeaponEffects(event, attacker, victim, source, range_damage);
    } catch(e) {
        console.log("handleCuriosEffects\\handleWeaponEffects出现问题:")
        console.log(e)
    }
});

// 抛射体撞击事件（占位）
ForgeEvents.onEvent("net.minecraftforge.event.entity.ProjectileImpactEvent", event => {
})

// 玩家放置方块事件
ForgeEvents.onEvent("net.minecraftforge.event.level.BlockEvent$EntityPlaceEvent", event => {
    try {
        let entity = event.getEntity()

        if (entity.level.clientSide) return;

        // 禁止在 backroom 维度放置方块
        if (entity.level.name.getString() === "backroom:backroom") {
            event.setCanceled(true);
        }
    } catch(e) {
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

        // 检测黑曜石和特定镐子（霜冻金属镐加速挖掘）
        if (event.originalSpeed >= 8.0 && entity.getItemInHand("main_hand").id == "rainbow:frostium_pickaxe") {
            // 修改破坏速度（原始值×16）
            event.newSpeed = 16 * event.originalSpeed;
        }
        // 禁止在 backroom 维度挖掘
        if (entity.level.name.getString() === "backroom:backroom") {
            event.newSpeed = 0 * event.originalSpeed;
        }
    } catch(e) {
        console.log("玩家破坏方块事件出现问题：")
        console.log(e)
    }
});

// 玩家攻击实体事件
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.AttackEntityEvent", event => {
    try {
        let entity = event.getEntity();
        let target = event.getTarget();
        let Integer = Java.loadClass("java.lang.Integer");
        if (entity.level.clientSide) return;

        if (entity.getType() != null && target.getType() != null) {
            // 泰拉刃：增加充能等级
            if (entity.getItemInHand("main_hand") === 'rainbow:terasword') {
                if (!entity.getItemInHand("main_hand").nbt.power) {
                    entity.getItemInHand("main_hand").nbt.power = 1;
                }
                else {
                    if (entity.getItemInHand("main_hand").nbt.power < 4) {
                        entity.getItemInHand("main_hand").nbt.power = entity.getItemInHand("main_hand").nbt.power + 1;
                    }
                    else {
                        return;
                    }
                }
            }
            // 动力剑：充能逻辑
            if (entity.getItemInHand("main_hand") === 'rainbow:baseball_power') {
                console.log(entity.getItemInHand("main_hand").getNbt().getInt("Power"))
                if(!entity.getItemInHand("main_hand").getNbt().getInt("Power")) {
                    entity.getItemInHand("main_hand").getNbt().putInt("Power",4)
                } else {
                    entity.getItemInHand("main_hand").getNbt().putInt("Power",entity.getItemInHand("main_hand").getNbt().getInt("Power") - 1)
                }
        
                // 充能耗尽，变回普通棒球棍
                if(entity.getItemInHand("main_hand").getNbt().getInt("Power") == 1) {
                    entity.setItemInHand("main_hand","rainbow:baseball_bat")
                    entity.cooldowns.addCooldown("rainbow:baseball_bat",SecoundToTick(40))
                }
            }
            // 决斗剑：初始化类型
            if (entity.getItemInHand("main_hand") === 'rainbow:duel') {
                if (!entity.getItemInHand("main_hand").nbt.type) {
                    entity.getItemInHand("main_hand").nbt.type = none;
                }
            }
        }
    } catch(e) {
        console.log("玩家攻击事件出现问题：")
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
    } catch(e) {
        console.log("玩家右键生物事件出现问题：")
        console.log(e)
    }
});

const AttributeModifier = Java.loadClass('net.minecraft.world.entity.ai.attributes.AttributeModifier');

// 物品动态属性修改事件
ForgeEvents.onEvent('net.minecraftforge.event.ItemAttributeModifierEvent', (event) => {
    let item = event.getItemStack();
    let slotType = event.getSlotType();

    try {
        if (!item || item.getNbt() == null) return;

        // 邪恶面具：根据 maskId 动态添加属性
        if (item.id === "species:wicked_mask" && slotType === "head") {
            let maskId = item.getNbt().getString("id")
            let attrs = global.MobMaskAttributeConfig[maskId]

            // ✅ 统一为数组，自动兼容 0、1、多个
            if (!attrs) return
            if (!Array.isArray(attrs)) attrs = [attrs]

            attrs.forEach(attr => {
                if (!attr || !attr.attribute) return
                event.addModifier(
                    attr.attribute,
                    new AttributeModifier(
                        attr.UUID,
                        attr.ID,
                        attr.NUMBER,
                        attr.OPERATION
                    )
                )
            })
        }

        // 🍳 饕餮之锅：食物数量影响攻击力
        let foodnum = item.getNbt().getInt("foodnumber") || 0;
        if (item.id === "rainbow:eldritch_pan" && slotType === "mainhand") {
            event.addModifier(
                "generic.attack_damage",
                new AttributeModifier(
                    'e93f7408-d7f1-4df1-a28f-43c2e16b004e',
                    'eldritch_pan',
                    1 * foodnum,
                    "addition"
                )
            );
        }

        // 🗡️ 群系之刃：群系系数影响攻击力
        let biomenum = item.getNbt().getInt("biomenum") || 0;
        if (item.id === "rainbow:biome_of_sword" && slotType === "mainhand") {
            event.addModifier(
                "generic.attack_damage",
                new AttributeModifier(
                    'b6ea6b0f-a294-44d5-a5af-8793b02b19c4',
                    'biome_of_sword',
                    1 * biomenum,
                    "addition"
                )
            );
        }

    } catch (e) {
        console.log(e);
    }
});

// 监听实体仇恨变更事件
ForgeEvents.onEvent("net.minecraftforge.event.entity.living.LivingChangeTargetEvent", event => {
    try{
        let entity_A = event.getEntity() // 产生仇恨的实体
        let entity_B = event.getNewTarget() // 新的目标
    
        if(!entity_B) return
    
        // 佩戴对应生物面具的玩家不会被该种生物攻击
        if(entity_B.isLiving() && entity_B.isPlayer()){
            if(entity_B.getItemBySlot("head").id == "species:wicked_mask" && entity_B.getItemBySlot("head").getNbt().getString("id") == entity_A.getType())
            {
                event.setNewTarget(null) // 取消仇恨
            }
        }
    }catch (e) {
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
    try
    {
        let entity = event.entity;
        // 获取效果实例
        let effectInstance = event.getEffectInstance();
        let effectId = effectInstance.getEffect().getDescriptionId();

        // 下班时间到了，实体消失
        if(effectId === "effect.rainbow.off_work_time")
        {
            entity.discard() 
        }
    }
    catch(e)
    {
        console.log("监听buff过期出现问题：")
        console.log(e)
    }
});

// 监听效果赋予事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobEffectEvent$Added', event => {
    try
    {
        let entity = event.entity;
        if(!entity.isPlayer()) return;
        // 获取效果实例
        let effectInstance = event.getEffectInstance();
        let effectId = effectInstance.getEffect().getDescriptionId();
        if(effectId.toString() == "effect.minecraft.poison" || effectId.toString() == "effect.alexscaves.irradiated" || effectId.toString() == "effect.minecraft.wither")
            {
                if(entity.getItemBySlot("head").id == 'alexscaves:hazmat_mask' 
                && entity.getItemBySlot("chest").id == 'alexscaves:hazmat_chestplate' 
                && entity.getItemBySlot("legs").id == 'alexscaves:hazmat_leggings' 
                && entity.getItemBySlot("feet").id == 'alexscaves:hazmat_boots')
                    {
                        event.setCanceled(true);
                    }
            }

    }
    catch(e)
    {
        console.log("监听buff赋予出现问题：")
        console.log(e)
    }
});

/*
// 堕落之心逻辑（已注释）
// ...
*/

// 虚空炼成系统：物品掉入虚空后转化为指定产物
ForgeEvents.onEvent("net.minecraftforge.event.entity.EntityLeaveLevelEvent", (event) => {
    try
    {
        let { entity, level } = event;
        // 确保是物品掉入虚空
        if (level.clientSide || !entity.item || entity.getY() > level.getMinBuildHeight()) return;

        let inputItemId = entity.item.id;
        let inputCount = entity.item.count;

        // 配方列表：输入 → 输出
        let voidTransmuteRecipes = {
            'rainbow:raw_voidore': 'createutilities:void_steel_ingot'
        };

        // 检查是否有对应配方
        let outputItemId = voidTransmuteRecipes[inputItemId];
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
    }catch(e)
    {
        console.log("虚空炼成系统出现问题：")
        console.log(e)
    }
});


// 监听左键空击事件（已注释大部分逻辑）
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent$LeftClickEmpty', event => {
    /* 
    // 剑气/投射物逻辑
    // ...
    */
})

// 监听效果移除事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.MobEffectEvent$Remove', event => {
    try
    {
        let entity = event.getEntity();
        if(!entity.isPlayer()) return;
        if(!event.getEffectInstance()) return;
        let buffId = event.getEffectInstance().getDescriptionId();
        let item_main = entity.getItemInHand("main_hand").getId();
        let item_off = entity.getItemInHand("off_hand").getId();

        // 嗜血效果移除逻辑：如果没有打伞，则会被点燃
        if(buffId == "effect.species.bloodlust")
        {
            if(item_main == 'artifacts:umbrella' || item_off == 'artifacts:umbrella')
            {
                event.setCanceled(true);
            }
            else
            {
                entity.secondsOnFire = 100;
                event.setCanceled(true);
            }
        }

    }catch(e)
    {
        console.log("监听玩家获取buff出现问题：")
        console.log(e)
    }
})

// 监听睡觉事件
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerSleepInBedEvent', event => {
    try
    {
        let player = event.getEntity();
        if(!player.isPlayer()) return;
        // 10% 概率做噩梦
        if(randomBool(0.1))
        {
            player.tell("你做了个噩梦")
        }
    }
    catch(e)
    {
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

        // 牺牲护符：击杀计数逻辑
        let item = getCuriosItem(player, "rainbow:oceantooth_necklace");
        if (!item) return;

        let nbt = item.getOrCreateTag();

        // 读取计数
        let kills = nbt.getInt("kill");

        if (kills < 100) {
            nbt.putInt("kill", kills + 1);
        } else {
            nbt.putInt("kill", 0);
            item.setDamageValue(item.getDamageValue() + Integer.valueOf("100"))
            // 这里应该有生成战利品的逻辑，但目前只提示
        }

    } catch (e) {
        console.log("监听死亡出现问题：");
        console.log(e);
    }
});

ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingDeathEvent', event => {
    try {
        let player = event.getSource().getPlayer();
        if (event.getEntity().getLevel().isClientSide()) return;
        if (!player || !player.isPlayer()) return;

        // 牺牲护符：击杀计数逻辑
        let item = getCuriosItem(player, "rainbow:infernotooth_necklace");
        if (!item) return;

        if(player.getItemInHand("main_hand").id == 'species:spectralibur') return;

        let nbt = item.getOrCreateTag();

        let Souls = nbt.getInt("Souls");

        if(Souls == null)
            {
                nbt.putInt("Souls",0)
            }
        else
        {
            nbt.putInt("Souls",Souls + 1)
        }

    } catch (e) {
        console.log("监听死亡出现问题：");
        console.log(e);
    }
});