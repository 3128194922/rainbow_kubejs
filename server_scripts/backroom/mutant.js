// priority: 0

let mutantId = 'mutantmore:mutant_wither_skeleton'
let spawnInterval = 6000
let moveInterval = 20
let peaceMoveInterval = 600
let raidInterval = 6000
let raidDuration = 3600
let spawnMinDistance = 32
let spawnMaxDistance = 40
let moveSpeed = 1.2
let maxMutantsPerPlayer = 1

let trackedMutantsByPlayer = {}
let raidActiveLastTick = false

function findEntityByUUID(level, uuid) {
  for (let entity of level.entities) {
    if (String(entity.uuid) == uuid) return entity
  }
  return null
}

function cleanupInvalidMutants(level, track) {
  let validUUIDs = []
  let removedCount = 0
  for (let uuid of track.entityUUIDs) {
    let entity = findEntityByUUID(level, uuid)
    if (entity != null && entity.isAlive()) {
      validUUIDs.push(uuid)
    } else {
      removedCount++
    }
  }
  track.entityUUIDs = validUUIDs
  return removedCount
}

function findSpawnPosition(level, px, py, pz) {
  let minY = Number(level.minBuildHeight)
  let maxY = Number(level.maxBuildHeight)
  if (!Number.isFinite(minY)) minY = -64
  if (!Number.isFinite(maxY)) maxY = 320

  for (let r = spawnMinDistance; r <= spawnMaxDistance; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue

        let bx = Math.floor(px) + dx
        let by = py
        let bz = Math.floor(pz) + dz

        if (by <= minY + 1 || by >= maxY - 1) continue

        let feetState = level.getBlock(bx, by, bz).blockState
        let headState = level.getBlock(bx, by + 1, bz).blockState
        let floorState = level.getBlock(bx, by - 1, bz).blockState

        if (feetState.isAir() && headState.isAir() &&
            !floorState.isAir() && floorState.getFluidState().isEmpty() &&
            floorState.blocksMotion()) {
          return { x: bx + 0.5, y: by, z: bz + 0.5 }
        }
      }
    }
  }
  return null
}

