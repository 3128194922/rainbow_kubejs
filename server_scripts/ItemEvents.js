// priority: 500
const Integer = Java.loadClass("java.lang.Integer");
ItemEvents.rightClicked(event => {
    let { player, item, level, server, hand } = event;
    //let ender_chest = player.getEnderChestInventory().getAllItems();
    if (level.isClientSide()) return;
/*
    // 爆破之星（下界之星）
    if (item.id === "minecraft:nether_star") {
        level.createExplosion(player.x, player.y - 1, player.z).explode();
    }
    */
    // 粘液块平台（粘液棒）
    if (item.id === "rainbow:slime_rod") {
        let playerName = player.getName().getString();
        if (player.shiftKeyDown) {
            // 生成大型粘液块平台
            server.runCommandSilent(`/execute at ${playerName} run fill ~-2 ~-1 ~-2 ~2 ~3 ~2 minecraft:slime_block replace air`);
            server.runCommandSilent(`/execute at ${playerName} run fill ~-1 ~0 ~-1 ~1 ~2 ~1 minecraft:air replace slime_block`);
        } else {
            // 生成小型粘液块平台
            server.runCommandSilent(`/execute as ${playerName} at @s run fill ~-1 ~-3 ~-1 ~1 ~-3 ~1 minecraft:slime_block replace air`);
        }
        player.setStatusMessage('救命之恩！');
        player.setItemInHand("main_hand", 'minecraft:air');
    }

    // 拉屎行为（纸+潜行）
    if (item.id === "minecraft:paper" && player.shiftKeyDon) {
        item.shrink(1);
        player.addItem("rainbow:shit");
        player.setStatusMessage('你拉屎了');
    }
    /*
      // 太刀冲刺
      if (item.id === "smc:katana" && !player.cooldowns.isOnCooldown("smc:katana")) {
          player.setDeltaMovement(player.getLookAngle().scale(3.0));
          player.hurtMarked = true;
          player.cooldowns.addCooldown("smc:katana", 60); // 3秒冷却
      }*/
    /*
      // 闹钟（时钟）
      if (item.id === "minecraft:clock" && !player.cooldowns.isOnCooldown("minecraft:clock")) {
          let isDay = level.dayTime <= 13000;
          server.runCommandSilent(`/time set ${isDay ? "night" : "day"}`);
          server.tell(`${player.getName().getString()} 将时间调到${isDay ? "傍晚" : "清晨"}`);
          player.cooldowns.addCooldown("minecraft:clock", 60);
      }
    */
    /*
      // 指南针（月相显示）
      if (item.id === "minecraft:compass" && !player.cooldowns.isOnCooldown("minecraft:compass")) {
          let moonPhaseList = ["满", "亏凸", "下弦", "残", "新", "峨嵋", "满", "满"];
          player.setStatusMessage(`今天的月像是${moonPhaseList[level.moonPhase]}月`);
          player.cooldowns.addCooldown("minecraft:compass", 60);
      }
    */
    /*
      // 回溯指针（重生指南针）
      if (item.id === "minecraft:recovery_compass" && !player.cooldowns.isOnCooldown("minecraft:recovery_compass")) {
          let name = player.getDisplayName().getString();
          if (!global.deathRecords[name]) {
              player.setStatusMessage("纵使一罪，仍有百善");
          } else {
              player.setStatusMessage("不要相信时间，吾将给带来光明");
              server.runCommandSilent(`/tp ${name} ${global.deathRecords[name].x} ${global.deathRecords[name].y} ${global.deathRecords[name].z}`);
          }
          player.cooldowns.addCooldown("minecraft:recovery_compass", 60);
      }
    */
    // 末影戒指（末影箱）
    if (item.id === "rainbow:enderchest" && !player.isShiftKeyDown()) {
        player.openInventoryGUI(player.enderChestInventory, Component.translatable("container.enderchest"));
    }

    // 饕餮之锅
    if (item.id === "rainbow:eldritch_pan") {
        // 检查末影箱是否有物品
        //if (ender_chest.length === 0) return; // 末影箱为空，直接返回

        //let targetItemId = ender_chest[0].id; // 获取末影箱第一个物品的ID

        let targetItem = player.getItemInHand("off_hand");
        let tag = global.foodlist.indexOf(targetItem.id); // 查找在 foodlist 中的索引

        // 如果未找到（tag === -1），则不处理
        if (tag === -1) return;

        // 检查主手物品的 NBT 是否有 foodlist，没有则初始化
        if (!item.nbt.foodlist) {
            item.nbt.foodlist = [];
            item.nbt.foodnumber = 0;
        }

        for (let i = 0; i < item.nbt.foodlist.length; i++) {
            if (item.nbt.foodlist[i] == tag) {
                player.setStatusMessage("这个食物已经吃过了！");
                level.server.runCommandSilent(`/playsound minecraft:entity.player.hurt_sweet_berry_bush player @p ${player.x} ${player.y} ${player.z} 1`);
                return;
            }
        }

        // 减少末影箱物品数量
        //ender_chest[0].shrink(1);
        targetItem.shrink(1);
        level.server.runCommandSilent(`/playsound minecraft:entity.player.levelup player @p ${player.x} ${player.y} ${player.z} 1`);

        // 将 tag 添加到 foodlist
        item.nbt.foodlist.push(Integer.valueOf(tag));
        item.nbt.foodnumber = item.nbt.foodlist.length;
    }

    if (item.id === 'rainbow:terasword') {
        if (item.getNbt().getInt("power")) {
            item.getNbt().putInt("power",item.getNbt().getInt("power") - 1)

            let projectileName = "rainbow:trea";

            // 计算发射数据
            let viewVector = player.getViewVector(1.0)
            let length = Math.sqrt(viewVector.x() * viewVector.x() + viewVector.y() * viewVector.y() + viewVector.z() * viewVector.z())
            let nor_x = viewVector.x() / length
            let nor_y = viewVector.y() / length
            let nor_z = viewVector.z() / length
            let new_x = player.x + nor_x * 2
            let new_y = player.y + player.getEyeHeight()
            let new_z = player.z + nor_z * 2

            // 发送数据到服务端
            Client.player.sendData("projectlie", {
                x: new_x,
                y: new_y,
                z: new_z,
                viewX: nor_x,
                viewY: nor_y,
                viewZ: nor_z,
                name: projectileName
            })
        }
        else {
            player.tell("能量不足")
        }
    }

    if(item.id === 'rainbow:creeper_charm')
        {
            player.teleportTo("minecraft:overworld", getRandomInt(-14999992, 14999992), 300, getRandomInt(-14999992, 14999992), player.yaw, player.pitch)
            player.potionEffects.add("rainbow:democratic_save", 10 * 20, 0, false, false)
            player.cooldowns.addCooldown("rainbow:creeper_charm",SecoundToTick(60*60))
        }

    if(item.id === 'chromaticarsenal:lunar_crystal')
        {
            if(PlayerLookAtMoon(player))
                {
                    player.give("uniyesmod:moon")
                    item.shrink(1)
                }
        }
    
    if(item.id === 'rainbow:baseball_bat')
        {
            let nbt = item.getNbt()
            server.runCommandSilent(`/playsound domesticationinnovation:chain_lightning voice @p ${player.x} ${player.y} ${player.z}`)
            player.setItemInHand("main_hand",Item.of("rainbow:baseball_power",`${nbt}`))
        }    
    
    if(item.id == "rainbow:musical_score")
        {
            if(!item.nbt) return;
            if(!item.nbt.music) return;

            Client.player.sendData("music",{
                music: intArrayTagToNumbers(item.nbt.music)
            })
        }
    if (item.id === "rainbow:biome_of_sword") {

        // 确保全局群系列表已初始化
        if (!global.biomelist || global.biomelist.length === 0) {
            global.biomelist = [];
            let access = server.registryAccess();
            let biomeRegistry = access.registryOrThrow(Registries.BIOME);
            biomeRegistry.keySet().forEach(id => global.biomelist.push(id.toString()));
        }
    
        let access = server.registryAccess();
        let biomeRegistry = access.registryOrThrow(Registries.BIOME);
        let biome = level.getBiome(player.blockPosition());
        let biomeKey = biomeRegistry.getResourceKey(biome.get()).get();
        let biomeId = biomeKey.location().toString();
        let tag = global.biomelist.indexOf(biomeId);
    
        // 初始化物品 NBT
        if (!item.nbt.biomes) item.nbt.biomes = [];
        if (!item.nbt.biomenum) item.nbt.biomenum = item.nbt.biomes.length;
    
        // 检查是否为有效群系
        if (tag === -1) {
            console.log("⚠ 未找到群系:", biomeId);
            return;
        }
    
        // 检查是否已收集过（循环比对）
        for (let i = 0; i < item.nbt.biomes.length; i++) {
            if (Number(item.nbt.biomes[i]) === tag) {
                player.setStatusMessage("你已经领略过这个群系的力量！");
                level.server.runCommandSilent(`/playsound minecraft:entity.player.hurt_sweet_berry_bush player @p ${player.x} ${player.y} ${player.z} 1`);
                return;
            }
        }
    
        // 成功收集新群系
        level.server.runCommandSilent(`/playsound minecraft:entity.player.levelup player @p ${player.x} ${player.y} ${player.z} 1`);
        item.nbt.biomes.push(tag);
        item.nbt.biomenum = item.nbt.biomes.length;
        player.setStatusMessage(`已收集新的群系力量：§a${biomeId}`);
    }
});

