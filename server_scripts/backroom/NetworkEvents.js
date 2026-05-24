// priority: 0

// 目标维度：后室 和 主世界
let BACKROOM_DIM = new ResourceLocation('backroom:backroom')
let OVERWORLD_DIM = new ResourceLocation('minecraft:overworld')

// 后室默认传送目标层
let BACKROOM_TARGET_Y = -62

// 在后室固定 Y 层搜索安全点的半径
let BACKROOM_SEARCH_RADIUS = 16

// 回主世界时搜索安全点的半径
let OVERWORLD_SEARCH_RADIUS = 16

// 在指定位置生成掉落物
function spawnDroppedItem(level, x, y, z, stack) {
  if (stack == null || stack.isEmpty()) return

  let drop = new ItemEntity(level, x, y + 0.5, z, stack.copy())
  drop.setPickUpDelay(20)
  level.addFreshEntity(drop)
}

// 将玩家普通背包中的物品掉落在当前位置，并清空
// 这里使用原版 Player Inventory，等价替代原先 clear @s 的主要用途
function dropPlayerInventoryExceptEnderChest(player) {
  let level = player.level
  let inventory = player.getInventory()
  let size = inventory.getContainerSize()

  for (let i = 0; i < size; i++) {
    let stack = inventory.getItem(i)
    if (stack == null || stack.isEmpty()) continue

    spawnDroppedItem(level, player.x, player.y, player.z, stack)
    inventory.setItem(i, ItemStack.EMPTY)
  }

  inventory.setChanged()
}

// 将玩家 Curios 栏位中的物品掉落在当前位置，并清空
function dropAllCurios(player) {
  let level = player.level
  let allCurios = player.getAllCurios()

  allCurios.forEach((slotName, stacksHandler) => {
    let stacks = stacksHandler.getStacks()
    let slots = stacks.getSlots()

    for (let i = 0; i < slots; i++) {
      let stack = stacks.getStackInSlot(i)
      if (stack == null || stack.isEmpty()) continue

      spawnDroppedItem(level, player.x, player.y, player.z, stack)
      player.setEquippedCurio(slotName, i, ItemStack.EMPTY)
    }
  })
}

// 将玩家所有 Backpacked 背包内部物品掉落在当前位置，并清空
// 注意：这里只清空背包内容，不移除背包壳
function dropAllBackpackedContents(player) {
  let level = player.level
  let backpacks = BackpackHelper.getBackpacks(player)

  for (let i = 0; i < backpacks.size(); i++) {
    let inv = player['backpacked$GetBackpackInventory'](i)
    if (inv == null) continue

    let size = inv.getContainerSize()

    for (let slot = 0; slot < size; slot++) {
      let stack = inv.getItem(slot)
      if (stack == null || stack.isEmpty()) continue

      spawnDroppedItem(level, player.x, player.y, player.z, stack)
      inv.setItem(slot, ItemStack.EMPTY)
    }

    inv.saveItemsToStack()
  }
}

// 统一调用：将玩家要被“清空”的物品改为掉落在当前后室位置
function dropAndClearAllBackroomItems(player) {
  dropPlayerInventoryExceptEnderChest(player)
  dropAllCurios(player)
  dropAllBackpackedContents(player)
}

// 判断某个方块是否为空气
function isAirBlock(level, x, y, z) {
  return level.getBlock(x, y, z).blockState.isAir()
}

// 判断某个方块是否可以作为“脚下站立方块”
function isSolidFloor(level, x, y, z) {
  let state = level.getBlock(x, y, z).blockState
  return !state.isAir() && state.getFluidState().isEmpty() && state.blocksMotion()
}

// 判断玩家是否可以站在 x,y,z 这个位置
function canStandAt(level, x, y, z) {
  if (y <= level.getMinBuildHeight() + 1) return false
  if (y >= level.getMaxBuildHeight() - 1) return false

  return (
    isAirBlock(level, x, y, z) &&
    isAirBlock(level, x, y + 1, z) &&
    isSolidFloor(level, x, y - 1, z)
  )
}

// 判断该位置是否为露天地表安全点
function canStandAtSurface(level, x, y, z) {
  if (!canStandAt(level, x, y, z)) return false
  return level.getBlock(x, y, z).canSeeSky
}

// 将方块坐标转换为玩家传送坐标
function makeTpPos(x, y, z) {
  return {
    x: x + 0.5,
    y: y,
    z: z + 0.5
  }
}

