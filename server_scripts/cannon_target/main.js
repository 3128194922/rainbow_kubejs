// priority: 1000
// ==========================================
// 🎯 CBC 炮击标定器
// ==========================================
// 绑定 CBC 炮台底座后投掷目标实体，目标实体停止移动时立即调整炮台并开火。

const CANNON_TARGETER_ITEM = 'rainbow:cannon_targeter'
const CANNON_TARGET_MARKER = 'rainbow:cannon_target_marker'
const CANNON_TARGET_TTL = 200
const CANNON_TARGET_SPEED = 1.6
const CANNON_TARGET_PI = 3.141592653589793
const CANNON_TARGET_RAD_TO_DEG = 180 / CANNON_TARGET_PI
const CANNON_MOUNT_ID = 'createbigcannons:cannon_mount'
const CANNON_FIXED_MOUNT_ID = 'createbigcannons:fixed_cannon_mount'

function cannonTargetWrapDegrees(angle) {
    let result = Number(angle)
    while (result > 180) result -= 360
    while (result <= -180) result += 360
    return result
}

function cannonTargetPhysicalAngles(sx, sy, sz, tx, ty, tz, fallbackYaw) {
    let dx = Number(tx) - Number(sx)
    let dy = Number(ty) - Number(sy)
    let dz = Number(tz) - Number(sz)
    let horizontal = Math.sqrt(dx * dx + dz * dz)
    let yaw = horizontal < 0.000001 ? Number(fallbackYaw) : Math.atan2(-dx, dz) * CANNON_TARGET_RAD_TO_DEG
    if (yaw < 0) yaw += 360
    let pitch = Math.atan2(dy, horizontal) * CANNON_TARGET_RAD_TO_DEG
    return { yaw: yaw, pitch: pitch }
}

function cannonTargetVerticalMountAngles(physicalYaw, physicalPitch, inverted, maximumDepression, maximumElevation) {
    let verticalSign = inverted == true ? -1 : 1
    let internalYaw = Number(physicalYaw) + (inverted == true ? 0 : 180)
    internalYaw = internalYaw % 360
    if (internalYaw < 0) internalYaw += 360

    let internalPitch = verticalSign * 90 - Number(physicalPitch)
    let minPitch = -Math.abs(Number(maximumDepression))
    let maxPitch = Math.abs(Number(maximumElevation))
    if (internalPitch < minPitch) internalPitch = minPitch
    if (internalPitch > maxPitch) internalPitch = maxPitch
    return { yaw: internalYaw, pitch: internalPitch }
}

function cannonTargetFixedMountAdjustments(physicalYaw, physicalPitch, baseYaw, sign) {
    let yawAdjustment = cannonTargetWrapDegrees(Number(physicalYaw) - Number(baseYaw))
    let pitchAdjustment = Number(physicalPitch) * Number(sign)
    let clipped = false
    if (yawAdjustment < -45) {
        yawAdjustment = -45
        clipped = true
    }
    if (yawAdjustment > 45) {
        yawAdjustment = 45
        clipped = true
    }
    if (pitchAdjustment < -45) {
        pitchAdjustment = -45
        clipped = true
    }
    if (pitchAdjustment > 45) {
        pitchAdjustment = 45
        clipped = true
    }
    return {
        yawAdjustment: yawAdjustment,
        pitchAdjustment: pitchAdjustment,
        clipped: clipped
    }
}

// 纯数学接口供本地测试使用；不依赖 KubeJS 或 Minecraft 对象。
global.cannonTargetMath = {
    wrapDegrees: cannonTargetWrapDegrees,
    physicalAngles: cannonTargetPhysicalAngles,
    verticalMountAngles: cannonTargetVerticalMountAngles,
    fixedMountAdjustments: cannonTargetFixedMountAdjustments
}

function cannonTargetDimensionId(level) {
    try {
        let dimension = level.dimension
        if (dimension != null && typeof dimension.location == 'function') {
            return String(dimension.location())
        }
        let value = String(dimension)
        let separator = value.lastIndexOf(' / ')
        if (value.indexOf('ResourceKey[') == 0 && separator >= 0) {
            value = value.substring(separator + 3)
            if (value.endsWith(']')) value = value.substring(0, value.length - 1)
        }
        return value
    } catch (e) {
        console.log('[CannonTarget] 获取维度 ID 失败: ' + e)
        return ''
    }
}

function cannonTargetGetLevel(server, dimensionId) {
    try {
        let targetLevel = server.getLevel(String(dimensionId))
        if (targetLevel != null) return targetLevel
    } catch (e) {
        console.log('[CannonTarget] 直接查找维度失败: ' + e)
    }

    try {
        let keyId = String(dimensionId)
        let key = ResourceKey.create(Registries.DIMENSION, new ResourceLocation(keyId))
        return server.getLevel(key)
    } catch (e) {
        console.log('[CannonTarget] ResourceKey 查找维度失败: ' + e)
        return null
    }
}