//音乐
ItemEvents.rightClicked(event => {
    let player = event.player;
    let item = event.item;

    if (item.id == "minecraft:goat_horn") {
        let music = item.getNbt().getString("instrument"); // 获取 instrument 的字符串值

        // 对应数组
        let instrumentIds = [
            "minecraft:ponder_goat_horn",
            "minecraft:sing_goat_horn",
            "minecraft:seek_goat_horn",
            "minecraft:feel_goat_horn",
            "minecraft:admire_goat_horn",
            "minecraft:call_goat_horn",
            "minecraft:yearn_goat_horn",
            "minecraft:dream_goat_horn"
        ];

        // 查找下标
        let instrumentNumber = instrumentIds.indexOf(music);
        if (instrumentNumber === -1) {
            console.error("音乐获取失败" + music);
            return;
        }

        // 初始化玩家音乐数组
        if (!player.persistentData.music) {
            player.persistentData.music = [];
        }

        // 保持长度最大为 9（先进先出）
        while (player.persistentData.music.length > 9) {
            player.persistentData.music.shift();
        }

        player.persistentData.music.push(Integer.valueOf(instrumentNumber));

        // 如果副手有乐谱，也记录到乐谱NBT
        let offHand = player.offHandItem;
        if (offHand.getId() == "rainbow:musical_score") {
            let offHandNbt = offHand.getNbt() || {};
            if (!offHandNbt.music) {
                offHandNbt.music = [];
            }
            while (offHandNbt.music.length > 9) {
                offHandNbt.music.shift();
            }
            offHandNbt.music.push(Integer.valueOf(instrumentNumber));
            offHand.setNbt(offHandNbt); // 保存回去
        }

        // 如果是 dream_goat_horn（编号为 7），发送数据
        if (instrumentNumber == 7) {
            Client.player.sendData("music", {
                music: player.persistentData.music
            });
            player.persistentData.music = [];
        }
    }
});

