// priority: 0
// BackroomRoguelike 1.0.0 / KubeJS 6：本局追猎者入口；不恢复旧维度或接管模组结算。
const BACKROOM_HUNTERS = {
  debug: false, // 调试日志开关：true 输出运行过程，false 关闭；异常日志始终保留。
  dimension: 'backroomroguelike:backroom',
  entity: 'mutantmore:mutant_wither_skeleton',
  clock: 'run', // run：按本局真实时间；dimension：沿用旧版维度 tick 时钟。
  spawnTicks: 6000,
  raidTicks: 3600,
  raidMoveTicks: 20,
  peaceMoveTicks: 600,
  moveSpeed: 1.2,
  minDistance: 32,
  maxDistance: 40,
  spawnAttempts: 192,
  runMillis: 1200000,
  stateKey: 'rainbow_backroom_hunters',
  ownerKey: 'rainbow_backroom_hunter_owner',
  runKey: 'rainbow_backroom_hunter_run',
  warningSound: 'rainbow:voice.warning'
}

// 只保存日志限流信息；实体名额与计时状态全部保存在维度 NBT 中，支持 /reload。
const backroomHunterErrors = {}

// 运行日志统一由顶部 debug 控制，输出到 KubeJS 服务端日志；不改变原有异常限流。
function backroomHunterDebug(stage, detail) {
  if (!BACKROOM_HUNTERS.debug) return
  console.log('[后室追猎者][调试][' + stage + '] ' + detail)
}

function backroomHunterLog(key, error) {
  let now = Date.now()
  if (backroomHunterErrors[key] != null && now - backroomHunterErrors[key] < 60000) return
  backroomHunterErrors[key] = now
  console.log('[后室追猎者] ' + key + ': ' + error)
}

function backroomHunterState(level) {
  let data = level.persistentData
  if (!data.contains(BACKROOM_HUNTERS.stateKey)) data.put(BACKROOM_HUNTERS.stateKey, new CompoundTag())
  return data.getCompound(BACKROOM_HUNTERS.stateKey)
}

// 直接读取模组 SavedData，命令传送进维度但未开局的玩家不会触发追猎者。
function backroomHunterRun(level, player, now) {
  if (BackroomRunData == null || player == null || !player.isAlive() || player.isCreative() || player.isSpectator()) {
    backroomHunterDebug('跳过玩家', '玩家=' + (player == null ? '无在线玩家' : String(player.uuid)) + '，接口缺失或玩家死亡/创造/旁观')
    return null
  }
  if (String(player.getLevel().dimension) != BACKROOM_HUNTERS.dimension) {
    backroomHunterDebug('跳过玩家', '玩家=' + String(player.uuid) + '，不在后室维度')
    return null
  }
  let run = BackroomRunData.get(level).get(player.uuid)
  if (run == null) {
    backroomHunterDebug('跳过玩家', '玩家=' + String(player.uuid) + '，没有有效本局记录')
    return null
  }
  let enteredAt = Number(run.enteredAt())
  if (!Number.isFinite(enteredAt) || enteredAt <= 0 || now - enteredAt >= BACKROOM_HUNTERS.runMillis) {
    backroomHunterDebug('跳过玩家', '玩家=' + String(player.uuid) + '，本局计时异常或已超时，enteredAt=' + enteredAt + '，now=' + now)
    return null
  }
  return { id: String(run.enteredAt()), elapsedTicks: Math.max(0, Math.floor((now - enteredAt) / 50)) }
}

function backroomHunterRelease(root, entity) {
  let owner = entity.persistentData.getString(BACKROOM_HUNTERS.ownerKey)
  let state = root.getCompound(owner)
  if (state.getString('Entity') == String(entity.uuid) &&
      state.getString('Run') == entity.persistentData.getString(BACKROOM_HUNTERS.runKey)) {
    state.remove('Entity')
    backroomHunterDebug('释放名额', '玩家=' + owner + '，实体=' + String(entity.uuid))
  }
}

