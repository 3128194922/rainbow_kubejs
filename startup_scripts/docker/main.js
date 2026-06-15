// priority: 500

// ============================================================
// 公共工具函数 - Docker 通用系统
// ============================================================

global.DOCKER_MODE_NAMES = [
    "§6末影箱转移",
    "§6物品栏转移",
    "§6背包转移",
    "§6背包代理",
    "§6物品栏代理",
    "§6末影箱代理"
];

function dockerGuard(entity) {
    if (entity.level.isClientSide()) return null;
    if (!entity.level.hasNeighborSignal(entity.blockPos)) return null;
    return entity.level;
}

function dockerGetPlayer(entity) {
    if (!entity.data || !entity.data.uuid) return null;
    return entity.level.server.getPlayerList().getPlayer(UUID.fromString(entity.data.uuid));
}

function dockerTransfer(entity, targetInv, slotCount) {
    for (let i = 0; i < slotCount; i++) {
        let stack = entity.inventory.getItem(i);
        if (stack.isEmpty()) continue;
        let toInsert = stack.copy();
        let remaining = targetInv.insertItem(toInsert, false);
        let inserted = toInsert.getCount() - remaining.getCount();
        if (inserted <= 0) continue;
        stack.shrink(inserted);
        entity.inventory.setItem(i, stack.isEmpty() ? ItemStack.EMPTY : stack);
    }
}

// 转移物品到玩家主背包(9-35)，跳过快捷栏(0-8)
function dockerTransferToMainInv(entity, playerInv) {
    for (let i = 0; i < 9; i++) {
        let stack = entity.inventory.getItem(i);
        if (stack.isEmpty()) continue;
        // 遍历玩家主背包槽位 9-35
        for (let s = 9; s < 36; s++) {
            let target = playerInv.getItem(s);
            if (target.isEmpty()) {
                // 空槽位：直接放入
                playerInv.setItem(s, stack.copy());
                entity.inventory.setItem(i, ItemStack.EMPTY);
                break;
            }
            // 同物品且未满：尝试堆叠
            if (target.id === stack.id && target.getCount() < target.getMaxStackSize()) {
                let space = target.getMaxStackSize() - target.getCount();
                let toMove = Math.min(space, stack.getCount());
                target.setCount(target.getCount() + toMove);
                stack.shrink(toMove);
                if (stack.isEmpty()) {
                    entity.inventory.setItem(i, ItemStack.EMPTY);
                    break;
                }
            }
        }
    }
}

function dockerSyncProxy(entity, sourceInv, startSlot, count) {
    for (let i = 0; i < count; i++) {
        let pStack = sourceInv.getItem(startSlot + i);
        let bStack = entity.inventory.getStackInSlot(i);
        if (!pStack.equals(bStack)) {
            entity.inventory.setStackInSlot(i, pStack.copy());
        }
    }
}

function dockerClearInventory(entity) {
    let inv = entity.inventory;
    for (let i = 0; i < inv.slots; i++) {
        if (!inv.getStackInSlot(i).isEmpty()) {
            inv.setStackInSlot(i, ItemStack.EMPTY);
        }
    }
}

// 物品能力注册：转移模式(0,1,2)允许漏斗等外部提取/插入，代理模式(3,4,5)禁止
function dockerCreateCapability() {
    return CapabilityBuilder.ITEM.blockEntity()
        .availableOn(() => true)
        .getSlotLimit((be, slot) => be.inventory.getSlotLimit(slot))
        .getSlots(be => be.inventory.slots)
        .getStackInSlot((be, slot) => be.inventory.getStackInSlot(slot))
        .isItemValid((be, slot, stack) => be.inventory.isItemValid(slot, stack))
        .extractItem((be, slot, amount, simulate) => {
            let mode = be.persistentData.mode || 0;
            // 代理模式(3,4,5)禁止外部提取，防止被漏斗/管道抽走映射物品
            if (mode >= 3) return ItemStack.EMPTY;
            return be.inventory.extractItem(slot, amount, simulate);
        })
        .insertItem((be, slot, stack, simulate) => {
            let mode = be.persistentData.mode || 0;
            // 代理模式(3,4,5)禁止外部插入
            if (mode >= 3) return stack;
            return be.inventory.insertItem(slot, stack, simulate);
        });
}

// ============================================================
// Docker 通用型：支持6种模式切换（替代原6个独立方块）
// ============================================================
StartupEvents.registry("block", event => {
    event.create("rainbow:docker")
        .woodSoundType()
        .displayName("Docker(通用型)")
        .blockEntity(entityInfo => {
            entityInfo.inventory(9, 3);
            //entityInfo.rightClickOpensInventory();

            entityInfo.serverTick(20, 0, entity => {
                let level = dockerGuard(entity);
                if (!level) return;
                let data = entity.persistentData;
                let mode = data.mode || 0;
                let player = dockerGetPlayer(entity);

                switch (mode) {
                    case 0: // 末影型：转移至末影箱
                        if (!player) return;
                        dockerTransfer(entity, player.getEnderChestInventory(), 9);
                        break;

                    case 1: // 末影加强型：转移至物品栏
                        if (!player) return;
                        dockerTransfer(entity, player.getInventory(), 9);
                        break;

                    case 2: // 主背包型：转移至玩家主背包(9-35)，不进入快捷栏
                        if (!player) return;
                        dockerTransferToMainInv(entity, player.getInventory());
                        break;

                    case 3: // 背包代理：玩家Inv 9-35 → 方块
                        if (player) {
                            dockerSyncProxy(entity, player.getInventory(), 9, 27);
                        } else {
                            dockerClearInventory(entity);
                        }
                        break;

                    case 4: // 物品栏代理：玩家Hotbar 0-8 → 方块
                        if (player) {
                            dockerSyncProxy(entity, player.getInventory(), 0, 9);
                        } else {
                            dockerClearInventory(entity);
                        }
                        break;

                    case 5: // 末影箱代理：玩家末影箱 → 方块
                        if (player) {
                            dockerSyncProxy(entity, player.getEnderChestInventory(), 0, 27);
                        } else {
                            dockerClearInventory(entity);
                        }
                        break;
                }
            });

            entityInfo.attachCapability(dockerCreateCapability());
        });
});













