// priority: 1000
// Docker 射手型（单发）：自动发射物品栏中的箭矢
StartupEvents.registry("block", event => {
    event.create("rainbow:docker_shooter")
        .noCollision()
        .woodSoundType()
        .displayName("Docker(射手型)(单发)")
        .notSolid()
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();

            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                let pos = entity.blockPos;
                let x = pos.getX() + 0.5;
                let y = pos.getY() + 0.5;
                let z = pos.getZ() + 0.5;
                let range = 5;

                let $LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity");
                let entities = level.getEntitiesOfClass($LivingEntity, AABB.ofBlock(pos).inflate(range));

                // 找到第一个有效目标
                let target = null;
                for (let e of entities) {
                    if (e.isPlayer()) continue;
                    if (e.isDeadOrDying()) continue;
                    target = e;
                    break;
                }
                if (!target) return;

                let tx = target.getX() - x;
                let ty = target.getEyeY() - y;
                let tz = target.getZ() - z;
                let dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
                if (dist < 0.5 || dist > range) return;

                let dirX = tx / dist;
                let dirY = ty / dist;
                let dirZ = tz / dist;

                // 依次检查 9 个物品槽，优先第一个可用的
                for (let slot = 0; slot < 9; slot++) {
                    let itemStack = entity.inventory.getItem(slot);
                    if (itemStack.isEmpty()) continue;

                    // 检查是否属于 #minecraft:arrows 标签
                    if (!itemStack.hasTag("minecraft:arrows")) continue;

                    let projectileName = itemStack.id;
                    try {
                        let projectile = level.createEntity(projectileName);
                        if (!projectile) break;

                        let randomOffsetX = (Math.random() - 0.5) * 0.05;
                        let randomOffsetY = (Math.random() - 0.5) * 0.05;
                        let randomOffsetZ = (Math.random() - 0.5) * 0.05;

                        projectile.setPosition(x + randomOffsetX, y + randomOffsetY, z + randomOffsetZ);
                        projectile.setMotion(dirX * 2.5, dirY * 2.5, dirZ * 2.5);
                        projectile.spawn();

                        // 消耗一个物品
                        itemStack.shrink(1);
                        entity.inventory.setItem(slot, itemStack);

                    } catch (err) {
                        console.warn(`[Docker Shooter] 创建实体失败: ${projectileName}`);
                        break;
                    }
                    
                    // 找到第一个有效的槽位后，不再检查其他槽
                    break;
                }
            });

            // 保留物品栏能力
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


