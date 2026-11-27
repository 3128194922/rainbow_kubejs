// priority: 0
// ==========================================
// 信标光束互动与能量转换 / 充能信标合成
// Beacon Beam Interaction & Energized Beacon Crafting
// ==========================================
// 功能：
// 1. 玩家手持触发物品（默认红石）右键点击信标，触发光束扫描。
// 2. 扫描光束经过的实体，并根据光束颜色给予实体着火效果（能量注入模拟）。
// 3. 扫描光束路径上的刚玉簇（rainbow:corundum_cluster），按「刚玉颜色 + 刚玉背面方块」
//    匹配 BEACON_CONFIG.recipes：掉落产物，可选消耗或替换背面方块。
// 4. 未命中配方时保留原行为：刚玉背面是靶子方块，则按光束颜色亮度输出红石信号。
//
// 配置入口：只需要修改下面的 BEACON_CONFIG 一个变量。
// Features:
// 1. Player right-clicks beacon with Redstone to scan the beam.
// 2. Scans entities in beam path and sets them on fire (energy injection sim) based on color.
// 3. Detects Corundum Clusters in beam path and matches BEACON_CONFIG.recipes by
//    corundum color + the block behind the cluster (catalyst).
// 4. Falls back to the legacy target-block signal when no recipe matches.

const directionMap = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
  up: "down",
  down: "up",
};
/*
const COLORS = {
  白: [1.00, 1.00, 1.00],
  红: [1.00, 0.25, 0.25],
  橙: [1.00, 0.63, 0.25],
  黄: [1.00, 1.00, 0.25],
  绿: [0.25, 1.00, 0.25],
  蓝: [0.25, 1.00, 1.00],
  靛: [0.25, 0.25, 1.00],
  紫: [1.00, 0.25, 1.00],
  黑: [0.06, 0.06, 0.06]
};*/

// ==========================================
// 配置（唯一需要改的地方）
// ==========================================
const BEACON_CONFIG = {
  // 触发扫描的手持物品 id；设为 null 表示空手也能触发
  triggerItem: 'minecraft:redstone',
  // 每个光束段沿光束方向向后扫描的方块数
  beamRange: 10,
  // 同一信标两次扫描的最短间隔（tick），防止连点重复触发
  beaconCooldownTicks: 10,
  // 是否给光束内实体点火
  igniteEntities: true,
  // 点火强度上限（秒）；实际值由光束颜色亮度换算，不超过该上限
  igniteSecondsMax: 15,
  // 靶子方块信号持续时间（tick）
  targetSignalTicks: 60,
  // 同一催化剂方块的默认冷却（tick），配方里可用 cooldown 单独覆盖
  cooldownTicks: 20,
  // 合成成功是否给玩家提示
  notifyPlayer: true,
  // 配方表：从上到下匹配，第一条命中的生效
  // color      : 刚玉颜色（red/orange/yellow/green/blue/indigo/violet/white/black），'any' 或省略 = 不限
  // catalyst   : 刚玉背面（被光束照射）的方块 id；可写数组或标签 '#forge:...'；省略 = 任意方块
  // output     : 产物物品 id（掉落物），省略 = 只转换方块
  // count      : 产物数量，默认 1
  // consume    : true 时把催化剂方块变成空气，默认 false
  // replaceWith: 把催化剂方块替换成指定方块（设置后无视 consume）
  // cooldown   : 该配方的独立冷却 tick，默认使用 cooldownTicks
  recipes: [
    // 示例 1：红色刚玉被光束照射，背面是铁块 → 掉落 1 个金锭并消耗铁块
    // { color: 'red', catalyst: 'minecraft:iron_block', output: 'minecraft:gold_ingot', count: 1, consume: true },
    // 示例 2：不限颜色，背面是绿宝石块 → 替换为钻石块并掉落 1 个钻石
    // { catalyst: 'minecraft:emerald_block', output: 'minecraft:diamond', replaceWith: 'minecraft:diamond_block' },
    // 示例 3：蓝色刚玉 + 下界合金块标签 → 掉落 1 个下界之星，冷却 60 秒
    // { color: 'blue', catalyst: '#forge:storage_blocks/netherite', output: 'minecraft:nether_star', count: 1, consume: true, cooldown: 1200 },
  ],
}

// 将RGB颜色转换为能量强度
function rgbToPower(r, g, b) {
  const minV = 0.02
  const maxV = 1.00
  const minP = 1
  const maxP = 15

  const brightness = 0.2126*r + 0.7152*g + 0.0722*b

  let power = ((brightness - minV) / (maxV - minV)) * (maxP - minP) + minP
  if (isNaN(power)) power = minP
  if (power < minP) power = minP
  if (power > maxP) power = maxP
  return Math.round(power)
}

// 读取光束颜色（旧代码对 toFixed 字符串做运算，这里统一转成数字）
function readBeamRGB(beam) {
  try {
    let colorArray = beam.color
    if (colorArray == null || colorArray.length < 3) return [1, 1, 1]
    return [toNumber(colorArray[0], 1), toNumber(colorArray[1], 1), toNumber(colorArray[2], 1)]
  } catch (err) {
    console.log('[充能信标] 读取光束颜色失败: ' + err)
    return [1, 1, 1]
  }
}