// 吃下屎后关闭客户端
ItemEvents.foodEaten('rainbow:shit', () => Client.close())
//超级饰品
ItemEvents.foodEaten('chromaticarsenal:magic_garlic_bread', event=>{
    let player = event.getPlayer();

    player.addCuriosSlotModifier("super_curio","ecb82943-df2f-41a6-a06b-072d54e44afe","magic_garlic_bread",1,"addition")
})

// 金手指：让两个生物互相骑乘 + 授予成就 rainbow:ccb
ItemEvents.entityInteracted("rainbow:golden_finger", event => {
    const player = event.player;
    const target = event.target;
    const item = event.item;
    const server = event.server;

    if (!target) return;

    const tag = item.getOrCreateTag();

    // === 第一次点击：选择第一个生物 ===
    if (!tag.contains("FirstUUID")) {
        tag.putString("FirstUUID", target.getUuid().toString());
        tag.putString("FirstType", target.type); // 记录实体类型
        tag.putString("FirstName", target.getName().getString());
        player.tell(`§e已选择第一个生物：§6${target.getName().getString()}§e，请选择第二个生物。`);
        return;
    }

    // === 第二次点击：让第一个生物骑乘第二个 ===
    const firstUUID = tag.getString("FirstUUID");
    const firstType = tag.getString("FirstType");
    const firstName = tag.getString("FirstName");
    const secondUUID = target.getUuid().toString();
    const secondType = target.type;
    const secondName = target.getName().getString();

    // 防止同一个生物
    if (firstUUID === secondUUID) {
        player.tell("§c不能选择同一个生物！");
        return;
    }

    // 执行骑乘
    const cmd = `/ride ${firstUUID} mount ${secondUUID}`;
    const success = server.runCommandSilent(cmd);

    if (success) {
        player.tell(`§a成功让 §6${firstName} §a骑乘 §6${secondName}！`);

        // ✅ 成就触发条件：大象骑乘村民
        if (firstType === "alexsmobs:elephant" && secondType === "minecraft:villager") {
            player.runCommandSilent(`advancement grant ${player.name.string} only rainbow:ccb`);
        }

    } else {
        player.tell("§c骑乘失败，可能目标不存在或已被移除。");
    }

    // 清除保存
    tag.remove("FirstUUID");
    tag.remove("FirstType");
    tag.remove("FirstName");
});