// Docker 射手型（火力）：高频发射箭矢
StartupEvents.registry("block", event => {
    event.create("rainbow:docker_shooter_fire")
        .noCollision()
        .woodSoundType()
        .displayName("Docker(射手型)(火力)")
        .notSolid()
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();

            entityInfo.serverTick(5, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;
                // ... (类似射手型的逻辑，但频率更高)
                let pos = entity.blockPos;
                let x = pos.getX() + 0.5;
                let y = pos.getY() + 0.5;
                let z = pos.getZ() + 0.5;
                let range = 5;

                let $LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity");
                let entities = level.getEntitiesOfClass($LivingEntity, AABB.ofBlock(pos).inflate(range));

                // 找到第一个有效目标
                let target = null;
                for (let e of entities) {
                    if (e.isDeadOrDying()) continue;
                    target = e;
                    break;
                }
                if (!target) return;

                let tx = target.getX() - x;
                let ty = target.getEyeY() - y;
                let tz = target.getZ() - z;
                let dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
                if (dist < 0.5 || dist > range) return;

                let dirX = tx / dist;
                let dirY = ty / dist;
                let dirZ = tz / dist;

                for (let slot = 0; slot < 9; slot++) {
                    let itemStack = entity.inventory.getItem(slot);
                    if (itemStack.isEmpty()) continue;
                    if (!itemStack.hasTag("minecraft:arrows")) continue;

                    let projectileName = itemStack.id;
                    try {
                        let projectile = level.createEntity(projectileName);
                        if (!projectile) break;
                        let randomOffsetX = (Math.random() - 0.5) * 0.05;
                        let randomOffsetY = (Math.random() - 0.5) * 0.05;
                        let randomOffsetZ = (Math.random() - 0.5) * 0.05;
                        projectile.setPosition(x + randomOffsetX, y + randomOffsetY, z + randomOffsetZ);
                        projectile.setMotion(dirX * 2.5, dirY * 2.5, dirZ * 2.5);
                        projectile.spawn();
                        itemStack.shrink(1);
                        entity.inventory.setItem(slot, itemStack);
                    } catch (err) {
                        console.warn(`[Docker Shooter] 创建实体失败: ${projectileName}`);
                        break;
                    }
                    break;
                }
            });

            // 保留物品栏能力
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

// Docker 射手型（散射）：同时向多个目标发射箭矢
StartupEvents.registry("block", event => {
    event.create("rainbow:docker_shooter_plus")
        .noCollision()
        .woodSoundType()
        .displayName("Docker(射手型)(散射)")
        .notSolid()
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();

            entityInfo.serverTick(60, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                let pos = entity.blockPos;
                let x = pos.getX() + 0.5;
                let y = pos.getY() + 0.5;
                let z = pos.getZ() + 0.5;
                let range = 10;

                let $LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity");
                let entities = level.getEntitiesOfClass($LivingEntity, AABB.ofBlock(pos).inflate(range));

                // 对范围内的每个有效目标逐一发射
                for (let target of entities) {
                    if (target.isPlayer()) continue;
                    if (target.isDeadOrDying()) continue;

                    let tx = target.getX() - x;
                    let ty = target.getEyeY() - y;
                    let tz = target.getZ() - z;
                    let dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
                    if (dist < 0.5 || dist > range) continue;

                    let dirX = tx / dist;
                    let dirY = ty / dist;
                    let dirZ = tz / dist;

                    // 从第一个可用槽中消耗一支箭
                    for (let slot = 0; slot < 9; slot++) {
                        let itemStack = entity.inventory.getItem(slot);
                        if (itemStack.isEmpty()) continue;
                        if (!itemStack.hasTag("minecraft:arrows")) continue;

                        let projectileName = itemStack.id;
                        try {
                            let projectile = level.createEntity(projectileName);
                            if (!projectile) break;
                            let randomOffsetX = (Math.random() - 0.5) * 0.05;
                            let randomOffsetY = (Math.random() - 0.5) * 0.05;
                            let randomOffsetZ = (Math.random() - 0.5) * 0.05;
                            projectile.setPosition(x + randomOffsetX, y + randomOffsetY, z + randomOffsetZ);
                            projectile.setMotion(dirX * 2.5, dirY * 2.5, dirZ * 2.5);
                            projectile.spawn();
                            itemStack.shrink(1);
                            entity.inventory.setItem(slot, itemStack);
                        } catch (err) {
                            console.warn(`[Docker Shooter] 创建实体失败: ${projectileName}`);
                        }
                        // 发射一发后不再从其他槽消耗
                        break;
                    }
                }
            });

            // 保留物品栏能力
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

// 下界反应堆：在下界随机激活，激活后检测周围唱片机播放的音乐并给予奖励
StartupEvents.registry("block", event => {
    event.create("rainbow:docker_nether_off")
        .randomTick(event => {
            let level = event.getLevel();
            let block = event.block;
            let pos = block.pos;

            if (level.getName().getString() == "minecraft:the_nether" && Math.random() < 0.1) {
                level.setBlock(pos, Block.id('rainbow:docker_nether_on').blockState, 3);
            }
        })
        .woodSoundType()
        .displayName("下界反应堆(未激活)");

});

StartupEvents.registry("block", event => {
    event.create("rainbow:docker_nether_on")
        .woodSoundType()
        .displayName("下界反应堆(激活)")
        .blockEntity(entityInfo => {

            const scanRadius = 1;

            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                let pos = entity.blockPos;
                let recordSet = new Set();

                // === 遍历周围方块 ===
                for (let dx = -scanRadius; dx <= scanRadius; dx++) {
                    for (let dy = -scanRadius; dy <= scanRadius; dy++) {
                        for (let dz = -scanRadius; dz <= scanRadius; dz++) {
                            let targetPos = pos.offset(dx, dy, dz);
                            let targetBlock = level.getBlock(targetPos);
                            if (targetBlock.id != "minecraft:jukebox") continue;

                            let be = level.getBlockEntity(targetPos);
                            if (!be) continue;

                            // ✅ 关键：获取方块实体的 NBT 数据
                            let nbt = be.saveWithFullMetadata();
                            if (!nbt) continue;

                            // ✅ 检查是否正在播放音乐并提取唱片 ID
                            if (nbt.IsPlaying && nbt.RecordItem && nbt.RecordItem.id) {
                                recordSet.add(nbt.RecordItem.id);
                            }
                        }
                    }
                }

                // === 写入方块实体 NBT ===
                let data = entity.persistentData;
                data.record_count = recordSet.size;

                // 初始化计数器
                if (!data.tick_counter) data.tick_counter = 0;

                // 按当前唱片种类数增加计数器
                data.tick_counter += recordSet.size;

                // === 达到1000计数时奖励物品 ===
                if (data.tick_counter >= 1000) {
                    data.tick_counter = 0;

                    let reward = Item.of("gimmethat:nether_of_voice");
                    entity.inventory.insertItem(reward, false);
                }
            });

            // 红石交互
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

// Docker 末影型：将容器内的物品转移到玩家的末影箱
StartupEvents.registry("block", event => {
    event.create("rainbow:docker_ender")
        .woodSoundType()
        .displayName("docker(末影型)")
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();
            // 每 20 ticks (即每秒) 执行一次
            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                // 确保 entity.data 存在
                if (!entity.data || !entity.data.uuid) return;

                // 从 data 中获取玩家 UUID
                let uuid = UUID.fromString(entity.data.uuid);
                let player = level.server.getPlayerList().getPlayer(uuid);

                // 如果找到了玩家
                if (player) {
                    let enderChest = player.getEnderChestInventory();

                    for (let i = 0; i < 9; i++) {
                        let stackInBlock = entity.inventory.getItem(i)
                        if (stackInBlock.isEmpty()) continue
                    
                        // 1️⃣ 复制一份用于插入（非常重要）
                        let toInsert = stackInBlock.copy()
                    
                        // 2️⃣ 尝试插入末影箱
                        let remaining = enderChest.insertItem(toInsert, false)
                    
                        // 3️⃣ 计算成功插入的数量
                        let inserted = toInsert.getCount() - remaining.getCount()
                        if (inserted <= 0) continue
                    
                        // 4️⃣ 只减少方块容器里的数量
                        stackInBlock.shrink(inserted)
                    
                        // 5️⃣ 如果空了就清槽
                        if (stackInBlock.isEmpty()) {
                            entity.inventory.setItem(i, ItemStack.EMPTY)
                        } else {
                            entity.inventory.setItem(i, stackInBlock)
                        }
                    }
                    
                }
            });

            // 红石交互：物品插入与提取
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn(() => true)  // 允许所有方向
                    .extractItem((be, slot, amount, simulate) => be.inventory.extractItem(slot, amount, simulate))
                    .insertItem((be, slot, stack, simulate) => be.inventory.insertItem(slot, stack, simulate))
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );            
        });
});