function cannonTargetReadBinding(item) {
    try {
        let nbt = item.getNbt()
        if (nbt == null || !nbt.contains('cannonTargetDimension')) return null
        return {
            dimension: nbt.getString('cannonTargetDimension'),
            x: nbt.getInt('cannonTargetX'),
            y: nbt.getInt('cannonTargetY'),
            z: nbt.getInt('cannonTargetZ'),
            mount: nbt.getString('cannonTargetMount')
        }
    } catch (e) {
        console.log('[CannonTarget] 读取绑定数据失败: ' + e)
        return null
    }
}

function cannonTargetGetBoundCannon(server, binding) {
    try {
        if (binding == null || binding.dimension == '') return null
        let targetLevel = cannonTargetGetLevel(server, binding.dimension)
        if (targetLevel == null) return null
        let targetPos = new BlockPos(binding.x, binding.y, binding.z)
        if (!targetLevel.isLoaded(targetPos)) return null
        let block = targetLevel.getBlock(targetPos)
        if (block == null || block.id != binding.mount) return null
        if (block.entity == null) return null
        return { level: targetLevel, pos: targetPos, block: block, entity: block.entity }
    } catch (e) {
        console.log('[CannonTarget] 获取绑定炮台失败: ' + e)
        return null
    }
}

function cannonTargetOrientationSign(contraption) {
    try {
        let direction = contraption.getInitialOrientation()
        let axisDirection = String(direction.getAxisDirection())
        let axis = String(direction.getAxis())
        return (axisDirection == 'POSITIVE') == (axis == 'X') ? 1 : -1
    } catch (e) {
        console.log('[CannonTarget] 获取炮管方向符号失败: ' + e)
        return 1
    }
}

function cannonTargetSyncContraptionRotation(contraption, entityPitch, internalYaw) {
    try {
        contraption.pitch = Number(entityPitch)
        contraption.yaw = Number(internalYaw)
        contraption.setXRot(Number(entityPitch))
        contraption.setYRot(Number(internalYaw))
        contraption.xRotO = contraption.getXRot()
        contraption.yRotO = contraption.getYRot()
    } catch (e) {
        console.log('[CannonTarget] 同步炮体旋转失败: ' + e)
    }
}

function cannonTargetPlayerEntity(player) {
    if (player == null) return null
    try {
        if (player.minecraftEntity != null) return player.minecraftEntity
    } catch (e) {
        console.log('[CannonTarget] 获取原生玩家对象失败: ' + e)
    }
    return player
}

function cannonTargetApplyAim(bound, marker, owner) {
    try {
        let block = bound.block
        let mount = bound.entity
        let contraption = mount.getContraption()
        if (contraption == null) return { ok: false, message: '§c火炮底座尚未组装火炮。' }

        let baseX = bound.pos.getX() + 0.5
        let baseY = bound.pos.getY()
        let baseZ = bound.pos.getZ() + 0.5
        let physical = cannonTargetPhysicalAngles(
            baseX, baseY, baseZ,
            marker.getX(), marker.getY(), marker.getZ(),
            Number(mount.getContraptionDirection().toYRot())
        )
        let orientationSign = cannonTargetOrientationSign(contraption)
        let internalYaw = 0
        let entityPitch = 0
        let clipped = false

        if (block.id == CANNON_FIXED_MOUNT_ID) {
            let direction = mount.getContraptionDirection()
            if (direction == null) direction = Direction.NORTH
            let baseYaw = Number(direction.toYRot())
            let adjustments = cannonTargetFixedMountAdjustments(
                physical.yaw, physical.pitch, baseYaw, orientationSign
            )
            let clipTag = new CompoundTag()
            clipTag.putInt('Pitch', Math.round(adjustments.pitchAdjustment))
            clipTag.putInt('Yaw', Math.round(adjustments.yawAdjustment))
            mount.readFromClipboard(clipTag, cannonTargetPlayerEntity(owner), Direction.NORTH, false)
            internalYaw = baseYaw + adjustments.yawAdjustment
            entityPitch = adjustments.pitchAdjustment
            clipped = adjustments.clipped
        } else {
            let inverted = false
            try {
                let verticalDirection = block.blockState.getValue(BlockStateProperties.VERTICAL_DIRECTION)
                inverted = verticalDirection != null && String(verticalDirection) == 'up'
            } catch (e) {
                console.log('[CannonTarget] 读取炮台上下方向失败: ' + e)
            }
            let maximumDepression = 90
            let maximumElevation = 90
            try {
                maximumDepression = Number(contraption.maximumDepression())
                maximumElevation = Number(contraption.maximumElevation())
                if (!isFinite(maximumDepression) || maximumDepression < 0) maximumDepression = 90
                if (!isFinite(maximumElevation) || maximumElevation < 0) maximumElevation = 90
            } catch (e) {
                console.log('[CannonTarget] 读取炮台射界失败: ' + e)
            }
            let angles = cannonTargetVerticalMountAngles(
                physical.yaw, physical.pitch, inverted, maximumDepression, maximumElevation
            )
            mount.setYaw(angles.yaw)
            mount.setPitch(angles.pitch)
            internalYaw = angles.yaw
            entityPitch = angles.pitch * orientationSign
        }

        cannonTargetSyncContraptionRotation(contraption, entityPitch, internalYaw)
        mount.setChanged()
        bound.level.sendBlockUpdated(block.pos, block.blockState, block.blockState, 3)
        contraption.tryFiringShot()
        return {
            ok: true,
            clipped: clipped,
            yaw: physical.yaw,
            pitch: physical.pitch
        }
    } catch (e) {
        console.log('[CannonTarget] 瞄准或开火失败: ' + e)
        return { ok: false, message: '§c火炮瞄准或开火失败，请查看服务器日志。' }
    }
}