// nbt工具
ItemEvents.entityInteracted("rainbow:nbt_util", event => {
    let player = event.getPlayer();
    let target = event.getTarget();

    let targetNbt = target.getNbt();
    let playerNbt = player.getNbt();

    console.log(JSON.stringify(nbtToJs(targetNbt), null, 2));

    player.tell("NBT已以JSON格式输出到日志");
});

const Allele = Java.loadClass('snownee.fruits.bee.genetics.Allele');
const CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag');

/**
 * RC/FC/FT1/FT2 -> 当前世界的伪装代号（A–Z）
 */
global.ffGetDisguisedGeneName = (realName) => {
  const allele = Allele.REGISTRY.get(realName);
  if (!allele) return null;
  const code = '' + allele.codename;
  return code === '0' ? null : code;
};

/** 将数字字符串键（如 '81'）转成对应 ASCII 字母（'Q'）；其他情况原样返回 */
global.ffNormalizeAsciiCodeKey = (code) => {
    if (code == null) return null;
    if (/^[0-9]+$/.test(code)) {
      const n = parseInt(code, 10);
      if (Number.isFinite(n) && n >= 0 && n <= 255) {
        return String.fromCharCode(n);
      }
    }
    return code === '0' ? null : code; // 世界未初始化返回 null
  };

/**
 * 伪装代号 -> 真实基因位点名（RC/FC/FT1/FT2）
 * - 输入可为字母代号（'A'）或数字字符串（'81'）
 * - 若输入本身是真实位点名（'RC' 等），原样返回
 * - 世界未初始化或找不到映射时返回 null
 */
global.ffCodeToRealGene = (code) => {
    if (code == null) return null;
    const key = global.ffNormalizeAsciiCodeKey(String(code)); // '81' -> 'Q'; 'Q' -> 'Q'; 其他原样
    // 如果传的是真实位点名，直接返回
    if (key === 'RC' || key === 'FC' || key === 'FT1' || key === 'FT2') {
      return key;
    }
    if (!key || key.length === 0) return null;
    // 单字符代号归一化为大写
    const ch = key.length === 1 ? key.toUpperCase().charAt(0) : key.charAt(0);
    const allele = Allele.byCode(ch);
    return allele ? allele.name : null;
  };

// 用琥珀注射器与实体交互时，读取真实基因并按伪装代号写入数值到物品 NBT
ItemEvents.entityInteracted('rainbow:amber_bee', event => {
    const player = event.getPlayer();
    const target = event.getTarget();
    const item = event.getItem ? event.getItem() : event.item;
  
    // 目标实体的完整基因结构检查
    const full = target.getNbt();
    if (!full || !full.contains('FruitfulFun')) return;
    const ff = full.get('FruitfulFun');
    if (!ff || !ff.contains('Genes')) return;
    const genes = ff.get('Genes');
  
    // 获取或创建物品 NBT
    const root = item.getOrCreateTag ? item.getOrCreateTag() : (item.nbt ?? new CompoundTag());
  
    // ✅ 若已经写入过基因，则不允许重复写入
    if (root.contains('FFDisguisedGeneBytes')) {
      player.tell('该注射器已含有基因信息，无法重复写入');
      return;
    }
  
    // 构造伪装代号对应的字节表
    const disguisedBytes = new CompoundTag();
    ['RC', 'FC', 'FT1', 'FT2'].forEach(name => {
      if (!genes.contains(name)) return;
      const b = genes.getByte(name);
      const rawCode = global.ffGetDisguisedGeneName(name) ?? name;
      const codeKey = global.ffNormalizeAsciiCodeKey(rawCode) ?? name;
      disguisedBytes.putByte(codeKey, b);
    });
  
    // 写入到注射器
    root.put('FFDisguisedGeneBytes', disguisedBytes);
    if (item.setTag) item.setTag(root); else item.nbt = root;
  
    player.tell('已将伪装代号对应的数值基因写入注射器');
  });
  