// 实体整个脚底必须有坚实支撑；先查区块，再查碰撞，避免生成检查触发同步区块加载。
function backroomHunterSafe(level, entity) {
  let box = entity.getBoundingBox()
  let minX = Math.floor(Number(box.minX))
  let maxX = Math.floor(Number(box.maxX) - 0.000001)
  let minZ = Math.floor(Number(box.minZ))
  let maxZ = Math.floor(Number(box.maxZ) - 0.000001)
  let feetY = Math.floor(Number(entity.y))
  if (feetY <= level.getMinBuildHeight() || Number(box.maxY) >= level.getMaxBuildHeight()) return false
  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      let support = new BlockPos(x, feetY - 1, z)
      if (!level.hasChunkAt(support)) return false
      let floor = level.getBlockState(support)
      if (!floor.getFluidState().isEmpty() || !floor.isFaceSturdy(level, support, Direction.UP)) return false
    }
  }
  return level.noCollision(entity, box) && !level.containsAnyLiquid(box)
}

function backroomHunterSpawn(level, player, run, state) {
  let entity = null
  try {
    backroomHunterDebug('开始生成', '玩家=' + String(player.uuid) + '，本局=' + run.id + '，实体类型=' + BACKROOM_HUNTERS.entity)
    if (!ForgeRegistries.ENTITY_TYPES.containsKey(new ResourceLocation(BACKROOM_HUNTERS.entity))) {
      backroomHunterLog('实体未注册', BACKROOM_HUNTERS.entity)
      return null
    }
    entity = level.createEntity(BACKROOM_HUNTERS.entity)
    if (entity == null) throw new Error('无法创建 ' + BACKROOM_HUNTERS.entity)
    let px = Number(player.x)
    let py = Math.floor(Number(player.y))
    let pz = Number(player.z)
    if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) throw new Error('玩家坐标不是有限数值')
    let offsets = [0, -1, 1, -2, 2]
    let placed = false
    for (let attempt = 0; attempt < BACKROOM_HUNTERS.spawnAttempts; attempt++) {
      // Rhino 不读取 Math.PI；随机环形采样有界，避免旧版逐块遍历固定角落。
      let angle = Math.random() * 6.283185307179586
      let radius = BACKROOM_HUNTERS.minDistance + Math.random() * (BACKROOM_HUNTERS.maxDistance - BACKROOM_HUNTERS.minDistance)
      let x = Math.floor(px + Math.cos(angle) * radius) + 0.5
      let z = Math.floor(pz + Math.sin(angle) * radius) + 0.5
      let distanceSq = (x - px) * (x - px) + (z - pz) * (z - pz)
      if (distanceSq < BACKROOM_HUNTERS.minDistance * BACKROOM_HUNTERS.minDistance ||
          distanceSq > BACKROOM_HUNTERS.maxDistance * BACKROOM_HUNTERS.maxDistance) continue
      entity.setPositionAndRotation(x, py + offsets[attempt % offsets.length], z, 0, 0)
      if (!backroomHunterSafe(level, entity)) continue
      placed = true
      backroomHunterDebug('安全生成点', '玩家=' + String(player.uuid) + '，尝试次数=' + (attempt + 1) + '，坐标=' + entity.x + ',' + entity.y + ',' + entity.z)
      break
    }
    if (!placed) {
      backroomHunterDebug('生成跳过', '玩家=' + String(player.uuid) + '，' + BACKROOM_HUNTERS.spawnAttempts + ' 次搜索未找到符合碰撞箱、支撑和区块加载条件的位置')
      backroomHunterLog('未找到安全生成点', String(player.uuid) + '，本周期跳过')
      entity.discard()
      return null
    }
    entity.persistentData.putString(BACKROOM_HUNTERS.ownerKey, String(player.uuid))
    entity.persistentData.putString(BACKROOM_HUNTERS.runKey, run.id)
    // createEntity/spawn 不会调用 finalizeSpawn；突变凋灵骷髅的双刀在此阶段初始化。
    let spawnBlock = new BlockPos(Math.floor(Number(entity.x)), Math.floor(Number(entity.y)), Math.floor(Number(entity.z)))
    ForgeEventFactory.onFinalizeSpawn(entity, level, level.getCurrentDifficultyAt(spawnBlock), MobSpawnType.EVENT, null, null)
    backroomHunterDebug('出生初始化', '实体=' + String(entity.uuid) + '，Forge 初始化已返回')
    if (!backroomHunterSafe(level, entity)) {
      backroomHunterDebug('生成跳过', '实体=' + String(entity.uuid) + '，出生初始化后二次安全检查未通过')
      entity.discard()
      return null
    }
    entity.setPersistenceRequired()
    // 在 spawn 前预留名额，实体入场事件才能确认该实体属于当前本局。
    state.putString('Entity', String(entity.uuid))
    entity.spawn()
    if (level.getEntity(UUID.fromString(String(entity.uuid))) == null) {
      backroomHunterDebug('生成拒绝', '玩家=' + String(player.uuid) + '，实体=' + String(entity.uuid) + '，入场后未能在维度中找到实体')
      state.remove('Entity')
      entity.discard()
      backroomHunterLog('生成被拒绝', String(player.uuid))
      return null
    }
    backroomHunterDebug('生成成功', '玩家=' + String(player.uuid) + '，实体=' + String(entity.uuid) + '，坐标=' + entity.x + ',' + entity.y + ',' + entity.z)
    player.tell('[后室] 追猎者已出现。')
    try {
      let soundId = new ResourceLocation(BACKROOM_HUNTERS.warningSound)
      if (ForgeRegistries.SOUND_EVENTS.containsKey(soundId)) {
        player.playNotifySound(ForgeRegistries.SOUND_EVENTS.getValue(soundId), SoundSource.PLAYERS, 1, 1)
      }
    } catch (soundError) { backroomHunterLog('警告音效', soundError) }
    return entity
  } catch (error) {
    // 尚未入场的实体也要释放，避免后续同局永久占位。
    if (entity != null) {
      if (state.getString('Entity') == String(entity.uuid)) state.remove('Entity')
      entity.discard()
    }
    backroomHunterLog('生成失败', error)
    return null
  }
}