// 在固定 Y 层寻找安全点
function findNearbySafeAtFixedY(level, centerX, centerZ, y, radius) {
  let baseX = Math.floor(centerX)
  let baseZ = Math.floor(centerZ)

  if (canStandAt(level, baseX, y, baseZ)) {
    return makeTpPos(baseX, y, baseZ)
  }

  for (let r = 1; r <= radius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue

        let x = baseX + dx
        let z = baseZ + dz

        if (canStandAt(level, x, y, z)) {
          return makeTpPos(x, y, z)
        }
      }
    }
  }

  return null
}

// 在某个 x,z 列上，从高到低寻找安全 Y
function findHighestSafeY(level, x, z, requireSky) {
  let minY = level.getMinBuildHeight() + 1
  let maxY = level.getMaxBuildHeight() - 2

  for (let y = maxY; y >= minY; y--) {
    if (requireSky) {
      if (canStandAtSurface(level, x, y, z)) {
        return y
      }
    } else {
      if (canStandAt(level, x, y, z)) {
        return y
      }
    }
  }

  return null
}

// 在主世界附近寻找安全点
function findNearbySurfaceSafe(level, centerX, centerZ, radius) {
  let baseX = Math.floor(centerX)
  let baseZ = Math.floor(centerZ)

  let y = findHighestSafeY(level, baseX, baseZ, true)
  if (y != null) {
    return makeTpPos(baseX, y, baseZ)
  }

  for (let r = 1; r <= radius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue

        let x = baseX + dx
        let z = baseZ + dz

        y = findHighestSafeY(level, x, z, true)
        if (y != null) {
          return makeTpPos(x, y, z)
        }
      }
    }
  }

  for (let r = 0; r <= radius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (r > 0 && Math.abs(dx) !== r && Math.abs(dz) !== r) continue

        let x = baseX + dx
        let z = baseZ + dz

        y = findHighestSafeY(level, x, z, false)
        if (y != null) {
          return makeTpPos(x, y, z)
        }
      }
    }
  }

  return null
}

// 执行跨维度安全传送
function teleportPlayerSafe(player, dimension, pos) {
  player.teleportTo(dimension, pos.x, pos.y, pos.z, player.yaw, player.pitch)
}

// 非创造切冒险
function setAdventureIfNotCreative(player) {
  if (player.isCreative()) return
  player.runCommandSilent(`execute as ${player.name.string} run gamemode adventure`)
}

// 非创造切生存
function setSurvivalIfNotCreative(player) {
  if (player.isCreative()) return
  player.runCommandSilent(`execute as ${player.name.string} run gamemode survival`)
}

// 接收客户端秘籍发包
NetworkEvents.dataReceived('pause_menu_code', event => {
  if (!event.data || event.data.code != 'wwssaaddbaba') return

  let server = event.server
  let player = event.player
  let currentDim = String(player.level.dimension)

  // 不在后室：传送进后室
  if (currentDim != 'backroom:backroom') {
    let backroomLevel = server.getLevel(BACKROOM_DIM)

    if (backroomLevel == null) {
      console.log('[KubeJS] 未找到维度 backroom:backroom')
      return
    }

    let safePos = findNearbySafeAtFixedY(
      backroomLevel,
      player.x,
      player.z,
      BACKROOM_TARGET_Y,
      BACKROOM_SEARCH_RADIUS
    )

    if (safePos == null) {
      console.log('[KubeJS] 后室未找到安全传送点')
      return
    }

    teleportPlayerSafe(player, BACKROOM_DIM, safePos)
    setAdventureIfNotCreative(player)

    console.log(`[KubeJS] ${player.name.string} 已传送到后室: ${safePos.x}, ${safePos.y}, ${safePos.z}`)
    return
  }

  // 已在后室：逃回主世界
  let overworldLevel = server.getLevel(OVERWORLD_DIM)

  if (overworldLevel == null) {
    console.log('[KubeJS] 未找到主世界 minecraft:overworld')
    return
  }

  let safePos = findNearbySurfaceSafe(
    overworldLevel,
    player.x,
    player.z,
    OVERWORLD_SEARCH_RADIUS
  )

  if (safePos == null) {
    console.log('[KubeJS] 主世界未找到安全传送点')
    return
  }

  // 先把要清空的物品以掉落形式留在后室，再传送离开
  dropAndClearAllBackroomItems(player)

  teleportPlayerSafe(player, OVERWORLD_DIM, safePos)
  setSurvivalIfNotCreative(player)

  console.log(`[KubeJS] ${player.name.string} 已逃出后室，物品已掉落在后室`)
})

// 玩家死亡事件：死在后室时，将要清空的物品改为掉落在后室
EntityEvents.death('minecraft:player', event => {
  let player = event.entity

  if (String(player.level.dimension) != 'backroom:backroom') return

  dropAndClearAllBackroomItems(player)

  console.log(`[KubeJS] ${player.name.string} 死于 backroom，物品已掉落在后室`)
})