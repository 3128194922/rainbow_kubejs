// Example event hooks. Keep or edit this file in the generated KubeJS folder.
MoreFireEvents.damage(event => {
  // event.fireId, event.entity, event.level, event.pos, event.amount
})

MoreFireEvents.fireReplace(event => {
  // event.currentFireId, event.attemptedFireId, event.remainingFireTicks
  // event.setFireId('minecraft:soul_fire')
  // event.setFireTicks(200)
})

MoreFireEvents.fireExtinguish(event => {
  // event.fireId, event.entity, event.level, event.pos
  // event.cause: 'water', 'rain', 'expired', 'manual', 'removed', 'replaced'
  // event.isEntityFire, event.isBlockFire
})
