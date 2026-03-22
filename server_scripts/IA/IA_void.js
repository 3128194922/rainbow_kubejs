/*
  IA：虚空蠕虫传送门出入时，为体节施加虚空效果（不包含头部）

  背景机制（Alex's Mobs）：
  - alexsmobs:void_worm 的“体节”是独立实体 alexsmobs:void_worm_part
  - 虫头通过 getChild() 串起体节链，每个体节也有 getChild()
  - 体节在传送门流程中会倒计时 PortalTicks；当 PortalTicks == 5 时体节被传送到出口位置

  本脚本做的事：
  - 给 void_worm 添加一个常驻 Goal（每 tick 执行）
  - 遍历体节链；当检测到体节处于“出门瞬间”（PortalTicks==5）时给它添加 rainbow:void
  - 用体节的 persistentData 记录状态，保证同一次传送只触发一次，避免重复施加
*/

let IA_VOID = {
  worm: 'alexsmobs:void_worm',
  part: 'alexsmobs:void_worm_part',
  effect: 'rainbow:void',
  duration: typeof SecoundToTick == 'function' ? SecoundToTick(30) : 20 * 30,
  amplifier: 0,
  pdPrevPortalTicks: 'ia_void_prev_portal_ticks',
  pdApplied: 'ia_void_void_applied',
  maxParts: 128
}

EntityJSEvents.addGoalSelectors(IA_VOID.worm, event => {
  event.customGoal(
    'ia_portal_void_effect',
    0,
    mob => true,
    mob => true,
    true,
    mob => {},
    mob => {},
    true,
    mob => {
      if (!mob || !mob.level || mob.level.isClientSide()) return

      let part = null
      try {
        part = mob.getChild()
      } catch (e) {
        part = null
      }

      let i = 0
      while (part && i < IA_VOID.maxParts) {
        i++
        if (part.getType && part.getType() == IA_VOID.part) {
          let portalTicks = 0
          try {
            portalTicks = part.getPortalTicks()
          } catch (e) {
            portalTicks = 0
          }

          let pd = part.persistentData
          let prev = pd.getInt(IA_VOID.pdPrevPortalTicks)
          // prev==0 && portalTicks>0：认为本轮“刚开始进入/经过传送门”，重置“已施加”标记
          if (prev == 0 && portalTicks > 0) {
            pd.putBoolean(IA_VOID.pdApplied, false)
          }
          pd.putInt(IA_VOID.pdPrevPortalTicks, portalTicks)

          // portalTicks==5：体节刚从传送门出口落点“出现”的关键 tick
          if (portalTicks == 5 && !pd.getBoolean(IA_VOID.pdApplied)) {
            part.potionEffects.add(IA_VOID.effect, IA_VOID.duration, IA_VOID.amplifier, false, false)
            pd.putBoolean(IA_VOID.pdApplied, true)
          }
        }

        let next = null
        try {
          next = part.getChild()
        } catch (e) {
          next = null
        }
        part = next
      }
    }
  )
})
