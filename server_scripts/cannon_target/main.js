// priority: 1000
// ==========================================
// 🎯 CBC 炮击标定器 + 📻 炮兵电台
// ==========================================
// 信标球（cannon_targeter）两种绑定模式（互斥，后绑定的覆盖先绑定的）：
//   1. 潜行右键炮台底座 → 一对一绑定：投掷目标后该底座瞄准开火。
//   2. 潜行右键炮兵电台 → 电台模式：电台主动扫描周围 16×1×16 内已组装火炮的底座，
//      投掷目标后范围内所有火炮集中齐射。
// 目标实体沿抛物线飞行（带重力，类似投掷药水），停止移动时立即结算。

const CANNON_TARGETER_ITEM = 'rainbow:cannon_targeter'
const CANNON_TARGET_MARKER = 'rainbow:cannon_target_marker'
const CANNON_TARGET_TTL = 200
const CANNON_TARGET_SPEED = 1.6
const CANNON_TARGET_PI = 3.141592653589793
const CANNON_TARGET_RAD_TO_DEG = 180 / CANNON_TARGET_PI
const CANNON_MOUNT_ID = 'createbigcannons:cannon_mount'
const CANNON_FIXED_MOUNT_ID = 'createbigcannons:fixed_cannon_mount'
const CANNON_RADIO_ID = 'rainbow:artillery_radio'
// 电台扫描半径：16×1×16 即 XZ 各 -8..+7（共 16 格），Y 取电台所在层
const CANNON_RADIO_HALF = 8
// 电台触发音效（无线电静电噪声）：startup_scripts/sound.js 注册的声音事件，
// 音频文件 assets/rainbow/sounds/artillery_radio.ogg，在电台方块位置播放
const CANNON_RADIO_SOUND = 'rainbow:voice.artillery_radio'

function cannonTargetWrapDegrees(angle) {
    let result = Number(angle)
    while (result > 180) result -= 360
    while (result <= -180) result += 360
    return result
}

// 原版 Direction#toYRot 语义 = (horizontalIndex & 3) * 90：南0/西90/北180/东270，上下方向与原版一致取270。
// 不直接调用 Direction 实例方法（toYRot/getAxis 等）：本整合包运行环境曾出现
// "Cannot find function toYRot in object south" 的解析失败，改用方向名字符串映射（Direction#toString 即小写名字）。
const CANNON_TARGET_DIR_YAW = {
    south: 0,
    west: 90,
    north: 180,
    east: 270,
    up: 270,
    down: 270
}

function cannonTargetDirectionYaw(direction) {
    if (direction == null) return 180
    let name = String(direction).toLowerCase()
    return CANNON_TARGET_DIR_YAW.hasOwnProperty(name) ? CANNON_TARGET_DIR_YAW[name] : 0
}

