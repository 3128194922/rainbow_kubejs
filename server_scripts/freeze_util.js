// priority: 100
// 冻结工具函数 — FreezableMob 统一由 server_scripts/CONST.js 提供。

// 冻结实体指定时间（tick），到期自动解冻
global.freezeEntityForTicks = function (entity, ticks) {
  if (!(entity instanceof FreezableMob)) return false
  if (entity.isDeadOrDying()) return false
  if (entity.tide$isFrozen()) return false
  entity.tide$setFrozen(true)
  entity.level.server.scheduleInTicks(ticks, function() {
    if (!entity.isDeadOrDying()) {
      entity.tide$setFrozen(false)
    }
  })
  return true
}

global.isFrozen = function (entity) {
  return entity instanceof FreezableMob && entity.tide$isFrozen()
}

global.freezeEntity = function (entity) {
  if (!(entity instanceof FreezableMob)) return false
  if (entity.isDeadOrDying()) return false
  if (entity.tide$isFrozen()) return false
  entity.tide$setFrozen(true)
  return true
}

global.unfreezeEntity = function (entity) {
  if (!(entity instanceof FreezableMob)) return false
  if (!entity.tide$isFrozen()) return false
  entity.tide$setFrozen(false)
  return true
}

global.toggleFreeze = function (entity) {
  if (!(entity instanceof FreezableMob)) return false
  if (entity.tide$isFrozen()) {
    entity.tide$setFrozen(false)
    return false
  } else {
    entity.tide$setFrozen(true)
    return true
  }
}

// 火焰融冰：有火焰伤害时削减冻结积累；已完全冻结则立即解冻并移除蓝冰 UV。
global.meltFreeze = function (entity) {
  if (!(entity instanceof FreezableMob)) return false
  if (entity.isDeadOrDying()) return false

  let changed = false
  let wasFrozen = entity.tide$isFrozen()
  let frozenTicks = entity.getTicksFrozen()

  if (wasFrozen) {
    entity.tide$setFrozen(false)
    entity.setTicksFrozen(0)
    changed = true
  } else if (frozenTicks > 0) {
    // 每次火焰命中融化约 2 秒的冻结积累，不直接清空高额冻结值。
    entity.setTicksFrozen(Math.max(0, frozenTicks - 40))
    changed = true
  }

  if (wasFrozen) {
    try {
      let server = entity.level.server
      if (server != null) {
        server.runCommandSilent('/dyeing uv remove ' + entity.uuid.toString() + ' freeze_ice')
      }
    } catch (e) {
      console.log('[冻结] 火焰融冰移除 UV 失败: ' + e)
    }
  }

  return changed
}

// 冰熄灭火：同时清理原版燃烧与 MoreFire 自定义火焰状态。
global.extinguishEntityFire = function (entity) {
  if (entity == null || entity.isDeadOrDying()) return false
  try {
    if (typeof MoreFire !== 'undefined' && MoreFire != null && MoreFire.clearFire != null) {
      MoreFire.clearFire(entity)
    }
  } catch (e) {
    console.log('[冻结] MoreFire 灭火失败: ' + e)
  }
  entity.setRemainingFireTicks(0)
  return true
}