function backroomHunterTick(level) {
  let tick = Number(level.getTime())
  if (!Number.isFinite(tick) || tick % 20 != 0) return
  let now = Date.now()
  // 每 20 tick 一次的心跳，帮助区分“事件未运行”和“仍在等待生成周期”。
  backroomHunterDebug('维度运行', 'tick=' + tick + '，now=' + now + '，计时模式=' + BACKROOM_HUNTERS.clock)
  let root = backroomHunterState(level)
  let owners = {}
  let loaded = {}
  for (let player of level.players) {
    try {
      let run = backroomHunterRun(level, player, now)
      if (run == null) continue
      let owner = String(player.uuid)
      let state = root.getCompound(owner)
      if (state.getString('Run') != run.id) {
        state = new CompoundTag()
        state.putString('Run', run.id)
        root.put(owner, state)
        backroomHunterDebug('建立本局状态', '玩家=' + owner + '，本局=' + run.id)
      }
      owners[owner] = { player: player, run: run, state: state }
    } catch (error) { backroomHunterLog('读取本局', error) }
  }
  // 仅扫描一次已加载实体；不把“未加载”当成“死亡”，离线/失效本局仅清理本功能实体。
  for (let entity of level.entities) {
    try {
      let owner = entity.persistentData.getString(BACKROOM_HUNTERS.ownerKey)
      if (owner == '') continue
      let info = owners[owner]
      if (info == null || entity.persistentData.getString(BACKROOM_HUNTERS.runKey) != info.run.id) {
        backroomHunterDebug('清理实体', '玩家=' + owner + '，实体=' + String(entity.uuid) + '，所有者无有效在线本局或实体属于旧本局')
        backroomHunterRelease(root, entity)
        entity.discard()
        continue
      }
      if (!entity.isAlive()) {
        backroomHunterRelease(root, entity)
        continue // 保留原生死亡动画及掉落流程。
      }
      let id = String(entity.uuid)
      let reserved = info.state.getString('Entity')
      if (reserved == '') info.state.putString('Entity', id)
      else if (reserved != id) {
        backroomHunterDebug('清理重复实体', '玩家=' + owner + '，实体=' + id + '，保留名额=' + reserved)
        entity.discard()
        continue
      }
      loaded[id] = entity
    } catch (error) { backroomHunterLog('实体恢复与清理', error) }
  }
  // getAllKeys 是 Java 的实时视图；先复制再删，避免 ConcurrentModificationException。
  // 离线玩家仍可能有有效本局；保留 SpawnCycle，防止重连把同一个周期重复结算。
  let expired = []
  for (let key of root.getAllKeys()) {
    if (owners[String(key)] != null) continue
    let run = BackroomRunData.get(level).get(UUID.fromString(String(key)))
    if (run == null || String(run.enteredAt()) != root.getCompound(key).getString('Run') ||
        now - Number(run.enteredAt()) >= BACKROOM_HUNTERS.runMillis) expired.push(String(key))
  }
  for (let key of expired) {
    root.remove(key)
    backroomHunterDebug('清理本局状态', '玩家=' + key + '，本局失效、已更换或超时')
  }
  for (let owner in owners) {
    try {
      let info = owners[owner]
      let state = info.state
      let elapsed = BACKROOM_HUNTERS.clock == 'dimension' ? tick : info.run.elapsedTicks
      let cycle = Math.floor(elapsed / BACKROOM_HUNTERS.spawnTicks)
      let raid = elapsed % BACKROOM_HUNTERS.spawnTicks < BACKROOM_HUNTERS.raidTicks
      let entity = loaded[state.getString('Entity')]
      backroomHunterDebug('玩家计时', '玩家=' + owner + '，本局=' + info.run.id + '，已过tick=' + elapsed + '，当前周期=' + cycle + '，已处理周期=' + state.getInt('SpawnCycle') + '，阶段=' + (raid ? '袭击' : '平静') + '，实体名额=' + state.getString('Entity') + '，已加载=' + (entity != null))
      let phaseChanged = !state.contains('Raid') || state.getBoolean('Raid') != raid
      if (phaseChanged) {
        backroomHunterDebug('阶段切换', '玩家=' + owner + '，阶段=' + (raid ? '袭击' : '平静'))
        state.putBoolean('Raid', raid)
        info.player.tell(raid ? '[后室] 袭击开始，追猎者将进入高频追击。' : '[后室] 袭击结束，追猎者进入低频追踪。')
        if (!raid && entity != null) { entity.setTarget(null); entity.getNavigation().stop() }
        state.putLong('NextMove', tick)
      }
      if (cycle > state.getInt('SpawnCycle')) {
        backroomHunterDebug('生成周期检查', '玩家=' + owner + '，周期=' + cycle + '，实体名额=' + state.getString('Entity'))
        state.putInt('SpawnCycle', cycle)
        if (state.getString('Entity') == '') {
          entity = backroomHunterSpawn(level, info.player, info.run, state)
          if (entity != null) state.putLong('NextMove', tick)
        } else {
          backroomHunterDebug('跳过生成', '玩家=' + owner + '，已有实体名额（未加载仍占用），实体=' + state.getString('Entity'))
        }
      }
      if (entity != null && tick >= Number(state.getLong('NextMove'))) {
        // 保留突变凋灵骷髅原生攻击 AI，仅按阶段更新导航；平静期仍可能近距离战斗。
        let navigationResult = entity.getNavigation().moveTo(info.player, BACKROOM_HUNTERS.moveSpeed)
        // 返回 true 只表示导航请求被接受，不能据此判断实际移动或攻击命中。
        backroomHunterDebug('寻路更新', '玩家=' + owner + '，实体=' + String(entity.uuid) + '，目标=' + info.player.x + ',' + info.player.y + ',' + info.player.z + '，速度=' + BACKROOM_HUNTERS.moveSpeed + '，返回=' + navigationResult)
        state.putLong('NextMove', tick + (raid ? BACKROOM_HUNTERS.raidMoveTicks : BACKROOM_HUNTERS.peaceMoveTicks))
      }
    } catch (error) { backroomHunterLog('玩家追踪 ' + owner, error) }
  }
}