// Docker 末影加强型：将容器内的物品转移到玩家的物品栏
StartupEvents.registry("block", event => {
    event.create("rainbow:docker_ender_player")
        .woodSoundType()
        .displayName("docker(末影加强型)")
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();

            // 每 20 ticks (即每秒) 执行一次
            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                // 确保 entity.data 存在
                if (!entity.data || !entity.data.uuid) return;

                // 从 data 中获取玩家 UUID
                let uuid = UUID.fromString(entity.data.uuid);
                let player = level.server.getPlayerList().getPlayer(uuid);

                // 如果找到了玩家
                if (player) {
                    let playerInventory = player.getInventory();

                    for (let i = 0; i < 9; i++) {
                        let stackInBlock = entity.inventory.getItem(i)
                        if (stackInBlock.isEmpty()) continue
                    
                        // 1️⃣ 复制一份用于插入（非常重要）
                        let toInsert = stackInBlock.copy()
                    
                        // 2️⃣ 尝试插入物品到玩家物品栏
                        let remaining = playerInventory.insertItem(toInsert, false)
                    
                        // 3️⃣ 计算成功插入的数量
                        let inserted = toInsert.getCount() - remaining.getCount()
                        if (inserted <= 0) continue
                    
                        // 4️⃣ 只减少方块容器里的数量
                        stackInBlock.shrink(inserted)
                    
                        // 5️⃣ 如果空了就清槽
                        if (stackInBlock.isEmpty()) {
                            entity.inventory.setItem(i, ItemStack.EMPTY)
                        } else {
                            entity.inventory.setItem(i, stackInBlock)
                        }
                    }
                    
                }
            });

            // 红石交互：物品插入与提取
            entityInfo.attachCapability(
                CapabilityBuilder.ITEM.blockEntity()
                    .availableOn(() => true)  // 允许所有方向
                    .extractItem((be, slot, amount, simulate) => be.inventory.extractItem(slot, amount, simulate))
                    .insertItem((be, slot, stack, simulate) => be.inventory.insertItem(slot, stack, simulate))
                    .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
                    .getSlots(be => be.inventory.slots)
                    .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
                    .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
            );            
        });
});