LevelEvents.tick('backroom:backroom', event => {
  let level = event.level
  let tick = Number(level.time)
  let playerList = level.players

  if (!Number.isFinite(tick)) return

  // 无玩家时清除所有追猎者
  if (playerList.size() <= 0) {
    let removedMutants = 0
    for (let entity of level.entities) {
      if (String(entity.type) == mutantId) {
        try { entity.discard(); removedMutants++ } catch (e) {
          try { entity.kill(); removedMutants++ } catch (e2) {}
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

  // 清理已离线玩家的记录
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

  // 袭击开始通知
  if (raidActive && !raidActiveLastTick) {
    for (let player of playerList) {
      player.tell(Text.of('[后室] 袭击开始，追猎者将进入高频追击'))
    }
  }

  // 袭击结束：清除所有追猎者目标并停止导航
  if (!raidActive && raidActiveLastTick) {
    for (let player of playerList) {
      player.tell(Text.of('[后室] 袭击结束，追猎者进入低频追踪'))
    }
    for (let player of playerList) {
      let track = trackedMutantsByPlayer[String(player.uuid)]
      if (!track) continue

      cleanupInvalidMutants(level, track)
      for (let uuid of track.entityUUIDs) {
        let entity = findEntityByUUID(level, uuid)
        if (entity == null) continue
        try { entity.setTarget(null) } catch (e) {}
        try { entity.getNavigation().stop() } catch (e) {}
      }
    }
  }

  raidActiveLastTick = raidActive

  // 定时生成追猎者
  if (tick % spawnInterval == 0) {
    for (let player of playerList) {
      let playerId = String(player.uuid)

      player.tell(Text.of('[后室] 开始检查追猎者生成'))

      if (!trackedMutantsByPlayer[playerId]) {
        trackedMutantsByPlayer[playerId] = { entityUUIDs: [] }
      }

      let track = trackedMutantsByPlayer[playerId]
      let removedCount = cleanupInvalidMutants(level, track)

      player.tell(Text.of(`[后室] 当前有效追猎者数量: ${track.entityUUIDs.length}/${maxMutantsPerPlayer}`))

      if (removedCount > 0) {
        player.tell(Text.of(`[后室] 已清理失效追猎者: ${removedCount} 个`))
      }

      if (track.entityUUIDs.length >= maxMutantsPerPlayer) {
        player.tell(Text.of('[后室] 已达到追猎者数量上限，本次不会继续生成'))
        continue
      }

      let px = Number(player.x)
      let py = Math.floor(Number(player.y))
      let pz = Number(player.z)

      if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz)) {
        player.tell(Text.of('[后室] 玩家坐标异常，无法生成追猎者'))
        continue
      }

      player.tell(Text.of(`[后室] 开始搜索安全生成点，搜索Y=${py}`))

      let spawnPos = findSpawnPosition(level, px, py, pz)

      if (spawnPos == null) {
        player.tell(Text.of(`[后室] 在 ${spawnMinDistance}-${spawnMaxDistance} 格内未找到安全生成点`))
        continue
      }

      player.tell(Text.of(`[后室] 已找到安全生成点: ${spawnPos.x}, ${spawnPos.y}, ${spawnPos.z}`))

      let mutant = level.createEntity(mutantId)
      if (mutant == null) {
        player.tell(Text.of('[后室] 创建追猎者实体失败'))
        console.log(`[KubeJS] 创建实体失败: ${mutantId}`)
        continue
      }

      mutant.setPositionAndRotation(spawnPos.x, spawnPos.y, spawnPos.z, 0, 0)
      level.playSound(null, player.x, player.y, player.z, "rainbow:voice.warning", "voice", 1, 1)
      mutant.spawn()

      try {
        mutant.getNavigation().moveTo(player, moveSpeed)
      } catch (e) {
        player.tell(Text.of('[后室] 新生成的追猎者不支持AI寻路接口'))
      }

      track.entityUUIDs.push(String(mutant.uuid))

      player.tell(Text.of(`[后室] 追猎者已生成，当前数量: ${track.entityUUIDs.length}/${maxMutantsPerPlayer}`))
      console.log(`[KubeJS] 为玩家 ${player.name.string} 生成 ${mutantId}，当前数量 ${track.entityUUIDs.length}`)
    }
  }

  // 定时更新AI追踪
  let trackInterval = raidActive ? moveInterval : peaceMoveInterval
  if (tick % trackInterval == 0) {
    for (let player of playerList) {
      let playerId = String(player.uuid)

      if (!trackedMutantsByPlayer[playerId]) {
        trackedMutantsByPlayer[playerId] = { entityUUIDs: [] }
      }

      let track = trackedMutantsByPlayer[playerId]

      if (track.entityUUIDs.length <= 0) continue

      if (raidActive) {
        player.tell(Text.of('[后室] 开始更新袭击期追猎者AI追踪'))
      } else {
        player.tell(Text.of('[后室] 开始更新非袭击期追猎者AI追踪'))
      }

      let validUUIDs = []
      let removedCount = 0

      for (let uuid of track.entityUUIDs) {
        let entity = findEntityByUUID(level, uuid)
        if (entity == null || !entity.isAlive()) {
          removedCount++
          continue
        }
        try {
          entity.getNavigation().moveTo(player, moveSpeed)
          validUUIDs.push(uuid)
        } catch (e) {
          player.tell(Text.of(`[后室] 追猎者AI调用失败: ${uuid}`))
        }
      }

      track.entityUUIDs = validUUIDs

      if (track.entityUUIDs.length <= 0) continue

      if (removedCount > 0) {
        player.tell(Text.of(`[后室] 已移除失效追猎者: ${removedCount} 个`))
      }

      if (raidActive) {
        player.tell(Text.of(`[后室] 袭击期追猎者AI追踪已更新，当前有效数量: ${track.entityUUIDs.length}`))
      } else {
        player.tell(Text.of(`[后室] 非袭击期追猎者AI追踪已更新，当前有效数量: ${track.entityUUIDs.length}`))
      }

      console.log(`[KubeJS] 更新玩家 ${player.name.string} 的追踪实体AI，当前有效数量 ${track.entityUUIDs.length}，raid=${raidActive}`)
    }
  }
})
