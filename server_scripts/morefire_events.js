// Example event hooks. Keep or edit this file in the generated KubeJS folder.
MoreFireEvents.damage(event => {
  try {
    let entity = event.getEntity()
    let source = event.getDamageSource()
    if (entity == null || source == null) return
    if (!(entity instanceof LivingEntity)) {
      if (global.meltFreeze) global.meltFreeze(entity)
      return
    }

    // 已带火焰标签的伤害由 LivingHurtEvent 的 handleFreezeEffects 处理，
    // 这里只兜底未使用原版火焰类型的 MoreFire 自定义火焰。
    if (source.is(DamageTypeTags.IS_FIRE)) return

    let amount = event.getAmount()
    let electrified = ForgeRegistries.MOB_EFFECTS.getValue(
      new ResourceLocation('eeeabsmobs', 'electrified_effect')
    )

    if (amount > 0 && electrified != null && entity.hasEffect(electrified)) {
      // 感电目标：把这段 MoreFire 火伤转成原版 in_fire 重新结算，
      // 让 eeeabsmobs 的 #minecraft:is_fire 电火反应能够触发。
      event.cancelEvent()
      if (!entity.attack(entity.damageSources().inFire(), amount)) {
        // 火焰免疫等导致 in_fire 无法结算时，保留原 MoreFire 伤害。
        entity.attack(source, amount)
      }
      return
    }

    // 非感电目标：仍按 MoreFire 自定义伤害结算，但火焰要能融化冻结。
    if (global.meltFreeze) global.meltFreeze(entity)
  } catch (e) {
    console.log('[MoreFire] 自定义火焰兼容处理失败: ' + e)
  }
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
