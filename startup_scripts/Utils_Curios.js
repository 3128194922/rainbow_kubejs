let $CuriosApi = Java.loadClass("top.theillusivec4.curios.api.CuriosApi")

// 检测实体是否装备了指定饰品物品
/*function hasCurios(entity, stack) {
    return $CuriosApi.getCuriosHelper().findEquippedCurio(stack, entity).isPresent()
}*/
// 饰品槽位操作：shrink收缩/grow扩容/getfor查询数量/setfor设置数量/unlock解锁/lock锁定
function CuriosSlotMethod(method, slot, player, amount) {
    switch (method) {
        case "shrink":
            $CuriosApi.getSlotHelper().shrinkSlotType(slot, amount, player)
            break;
        case "grow":
            $CuriosApi.getSlotHelper().growSlotType(slot, amount, player)
            break;
        case "getfor":
            return $CuriosApi.getSlotHelper().getSlotsForType(player, slot)
        case "setfor":
            $CuriosApi.getSlotHelper().setSlotsForType(slot, player, amount)
            break;
        case "unlock":
            $CuriosApi.getSlotHelper().unlockSlotType(slot, player)
            break;
        case "lock":
            $CuriosApi.getSlotHelper().lockSlotType(slot, player)
            break;
    }
}
// 安全获取玩家的饰品背包，兼容不同版本API
function getCuriosInventorySafe(player) {
    if (player == null) return null
    //先检查实体是否有curios能力，避免对非玩家实体抛IllegalStateException
    try {
        if (!$CuriosApi.getCuriosInventory(player).isPresent()) return null
        return $CuriosApi.getCuriosInventory(player).resolve().get()
    } catch (e) {
        return null
    }
}

// 获取指定槽位类型的饰品处理器
function getCuriosHandler(player, slotType) {
    let curios = getCuriosInventorySafe(player)
    if (!curios) return null
    let handler = curios.getCurios().get(slotType)
    return handler ? handler : null
}

// 获取玩家所有已解锁的饰品槽位类型名称列表
function getCuriosSlotTypes(player) {
    let curios = getCuriosInventorySafe(player)
    if (!curios) return []
    let map = curios.getCurios()
    let types = []
    let it = map.keySet().iterator()
    while (it.hasNext()) {
        types.push(String(it.next()))
    }
    return types
}

// 获取指定槽位类型的格子数量
function getCuriosSlotCount(player, slotType) {
    let handler = getCuriosHandler(player, slotType)
    if (!handler) return 0
    return handler.getStacks().getSlots()
}

// 列出玩家所有已装备饰品的物品ID列表
function listCurios(player) {
    if (player == null) return []
    let curios = getCuriosInventorySafe(player)
    if (curios == null) return []
    let all = []
    for (let handler of curios.getCurios().values()) {
        let stacks = handler.getStacks()
        let size = stacks.getSlots()
        for (let i = 0; i < size; i++) {
            let stack = stacks.getStackInSlot(i)
            if (!stack.isEmpty()) all.push(stack.getId().toString())
        }
    }
    return all
}
// 列出玩家所有饰品的冷却状态（1=无冷却可用，0=冷却中或无饰品）
function listCuriosCooldown(player) {
    if (player == null) return []
    let curios = getCuriosInventorySafe(player)
    if (curios == null) return []
    let result = []
    for (let handler of curios.getCurios().values()) {
        let stacks = handler.getStacks()
        let size = stacks.getSlots()
        for (let i = 0; i < size; i++) {
            let stack = stacks.getStackInSlot(i)
            if (!stack.isEmpty()) {
                let id = stack.getId().toString()
                let notOnCd = !player.cooldowns.isOnCooldown(id)
                result.push(notOnCd ? 1 : 0)
            } else {
                result.push(0)
            }
        }
    }
    return result
}
// 获取指定槽位类型中的所有饰品物品列表
function getCuriosItems(player, slotType) {
    let curios = getCuriosInventorySafe(player)
    if (!curios) return null
    let handler = curios.getCurios().get(slotType)
    if (!handler) return null
    let stacks = handler.getStacks()
    let size = stacks.getSlots()
    let result = []
    for (let i = 0; i < size; i++) {
        let stack = stacks.getStackInSlot(i)
        if (!stack.isEmpty()) {
            result.push(stack)
        }
    }
    return result.length > 0 ? result : null
}