//远古之庇护
ItemEvents.entityInteracted("rainbow:ancientaegis",event => {
    let player = event.getPlayer();
    let hand = event.getHand();
    let item = event.getItem();
    let level = event.getLevel();
    let target = event.getTarget();
    let targetId = target.getType();
    let itemId = item.id;

    if(!item.nbt)
        {
            item.nbt = {}
        }

    if(target.isPlayer() && target.isAlive())
        {
            item.nbt.putString("UUID",target.getUuid().toString())
            player.tell("绑定对象成功")
        }

})

//矿车和箱子右键安装
ItemEvents.entityInteracted(event => {
    let player = event.getPlayer();
    let hand = event.getHand();
    let item = event.getItem();
    let level = event.getLevel();
    let target = event.getTarget();
    let targetId = target.getType();
    let itemId = item.id;

    if (level.isClientSide()) return;
    if (!player.isShiftKeyDown()) return;

    let chestTags = item.hasTag('forge:chests/wooden');
    let validMinecartItems = [
        'quark:deepslate_furnace', 'quark:blackstone_furnace',
        'minecraft:furnace', 'minecraft:tnt', 'minecraft:hopper',
        'oreganized:shrapnel_bomb',
        'minecraft:chest', 'quark:acacia_chest', 'quark:jungle_chest',
        'quark:birch_chest', 'quark:spruce_chest', 'quark:oak_chest',
        'quark:blossom_chest', 'quark:azalea_chest', 'quark:ancient_chest',
        'quark:dark_oak_chest', 'quark:cherry_chest', 'quark:bamboo_chest',
        'quark:mangrove_chest', 'quark:warped_chest', 'quark:crimson_chest'
    ];

    let isBoat = ['minecraft:boat', 'blueprint:boat', 'quark:quark_boat'].includes(targetId);
    let isMinecart = BoatidOK(targetId) && !isBoat;

    // 如果目标是普通船 且 手持物品是木质箱子
    if (isBoat && chestTags) {
        let newBoatId = BoatToChestBoat(targetId);
        if (!newBoatId) return;

        let toEntity = level.createEntity(newBoatId);
        toEntity.setPosRaw(target.getX(), target.getY(), target.getZ());
        toEntity.setYaw(target.getYaw());
        toEntity.setPitch(target.getPitch());
        toEntity.setNbt(target.getNbt());

        target.remove("discarded");
        item.shrink(1);
        level.addFreshEntity(toEntity);
        level.server.runCommandSilent(`/playsound minecraft:block.amethyst_block.place voice @p ${toEntity.x} ${toEntity.y} ${toEntity.z}`)
        return;
    }

    // 如果目标是矿车 且 手持物品是有效可合成矿车的物品
    if (isMinecart && validMinecartItems.includes(itemId)) {
        let newMinecartId = null;
        if (chestTags) {
            newMinecartId = 'minecraft:chest_minecart';
        } else {
            newMinecartId = McTo(itemId);
        }
        if (!newMinecartId) return;

        let toEntity = level.createEntity(newMinecartId);
        toEntity.setPosRaw(target.getX(), target.getY(), target.getZ());
        toEntity.setYaw(target.getYaw());
        toEntity.setPitch(target.getPitch());
        toEntity.setNbt(target.getNbt());

        target.remove("discarded");
        item.shrink(1);
        level.addFreshEntity(toEntity);
        level.server.runCommandSilent(`/playsound minecraft:block.amethyst_block.place voice @p ${toEntity.x} ${toEntity.y} ${toEntity.z}`)
        return;
    }
});
//宠物收容

