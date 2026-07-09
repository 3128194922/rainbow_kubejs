// priority: 500
// ==========================================
// 鲁班锁 - 3×3×3方块结构存储/还原系统
// 右键捕获 -> 破坏保存到物品NBT -> 放置自动还原
// 利用 BlockEntityTag 实现数据自动传递
// ==========================================

// 右键捕获3×3×3区域（仅空手触发）
BlockEvents.rightClicked("rainbow:luban_lock", event => {
    let { block, player, hand, level, item } = event;
    if (hand != "MAIN_HAND") return;
    if (level.isClientSide()) return;
    if (!item || !item.isEmpty()) return;

    let entity = block.entity;
    if (!entity) {
        console.log("[鲁班锁] 方块实体不存在");
        return;
    }

    let pos = block.pos;
    let captured = [];
    console.log("[鲁班锁] 开始捕获3x3x3, 位置: " + pos.getX() + "," + pos.getY() + "," + pos.getZ());

    for (let dy = 1; dy <= 3; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                let targetPos = pos.offset(dx, dy, dz);
                let targetBlock = level.getBlock(targetPos);

                let entry = { dx: dx, dy: dy, dz: dz, id: targetBlock.id };

                // 保存方块状态（Java HashMap → JS Object）
                let props = targetBlock.properties;
                if (props) {
                    let stateObj = {};
                    let entrySet = props.entrySet();
                    let iter = entrySet.iterator();
                    while (iter.hasNext()) {
                        let propEntry = iter.next();
                        stateObj[String(propEntry.getKey())] = String(propEntry.getValue());
                    }
                    entry.state = stateObj;
                }

                // 保存方块实体数据（含容器物品）
                let targetBE = level.getBlockEntity(targetPos);
                if (targetBE) {
                    try {
                        entry.entity_nbt = targetBE.saveWithFullMetadata();
                        // 提取CBC机炮连接方向，用于后续重建邻居双向连接
                        if (typeof targetBE.cannonBehavior === 'function') {
                            let connectionsTag = entry.entity_nbt.getList("Connections", 8);
                            if (connectionsTag.size() > 0) {
                                entry.connectedTowards = [];
                                for (let ci = 0; ci < connectionsTag.size(); ci++) {
                                    entry.connectedTowards.push(connectionsTag.getString(ci));
                                }
                            }
                        }
                        // 保存火控-机械臂连接相对偏移（FireControlPos为绝对坐标，需转为区域相对位置）
                        if (entry.entity_nbt.contains("FireControlPos", 10)) {
                            let fcPos = entry.entity_nbt.getCompound("FireControlPos");
                            let fcX = fcPos.getInt("X");
                            let fcY = fcPos.getInt("Y");
                            let fcZ = fcPos.getInt("Z");
                            if (fcX >= pos.getX() - 1 && fcX <= pos.getX() + 1 &&
                                fcY >= pos.getY() + 1 && fcY <= pos.getY() + 3 &&
                                fcZ >= pos.getZ() - 1 && fcZ <= pos.getZ() + 1) {
                                let fcOrigin = pos.offset(-1, 1, -1);
                                entry.fireControlRel = [
                                    fcX - fcOrigin.getX(),
                                    fcY - fcOrigin.getY(),
                                    fcZ - fcOrigin.getZ()
                                ];
                            }
                        }
                    } catch (e) {}
                }

                // 清空方块实体数据，防止 onRemove 掉落自身物品/库存
                if (targetBE) {
                    try {
                        if (typeof targetBE.clearContent === 'function') {
                            targetBE.clearContent();
                        }
                        // 对非容器BE（如机械臂）加载空NBT清空自定义字段（heldItem等）
                        let emptyTag = Java.loadClass('net.minecraft.nbt.CompoundTag')();
                        targetBE.load(emptyTag);
                    } catch (e2) {}
                }
                level.getBlock(targetPos).set("minecraft:air");

                captured.push(entry);
            }
        }
    }

    entity.data.captured_blocks = captured;
    console.log("[鲁班锁] 捕获完成, 共 " + captured.length + " 个方块");
    player.tell("§a✔ 已捕获3×3×3方块结构");
});

// 破坏时保存数据到掉落物NBT（使用BlockEntityTag自动传递）
BlockEvents.broken("rainbow:luban_lock", event => {
    let block = event.block;
    let entity = block.entity;
    if (!entity) {
        console.log("[鲁班锁] 破坏时方块实体不存在");
        return;
    }

    let data = entity.data;
    let blocksData = data.captured_blocks;
    if (!blocksData) {
        console.log("[鲁班锁] 破坏时无已捕获数据，正常掉落");
        return;
    }

    console.log("[鲁班锁] 破坏, 保存 " + blocksData.length + " 个方块到掉落物NBT");

    block.set("minecraft:air");
    console.log("[鲁班锁] 方块已手动移除");

    // BlockEntityTag 会在放置时自动加载到方块实体
    let itemStack = Item.of('rainbow:luban_lock', {
        BlockEntityTag: {
            data: {
                captured_blocks: blocksData
            }
        }
    });
    console.log("[鲁班锁] 创建带BlockEntityTag掉落物");
    block.popItem(itemStack);
    console.log("[鲁班锁] 掉落物已生成");
});