function toNumber(value, fallback) {
  let number = Number(value)
  if (isNaN(number)) number = parseFloat(String(value))
  if (isNaN(number)) return fallback
  return number
}

// 从刚玉簇方块 id 解析颜色，例如 quark:red_corundum_cluster → red
function getCorundumColor(blockId) {
  try {
    if (blockId == null) return null
    const prefix = 'quark:'
    const suffix = '_corundum_cluster'
    if (blockId.indexOf(prefix) !== 0) return null
    if (blockId.length <= prefix.length + suffix.length) return null
    if (blockId.substring(blockId.length - suffix.length) !== suffix) return null
    return blockId.substring(prefix.length, blockId.length - suffix.length)
  } catch (err) {
    console.log('[充能信标] 解析刚玉颜色失败: ' + err)
    return null
  }
}

function offsetPos(pos, dirName) {
  switch (dirName) {
    case 'north': return { x: pos.x, y: pos.y, z: pos.z - 1 };
    case 'south': return { x: pos.x, y: pos.y, z: pos.z + 1 };
    case 'west': return { x: pos.x - 1, y: pos.y, z: pos.z };
    case 'east': return { x: pos.x + 1, y: pos.y, z: pos.z };
    case 'up': return { x: pos.x, y: pos.y + 1, z: pos.z };
    case 'down': return { x: pos.x, y: pos.y - 1, z: pos.z };
  }
  return null
}

function matchesColor(rule, actual) {
  if (rule == null || rule === 'any') return true
  return rule === actual
}

function matchesCatalyst(rule, block) {
  if (rule == null) return true
  if (block == null) return false
  let ids = Array.isArray(rule) ? rule : [rule]
  for (let i = 0; i < ids.length; i++) {
    let id = ids[i]
    if (id == null) continue
    try {
      if (id.indexOf('#') === 0) {
        if (block.hasTag(id.substring(1))) return true
      } else if (block.id === id) {
        return true
      }
    } catch (err) {
      console.log('[充能信标] 判断催化剂方块失败: ' + err)
    }
  }
  return false
}

function findRecipe(corundumColor, catalystBlock) {
  let recipes = BEACON_CONFIG.recipes
  if (recipes == null) return null
  for (let i = 0; i < recipes.length; i++) {
    let recipe = recipes[i]
    if (recipe == null) continue
    if (!matchesColor(recipe.color, corundumColor)) continue
    if (!matchesCatalyst(recipe.catalyst, catalystBlock)) continue
    return recipe
  }
  return null
}

// 冷却表：key = 类型|维度|坐标
const craftCooldowns = {}

function cooldownKey(level, type, pos) {
  return type + '|' + String(level.dimension) + '|' + pos.x + ',' + pos.y + ',' + pos.z
}

function isCoolingDown(level, type, pos, ticks) {
  if (ticks == null || ticks <= 0) return false
  try {
    let key = cooldownKey(level, type, pos)
    let now = level.getTime()
    let last = craftCooldowns[key]
    if (last != null && now - last < ticks) return true
    craftCooldowns[key] = now
    pruneCooldowns(now)
    return false
  } catch (err) {
    console.log('[充能信标] 冷却判断失败: ' + err)
    return false
  }
}

function pruneCooldowns(now) {
  let keys = Object.keys(craftCooldowns)
  if (keys.length < 512) return
  for (let i = 0; i < keys.length; i++) {
    if (now - craftCooldowns[keys[i]] > 12000) delete craftCooldowns[keys[i]]
  }
}

function craftWithRecipe(level, player, recipe, catalystBlock) {
  let cooldown = recipe.cooldown == null ? BEACON_CONFIG.cooldownTicks : recipe.cooldown
  if (isCoolingDown(level, 'craft', catalystBlock.pos, cooldown)) return false

  let count = recipe.count == null ? 1 : recipe.count

  try {
    if (recipe.output != null) catalystBlock.popItem(Item.of(recipe.output, count))
  } catch (err) {
    console.log('[充能信标] 产物掉落失败: ' + err)
  }

  try {
    if (recipe.replaceWith != null) {
      catalystBlock.set(recipe.replaceWith)
    } else if (recipe.consume === true) {
      catalystBlock.set('minecraft:air')
    }
  } catch (err) {
    console.log('[充能信标] 方块替换失败: ' + err)
  }

  if (BEACON_CONFIG.notifyPlayer && player != null) {
    try {
      let text = recipe.output != null ? recipe.output + ' ×' + count : recipe.replaceWith
      if (text != null) player.tell('§b[充能信标] §f' + text)
    } catch (err) {
      console.log('[充能信标] 提示玩家失败: ' + err)
    }
  }

  try {
    level.playSound(null, catalystBlock.pos.x + 0.5, catalystBlock.pos.y + 0.5, catalystBlock.pos.z + 0.5,
      'minecraft:block.beacon.power_select', 'blocks', 1.0, 1.4)
  } catch (err) {
    console.log('[充能信标] 播放合成音效失败: ' + err)
  }

  return true
}

