// priority: 0

let mutantId = 'mutantmore:mutant_wither_skeleton'

// 每 5 分钟尝试生成一次
let spawnInterval = 6000

// 袭击期间追踪周期
let moveInterval = 20

// 非袭击期间追踪周期
let peaceMoveInterval = 600

// 袭击间隔：每 5 分钟触发一次袭击
let raidInterval = 6000

// 袭击持续时间：持续 3 分钟
let raidDuration = 3600

// 生成距离范围
let spawnMinDistance = 32
let spawnMaxDistance = 40

// AI 寻路速度
let moveSpeed = 1.2

// 单个玩家最多对应多少只
let maxMutantsPerPlayer = 1

// 玩家UUID -> { entityUUIDs: [], count: 0 }
let trackedMutantsByPlayer = {}

// 记录上一 tick 是否处于袭击中，用于判定袭击开始/结束
let raidActiveLastTick = false

LevelEvents.tick('backroom:backroom', event => {
  let level = event.level
  let tick = Number(level.time)
  let playerList = level.players

  if (!Number.isFinite(tick)) return

  // 当前维度没人时：清除后室内所有追猎者，并清空记录
  if (playerList.size() <= 0) {
    let removedMutants = 0

    for (let entity of level.entities) {
      if (String(entity.type) == mutantId) {
        try {
          entity.discard()
          removedMutants++
        } catch (e) {
          try {
            entity.kill()
            removedMutants++
          } catch (e2) {
          }
        }
      }
    }

    for (let playerId in trackedMutantsByPlayer) {
      delete trackedMutantsByPlayer[playerId]
    }

    raidActiveLastTick = false

    if (removedMutants > 0) {
      console.log(`[KubeJS] 后室无玩家，已清除追猎者 ${removedMutants} 个`)
    }

    return
  }

  let currentPlayers = {}
  for (let player of playerList) {
    currentPlayers[String(player.uuid)] = true
  }

  for (let playerId in trackedMutantsByPlayer) {
    if (!currentPlayers[playerId]) {
      delete trackedMutantsByPlayer[playerId]
    }
  }

  let raidActive = (tick % raidInterval) < raidDuration

  if (raidActive && !raidActiveLastTick) {
    for (let player of playerList) {
      //player.tell(Text.of('[后室] 袭击开始，追猎者将进入高频追击'))
    }
  }

  if (!raidActive && raidActiveLastTick) {
    for (let player of playerList) {
      //player.tell(Text.of('[后室] 袭击结束，追猎者进入低频追踪'))
    }

    for (let player of playerList) {
      let playerId = String(player.uuid)

      if (!trackedMutantsByPlayer[playerId]) continue

      let track = trackedMutantsByPlayer[playerId]
      let validUUIDs = []

      for (let uuid of track.entityUUIDs) {
        let found = null

        for (let entity of level.entities) {
          if (String(entity.uuid) == uuid) {
            found = entity
            break
          }
        }

        if (found == null || !found.isAlive()) {
          continue
        }

        try {
          found.setTarget(null)
        } catch (e) {
        }

        try {
          found.getNavigation().stop()
        } catch (e) {
        }

        validUUIDs.push(uuid)
      }

      track.entityUUIDs = validUUIDs
      track.count = validUUIDs.length
    }
  }

  raidActiveLastTick = raidActive

  if (tick % spawnInterval == 0) {
    for (let player of playerList) {
      let playerId = String(player.uuid)

      //player.tell(Text.of('[后室] 开始检查追猎者生成'))

      if (!trackedMutantsByPlayer[playerId]) {
        trackedMutantsByPlayer[playerId] = {
          entityUUIDs: [],
          count: 0
        }
      }

      let track = trackedMutantsByPlayer[playerId]
      let validUUIDs = []
      let removedCount = 0

      for (let uuid of track.entityUUIDs) {
        let found = null

        for (let entity of level.entities) {
          if (String(entity.uuid) == uuid) {
            found = entity
            break
          }
        }

        if (found != null && found.isAlive()) {
          validUUIDs.push(uuid)
        } else {
          removedCount++
        }
      }

      track.entityUUIDs = validUUIDs
      track.count = validUUIDs.length

      //player.tell(Text.of(`[后室] 当前有效追猎者数量: ${track.count}/${maxMutantsPerPlayer}`))

      if (removedCount > 0) {
        //player.tell(Text.of(`[后室] 已清理失效追猎者: ${removedCount} 个`))
      }

      if (track.count >= maxMutantsPerPlayer) {
        //player.tell(Text.of('[后室] 已达到追猎者数量上限，本次不会继续生成'))
        continue
      }

      let px = Number(player.x)
      let py = Math.floor(Number(player.y))
      let pz = Number(player.z)

      if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) {
        //player.tell(Text.of('[后室] 玩家坐标异常，无法生成追猎者'))
        continue
      }

      //player.tell(Text.of(`[后室] 开始搜索安全生成点，搜索Y=${py}`))

      let spawnPos = null

      for (let r = spawnMinDistance; r <= spawnMaxDistance; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dz = -r; dz <= r; dz++) {
            if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue

            let bx = Math.floor(px) + dx
            let by = py
            let bz = Math.floor(pz) + dz

            if (!Number.isFinite(bx) || !Number.isFinite(by) || !Number.isFinite(bz)) {
              continue
            }

            let minY = Number(level.minBuildHeight)
            let maxY = Number(level.maxBuildHeight)

            if (!Number.isFinite(minY)) minY = -64
            if (!Number.isFinite(maxY)) maxY = 320

            if (by <= minY + 1) continue
            if (by >= maxY - 1) continue

            let feetState = level.getBlock(bx, by, bz).blockState
            let headState = level.getBlock(bx, by + 1, bz).blockState
            let floorState = level.getBlock(bx, by - 1, bz).blockState

            let safe =
              feetState.isAir() &&
              headState.isAir() &&
              !floorState.isAir() &&
              floorState.getFluidState().isEmpty() &&
              floorState.blocksMotion()

            if (safe) {
              spawnPos = {
                x: bx + 0.5,
                y: by,
                z: bz + 0.5
              }
              break
            }
          }

          if (spawnPos != null) break
        }

        if (spawnPos != null) break
      }

      if (spawnPos == null) {
        //player.tell(Text.of(`[后室] 在 ${spawnMinDistance}-${spawnMaxDistance} 格内未找到安全生成点`))
        continue
      }

      //player.tell(Text.of(`[后室] 已找到安全生成点: ${spawnPos.x}, ${spawnPos.y}, ${spawnPos.z}`))

      let mutant = level.createEntity(mutantId)
      if (mutant == null) {
        //player.tell(Text.of('[后室] 创建追猎者实体失败'))
        console.log(`[KubeJS] 创建实体失败: ${mutantId}`)
        continue
      }

      mutant.setPositionAndRotation(spawnPos.x, spawnPos.y, spawnPos.z, 0, 0)
      level.playSound(null, player.x, player.y, player.z,"rainbow:voice.warning","voice", 1, 1)
      mutant.spawn()

      try {
        //mutant.setTarget(player)
        mutant.getNavigation().moveTo(player, moveSpeed)

        if (raidActive) {
          ////player.tell(Text.of('[后室] 已为新追猎者下发袭击期AI追踪任务'))
        } else {
          ////player.tell(Text.of('[后室] 已为新追猎者下发非袭击期AI追踪任务'))
        }
      } catch (e) {
        //player.tell(Text.of('[后室] 新生成的追猎者不支持AI寻路接口'))
      }

      track.entityUUIDs.push(String(mutant.uuid))
      track.count = track.entityUUIDs.length

      //player.tell(Text.of(`[后室] 追猎者已生成，当前数量: ${track.count}/${maxMutantsPerPlayer}`))
      console.log(`[KubeJS] 为玩家 ${player.name.string} 生成 ${mutantId}，当前数量 ${track.count}`)
    }
  }

  let shouldUpdateTrack = false
  let currentTrackInterval = raidActive ? moveInterval : peaceMoveInterval

  if (tick % currentTrackInterval == 0) {
    shouldUpdateTrack = true
  }

  if (shouldUpdateTrack) {
    for (let player of playerList) {
      let playerId = String(player.uuid)

      if (!trackedMutantsByPlayer[playerId]) {
        trackedMutantsByPlayer[playerId] = {
          entityUUIDs: [],
          count: 0
        }
      }

      let track = trackedMutantsByPlayer[playerId]

      // 追猎者数量为0时，不执行AI追踪
      if (track.count <= 0 || track.entityUUIDs.length <= 0) {
        continue
      }

      if (raidActive) {
        //player.tell(Text.of('[后室] 开始更新袭击期追猎者AI追踪'))
      } else {
        //player.tell(Text.of('[后室] 开始更新非袭击期追猎者AI追踪'))
      }

      let validUUIDs = []
      let removedCount = 0

      for (let uuid of track.entityUUIDs) {
        let found = null

        for (let entity of level.entities) {
          if (String(entity.uuid) == uuid) {
            found = entity
            break
          }
        }

        if (found == null || !found.isAlive()) {
          removedCount++
          continue
        }

        try {
          //found.setTarget(player)
          found.getNavigation().moveTo(player, moveSpeed)
          validUUIDs.push(uuid)
        } catch (e) {
          //player.tell(Text.of(`[后室] 追猎者AI调用失败: ${uuid}`))
        }
      }

      track.entityUUIDs = validUUIDs
      track.count = validUUIDs.length

      // 清理后如果数量归零，则不继续执行提示和日志
      if (track.count <= 0 || track.entityUUIDs.length <= 0) {
        continue
      }

      if (removedCount > 0) {
        //player.tell(Text.of(`[后室] 已移除失效追猎者: ${removedCount} 个`))
      }

      if (raidActive) {
        //player.tell(Text.of(`[后室] 袭击期追猎者AI追踪已更新，当前有效数量: ${track.count}`))
      } else {
        //player.tell(Text.of(`[后室] 非袭击期追猎者AI追踪已更新，当前有效数量: ${track.count}`))
      }

      console.log(`[KubeJS] 更新玩家 ${player.name.string} 的追踪实体AI，当前有效数量 ${track.count}，raid=${raidActive}`)
    }
  }
})

