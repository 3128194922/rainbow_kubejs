// priority: 0
// 迷你boss AI - 遍历所有已注册实体类型，尝试注册5种power Goal
// 非Mob类型会被EntityJS自动跳过（try-catch忽略）


function hasPower(entity, power) {
  if (!entity || !entity.isAlive()) return false
  let pd = entity.persistentData
  return pd.getBoolean('isMiniBoss') && pd.getBoolean('_mb_p_' + power)
}

function getTarget(mob) {
  try { return mob.getTarget() } catch(e) { return null }
}

function findSafeSpawnPos(level, x, y, z) {
  for (let dy = -3; dy <= 3; dy++) {
    let by = Math.floor(y) + dy
    if (by < 0) continue
    let here = level.getBlock(x, by, z)
    let above = level.getBlock(x, by + 1, z)
    let below = level.getBlock(x, by - 1, z)
    if (here.isAir() && above.isAir() && !below.isAir() && !below.liquid) {
      return { x: x + 0.5, y: by + 0.5, z: z + 0.5 }
    }
  }
  return null
}
//通用词条
$ForgeRegistries.ENTITY_TYPES.getKeys().forEach(key => {
  let id = key.toString()
  try {
    EntityJSEvents.addGoalSelectors(id, event => {

      // ==================== 自愈 (Regenerate) ====================
      event.customGoal('mb_regen', 0,
        e => hasPower(e, 'Regenerate') && e.getHealth() < e.getMaxHealth(),
        e => hasPower(e, 'Regenerate') && e.getHealth() < e.getMaxHealth(),
        false,
        e => { e.persistentData.putInt('_mb_regen_t', 0) },
        e => {},
        true,
        e => {
          let pd = e.persistentData
          let t = (pd.getInt('_mb_regen_t') || 0) + 1
          if (t >= 20) {
            e.heal(2.0)
            t = 0
          }
          pd.putInt('_mb_regen_t', t)
        }
      )

      // ==================== 援军 (Reinforce) ====================
      event.customGoal('mb_reinforce', 1,
        e => {
          if (!hasPower(e, 'Reinforce')) return false
          if (e.persistentData.getBoolean('_mb_reinforce_called')) return false
          if (e.persistentData.getBoolean('_mb_reinforce_spawned')) return false
        let target = getTarget(e)
        return target != null && target.isAlive()
        },
        e => false,
        false,
        e => {
          e.persistentData.putBoolean('_mb_reinforce_called', true)
          let level = e.level
          let target = getTarget(e)

          let rawType = e.getType()

          for (let i = 0; i < 3; i++) {

            let spawn = level.createEntity(rawType)
            if (!spawn) { console.log(`Reinforce: createEntity returned null for ${rawType}`); continue }
            spawn.persistentData.putBoolean('_mb_reinforce_spawned', true)
            spawn.setPos(e.x, e.y + 1, e.z)
            spawn.spawn()
            console.log(`Reinforce: spawned ${rawType} at ${e.x},${e.y + 1},${e.z}`)

            if (target && target.isAlive()) {
              try { spawn.setTarget(target) } catch(er) { console.log(er) }
            }
          }

          try { level.playSound(null, e.x, e.y, e.z, 'entity.warden.roar', 'hostile', 1.0, 1.0) } catch(er) { console.log(er) }
        },
        e => {},
        false,
        e => {}
      )

      // ==================== 领袖 (Leader) ====================
      event.customGoal('mb_leader', 2,
        e => hasPower(e, 'Leader'),
        e => hasPower(e, 'Leader'),
        true,
        e => {},
        e => {},
        true,
        e => {
          let pd = e.persistentData
          let t = (pd.getInt('_mb_leader_t') || 0) + 1
          if (t >= 40) {
            e.level.getEntitiesWithin(e.boundingBox.inflate(16)).forEach(other => {
              if (!other || !other.isAlive()) return
              if (other == e) return
              if (other.getType() != e.getType()) return
              try { other.potionEffects.add('quark:resilience', 100, 0, false, true);
              other.potionEffects.add('minecraft:speed', 100, 0, false, true)

               } catch(er) { console.log(er) }
            })
            t = 0
          }
          pd.putInt('_mb_leader_t', t)
        }
      )

      // ==================== 挖掘 (Dig) - EnhancedAI式持续挖掘 ====================
      let DIG_BT = 12
      let DIG_STUCK_TICKS = 60

      function digScan(e, t) {
        let lv = e.level
        let x1 = e.x, y1 = e.y + 1, z1 = e.z
        let x2 = t.x, y2 = t.y + 1, z2 = t.z
        let steps = Math.max(1, Math.min(24, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), Math.abs(z2 - z1)))))
        let found = null, foundD = 999999, foundHp = 0
        for (let i = 1; i <= steps; i++) {
          let p = i / steps
          let bx = Math.floor(x1 + (x2 - x1) * p)
          let by = Math.floor(y1 + (y2 - y1) * p)
          let bz = Math.floor(z1 + (z2 - z1) * p)
          let state = lv.getBlockState(new BlockPos(bx, by, bz))
          if (!state.isAir()) {
            try {
              let hp = state.getDestroySpeed(lv, new BlockPos(bx, by, bz))
              let dd = (bx - x1)*(bx - x1) + (by - y1)*(by - y1) + (bz - z1)*(bz - z1)
              if (hp >= 0 && hp < 50 && dd < foundD) { found = new BlockPos(bx, by, bz); foundD = dd; foundHp = hp }
            } catch(er) {}
          }
        }
        return found ? {x: found.x, y: found.y, z: found.z, hp: foundHp} : null
      }

      event.customGoal('mb_dig_v3', 3,
        e => {
          if (!hasPower(e, 'Dig')) return false
          let t = getTarget(e)
          if (!t || !t.isAlive()) return false

          let nav = e.navigation
          if (nav && !nav.isDone()) {
            let pd = e.persistentData
            let lx = pd.getDouble('_mb_dig_lx')
            if (lx != 0) {
              let dx = e.x - lx, dy = e.y - pd.getDouble('_mb_dig_ly'), dz = e.z - pd.getDouble('_mb_dig_lz')
              if (dx*dx + dy*dy + dz*dz < 2.25) {
                let st = (pd.getInt('_mb_dig_st') || 0) + 1
                pd.putInt('_mb_dig_st', st)
                if (st < DIG_STUCK_TICKS) return false
              } else {
                pd.putInt('_mb_dig_st', 0)
              }
            }
            pd.putDouble('_mb_dig_lx', e.x)
            pd.putDouble('_mb_dig_ly', e.y)
            pd.putDouble('_mb_dig_lz', e.z)
          }

          let found = digScan(e, t)
          if (!found) return false
          let pd = e.persistentData
          pd.putInt('_mb_dig_tx', found.x)
          pd.putInt('_mb_dig_ty', found.y)
          pd.putInt('_mb_dig_tz', found.z)
          pd.putFloat('_mb_dig_hp', found.hp)
          return true
        },
        e => {
          let pd = e.persistentData
          let tx = pd.getInt('_mb_dig_tx')
          if (tx == 0) return false
          let pos = new BlockPos(tx, pd.getInt('_mb_dig_ty'), pd.getInt('_mb_dig_tz'))
          let state = e.level.getBlockState(pos)
          if (state.isAir()) return false
          let prog = pd.getInt('_mb_dig_progress') || 0
          let bt = Math.max(10, Math.ceil((pd.getFloat('_mb_dig_hp') || 1) * DIG_BT))
          return prog < bt
        },
        false,
        e => { e.persistentData.putInt('_mb_dig_progress', 0) },
        e => {
          let pd = e.persistentData
          let tx = pd.getInt('_mb_dig_tx')
          if (tx != 0) {
            e.level.destroyBlockProgress(e.getId(), new BlockPos(tx, pd.getInt('_mb_dig_ty'), pd.getInt('_mb_dig_tz')), -1)
          }
          pd.putInt('_mb_dig_tx', 0)
          pd.putInt('_mb_dig_progress', 0)
          pd.putInt('_mb_dig_st', 0)
        },
        true,
        e => {
          let pd = e.persistentData
          let tx = pd.getInt('_mb_dig_tx')
          if (tx == 0) return
          let pos = new BlockPos(tx, pd.getInt('_mb_dig_ty'), pd.getInt('_mb_dig_tz'))
          let state = e.level.getBlockState(pos)
          if (state.isAir()) { pd.putInt('_mb_dig_tx', 0); return }

          let hp = pd.getFloat('_mb_dig_hp') || 1
          let bt = Math.max(10, Math.ceil(hp * DIG_BT))
          let prog = (pd.getInt('_mb_dig_progress') || 0) + 1
          pd.putInt('_mb_dig_progress', prog)

          try { e.getLookControl().setLookAt(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5) } catch(er) {}

          if (prog % 5 == 0) {
            let stage = Math.min(9, Math.floor(prog / bt * 10))
            e.level.destroyBlockProgress(e.getId(), pos, stage)
            try { e.level.playSound(null, e.x, e.y, e.z, 'minecraft:block.stone.break', 'blocks', 0.5, 1.0) } catch(er) {}
          }

          if (prog >= bt) {
            e.level.destroyBlock(pos, true)
            e.level.destroyBlockProgress(e.getId(), pos, -1)
            let t = getTarget(e)
            if (t && t.isAlive()) {
              let next = digScan(e, t)
              if (next) {
                pd.putInt('_mb_dig_tx', next.x)
                pd.putInt('_mb_dig_ty', next.y)
                pd.putInt('_mb_dig_tz', next.z)
                pd.putFloat('_mb_dig_hp', next.hp)
                pd.putInt('_mb_dig_progress', 0)
                return
              }
            }
            pd.putInt('_mb_dig_tx', 0)
          }
        }
      )

      // ==================== 隐匿 (Stealth) ====================
      event.customGoal('mb_stealth', 4,
        e => {
          if (!hasPower(e, 'Stealth')) return false
          let target = getTarget(e)
          return target == null || !target.isAlive()
        },
        e => {
          let target = getTarget(e)
          return target == null || !target.isAlive()
        },
        true,
        e => {
          e.persistentData.putBoolean('_mb_stealth', true)
        },
        e => {
          e.persistentData.putBoolean('_mb_stealth', false)
          try { e.potionEffects.remove('minecraft:invisibility') } catch(er) { console.log(er) }
        },
        true,
        e => {
          try {
            if (!e.hasEffect($Effects.INVISIBILITY)) {
              e.potionEffects.add('minecraft:invisibility', 200, 0, false, false)
            }
          } catch(er) { console.log(er) }
        }
      )

    })
  } catch (err) {
    console.log(err)
  }
})
//特殊词条
/*EntityJSEvents.addGoalSelectors(id, event => {
  
})
  */