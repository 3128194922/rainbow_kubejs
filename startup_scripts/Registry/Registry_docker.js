// priority: 1000
// Docker 射手型（单发）：自动发射物品栏中的箭矢
function dockerBallisticMotion(dx, dy, dz, v, g, preferHigh) {
    let dh2 = dx * dx + dz * dz;
    let A = g * g;
    let B = 4.0 * (dy * g - v * v);
    let C = 4.0 * (dh2 + dy * dy);
    let discriminant = B * B - 4.0 * A * C;
    if (discriminant < 0) return null;
    let sqrtDisc = Math.sqrt(discriminant);
    let u1 = (-B + sqrtDisc) / (2.0 * A);
    let u2 = (-B - sqrtDisc) / (2.0 * A);
    let solutions = [];
    if (u1 > 1e-9) solutions.push(u1);
    if (u2 > 1e-9 && Math.abs(u2 - u1) > 1e-9) solutions.push(u2);
    if (solutions.length == 0) return null;
    solutions.sort((a, b) => a - b);
    let u = preferHigh ? solutions[solutions.length - 1] : solutions[0];
    let t = Math.sqrt(u);
    if (!isFinite(t) || t <= 1e-9) return null;
    let vx = dx / t;
    let vz = dz / t;
    let vy = (dy + 0.5 * g * u) / t;
    let mag = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (!isFinite(mag) || mag <= 1e-9) return null;
    let scale = v / mag;
    return { x: vx * scale, y: vy * scale, z: vz * scale };
}

function dockerBallisticMotionDrag(dx, dy, dz, v, g, drag, preferHigh, maxTicks) {
    let tol = 0.05;
    let bestLow = null;
    let bestHigh = null;

    let oneMinus = 1.0 - drag;
    if (oneMinus <= 1e-9) return null;

    for (let n = 2; n <= maxTicks; n++) {
        let dn = Math.pow(drag, n);
        let S = (1.0 - dn) / oneMinus;
        if (!isFinite(S) || S <= 1e-9) continue;

        let vx0 = dx / S;
        let vz0 = dz / S;
        let vy0 = (dy + (drag * g / oneMinus) * (n - S)) / S;
        if (!isFinite(vx0) || !isFinite(vy0) || !isFinite(vz0)) continue;

        let speed = Math.sqrt(vx0 * vx0 + vy0 * vy0 + vz0 * vz0);
        if (!isFinite(speed) || speed <= 1e-9) continue;

        let err = Math.abs(speed - v);
        if (err > v * tol) continue;

        let candidate = { x: vx0, y: vy0, z: vz0, n: n, err: err, speed: speed };
        if (!bestLow || candidate.err < bestLow.err || (candidate.err == bestLow.err && candidate.n < bestLow.n)) bestLow = candidate;
        if (!bestHigh || candidate.err < bestHigh.err || (candidate.err == bestHigh.err && candidate.n > bestHigh.n)) bestHigh = candidate;
    }

    let picked = preferHigh ? bestHigh : bestLow;
    if (!picked) return null;
    let scale = v / picked.speed;
    return { x: picked.x * scale, y: picked.y * scale, z: picked.z * scale };
}

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
                let redstone = level.hasNeighborSignal(pos);
                if(!redstone) return;
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
                let redstone = level.hasNeighborSignal(pos);
                if(!redstone) return;
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
                let redstone = level.hasNeighborSignal(pos);
                if(!redstone) return;
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

