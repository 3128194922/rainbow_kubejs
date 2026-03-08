// priority: 1000
/**
 * 根据中文工具类型或品质返回对应的 Minecraft 标签
 * @param {string} input 中文输入（如"剑"、"石"、"钻石"等）
 * @returns {string|null} 对应的 Minecraft 标签，若无匹配则返回 null
 */
function getMinecraftToolTag(input) {
    // 工具类型映射
    let toolTypeMap = {
        "剑": "minecraft:mineable/sword",
        "镐": "minecraft:mineable/pickaxe",
        "斧": "minecraft:mineable/axe",
        "锹": "minecraft:mineable/shovel",
        "锄": "minecraft:mineable/hoe"
    };

    // 工具品质映射
    let toolTierMap = {
        "木": "minecraft:needs_wooden_tool",
        "石": "minecraft:needs_stone_tool",
        "铁": "minecraft:needs_iron_tool",
        "金": "minecraft:needs_golden_tool",
        "钻石": "minecraft:needs_diamond_tool",
        "下界合金": "forge:needs_netherite_tool"
    };

    // 优先检查工具类型
    if (toolTypeMap[input]) {
        return toolTypeMap[input];
    }

    // 然后检查工具品质
    if (toolTierMap[input]) {
        return toolTierMap[input];
    }

    // 无匹配时返回 null
    return null;
}

// ==========================================
// 🧱 注册方块
// ==========================================
StartupEvents.registry("block", event => {
    // 幸运方块：使用 basic 类型，需要工具，草地音效，铲子挖掘，默认裁剪渲染
    event.create("rainbow:luckyblock", "basic").requiresTool(true).grassSoundType().tagBlock("minecraft:mineable/shovel").defaultCutout().box(3, 0, 3, 13, 10, 13)
    // 始冰矿：材质为 STONE，需要工具，镐挖掘，铁级挖掘等级，石头音效
    event.create("rainbow:origin_ice_ore", "basic").material('stone').requiresTool().tagBlock(getMinecraftToolTag("镐")).tagBlock(getMinecraftToolTag("铁")).stoneSoundType()
    // 虚空矿：材质为 STONE，需要工具，镐挖掘，铁级挖掘等级，石头音效
    event.create("rainbow:void_ore", "basic").material('stone').requiresTool().tagBlock(getMinecraftToolTag("镐")).tagBlock(getMinecraftToolTag("铁")).stoneSoundType()
})



// 灵脂蜡块：Docker 基础型，标记周围实体
StartupEvents.registry("block", event => {
    event.create("rainbow:soul_hex_block")
        .woodSoundType()
        .displayName("灵脂蜡块")
        .blockEntity(entityInfo => {
            // 每 20 tick 执行一次
            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return; // 只在服务端执行

                let pos = entity.blockPos; // 方块坐标
                let range = 5; // 半径范围
                let aabb = AABB.ofBlock(pos).inflate(range);

                // 获取范围内的所有活体实体
                let entities = level.getEntitiesOfClass(Java.loadClass("net.minecraft.world.entity.LivingEntity"), aabb);

                for (let e of entities) {
                    if (e.isPlayer()) continue;
                    // 标记实体
                    e.persistentData.docker = true;
                }
            });

            // 红石交互能力
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn((be, dir) => dir != Direction.UP)
                    .extractItem((be, slot, amount, simulate) => be.inventory.extractItem(slot, amount, simulate))
                    .insertItem((be, slot, stack, simulate) => be.inventory.insertItem(slot, stack, simulate))
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );
        });
});
/*
// 逻辑计算机
StartupEvents.registry("block", event => {
    event.create("rainbow:number_computer")
        .woodSoundType()
        .displayName("逻辑计算机")
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();

            // 每 20 ticks (即每秒) 执行一次
            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                let numbers = ["rainbow:three","rainbow:eight"]
                let choose = randomBool(0.5)?1:0;

                entity.inventory.insertItem(Item.of(numbers[choose]), false)
            });
            // 红石交互
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn((be, dir) => true)
                    .extractItem((be, slot, amount, simulate) => false)
                    .insertItem((be, slot, stack, simulate) => false)
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );
        });
});*/