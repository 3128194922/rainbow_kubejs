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
  // 诊断日志：排查 rainbow:soul_flame 方块火自动熄灭原因（cause 区分 水/雨/过期/手动/移除/替换），确认根因后可移除
  try {
    if (event.isBlockFire && event.fireId == 'rainbow:soul_flame') {
      let pos = event.pos;
      console.log('[魂火诊断] 方块魂火熄灭: cause=' + event.cause
        + ' 位置=' + (pos == null ? 'null' : (pos.getX() + ',' + pos.getY() + ',' + pos.getZ())));
    }
  } catch (e) {
    console.log('[魂火诊断] 输出熄灭信息失败: ' + e);
  }
})
