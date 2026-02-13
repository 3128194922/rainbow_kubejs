let $CuriosApi = Java.loadClass("top.theillusivec4.curios.api.CuriosApi")
function hasCurios(entity, stack) {
    return $CuriosApi.getCuriosHelper().findEquippedCurio(stack, entity).isPresent()
}
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
function getCuriosInventorySafe(player) {
    if (player == null) return null
    return player.getCuriosInventory ? player.getCuriosInventory() : player.curiosInventory
}
function getCuriosHandler(player, slotType) {
    let curios = getCuriosInventorySafe(player)
    if (!curios) return null
    let handler = curios.getCurios().get(slotType)
    return handler ? handler : null
}
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
function getCuriosSlotCount(player, slotType) {
    let handler = getCuriosHandler(player, slotType)
    if (!handler) return 0
    return handler.getStacks().getSlots()
}
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

function listCuriosStack(player) {
    if (player == null) return []
    let curios = getCuriosInventorySafe(player)
    if (curios == null) return []
    let all = []
    for (let handler of curios.getCurios().values()) {
        let stacks = handler.getStacks()
        let size = stacks.getSlots()
        for (let i = 0; i < size; i++) {
            let stack = stacks.getStackInSlot(i)
            if (!stack.isEmpty()) all.push(stack)
        }
    }
    return all
}

function listCuriosIdNbt(player) {
    if (player == null) return []
    let curios = getCuriosInventorySafe(player)
    if (curios == null) return []
    let all = []
    for (let handler of curios.getCurios().values()) {
        let stacks = handler.getStacks()
        let size = stacks.getSlots()
        for (let i = 0; i < size; i++) {
            let stack = stacks.getStackInSlot(i)
            if (!stack.isEmpty()) {
                let id = stack.getId().toString()
                let nbt = stack.getNbt()
                all.push({ id: id, nbt: nbt ? String(nbt) : null })
            }
        }
    }
    return all
}
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
function getCuriosItemList(player, slot) {
    let curio = player.nbt.ForgeCaps['curios:inventory']["Curios"].find(function (curio) {
        return curio["Identifier"] === slot;
    })
    return curio ? curio.StacksHandler.Stacks.Items : []
}
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

function getVanillaItem(player, sourceType, slotIndex, slotName) {
    if (sourceType === "vanilla_mainhand") {
        return player.getItemInHand("main_hand");
    }
    if (sourceType === "vanilla_offhand") {
        return player.getItemInHand("off_hand");
    }
}