// 放置时从entity.data还原3x3x3结构（BlockEntityTag已自动加载）
BlockEvents.placed("rainbow:luban_lock", event => {
    let { block, level, player } = event;

    let entity = block.entity;
    if (!entity) {
        console.log("[鲁班锁] 放置后方块实体不存在");
        return;
    }

    let captured = entity.data.captured_blocks;
    if (!captured) {
        console.log("[鲁班锁] 方块无待还原数据，跳过还原");
        return;
    }

    console.log("[鲁班锁] 放置, 从entity.data读取到 " + captured.length + " 个方块");

    let pos = block.pos;
    let restoreCount = 0;
    let failCount = 0;

    for (let i = 0; i < captured.length; i++) {
        let entry = captured[i];
        let targetPos = pos.offset(entry.dx, entry.dy, entry.dz);

        try {
            // 构建完整BlockState
            let blockEntry = ForgeRegistries.BLOCKS.getValue(new ResourceLocation(entry.id));
            if (blockEntry == null) {
                console.log("[鲁班锁] 未知方块ID: " + entry.id);
                failCount++;
                continue;
            }
            let finalState = blockEntry.defaultBlockState();
            if (entry.state) {
                let stateDef = blockEntry.getStateDefinition();
                for (let key in entry.state) {
                    if (Object.prototype.hasOwnProperty.call(entry.state, key)) {
                        let prop = stateDef.getProperty(key);
                        if (prop) {
                            let parsedValue = prop.getValue(entry.state[key]).orElse(null);
                            if (parsedValue != null) {
                                finalState = finalState.setValue(prop, parsedValue);
                            }
                        }
                    }
                }
            }
            level.setBlockAndUpdate(targetPos, finalState);
            restoreCount++;

            // 还原方块实体数据（含容器物品）
            if (entry.entity_nbt) {
                try {
                    // 将火控-机械臂连接从相对偏移转回新绝对坐标
                    if (entry.fireControlRel) {
                        let fcOrigin = pos.offset(-1, 1, -1);
                        let fcPos = entry.entity_nbt.getCompound("FireControlPos");
                        fcPos.putInt("X", fcOrigin.getX() + entry.fireControlRel[0]);
                        fcPos.putInt("Y", fcOrigin.getY() + entry.fireControlRel[1]);
                        fcPos.putInt("Z", fcOrigin.getZ() + entry.fireControlRel[2]);
                    }
                    entry.entity_nbt.putInt("x", targetPos.getX());
                    entry.entity_nbt.putInt("y", targetPos.getY());
                    entry.entity_nbt.putInt("z", targetPos.getZ());
                    let targetBE = level.getBlockEntity(targetPos);
                    if (targetBE) {
                        targetBE.load(entry.entity_nbt);
                        targetBE.setChanged();
                    }
                } catch (nbtErr) {
                    console.log("[鲁班锁] 还原NBT失败: " + nbtErr);
                }
            }
        } catch (e) {
            console.log("[鲁班锁] 还原失败: " + entry.id + " 错误: " + e);
            failCount++;
        }
    }

    // 第二遍：重建CBC方块的邻居双向连接（setBlockAndUpdate可能已清除邻居的引用）
    let Direction = Java.loadClass('net.minecraft.core.Direction');
    let cannonBlockCount = 0;
    for (let i = 0; i < captured.length; i++) {
        let entry = captured[i];
        if (!entry.connectedTowards || entry.connectedTowards.length === 0) continue;
        cannonBlockCount++;
        let targetPos = pos.offset(entry.dx, entry.dy, entry.dz);
        let targetBE = level.getBlockEntity(targetPos);
        if (targetBE && typeof targetBE.cannonBehavior === 'function') {
            for (let j = 0; j < entry.connectedTowards.length; j++) {
                let dir = Direction.byName(entry.connectedTowards[j]);
                if (dir == null) continue;
                let neighborPos = targetPos.relative(dir);
                let neighborBE = level.getBlockEntity(neighborPos);
                if (neighborBE && typeof neighborBE.cannonBehavior === 'function') {
                    neighborBE.cannonBehavior().setConnectedFace(dir.getOpposite(), true);
                }
            }
        }
    }
    if (cannonBlockCount > 0) {
        console.log("[鲁班锁] CBC连接重建完成，涉及 " + cannonBlockCount + " 个方块");
    }

    console.log("[鲁班锁] 还原完成, 成功 " + restoreCount + "/" + captured.length + " 失败 " + failCount);

    // 清空已还原的数据，防止重复放置
    entity.data.captured_blocks = [];

    if (player) {
        player.tell("§a✔ 已还原3×3×3方块结构");
    }
});
