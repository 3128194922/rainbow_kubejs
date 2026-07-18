// priority: 100
// 冻结工具函数 — 通过 Java.loadClass 调用 Tide 的 FreezableMob 接口

const $FreezableMob = Java.loadClass('com.li64.tide.data.FreezableMob')

global.isFrozen = function (entity) {
  return entity instanceof $FreezableMob && entity.tide$isFrozen()
}

global.freezeEntity = function (entity) {
  if (!(entity instanceof $FreezableMob)) return false
  if (entity.isDeadOrDying()) return false
  if (entity.tide$isFrozen()) return false
  entity.tide$setFrozen(true)
  return true
}

global.unfreezeEntity = function (entity) {
  if (!(entity instanceof $FreezableMob)) return false
  if (!entity.tide$isFrozen()) return false
  entity.tide$setFrozen(false)
  return true
}

global.toggleFreeze = function (entity) {
  if (!(entity instanceof $FreezableMob)) return false
  if (entity.tide$isFrozen()) {
    entity.tide$setFrozen(false)
    return false
  } else {
    entity.tide$setFrozen(true)
    return true
  }
}