/**
 * // priority: 0

// 可生成的追杀者实体列表
let mutantIds = [
  'mutantmore:mutant_wither_skeleton',
  'minecraft:zombie',
  'minecraft:husk',
  'minecraft:stray'
]

// 每 5 分钟尝试生成一次
let spawnInterval = 6000

// 每次生成波次，单个玩家尝试生成几个追杀者
let spawnCountPerWave = 2

// 袭击期间追踪周期
let moveInterval = 20

// 非袭击期间追踪周期
let peaceMoveInterval = 600

// 袭击间隔：每 5 分钟触发一次袭击
let raidInterval = 6000

// 袭击持续时间：持续 3 分钟
let raidDuration = 3600

// 生成距离范围
let spawnMinDistance = 32
let spawnMaxDistance = 40

// AI 寻路速度
let moveSpeed = 1.2

// 单个玩家最多对应多少只
let maxMutantsPerPlayer = 3

// 玩家UUID -> { entityUUIDs: [], count: 0 }
let trackedMutantsByPlayer = {}

// 记录上一 tick 是否处于袭击中，用于判定袭击开始/结束
let raidActiveLastTick = false

LevelEvents.tick('backroom:backroom', event => {
  let level = event.level
  let tick = Number(level.time)
  let playerList = level.players

  if (!Number.isFinite(tick)) return

  // 当前维度没人时：清除后室内所有追杀者，并清空记录
  if (playerList.size() <= 0) {
    let removedMutants = 0

    for (let entity of level.entities) {
      if (mutantIds.indexOf(String(entity.type)) >= 0) {
        try {
          entity.discard()
          removedMutants++
        } catch (e) {
          try {
            entity.kill()
            removedMutants++
          } catch (e2) {
          }
        }
      }
    }

    for (let playerId in trackedMutantsByPlayer) {
      delete trackedMutantsByPlayer[playerId]
    }

    raidActiveLastTick = false

    if (removedMutants > 0) {
      console.log(`[KubeJS] 后室无玩家，已清除追杀者 ${removedMutants} 个`)
    }

    return
  }

  let currentPlayers = {}
  for (let player of playerList) {
    currentPlayers[String(player.uuid)] = true
  }

  for (let playerId in trackedMutantsByPlayer) {
    if (!currentPlayers[playerId]) {
      delete trackedMutantsByPlayer[playerId]
    }
  }

  let raidActive = (tick % raidInterval) < raidDuration

  if (raidActive && !raidActiveLastTick) {
    for (let player of playerList) {
      //player.tell(Text.of('[后室] 袭击开始，多种追杀者将进入高频追击'))
    }
  }

  if (!raidActive && raidActiveLastTick) {
    for (let player of playerList) {
      //player.tell(Text.of('[后室] 袭击结束，追杀者进入低频追踪'))
    }

    for (let player of playerList) {
      let playerId = String(player.uuid)

      if (!trackedMutantsByPlayer[playerId]) continue

      let track = trackedMutantsByPlayer[playerId]
      let validUUIDs = []

      for (let uuid of track.entityUUIDs) {
        let found = null

        for (let entity of level.entities) {
          if (String(entity.uuid) == uuid) {
            found = entity
            break
          }
        }

        if (found == null || !found.isAlive()) {
          continue
        }

        try {
          found.setTarget(null)
        } catch (e) {
        }

        try {
          found.getNavigation().stop()
        } catch (e) {
        }

        validUUIDs.push(uuid)
      }

      track.entityUUIDs = validUUIDs
      track.count = validUUIDs.length
    }
  }

  raidActiveLastTick = raidActive

  if (tick % spawnInterval == 0) {
    for (let player of playerList) {
      let playerId = String(player.uuid)

      //player.tell(Text.of('[后室] 开始检查多种追杀者生成'))

      if (!trackedMutantsByPlayer[playerId]) {
        trackedMutantsByPlayer[playerId] = {
          entityUUIDs: [],
          count: 0
        }
      }

      let track = trackedMutantsByPlayer[playerId]
      let validUUIDs = []
      let removedCount = 0

      for (let uuid of track.entityUUIDs) {
        let found = null

        for (let entity of level.entities) {
          if (String(entity.uuid) == uuid) {
            found = entity
            break
          }
        }

        if (found != null && found.isAlive()) {
          validUUIDs.push(uuid)
        } else {
          removedCount++
        }
      }

      track.entityUUIDs = validUUIDs
      track.count = validUUIDs.length

      //player.tell(Text.of(`[后室] 当前有效追杀者数量: ${track.count}/${maxMutantsPerPlayer}`))

      if (removedCount > 0) {
        //player.tell(Text.of(`[后室] 已清理失效追杀者: ${removedCount} 个`))
      }

      if (track.count >= maxMutantsPerPlayer) {
        //player.tell(Text.of('[后室] 已达到追杀者数量上限，本次不会继续生成'))
        continue
      }

      let px = Number(player.x)
      let py = Math.floor(Number(player.y))
      let pz = Number(player.z)

      if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) {
        //player.tell(Text.of('[后室] 玩家坐标异常，无法生成追杀者'))
        continue
      }

      //player.tell(Text.of(`[后室] 开始搜索安全生成点，搜索Y=${py}`))

      for (let waveIndex = 0; waveIndex < spawnCountPerWave; waveIndex++) {
        if (track.count >= maxMutantsPerPlayer) {
          break
        }

        let spawnPos = null

        for (let r = spawnMinDistance; r <= spawnMaxDistance; r++) {
          for (let dx = -r; dx <= r; dx++) {
            for (let dz = -r; dz <= r; dz++) {
              if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue

              let bx = Math.floor(px) + dx
              let by = py
              let bz = Math.floor(pz) + dz

              if (!Number.isFinite(bx) || !Number.isFinite(by) || !Number.isFinite(bz)) {
                continue
              }

              let minY = Number(level.minBuildHeight)
              let maxY = Number(level.maxBuildHeight)

              if (!Number.isFinite(minY)) minY = -64
              if (!Number.isFinite(maxY)) maxY = 320

              if (by <= minY + 1) continue
              if (by >= maxY - 1) continue

              let feetState = level.getBlock(bx, by, bz).blockState
              let headState = level.getBlock(bx, by + 1, bz).blockState
              let floorState = level.getBlock(bx, by - 1, bz).blockState

              let safe =
                feetState.isAir() &&
                headState.isAir() &&
                !floorState.isAir() &&
                floorState.getFluidState().isEmpty() &&
                floorState.blocksMotion()

              if (safe) {
                spawnPos = {
                  x: bx + 0.5,
                  y: by,
                  z: bz + 0.5
                }
                break
              }
            }

            if (spawnPos != null) break
          }

          if (spawnPos != null) break
        }

        if (spawnPos == null) {
          //player.tell(Text.of(`[后室] 第 ${waveIndex + 1} 个追杀者未找到安全生成点`))
          continue
        }

        let randomIndex = Math.floor(Math.random() * mutantIds.length)
        let mutantId = mutantIds[randomIndex]

        //player.tell(Text.of(`[后室] 已找到安全生成点，准备生成: ${mutantId}`))

        let mutant = level.createEntity(mutantId)
        if (mutant == null) {
          //player.tell(Text.of(`[后室] 创建追杀者实体失败: ${mutantId}`))
          console.log(`[KubeJS] 创建实体失败: ${mutantId}`)
          continue
        }

        mutant.setPositionAndRotation(spawnPos.x, spawnPos.y, spawnPos.z, 0, 0)
        mutant.spawn()

        try {
          mutant.getNavigation().moveTo(player, moveSpeed)

          if (raidActive) {
            //player.tell(Text.of(`[后室] 已为新追杀者下发袭击期AI追踪任务: ${mutantId}`))
          } else {
            //player.tell(Text.of(`[后室] 已为新追杀者下发非袭击期AI追踪任务: ${mutantId}`))
          }
        } catch (e) {
          //player.tell(Text.of(`[后室] 新生成的追杀者不支持AI寻路接口: ${mutantId}`))
        }

        track.entityUUIDs.push(String(mutant.uuid))
        track.count = track.entityUUIDs.length

        //player.tell(Text.of(`[后室] 已生成追杀者 ${mutantId}，当前数量: ${track.count}/${maxMutantsPerPlayer}`))
        console.log(`[KubeJS] 为玩家 ${player.name.string} 生成 ${mutantId}，当前数量 ${track.count}`)
      }
    }
  }

  let shouldUpdateTrack = false
  let currentTrackInterval = raidActive ? moveInterval : peaceMoveInterval

  if (tick % currentTrackInterval == 0) {
    shouldUpdateTrack = true
  }

  if (shouldUpdateTrack) {
    for (let player of playerList) {
      let playerId = String(player.uuid)

      if (!trackedMutantsByPlayer[playerId]) {
        trackedMutantsByPlayer[playerId] = {
          entityUUIDs: [],
          count: 0
        }
      }

      let track = trackedMutantsByPlayer[playerId]

      if (track.count <= 0 || track.entityUUIDs.length <= 0) {
        continue
      }

      if (raidActive) {
        //player.tell(Text.of('[后室] 开始更新袭击期追杀者AI追踪'))
      } else {
        //player.tell(Text.of('[后室] 开始更新非袭击期追杀者AI追踪'))
      }

      let validUUIDs = []
      let removedCount = 0

      for (let uuid of track.entityUUIDs) {
        let found = null

        for (let entity of level.entities) {
          if (String(entity.uuid) == uuid) {
            found = entity
            break
          }
        }

        if (found == null || !found.isAlive()) {
          removedCount++
          continue
        }

        try {
          found.setTarget(player)
        } catch (e) {
        }

        try {
          found.getNavigation().moveTo(player, moveSpeed)
          validUUIDs.push(uuid)
        } catch (e) {
          //player.tell(Text.of(`[后室] 追杀者AI调用失败: ${uuid}`))
        }
      }

      track.entityUUIDs = validUUIDs
      track.count = validUUIDs.length

      if (track.count <= 0 || track.entityUUIDs.length <= 0) {
        continue
      }

      if (removedCount > 0) {
        //player.tell(Text.of(`[后室] 已移除失效追杀者: ${removedCount} 个`))
      }

      if (raidActive) {
        //player.tell(Text.of(`[后室] 袭击期追杀者AI追踪已更新，当前有效数量: ${track.count}`))
      } else {
        //player.tell(Text.of(`[后室] 非袭击期追杀者AI追踪已更新，当前有效数量: ${track.count}`))
      }

      console.log(`[KubeJS] 更新玩家 ${player.name.string} 的追杀者AI，当前有效数量 ${track.count}，raid=${raidActive}`)
    }
  }
})
 */