StartupEvents.registry("block", event => {
    event.create("rainbow:docker_shooter_parabola")
        .noCollision()
        .woodSoundType()
        .displayName("Docker(射手型)(抛物线)")
        .notSolid()
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 1);
            entityInfo.rightClickOpensInventory();

            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                
                if (level.isClientSide()) return;

                let pos = entity.blockPos;
                let redstone = level.hasNeighborSignal(pos);
                if(!redstone) return;
                let x = pos.getX() + 0.5;
                let y = pos.getY() + 0.5;
                let z = pos.getZ() + 0.5;
                let range = 50;

                let tx = null;
                let ty = null;
                let tz = null;

                let belowPos = pos.below();
                let belowBlock = level.getBlock(belowPos);

                if (belowBlock && belowBlock.id == "rainbow:docker_player_pos_proxy") {
                    let proxyEntity = level.getBlockEntity(belowPos);
                    if (!proxyEntity) return;
                    let data = proxyEntity.persistentData;
                    if (!data || !data.player_online) return;
                    let levelDim = level.dimension.toString();
                    if (data.player_dim && data.player_dim != levelDim) return;
                    tx = data.player_x - x;
                    ty = (data.player_y + 1.62) - y;
                    tz = data.player_z - z;
                } else {
                    let $LivingEntity = Java.loadClass("net.minecraft.world.entity.LivingEntity");
                    let aabb = AABB.of(x - range, y, z - range, x + range, y + 2, z + range);
                    //let aabb = AABB.ofBlock(pos).inflate(range);
                    let entities = level.getEntitiesOfClass($LivingEntity, aabb);
                    let target = null;
                    for (let e of entities) {
                        if (e.isPlayer()) continue;
                        if (e.isDeadOrDying()) continue;
                        target = e;
                        break;
                    }
                    if (!target) return;
                    tx = target.getX() - x;
                    ty = target.getEyeY() - y;
                    tz = target.getZ() - z;
                }

                if (!isFinite(tx) || !isFinite(ty) || !isFinite(tz)) return;
                let dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
                if (dist < 0.5 || dist > range) return;

                let v = 2.5;
                let g = 0.05;
                let motion = dockerBallisticMotionDrag(tx, ty, tz, v, g, 0.99, true, 160);
                if (!motion) motion = dockerBallisticMotion(tx, ty, tz, v, g, true);
                if (!motion) {
                    motion = { x: (tx / dist) * v, y: (ty / dist) * v, z: (tz / dist) * v };
                }

                for (let slot = 0; slot < 9; slot++) {
                    let itemStack = entity.inventory.getItem(slot);
                    if (itemStack.isEmpty()) continue;
                    let isPotionAmmo = itemStack.id == "minecraft:splash_potion" || itemStack.id == "minecraft:lingering_potion";
                    if (!itemStack.hasTag("minecraft:arrows") && !isPotionAmmo) continue;

                    let projectileName = itemStack.id;
                    try {
                        let projectileType = isPotionAmmo ? "minecraft:potion" : projectileName;
                        let projectile = level.createEntity(projectileType);
                        if (!projectile) break;

                        let randomOffsetX = (Math.random() - 0.5) * 0.05;
                        let randomOffsetY = (Math.random() - 0.5) * 0.05;
                        let randomOffsetZ = (Math.random() - 0.5) * 0.05;

                        projectile.setPosition(x + randomOffsetX, y + randomOffsetY, z + randomOffsetZ);
                        projectile.setMotion(motion.x, motion.y, motion.z);
                        if (isPotionAmmo) {
                            let potionStack = itemStack.copy();
                            try { projectile.item = potionStack; } catch (e) { }
                            try { projectile.setItem(potionStack); } catch (e) { }
                        }
                        projectile.spawn();

                        itemStack.shrink(1);
                        entity.inventory.setItem(slot, itemStack);
                    } catch (err) {
                        console.log(`[Docker Shooter] 创建实体失败: ${projectileName}`);
                        break;
                    }
                    break;
                }
            });

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

                let pos = entity.blockPos;
                let redstone = level.hasNeighborSignal(pos);
                if(!redstone) return;

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

                let pos = entity.blockPos;
                let redstone = level.hasNeighborSignal(pos);
                if(!redstone) return;

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

StartupEvents.registry("block", event => {
    event.create("rainbow:docker_player_pos_proxy")
        .woodSoundType()
        .displayName("docker(玩家坐标代理)")
        .blockEntity(entityInfo => {
            entityInfo.serverTick(20, 0, entity => {
                let level = entity.level;
                if (level.isClientSide()) return;
                let pos = entity.blockPos;
                let redstone = level.hasNeighborSignal(pos);
                if(!redstone) return;
                if (!entity.data || !entity.data.uuid) return;

                let uuid = UUID.fromString(entity.data.uuid);
                let player = level.server.getPlayerList().getPlayer(uuid);
                let data = entity.persistentData;

                if (!player) {
                    data.player_online = false;
                    return;
                }

                data.player_online = true;
                data.player_x = player.getX();
                data.player_y = player.getY();
                data.player_z = player.getZ();
                data.player_dim = player.level.dimension.toString();
            });
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

                let pos = entity.blockPos;
                let redstone = level.hasNeighborSignal(pos);
                if(!redstone) return;

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

                let pos = entity.blockPos;
                let redstone = level.hasNeighborSignal(pos);
                if(!redstone) return;

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

                let pos = entity.blockPos;
                let redstone = level.hasNeighborSignal(pos);
                if(!redstone) return;

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

// Docker 地雷型 
StartupEvents.registry("block", event => { 
    event.create("rainbow:landmine") 
        .displayName("Docker(地雷型)") 
        .grassSoundType() 
        //.noCollision()
        .steppedOn(event => { 
            try { 
                let level = event.getLevel(); 
                let pos = event.getPos(); 
                //console.log(level.hasNeighborSignal(pos)) 
                if(!level.hasNeighborSignal(pos)) return; 
                
                /*event.block.createExplosion() 
                    //.exploder(event.getEntity()) 
                    .strength(6.0) 
                    .causesFire(false) 
                    .explosionMode("none") 
                    .explode()*/

                level.getBlock(pos.x,pos.y,pos.z).set("minecraft:air")

                level.createExplosion(pos.x,pos.y+1,pos.z)
                .strength(6.0)
                .causesFire(false)
                .explosionMode("tnt")
                .explode()

            } catch(e) { 
                console.log("地雷触发报错：") 
                console.log(e) 
            } 
        }) 
}) 

// Docker 地雷型 - 使用检测器方块（需要红石信号触发）
/*StartupEvents.registry("block", event => {
    event.create("rainbow:landmine", "detector")
        .displayName("Docker(地雷型)")
        .grassSoundType()
})*/