// 收容宠物（普通右键）
ItemEvents.entityInteracted(event => {
    let player = event.getPlayer();
    let item = event.getItem();
    let target = event.getTarget();
    let level = event.getLevel();

    if (level.isClientSide()) return;
    if (item.id != 'rainbow:mind_ctroller_detention') return;
    if (!target) return;

    // 必须是自己的宠物（可按需调整判定）
    if (target.persistentData.OwnerName != player.getUuid().toString()) {
        player.tell("未被脑控，无法收容！");
        return;
    }

    if(target.persistentData.CanTake == false)
        {
            player.tell("特殊生物，无法收容！");
            return;
        }

    if (!item.nbt) item.nbt = {};
    if (!item.nbt.StoredEntities) item.nbt.StoredEntities = [];

    // 存储数量限制
    if (item.nbt.StoredEntities.length >= global.MAX_STORAGE) {
        player.tell(`收容失败！最多只能存放 ${global.MAX_STORAGE} 个宠物。`);
        return;
    }

    // 获取实体 NBT
    let entityNBT = target.getNbt();
    let entityId = target.getType();

    // 存入物品 NBT
    item.nbt.StoredEntities.push({
        id: entityId,
        nbt: entityNBT
    });

    // 移除实体（无死亡动画）
    target.remove("discarded");

    player.tell(`已收容：${target.getName().getString()}，当前总数：${item.nbt.StoredEntities.length}`);
});

// 释放宠物（潜行右键）
// 释放：潜行右键空气时，一次性释放所有
ItemEvents.rightClicked(event => {
    let player = event.player
    let item = event.item
    if (event.level.isClientSide()) return
    if (item.id != 'rainbow:mind_ctroller_detention') return;
    if (!player.isShiftKeyDown()) return // 只有潜行才释放

    let nbt = item.nbt || {}
    if (!nbt.StoredEntities || nbt.StoredEntities.length == 0) {
        player.tell("没有收容的生物")
        return
    }

    // 获取玩家当前位置
    let pos = player.getBlock().pos;

    for (let entityData of nbt.StoredEntities) {
        let entity = event.level.createEntity(entityData.id)
        if (entity) {
            entity.setNbt(entityData) // 恢复 NBT
            entity.persistentData.OwnerName = entityData.nbt.KubeJSPersistentData.OwnerName.toString();
            entity.setPos(pos.x + 0.5, pos.y, pos.z + 0.5)
            entity.spawn()
        }
    }

    // 清空存储
    nbt.StoredEntities = []
    item.nbt = nbt

    player.tell("所有收容的生物已释放")
})


//夸克回旋镖
// Java 类加载
let Pickarang = Java.loadClass("org.violetmoon.quark.content.tools.entity.rang.Pickarang");
let ServerPlayer = Java.loadClass("net.minecraft.server.level.ServerPlayer");
let PickarangModule = Java.loadClass("org.violetmoon.quark.content.tools.module.PickarangModule");
let ItemStack = Java.loadClass("net.minecraft.world.item.ItemStack");

ItemEvents.rightClicked(event => {
    let { hand, player, level, server,item } = event;
    if(!item.hasTag("rainbow:pika")) return;
    if (hand != "MAIN_HAND") return;
    if (level.isClientSide()) return;

    let inventory = player.inventory;
    let containerSize = inventory.containerSize;
    let x = player.x, y = player.y, z = player.z, eyeHeight = player.getEyeHeight();

    let slot = 0;

    function throwPickarang() {
        if (slot >= containerSize) return;

        let itemStack = inventory.getItem(slot);
        if(itemStack.hasTag("rainbow:pika"))
        {
            let pickarang = new Pickarang("quark:pickarang", level, player);

            // 随机偏移
            let offsetX = (Math.random() - 0.5) * 5;
            let offsetY = Math.random() * 0.5;
            let offsetZ = (Math.random() - 0.5) * 5;

            pickarang.setPos(x + offsetX, y + eyeHeight + offsetY, z + offsetZ);
            pickarang.setThrowData(slot, itemStack);
            pickarang.setOwner(player);

            // 随机瞄准角度
            let yaw = player.yRotO + (Math.random() - 0.5) * 20;
            let pitch = player.xRotO + (Math.random() - 0.5) * 10;

            pickarang.shoot(player, pitch, yaw, 0.0, 2.5, 0.0);
            level.addFreshEntity(pickarang);

            inventory.setStackInSlot(slot, ItemStack.EMPTY);

            if (player instanceof ServerPlayer) {
                PickarangModule.throwPickarangTrigger.trigger(player);
            }
        }

        slot++;
        server.scheduleInTicks(6, throwPickarang);
    }

    throwPickarang();
});