function cannonTargetUuid(entity) {
    try {
        if (entity.uuid != null) return String(entity.uuid)
    } catch (e) {
        console.log('[CannonTarget] 读取实体 UUID 属性失败: ' + e)
    }
    try {
        return String(entity.getUUID())
    } catch (e) {
        console.log('[CannonTarget] 读取实体 UUID 方法失败: ' + e)
        return ''
    }
}

function cannonTargetGetOwner(marker) {
    try {
        let data = marker.getPersistentData()
        let ownerId = data.getString('cannonTargetOwner')
        if (ownerId == '') return null
        let server = marker.getLevel().getServer()
        return server.getPlayerList().getPlayer(UUID.fromString(ownerId))
    } catch (e) {
        console.log('[CannonTarget] 获取目标实体主人失败: ' + e)
        return null
    }
}

function cannonTargetTellOwner(marker, message) {
    try {
        let owner = cannonTargetGetOwner(marker)
        if (owner == null) return
        try {
            owner.tell(message)
            return
        } catch (e) {
            console.log('[CannonTarget] 原生玩家 tell 调用失败: ' + e)
        }
        owner.sendSystemMessage(Component.literal(message))
    } catch (e) {
        console.log('[CannonTarget] 向玩家发送炮击反馈失败: ' + e)
    }
}

function cannonTargetHasEntityCollision(marker) {
    try {
        let data = marker.getPersistentData()
        let ownerId = data.getString('cannonTargetOwner')
        let entities = marker.getLevel().getEntitiesWithin(marker.getBoundingBox().inflate(0.12))
        for (let i = 0; i < entities.length; i++) {
            let other = entities[i]
            if (other == null || other.getId() == marker.getId()) continue
            if (cannonTargetUuid(other) == ownerId) continue
            if (other.isAlive()) return true
        }
    } catch (e) {
        console.log('[CannonTarget] 检查目标实体碰撞失败: ' + e)
    }
    return false
}

function cannonTargetHasStopped(marker) {
    try {
        if (marker.onGround()) return true
    } catch (e) {
        console.log('[CannonTarget] 检查目标落地状态失败: ' + e)
    }
    try {
        if (marker.horizontalCollision || marker.verticalCollision) return true
    } catch (e) {
        console.log('[CannonTarget] 检查目标方块碰撞失败: ' + e)
    }
    return cannonTargetHasEntityCollision(marker)
}

function cannonTargetResolveMarker(marker) {
    try {
        let data = marker.getPersistentData()
        let binding = {
            dimension: data.getString('cannonTargetDimension'),
            x: data.getInt('cannonTargetX'),
            y: data.getInt('cannonTargetY'),
            z: data.getInt('cannonTargetZ'),
            mount: data.getString('cannonTargetMount')
        }
        let bound = cannonTargetGetBoundCannon(marker.getLevel().getServer(), binding)
        if (bound == null) {
            cannonTargetTellOwner(marker, '§c绑定的 CBC 炮台不存在、未加载或类型已改变。')
            return
        }
        let result = cannonTargetApplyAim(bound, marker, cannonTargetGetOwner(marker))
        if (!result.ok) {
            cannonTargetTellOwner(marker, result.message)
            return
        }
        let clipText = result.clipped ? '（固定底座超出 ±45°，已截断）' : ''
        cannonTargetTellOwner(marker, '§aCBC 炮台已瞄准并开火！方向角 ' + result.yaw.toFixed(1) + '°，仰角 ' + result.pitch.toFixed(1) + '°' + clipText)
    } catch (e) {
        console.log('[CannonTarget] 解析目标并开火失败: ' + e)
        cannonTargetTellOwner(marker, '§c炮击目标处理失败，请查看服务器日志。')
    } finally {
        try {
            marker.discard()
        } catch (e) {
            console.log('[CannonTarget] 清理目标实体失败: ' + e)
        }
    }
}