// 旧行为：刚玉背面是靶子方块时，按光束颜色亮度输出红石信号
function activateTarget(level, targetBlock, power) {
  try {
    let pos = targetBlock.pos
    level.setBlockAndUpdate(pos, targetBlock.blockState.setValue(BlockProperties.POWER, Integer.valueOf(String(power))))
    level.server.scheduleInTicks(BEACON_CONFIG.targetSignalTicks, () => {
      try {
        let current = level.getBlock(pos.x, pos.y, pos.z)
        if (current.id !== 'minecraft:target') return
        level.setBlockAndUpdate(pos, current.blockState.setValue(BlockProperties.POWER, Integer.valueOf('0')))
      } catch (err) {
        console.log('[充能信标] 靶子复位失败: ' + err)
      }
    })
  } catch (err) {
    console.log('[充能信标] 激活靶子失败: ' + err)
  }
}

;(() => {
  BlockEvents.rightClicked('minecraft:beacon', (e) => {
      let { hand, item, block, player, level } = e;
      if (level.isClientSide()) return;
      if (hand !== 'main_hand') return;
      if (BEACON_CONFIG.triggerItem != null && item.id !== BEACON_CONFIG.triggerItem) return;

      if (block.entity == null) return;

      let sections = null;
      try {
          if (block.entity.getBeamSections != null) sections = block.entity.getBeamSections();
      } catch (err) {
          console.log('[充能信标] 读取光束失败: ' + err);
          return;
      }

      if (sections == null || sections.length === 0) {
          player.tell('§c信标没有激活光束！');
          return;
      }

      if (isCoolingDown(level, 'beacon', block.pos, BEACON_CONFIG.beaconCooldownTicks)) return;

      console.log(`=== 信标光束实体扫描 ===`);
      console.log(`信标位置: (${block.x}, ${block.y}, ${block.z})`);
      console.log(`玩家: ${player.displayName.string}`);
      console.log(`光束部分数量: ${sections.length}`);

      let stats = { sections: 0, entities: 0, crafts: 0, signals: 0 };
      let scanIndex = 0;

      for (let index = 0; index < sections.length; index++) {
          if (index === 0) continue; // 跳过底层部分

          let beam = sections[index];
          let rgb = readBeamRGB(beam);
          let power = rgbToPower(rgb[0], rgb[1], rgb[2]);
          let normal = beam.dir.normal;
          let range = BEACON_CONFIG.beamRange;
          let startPos = block.pos.offset(beam.offset.x, beam.offset.y, beam.offset.z);
          let endPos = startPos.offset(normal.x * range, normal.y * range, normal.z * range);
          let beamAABB = AABB.ofBlocks(startPos, endPos);
          let isLast = index === sections.length - 1;

          scanIndex++;
          stats.sections++;

          Utils.server.scheduleInTicks(20 * scanIndex, () => {
              try {
                  if (BEACON_CONFIG.igniteEntities) {
                      let entities = level.getEntitiesWithin(beamAABB);
                      stats.entities += entities.length;
                      entities.forEach((entity) => {
                          entity.setSecondsOnFire(Math.min(power, BEACON_CONFIG.igniteSecondsMax));
                      });
                  }

                  // 逐格扫描光束段，避免遗漏段中间的刚玉簇
                  for (let step = 0; step < range; step++) {
                      let currentBlock = level.getBlock(
                          startPos.x + normal.x * step,
                          startPos.y + normal.y * step,
                          startPos.z + normal.z * step
                      );
                      if (!currentBlock.hasTag('rainbow:corundum_cluster')) continue;

                      let facing = null;
                      if (currentBlock.properties != null) facing = currentBlock.properties.facing;
                      if (facing == null || directionMap[facing] == null) continue;

                      let oppositePos = offsetPos(currentBlock.pos, directionMap[facing]);
                      if (oppositePos == null) continue;

                      let catalystBlock = level.getBlock(oppositePos.x, oppositePos.y, oppositePos.z);
                      let corundumColor = getCorundumColor(currentBlock.id);
                      let recipe = findRecipe(corundumColor, catalystBlock);

                      if (recipe != null) {
                          if (craftWithRecipe(level, player, recipe, catalystBlock)) stats.crafts++;
                          continue;
                      }

                      if (catalystBlock.id === 'minecraft:target') {
                          activateTarget(level, catalystBlock, power);
                          stats.signals++;
                      }
                  }
              } catch (err) {
                  console.log('[充能信标] 光束段处理异常: ' + err);
              }

              if (isLast) {
                  console.log(`=== 扫描总结 ===`);
                  console.log(`扫描光束部分: ${stats.sections}`);
                  console.log(`点火实体: ${stats.entities}`);
                  console.log(`配方合成: ${stats.crafts}`);
                  console.log(`靶子激活: ${stats.signals}`);
              }
          });
      }

      // 播放激活音效
      block.getPlayersInRadius(32).forEach(p => {
          Utils.server.runCommandSilent(
              `playsound minecraft:block.beacon.activate block ${p.displayName.string} ${block.x} ${block.y} ${block.z} 3 1`
          );
      });

      e.cancel();
  });
})();
