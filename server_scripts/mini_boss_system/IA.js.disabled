// priority: 0
// 迷你boss AI - 遍历所有已注册实体类型，尝试注册5种power Goal
// 非Mob类型会被EntityJS自动跳过（try-catch忽略）

function hasPower(entity, power) {
  if (!entity || !entity.isAlive()) return false
  let pd = entity.persistentData
  return pd.getBoolean('isMiniBoss') && pd.getBoolean('_mb_p_' + power)
}

// 读取词条等级（main.js 抽取时写入 _mb_lvl_<key>），旧数据或未存储时默认 1 级
function getPowerLevel(entity, power) {
  if (!entity || !entity.isAlive()) return 1
  let lvl = entity.persistentData.getInt('_mb_lvl_' + power)
  // 显式判断：未存储/为 0 时回退 1 级，保证旧存档 miniboss 兼容
  if (lvl <= 0) return 1
  return lvl
}

function getTarget(mob) {
  try { return mob.getTarget() } catch(e) { return null }
}

function findSafeSpawnPos(level, x, y, z) {
  for (let dy = -3; dy <= 3; dy++) {
    let by = Math.floor(y) + dy
    if (by < 0) continue
    let here = level.getBlock(x, by, z).blockState
    let above = level.getBlock(x, by + 1, z).blockState
    let below = level.getBlock(x, by - 1, z).blockState
    if (here.isAir() && above.isAir() && !below.isAir() && below.getFluidState().isEmpty()) {
      return { x: x + 0.5, y: by + 0.5, z: z + 0.5 }
    }
  }
  return null
}
//通用词条
ForgeRegistries.ENTITY_TYPES.getKeys().forEach(key => {
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
            // 等级影响回血量：每秒回血 1.0 × 等级（1级=1.0，5级=5.0）
            e.heal(1.0 * getPowerLevel(e, 'Regenerate'))
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

          // 等级影响援军数量：生成数量 = 援军等级（1级=1只，3级=3只）
          let count = getPowerLevel(e, 'Reinforce')
          for (let i = 0; i < count; i++) {
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
              if (other.getId() == e.getId()) return // 实体同一性用 getId() 原生 int 比较（== 会走 Rhino Java包装对象慢路径）
              if (other.getType() != e.getType()) return
              try {
                other.potionEffects.add('quark:resilience', 100, 0, false, true);
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
          // 等级影响挖掘速度：耗时 = 基础耗时 ÷ 等级（1级=12tick/硬度，2级减半）
          let bt = Math.max(10, Math.ceil((pd.getFloat('_mb_dig_hp') || 1) * DIG_BT)) / getPowerLevel(e, 'Dig')
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
          // 等级影响挖掘速度：耗时 = 基础耗时 ÷ 等级（1级=12tick/硬度，2级减半）
          let bt = Math.max(10, Math.ceil(hp * DIG_BT)) / getPowerLevel(e, 'Dig')
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
          try { e.removeEffect('minecraft:invisibility') } catch(er) { console.log(er) }
        },
        true,
        e => {
          try {
            if (!e.hasEffect(MobEffects.INVISIBILITY)) {
              e.potionEffects.add('minecraft:invisibility', 200, 0, false, false)
            }
          } catch(er) { console.log(er) }
        }
      )

      // ==================== 演化 (Evolve) - 女巫：随机扔更多负面药水 ====================
      // 演化女巫额外投掷的负面喷溅药水池（原版女巫 AI 之外补充）
      const WITCH_POTIONS = ['minecraft:slowness', 'minecraft:weakness', 'minecraft:poison', 'minecraft:strong_poison', 'minecraft:harming'];
      event.customGoal('mb_evolve_potion', 5,
        e => {
          if (!hasPower(e, 'Evolve') || e.getType() != 'minecraft:witch') return false;
          let t = getTarget(e);
          if (!t || !t.isAlive()) return false;
          let dx = t.x - e.x, dy = t.y - e.y, dz = t.z - e.z;
          return Math.sqrt(dx * dx + dy * dy + dz * dz) < 12;
        },
        e => {
          let t = getTarget(e);
          return t != null && t.isAlive();
        },
        true,
        e => { e.persistentData.putInt('_mb_evolve_pot_t', 0) },
        e => {},
        true,
        e => {
          let pd = e.persistentData
          let t = (pd.getInt('_mb_evolve_pot_t') || 0) + 1
          if (t < 200) { pd.putInt('_mb_evolve_pot_t', t); return }  // 基础 10 秒冷却
          pd.putInt('_mb_evolve_pot_t', 0)
          let target = getTarget(e)
          if (!target || !target.isAlive()) return
          try {
            let pot = e.level.createEntity('minecraft:potion')
            if (!pot) return
            // 随机负面喷溅药水（NBT 指定药水类型）
            let potionId = WITCH_POTIONS[Math.floor(Math.random() * WITCH_POTIONS.length)]
            pot.setItem(Item.of('minecraft:splash_potion', '{Potion:"' + potionId + '"}').item)
            pot.setPos(e.x, e.y + 1.2, e.z)
            // 抛射初速：指向目标并按距离抬升（参考原版女巫投掷）
            let dx = target.x - e.x, dy = (target.y + 0.3) - (e.y + 1.2), dz = target.z - e.z
            let dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
            if (dist < 0.1) dist = 0.1
            pot.setDeltaMovement(new Vec3(dx / dist * 0.7, dy / dist * 0.7 + dist * 0.045, dz / dist * 0.7))
            pot.spawn()
            try { e.level.playSound(null, e.x, e.y, e.z, 'minecraft:entity.witch.throw', 'hostile', 1.0, 1.0) } catch (er) {}
          } catch (er) {
            console.log('[MiniBoss 演化] 女巫扔药水失败: ' + er)
          }
        }
      )

      // ==================== 演化 (Evolve) - 蜘蛛：每15s在目标位置放蜘蛛网 ====================
      event.customGoal('mb_evolve_web', 5,
        e => {
          if (!hasPower(e, 'Evolve') || e.getType() != 'minecraft:spider') return false;
          let t = getTarget(e);
          return t != null && t.isAlive();
        },
        e => {
          let t = getTarget(e);
          return t != null && t.isAlive();
        },
        true,
        e => { e.persistentData.putInt('_mb_evolve_web_t', 0) },
        e => {},
        true,
        e => {
          let pd = e.persistentData
          let t = (pd.getInt('_mb_evolve_web_t') || 0) + 1
          if (t < 300) { pd.putInt('_mb_evolve_web_t', t); return }  // 15 秒
          pd.putInt('_mb_evolve_web_t', 0)
          let target = getTarget(e)
          if (!target || !target.isAlive()) return
          try {
            let pos = new BlockPos(Math.floor(target.x), Math.floor(target.y), Math.floor(target.z))
            // 仅在目标位置为空气时结网，避免卡进方块
            if (e.level.getBlockState(pos).isAir()) {
              e.level.setBlock(pos, Blocks.COBWEB.defaultBlockState())
              try { e.level.playSound(null, target.x, target.y, target.z, 'minecraft:block.wool.place', 'blocks', 0.8, 1.0) } catch (er) {}
            }
          } catch (er) {
            console.log('[MiniBoss 演化] 蜘蛛结网失败: ' + er)
          }
        }
      )

      // ==================== 演化 (Evolve) - 爬行者：远距离弹跳突进 ====================
      event.customGoal('mb_evolve_jump', 5,
        e => {
          if (!hasPower(e, 'Evolve') || e.getType() != 'minecraft:creeper') return false;
          let t = getTarget(e);
          if (!t || !t.isAlive()) return false;
          let dx = t.x - e.x, dy = t.y - e.y, dz = t.z - e.z;
          let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          // 距离较远（6~40格）且已落地时才会蓄力跳
          if (dist < 6 || dist > 40) return false;
          return e.onGround();
        },
        e => {
          let t = getTarget(e);
          return t != null && t.isAlive();
        },
        false,
        e => { e.persistentData.putInt('_mb_evolve_jump_t', 0) },
        e => {},
        true,
        e => {
          let pd = e.persistentData
          let t = (pd.getInt('_mb_evolve_jump_t') || 0) + 1
          pd.putInt('_mb_evolve_jump_t', t)
          if (t < 40 || !e.onGround()) return  // 2 秒冷却且须落地
          let target = getTarget(e)
          if (!target || !target.isAlive()) return
          let dx = target.x - e.x, dy = target.y - e.y, dz = target.z - e.z
          let dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist < 6) return
          try {
            // 弹跳加速度：水平速度随距离增大，固定上抛（重力约 0.08/tick，
            // 0.85 可跳约 4.5 格高，滞空约 21 tick，最远可突进 25 格左右）
            let speed = Math.min(1.4, 0.6 + dist * 0.04)
            e.setDeltaMovement(new Vec3(dx / dist * speed, 0.85, dz / dist * speed))
            pd.putInt('_mb_evolve_jump_t', 0)
            try { e.level.playSound(null, e.x, e.y, e.z, 'minecraft:entity.slime.jump', 'hostile', 0.8, 0.7) } catch (er) {}
          } catch (er) {
            console.log('[MiniBoss 演化] 爬行者弹跳失败: ' + er)
          }
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