// Docker 背包代理
StartupEvents.registry("block", event => {
    event.create("rainbow:docker_ender_player_vpn")
        .woodSoundType()
        .displayName("docker(背包代理)")
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 3);
            //entityInfo.rightClickOpensInventory();

            // 每 20 ticks (即每秒) 执行一次
            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                // 确保 entity.data 存在
                if (!entity.data || !entity.data.uuid) return;

                // 从 data 中获取玩家 UUID
                let uuid = UUID.fromString(entity.data.uuid);
                let player = level.server.getPlayerList().getPlayer(uuid);

                // 如果找到了玩家
                if (player) {
                    let playerInventory = player.inventory;
                    
                    // 单向同步：玩家 -> 方块
                    // 遍历方块的 27 个槽位，对应玩家背包的 Slot 9-35
                    for (let i = 0; i < 27; i++) {
                        let playerSlot = i + 9; // 玩家背包 Slot 9-35
                        
                        let bStack = entity.inventory.getStackInSlot(i);
                        let pStack = playerInventory.getItem(playerSlot);
                        
                        // 强制同步为玩家背包的状态
                        if (!pStack.equals(bStack)) {
                            entity.inventory.setStackInSlot(i, pStack.copy());
                        }
                    }

                } else {
                    // 玩家不在线 -> 清空方块库存
                    let inv = entity.inventory;
                    for(let i=0; i<inv.slots; i++) {
                        if (!inv.getStackInSlot(i).isEmpty()) {
                            inv.setStackInSlot(i, ItemStack.EMPTY);
                        }
                    }
                }
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
});

// Docker 物品栏代理
StartupEvents.registry("block", event => {
    event.create("rainbow:docker_ender_player_hotbar")
        .woodSoundType()
        .displayName("docker(物品栏代理)")
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            //entityInfo.rightClickOpensInventory();

            // 每 20 ticks (即每秒) 执行一次
            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                if (!entity.data || !entity.data.uuid) return;

                let uuid = UUID.fromString(entity.data.uuid);
                let player = level.server.getPlayerList().getPlayer(uuid);

                if (player) {
                    let playerInventory = player.inventory;
                    
                    // 单向同步：玩家 -> 方块
                    // 遍历方块的 9 个槽位，对应玩家物品栏的 Slot 0-8
                    for (let i = 0; i < 9; i++) {
                        let playerSlot = i; 
                        let pStack = playerInventory.getItem(playerSlot);
                        let bStack = entity.inventory.getStackInSlot(i);

                        if (!pStack.equals(bStack)) {
                            entity.inventory.setStackInSlot(i, pStack.copy());
                        }
                    }

                } else {
                    let inv = entity.inventory;
                    for(let i=0; i<inv.slots; i++) {
                        if (!inv.getStackInSlot(i).isEmpty()) {
                            inv.setStackInSlot(i, ItemStack.EMPTY);
                        }
                    }
                }
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
});

// Docker 末影箱代理
StartupEvents.registry("block", event => {
    event.create("rainbow:docker_ender_proxy")
        .woodSoundType()
        .displayName("Docker(末影箱代理)")
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 3);
            //entityInfo.rightClickOpensInventory();

            // 每 20 ticks (即每秒) 执行一次
            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;

                if (!entity.data || !entity.data.uuid) return;

                let uuid = UUID.fromString(entity.data.uuid);
                let player = level.server.getPlayerList().getPlayer(uuid);

                if (player) {
                    let enderChest = player.getEnderChestInventory();
                    
                    // 单向同步：玩家末影箱 -> 方块 (仅用于显示)
                    for (let i = 0; i < 27; i++) {
                        let pStack = enderChest.getStackInSlot(i);
                        let bStack = entity.inventory.getStackInSlot(i);

                        if (!pStack.equals(bStack)) {
                            entity.inventory.setStackInSlot(i, pStack.copy());
                        }
                    }

                } else {
                    let inv = entity.inventory;
                    for(let i=0; i<inv.slots; i++) {
                        if (!inv.getStackInSlot(i).isEmpty()) {
                            inv.setStackInSlot(i, ItemStack.EMPTY);
                        }
                    }
                }
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
});