LevelEvents.tick(BACKROOM_HUNTERS.dimension, event => {
  try {
    if (event.level.isClientSide()) return
    if (BackroomRunData == null) { backroomHunterLog('接口缺失', '未安装支持 BackroomRunData 的 BackroomRoguelike'); return }
    backroomHunterTick(event.level)
  } catch (error) { backroomHunterLog('维度 tick', error) }
})

// KubeJS 6 spawned 同时覆盖新生成与存档重新加载；cancel 必须放在 try/catch 外。
EntityEvents.spawned(BACKROOM_HUNTERS.entity, event => {
  let reject = false
  try {
    let entity = event.entity
    let level = event.level
    if (level.isClientSide() || entity.persistentData.getString(BACKROOM_HUNTERS.ownerKey) == '') return
    let owner = entity.persistentData.getString(BACKROOM_HUNTERS.ownerKey)
    let player = level.getServer().getPlayerList().getPlayer(UUID.fromString(owner))
    let run = String(level.dimension) == BACKROOM_HUNTERS.dimension ? backroomHunterRun(level, player, Date.now()) : null
    let state = backroomHunterState(level).getCompound(owner)
    reject = run == null || entity.persistentData.getString(BACKROOM_HUNTERS.runKey) != run.id ||
      state.getString('Run') != run.id || state.getString('Entity') != String(entity.uuid)
    if (reject) backroomHunterRelease(backroomHunterState(level), entity)
    backroomHunterDebug('入场验证', '玩家=' + owner + '，实体=' + String(entity.uuid) + '，结果=' + (reject ? '拒绝：本局或名额不匹配' : '允许'))
  } catch (error) { backroomHunterLog('入场验证', error); reject = true }
  if (reject) event.cancel()
})