global.cannonTargetMarkerTick = function (marker) {
    try {
        let data = marker.getPersistentData()
        if (data.getBoolean('cannonTargetResolved')) return
        let ticks = data.getLong('cannonTargetTicks') + 1
        data.putLong('cannonTargetTicks', ticks)
        if (ticks >= CANNON_TARGET_TTL || cannonTargetHasStopped(marker)) {
            data.putBoolean('cannonTargetResolved', true)
            cannonTargetResolveMarker(marker)
        }
    } catch (e) {
        console.log('[CannonTarget] 目标实体处理异常: ' + e)
    }
}

function cannonTargetBindBlock(event) {
    try {
        let player = event.player
        let item = event.item
        let level = event.level
        let hand = String(event.hand)
        if (hand != 'MAIN_HAND' || item == null || item.id != CANNON_TARGETER_ITEM) return
        if (!player.isCrouching()) return
        if (level.isClientSide()) {
            event.cancel()
            return
        }

        let tag = item.getOrCreateTag()
        let pos = event.block.pos
        tag.putString('cannonTargetDimension', cannonTargetDimensionId(level))
        tag.putInt('cannonTargetX', pos.x)
        tag.putInt('cannonTargetY', pos.y)
        tag.putInt('cannonTargetZ', pos.z)
        tag.putString('cannonTargetMount', event.block.id)
        item.setTag(tag)
        player.tell('§a已绑定 CBC 炮台底座：' + event.block.id + ' [' + pos.x + ', ' + pos.y + ', ' + pos.z + ']')
        level.playSound(null, player.getX(), player.getY(), player.getZ(), 'item.lodestone_compass.lock', 'players', 1.0, 1.0)
        event.cancel()
    } catch (e) {
        console.log('[CannonTarget] 绑定炮台失败: ' + e)
    }
}

function cannonTargetThrow(event) {
    try {
        let player = event.player
        let item = event.item
        let level = event.level
        if (level.isClientSide()) return
        if (String(event.hand) != 'MAIN_HAND') return
        if (player.isCrouching()) return

        let binding = cannonTargetReadBinding(item)
        if (binding == null) {
            player.tell('§c尚未绑定 CBC 炮台，请先潜行右键炮台底座。')
            return
        }
        let bound = cannonTargetGetBoundCannon(level.getServer(), binding)
        if (bound == null) {
            player.tell('§c绑定的 CBC 炮台不存在、未加载或类型已改变。')
            return
        }
        if (bound.entity.getContraption() == null) {
            player.tell('§c绑定的 CBC 炮台尚未组装火炮。')
            return
        }

        let look = player.getLookAngle()
        let marker = level.createEntity(CANNON_TARGET_MARKER)
        if (marker == null) {
            player.tell('§c无法生成炮击目标实体，请查看服务器日志。')
            return
        }
        let startX = player.getX() + look.x() * 0.8
        let startY = player.getY() + player.getEyeHeight() + look.y() * 0.8
        let startZ = player.getZ() + look.z() * 0.8
        marker.setPos(startX, startY, startZ)
        marker.setYaw(player.getYaw())
        marker.setPitch(player.getPitch())
        marker.setInvulnerable(true)
        marker.setSilent(true)
        marker.setDeltaMovement(look.scale(CANNON_TARGET_SPEED))
        let data = marker.getPersistentData()
        data.putString('cannonTargetOwner', cannonTargetUuid(player))
        data.putString('cannonTargetDimension', binding.dimension)
        data.putInt('cannonTargetX', binding.x)
        data.putInt('cannonTargetY', binding.y)
        data.putInt('cannonTargetZ', binding.z)
        data.putString('cannonTargetMount', binding.mount)
        data.putLong('cannonTargetTicks', 0)
        marker.spawn()
        level.playSound(null, startX, startY, startZ, 'entity.snowball.throw', 'players', 0.8, 1.2)
    } catch (e) {
        console.log('[CannonTarget] 投掷炮击目标失败: ' + e)
    }
}

BlockEvents.rightClicked(CANNON_MOUNT_ID, cannonTargetBindBlock)
BlockEvents.rightClicked(CANNON_FIXED_MOUNT_ID, cannonTargetBindBlock)
ItemEvents.rightClicked(CANNON_TARGETER_ITEM, cannonTargetThrow)