// 获取指定槽位类型中的第一个饰品物品
function getCuriosItemBySlot(player, slotType) {
    let curios = getCuriosInventorySafe(player)
    if (!curios) return null
    let handler = curios.getCurios().get(slotType)
    if (!handler) return null
    let stacks = handler.getStacks()
    let size = stacks.getSlots()
    for (let i = 0; i < size; i++) {
        let stack = stacks.getStackInSlot(i)
        if (!stack.isEmpty()) {
            return stack
        }
    }
    return null
}

// 根据物品ID在所有饰品槽位中查找对应饰品
function getCuriosItem(player, id) {
    if (player == null) return null
    let curios = getCuriosInventorySafe(player)
    if (curios == null) return null
    for (let handler of curios.getCurios().values()) {
        let stacks = handler.getStacks()
        let size = stacks.getSlots()
        for (let i = 0; i < size; i++) {
            let stack = stacks.getStackInSlot(i)
            if (!stack.isEmpty() && stack.getId().toString() === id) {
                return stack
            }
        }
    }
    return null
}

// 通过NBT直接获取指定槽位的物品原始数据列表
function getCuriosItemList(player, slot) {
    let curio = player.nbt.ForgeCaps['curios:inventory']["Curios"].find(function (curio) {
        return curio["Identifier"] === slot;
    })
    return curio ? curio.StacksHandler.Stacks.Items : []
}

// 通过NBT查询玩家指定槽位中特定物品的详细信息（是否存在、数量、槽位索引）
function CuriosPlayer(player, slot, id) {
    let result = {
        hasItem: false,
        count: 0,
        SlotNum: 0,
        SlotSize: 0
    };
    let ItemList = getCuriosItemList(player, slot)
    result.SlotSize = player.nbt.ForgeCaps['curios:inventory']["Curios"].find(function (curio) {
        return curio["Identifier"] === slot;
    }).StacksHandler.Cosmetics.Size
    ItemList.forEach(item => {
        if (item.id === id) {
            result.hasItem = true;
            result.count += item.Count;
            result.SlotNum = item.Slot;
        }
    })
    return result
}

// 获取指定槽位类型中指定索引处的饰品物品
function getCuriosIndex(player, slotType, index) {
    if (player == null) return null
    let curios = getCuriosInventorySafe(player)
    if (!curios) return null
    let handler = curios.getCurios().get(slotType)
    if (!handler) return null
    let stacks = handler.getStacks()
    let size = stacks.getSlots()
    if (index < 0 || index >= size) return null
    let stack = stacks.getStackInSlot(index)
    return stack && !stack.isEmpty() ? stack : null
}

// 检测玩家所有已装备的饰品中是否有至少一个带有指定tag的物品
function hasCuriosTag(player, tag) {
    if (player == null) return false
    let curios = getCuriosInventorySafe(player)
    if (curios == null) return false
    for (let handler of curios.getCurios().values()) {
        let stacks = handler.getStacks()
        let size = stacks.getSlots()
        for (let i = 0; i < size; i++) {
            let stack = stacks.getStackInSlot(i)
            if (!stack.isEmpty() && stack.hasTag(tag)) {
                return true
            }
        }
    }
    return false
}

function getVanillaItem(player, sourceType, slotIndex, slotName) {
    if (sourceType === "vanilla_mainhand") {
        return player.getItemInHand("main_hand");
    }
    if (sourceType === "vanilla_offhand") {
        return player.getItemInHand("off_hand");
    }
}