// 方向符号：等价于 CBC 的 (轴方向为POSITIVE) == (轴为X) ? 1 : -1 —— 东/北/下=+1，西/南/上=-1。
// 供本文件与 cbc_aim.js 共用，避免直接调用 Direction.getAxis()/getAxisDirection()（本环境解析失败）。
function cannonTargetDirectionSign(direction) {
    if (direction == null) return 1
    let name = String(direction).toLowerCase()
    if (name == 'east' || name == 'north' || name == 'down') return 1
    if (name == 'west' || name == 'south' || name == 'up') return -1
    return 1
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

// 读取信标球上的电台绑定（cannonRadioBound=1 表示电台齐射模式）
function cannonTargetReadRadioBinding(item) {
    try {
        let nbt = item.getNbt()
        if (nbt == null || !nbt.contains('cannonRadioBound')) return null
        if (nbt.getByte('cannonRadioBound') != 1) return null
        return {
            x: nbt.getInt('cannonRadioX'),
            y: nbt.getInt('cannonRadioY'),
            z: nbt.getInt('cannonRadioZ')
        }
    } catch (e) {
        console.log('[CannonTarget] 读取电台绑定失败: ' + e)
        return null
    }
}

// 扫描电台周围 16×1×16（XZ 各 -8..+7，同 Y 层）内已组装火炮结构的底座，
// 返回 BlockContainerJS 数组。电台与开火时都调用它，保证实时性。
function cannonRadioScanCannons(radio) {
    let found = []
    try {
        let level = radio.level
        let bx = radio.pos.x
        let by = radio.pos.y
        let bz = radio.pos.z
        for (let dx = -CANNON_RADIO_HALF; dx < CANNON_RADIO_HALF; dx++) {
            for (let dz = -CANNON_RADIO_HALF; dz < CANNON_RADIO_HALF; dz++) {
                let b = level.getBlock(bx + dx, by, bz + dz)
                if (b == null || b.id == null) continue
                if (b.id != CANNON_MOUNT_ID && b.id != CANNON_FIXED_MOUNT_ID) continue
                let be = b.entity
                if (be == null) continue
                let assembled = false
                try {
                    assembled = be.getContraption() != null
                } catch (e2) {
                    assembled = false
                }
                if (assembled) found.push(b)
            }
        }
    } catch (e) {
        console.log('[CannonTarget] 电台扫描火炮失败: ' + e)
    }
    return found
}

// 电台主动发现：由方块实体 serverTick 每秒调用一次，
// 扫描范围内已组装火炮数量并写入方块实体数据（数量变化时同步到客户端）。
global.cannonRadioTick = function (be) {
    try {
        if (be.getLevel().isClientSide()) return
        let cannons = cannonRadioScanCannons(be.getBlock())
        let count = cannons.length
        let data = be.data
        if (data.getInt('radioCannonCount') != count) {
            data.putInt('radioCannonCount', count)
            be.sync()
        }
    } catch (e) {
        console.log('[CannonTarget] 电台主动发现异常: ' + e)
    }
}

function cannonTargetOrientationSign(contraption) {
    try {
        return cannonTargetDirectionSign(contraption.getInitialOrientation())
    } catch (e) {
        console.log('[CannonTarget] 获取炮管方向符号失败: ' + e)
        return 1
    }
}

// 同步结构体实体的旋转（同 tick 开火的炮弹方向由这些字段决定，prev* 也必须写入）。
// 注意：KubeJS 的 EntityMixin 通过 @RemapForJS 把原版 setXRot/setYRot 改名为 setPitch/setYaw，
// 脚本里调用 setXRot/setYRot 会报 "Cannot find function"，pitch/yaw 字段才是 Create 的结构体俯仰/偏航。
function cannonTargetSyncContraptionRotation(contraption, contraptionPitch, internalYaw, entityPitch) {
    try {
        contraption.pitch = Number(contraptionPitch)
        contraption.yaw = Number(internalYaw)
        contraption.prevPitch = Number(contraptionPitch)
        contraption.prevYaw = Number(internalYaw)
        contraption.setPitch(Number(entityPitch))
        contraption.setYaw(Number(internalYaw))
        contraption.xRotO = Number(entityPitch)
        contraption.yRotO = Number(internalYaw)
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
            cannonTargetDirectionYaw(mount.getContraptionDirection())
        )
        let orientationSign = cannonTargetOrientationSign(contraption)
        let internalYaw = 0          // 写入底座/结构体的方位角（原版 yaw 约定，南0西90北180东270）
        let entityPitch = 0          // 底座 cannonPitch / 实体 xRot：0=炮管水平，正值=抬仰角
        let contraptionPitch = 0     // 结构体 pitch 字段（= entityPitch × orientationSign）
        let clipped = false

        if (block.id == CANNON_FIXED_MOUNT_ID) {
            // 固定底座：剪切板里是相对炮口朝向的 ±45° 偏移，BE 的 applyRotation 会再乘 sgn 归一
            let baseYaw = cannonTargetDirectionYaw(mount.getContraptionDirection())
            let adjustments = cannonTargetFixedMountAdjustments(
                physical.yaw, physical.pitch, baseYaw, orientationSign
            )
            let clipTag = new CompoundTag()
            clipTag.putInt('Pitch', Math.round(adjustments.pitchAdjustment))
            clipTag.putInt('Yaw', Math.round(adjustments.yawAdjustment))
            mount.readFromClipboard(clipTag, cannonTargetPlayerEntity(owner), Direction.NORTH, false)
            internalYaw = baseYaw + adjustments.yawAdjustment
            entityPitch = adjustments.pitchAdjustment
            contraptionPitch = entityPitch * orientationSign
            clipped = adjustments.clipped
        } else {
            // 垂直底座（cannon_mount）：cannonYaw = 炮口方位角原值，cannonPitch = 仰角原值
            // （CBC 数据 cannon_mounts/big_cannon.json：射界为俯角30/仰角60，即 cannonPitch=0 为水平，
            //   正值抬仰角；applyRotation 中 contraption.yaw = cannonYaw 直接生效，无任何 +180 偏移。
            //   旧公式 internalYaw = yaw+180 会让炮口恰好指向反方向）
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
            entityPitch = Math.max(-maximumDepression, Math.min(maximumElevation, physical.pitch))
            internalYaw = physical.yaw
            contraptionPitch = entityPitch * orientationSign
            mount.setYaw(internalYaw)
            mount.setPitch(entityPitch)
        }

        cannonTargetSyncContraptionRotation(contraption, contraptionPitch, internalYaw, entityPitch)
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

// 电台模式结算：目标停止后，电台扫描范围内所有已组装火炮并集中开火
function cannonTargetResolveRadio(marker) {
    let data = marker.getPersistentData()
    let level = marker.getLevel()
    let owner = cannonTargetGetOwner(marker)
    let rx = data.getInt('cannonRadioX')
    let ry = data.getInt('cannonRadioY')
    let rz = data.getInt('cannonRadioZ')
    let radio = level.getBlock(rx, ry, rz)
    if (radio == null || radio.id != CANNON_RADIO_ID) {
        cannonTargetTellOwner(marker, '§c绑定的炮兵电台已失效，无法调度火炮。')
        return
    }
    let cannons = cannonRadioScanCannons(radio)
    if (cannons.length == 0) {
        cannonTargetTellOwner(marker, '§c炮兵电台范围内当前没有已组装的火炮。')
        return
    }
    let fired = 0
    let failed = 0
    for (let i = 0; i < cannons.length; i++) {
        let b = cannons[i]
        if (b == null || b.entity == null) continue
        let bound = { level: level, pos: b.pos, block: b, entity: b.entity }
        let result = cannonTargetApplyAim(bound, marker, owner)
        if (result.ok) {
            fired++
        } else {
            failed++
        }
    }
    if (fired > 0) {
        cannonTargetTellOwner(marker, '§a炮兵电台已调度 ' + fired + ' 座火炮向目标集中开火！' + (failed > 0 ? ' §7(' + failed + ' 座未能开火)' : ''))
        // 调度齐射成功时在电台位置播放电台触发音效
        try {
            level.playSound(null, radio.getX(), radio.getY(), radio.getZ(), CANNON_RADIO_SOUND, 'blocks', 0.9, 1.0)
        } catch (se) {
            console.log('[CannonTarget] 电台调度音效播放失败: ' + se)
        }
    } else {
        cannonTargetTellOwner(marker, '§c电台范围内的火炮全部未能开火，请查看服务器日志。')
    }
}

function cannonTargetResolveMarker(marker) {
    try {
        let data = marker.getPersistentData()
        // 电台模式：范围内火炮齐射
        if (data.getBoolean('cannonTargetIsRadio')) {
            cannonTargetResolveRadio(marker)
            return
        }
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

// 类原版投掷药水（ThrowableProjectile）物理：每刻先按当前速度做碰撞感知移动（move SELF），
// 再施加 0.99 空气阻力与每刻 0.03 重力。getMotionX/Y/Z 与 setMotionX/Y/Z 来自 KubeJS EntityKJS
// 接口（kjs$ 前缀重映射，稳定可用）；move 为 EntityJS BaseEntityJS 自身声明方法，可直接调用。
let cannonTargetPhysicsUseFallback = false

function cannonTargetApplyThrowablePhysics(marker) {
    try {
        let mx = marker.getMotionX()
        let my = marker.getMotionY()
        let mz = marker.getMotionZ()
        if (mx * mx + my * my + mz * mz < 1.0E-6) return
        let motion = marker.getDeltaMovement()
        if (motion == null) {
            cannonTargetPhysicsUseFallback = true
        }
        if (cannonTargetPhysicsUseFallback) {
            // 兜底：碰撞移动不可用时退化为无碰撞直线推进，标记靠 TTL 或碰实体结算
            marker.setPos(marker.getX() + mx, marker.getY() + my, marker.getZ() + mz)
        } else {
            try {
                marker.move('SELF', motion)
            } catch (e2) {
                // move/枚举参数转换失败时永久降级为直线推进，只打印一次错误
                cannonTargetPhysicsUseFallback = true
                console.log('[CannonTarget] 目标实体碰撞移动降级为直线推进: ' + e2)
                marker.setPos(marker.getX() + mx, marker.getY() + my, marker.getZ() + mz)
            }
        }
        marker.setMotionX(mx * 0.99)
        marker.setMotionY(my * 0.99 - 0.03)
        marker.setMotionZ(mz * 0.99)
    } catch (e) {
        console.log('[CannonTarget] 目标实体物理模拟失败: ' + e)
    }
}

global.cannonTargetMarkerTick = function (marker) {
    cannonTargetApplyThrowablePhysics(marker)
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
    // event.cancel() 在 KubeJS 6 中会抛出 EventExit 异常来中断事件，必须放在 try/catch 之外执行，
    // 否则会被当成绑定失败误报（日志曾出现 EventExit: result）
    let cancelEvent = false
    try {
        let player = event.player
        let item = event.item
        let level = event.level
        let hand = String(event.hand)
        if (hand != 'MAIN_HAND' || item == null || item.id != CANNON_TARGETER_ITEM) return
        if (!player.isCrouching()) return
        if (level.isClientSide()) {
            cancelEvent = true
            return
        }

        let tag = item.getOrCreateTag()
        let pos = event.block.pos
        tag.putString('cannonTargetDimension', cannonTargetDimensionId(level))
        tag.putInt('cannonTargetX', pos.x)
        tag.putInt('cannonTargetY', pos.y)
        tag.putInt('cannonTargetZ', pos.z)
        tag.putString('cannonTargetMount', event.block.id)
        // 两种绑定互斥：切回一对一模式时清除电台绑定键
        try {
            tag.remove('cannonRadioBound')
            tag.remove('cannonRadioX')
            tag.remove('cannonRadioY')
            tag.remove('cannonRadioZ')
        } catch (e2) {
            console.log('[CannonTarget] 清理电台绑定失败: ' + e2)
        }
        // KubeJS 的 ItemStackMixin 通过 @RemapForJS 把原版 setTag 改名为 setNbt，
        // 脚本里调用 setTag 会报 "Cannot find function setTag"，必须用 setNbt。
        item.setNbt(tag)
        player.tell('§a已绑定 CBC 炮台底座：' + event.block.id + ' [' + pos.x + ', ' + pos.y + ', ' + pos.z + ']')
        level.playSound(null, player.getX(), player.getY(), player.getZ(), 'item.lodestone_compass.lock', 'players', 1.0, 1.0)
        cancelEvent = true
    } catch (e) {
        console.log('[CannonTarget] 绑定炮台失败: ' + e)
        return
    }
    if (cancelEvent) event.cancel()
}

function cannonTargetThrow(event) {
    try {
        let player = event.player
        let item = event.item
        let level = event.level
        if (level.isClientSide()) return
        if (String(event.hand) != 'MAIN_HAND') return
        if (player.isCrouching()) return

        let radioBinding = cannonTargetReadRadioBinding(item)
        let binding = null
        let isRadioMode = radioBinding != null
        if (isRadioMode) {
            // 电台模式：验证电台方块仍存在且类型未变（电台与玩家同维度，无需跨维度查找）
            let radio = level.getBlock(radioBinding.x, radioBinding.y, radioBinding.z)
            if (radio == null || radio.id != CANNON_RADIO_ID) {
                player.tell('§c绑定的炮兵电台已失效，请重新潜行右键电台绑定。')
                return
            }
        } else {
            binding = cannonTargetReadBinding(item)
            if (binding == null) {
                player.tell('§c尚未绑定，请先潜行右键炮台底座（单发）或炮兵电台（齐射）。')
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
        data.putLong('cannonTargetTicks', 0)
        if (isRadioMode) {
            // 电台模式：目标结算时由电台调度范围内火炮齐射
            data.putBoolean('cannonTargetIsRadio', true)
            data.putInt('cannonRadioX', radioBinding.x)
            data.putInt('cannonRadioY', radioBinding.y)
            data.putInt('cannonRadioZ', radioBinding.z)
        } else {
            data.putString('cannonTargetDimension', binding.dimension)
            data.putInt('cannonTargetX', binding.x)
            data.putInt('cannonTargetY', binding.y)
            data.putInt('cannonTargetZ', binding.z)
            data.putString('cannonTargetMount', binding.mount)
        }
        marker.spawn()
        level.playSound(null, startX, startY, startZ, 'entity.snowball.throw', 'players', 0.8, 1.2)
    } catch (e) {
        console.log('[CannonTarget] 投掷炮击目标失败: ' + e)
    }
}

// 炮兵电台交互：
//   潜行 + 信标球 → 绑定电台（齐射模式，清除一对一绑定）
//   非信标球右键 → 播报当前范围内发现的火炮数量
//   非潜行 + 信标球 → 交给投掷逻辑（ItemEvents.rightClicked），此处不处理
function cannonRadioBind(event) {
    let cancelEvent = false
    try {
        let player = event.player
        let item = event.item
        let level = event.level
        let hand = String(event.hand)
        if (hand != 'MAIN_HAND') return
        let isTargeter = item != null && item.id == CANNON_TARGETER_ITEM
        if (isTargeter && !player.isCrouching()) return
        if (level.isClientSide()) {
            cancelEvent = true
            return
        }

        if (isTargeter) {
            let tag = item.getOrCreateTag()
            let pos = event.block.pos
            tag.putByte('cannonRadioBound', 1)
            tag.putInt('cannonRadioX', pos.x)
            tag.putInt('cannonRadioY', pos.y)
            tag.putInt('cannonRadioZ', pos.z)
            // 两种绑定互斥：切到电台模式时清除一对一底座绑定键
            try {
                tag.remove('cannonTargetDimension')
                tag.remove('cannonTargetX')
                tag.remove('cannonTargetY')
                tag.remove('cannonTargetZ')
                tag.remove('cannonTargetMount')
            } catch (e2) {
                console.log('[CannonTarget] 清理底座绑定失败: ' + e2)
            }
            item.setNbt(tag)
            let cannons = cannonRadioScanCannons(event.block)
            if (cannons.length > 0) {
                player.tell('§a已绑定炮兵电台 [' + pos.x + ', ' + pos.y + ', ' + pos.z + ']，范围内发现 ' + cannons.length + ' 座火炮，投掷目标后将集中齐射！')
            } else {
                player.tell('§e已绑定炮兵电台 [' + pos.x + ', ' + pos.y + ', ' + pos.z + ']，但范围内暂无已组装火炮。')
            }
            level.playSound(null, player.getX(), player.getY(), player.getZ(), 'item.lodestone_compass.lock', 'players', 1.0, 1.2)
            // 绑定成功：在电台位置播放电台触发音效（无线电静电噪声）
            try {
                level.playSound(null, event.block.getX(), event.block.getY(), event.block.getZ(), CANNON_RADIO_SOUND, 'blocks', 0.9, 1.0)
            } catch (se) {
                console.log('[CannonTarget] 电台绑定音效播放失败: ' + se)
            }
        } else {
            let cannons = cannonRadioScanCannons(event.block)
            let cached = event.block.entity != null ? event.block.entity.data.getInt('radioCannonCount') : -1
            player.tell('§b[炮兵电台] 主动发现范围内已组装火炮 ' + cannons.length + ' 座。' + (cached >= 0 && cached != cannons.length ? ' §7(上次记录 ' + cached + ' 座)' : ''))
            // 右键触发电台播报：在电台位置播放电台触发音效
            try {
                level.playSound(null, event.block.getX(), event.block.getY(), event.block.getZ(), CANNON_RADIO_SOUND, 'blocks', 0.9, 1.0)
            } catch (se) {
                console.log('[CannonTarget] 电台播报音效播放失败: ' + se)
            }
        }
        cancelEvent = true
    } catch (e) {
        console.log('[CannonTarget] 电台交互失败: ' + e)
        return
    }
    if (cancelEvent) event.cancel()
}

BlockEvents.rightClicked(CANNON_MOUNT_ID, cannonTargetBindBlock)
BlockEvents.rightClicked(CANNON_FIXED_MOUNT_ID, cannonTargetBindBlock)
BlockEvents.rightClicked(CANNON_RADIO_ID, cannonRadioBind)
ItemEvents.rightClicked(CANNON_TARGETER_ITEM, cannonTargetThrow)