// 死亡事件可被其他模组取消；一 tick 后确认死亡，且只释放同一局、同一实体的名额。
EntityEvents.death(BACKROOM_HUNTERS.entity, event => {
  try {
    let entity = event.entity
    let level = entity.getLevel()
    if (level.isClientSide() || entity.persistentData.getString(BACKROOM_HUNTERS.ownerKey) == '') return
    backroomHunterDebug('收到死亡事件', '实体=' + String(entity.uuid) + '，等待一 tick 确认')
    level.getServer().scheduleInTicks(1, () => {
      try {
        if (!entity.isAlive()) backroomHunterRelease(backroomHunterState(level), entity)
        backroomHunterDebug('死亡确认', '实体=' + String(entity.uuid) + '，仍存活=' + entity.isAlive())
      } catch (error) { backroomHunterLog('死亡确认', error) }
    })
  } catch (error) { backroomHunterLog('死亡事件', error) }
})

PlayerEvents.loggedOut(event => {
  try {
    let player = event.player
    let level = player.getLevel()
    if (String(level.dimension) != BACKROOM_HUNTERS.dimension) return
    let owner = String(player.uuid)
    backroomHunterDebug('离线清理', '玩家=' + owner + '，清理实体并保留本局生成周期')
    for (let entity of level.entities) {
      if (entity.persistentData.getString(BACKROOM_HUNTERS.ownerKey) == owner) {
        backroomHunterDebug('离线移除实体', '玩家=' + owner + '，实体=' + String(entity.uuid))
        entity.discard()
      }
    }
    // 清理实体和占位，保留当前本局的周期，避免重连提前触发新的生成检查。
    backroomHunterState(level).getCompound(owner).remove('Entity')
  } catch (error) { backroomHunterLog('离线清理', error) }
})

// /reload 后可通过此行确认调试开关和当前脚本配置已经生效。
backroomHunterDebug('脚本加载', '维度=' + BACKROOM_HUNTERS.dimension + '，计时模式=' + BACKROOM_HUNTERS.clock + '，生成间隔tick=' + BACKROOM_HUNTERS.spawnTicks)
