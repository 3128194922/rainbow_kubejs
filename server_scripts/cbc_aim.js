// priority: 0
// ============================================
// CBC 火炮瞄准工具 v3 (剪切板式瞄准, 当前角度自动读取)
// 用法:
//   /cbc_aim_to <k> <tx> <ty> <tz>  - 写入副手剪切板
//     主手必须在主手持有可辨认的CBC弹药(弹种自动写入剪切板)
//   执行指令后数据写入副手剪切板(create:clipboard)
//   手持该剪切板右键炮塔基座(cannon_mount / fixed_cannon_mount)
//   → 自动获取基座坐标 + 自动读取基座当前方位角/仰角
//   → 计算目标方位角/仰角 → 写入基座并同步
// 参数: k=炮管长  tx/ty/tz=目标坐标
// cyaw/cpitch 无需手动输入, 右键时从基座方块实体自动读取
// 说明: 炮弹装药量由系统自动计算最小需求
// 识别物品: solid_shot, he_shell, ap_shell, ap_shot, shrapnel_shell,
//           bag_of_grapeshot, smoke_shell, fluid_shell, drop_mortar_shell,
//           mortar_stone, traffic_cone,
//           ap_autocannon_round, flak_autocannon_round, machine_gun_round (机炮弹药)
// ============================================

// ============ 弹药类型弹道参数 ============
// 数据来源: Create Big Cannons v6 源码 munition_properties/projectiles/*.json
const AMMO_TYPES = {
    solid_shot: {
        name: '实心弹(Solid Shot)',
        gravity: -0.05,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    he_shell: {
        name: '高爆弹(HE Shell)',
        gravity: -0.05,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    ap_shell: {
        name: '穿甲弹(AP Shell)',
        gravity: -0.05,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    ap_shot: {
        name: 'AP实心弹(AP Shot)',
        gravity: -0.05,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    shrapnel_shell: {
        name: '榴霰弹(Shrapnel)',
        gravity: -0.05,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    bag_of_grapeshot: {
        name: '葡萄弹(Grapeshot)',
        gravity: -0.05,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    smoke_shell: {
        name: '烟雾弹(Smoke)',
        gravity: -0.05,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    fluid_shell: {
        name: '流体弹(Fluid)',
        gravity: -0.05,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    drop_mortar_shell: {
        name: '迫击炮弹(Dropped Mortar)',
        gravity: -0.05,
        drag: 0.01,
        quadratic: false,
        addedCharge: 2.0
    },
    mortar_stone: {
        name: '迫击弹(Mortar Stone)',
        gravity: -0.025,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    traffic_cone: {
        name: '交通锥(Traffic Cone)',
        gravity: -0.05,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    // ============ 机炮弹药 (Autocannon) ============
    // 机炮弹 gravity=-0.025(减半重力，弹道更平直), drag=0.01(与常规炮弹相同)
    ap_autocannon_round: {
        name: 'AP自动炮弹(AP Autocannon)',
        gravity: -0.025,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    flak_autocannon_round: {
        name: '高射自动炮弹(Flak)',
        gravity: -0.025,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    machine_gun_round: {
        name: '机枪弹(Machine Gun)',
        gravity: -0.025,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    }
}

// ============ 物品ID → 弹药类型 ============
const ITEM_TO_AMMO = {
    'createbigcannons:solid_shot': 'solid_shot',
    'createbigcannons:he_shell': 'he_shell',
    'createbigcannons:ap_shell': 'ap_shell',
    'createbigcannons:ap_shot': 'ap_shot',
    'createbigcannons:shrapnel_shell': 'shrapnel_shell',
    'createbigcannons:bag_of_grapeshot': 'bag_of_grapeshot',
    'createbigcannons:smoke_shell': 'smoke_shell',
    'createbigcannons:fluid_shell': 'fluid_shell',
    'createbigcannons:drop_mortar_shell': 'drop_mortar_shell',
    'createbigcannons:mortar_stone': 'mortar_stone',
    'createbigcannons:traffic_cone': 'traffic_cone',
    'createbigcannons:ap_autocannon_round': 'ap_autocannon_round',
    'createbigcannons:flak_autocannon_round': 'flak_autocannon_round',
    'createbigcannons:machine_gun_round': 'machine_gun_round'
}

// 从玩家主手物品自动识别弹药类型, 返回 { key, config } 或 null
function getAmmoFromHand(player) {
    try {
        let stack = player.getMainHandItem()
        if (stack == null || stack.isEmpty()) {
            return null
        }
        let itemId = stack.getItem().id
        let key = ITEM_TO_AMMO[itemId]
        if (key != null) {
            return { key: key, config: AMMO_TYPES[key] }
        }
        return null
    } catch (ex) {
        console.error('[CBC Aim] getAmmoFromHand出错: ' + ex)
        return null
    }
}

let G_MUL = 1.0         // 维度重力倍率
const D_MUL = 1.0         // 维度阻力倍率
const MAX_TICKS = 800     // 最大模拟tick数
// 仰角扫描范围按炮塔朝向在 solve() 内动态决定 (不再使用全局常量):
//   正立(炮口朝上): θ∈[30°,90°]  对应 cannonPitch∈[0°,60°] (配置 [-30,60] 的可用射界)
//   倒立(炮口朝下): θ∈[-90°,0°]  对应 cannonPitch∈[-90°,0°] (配置 [-90,15] 的可用射界)
const PITCH_TOL = 0.005   // 仰角精度
const MAX_ITER = 60       // 最大迭代次数
const GEAR_RATIO = 8      // Create 齿轮箱传动比（8:1 = 应力齿:输出度）

// Math.PI 在 KubeJS Rhino 中返回 undefined，需硬编码
const PI = 3.141592653589793
const RAD_TO_DEG = 180 / PI

// 通用弹道函数：仰角、n=装药(速度系数)、k=炮管长、x=水平距离、config=弹药配置，返回高度 y
// verticalSign: 弹道高度符号, 由炮尾位置(blockstate vertical_direction)决定, 与炮口方向无关
//   vertical_direction=down → 炮尾在基座上方2格 → +1 (常数 +2)
//   vertical_direction=up   → 炮尾在基座下方2格 → -1 (常数 -2)
// 末尾常数 verticalSign*2 为炮尾相对基座底部的高度修正 (上方 +2 / 下方 -2)
function ballisticFunction(tDeg, n, k, x, config, verticalSign) {
    let d = config.drag
    if (d <= 0) d = 0.01

    let gDivD = -config.gravity / d       // 标准弹: 5, 机炮弹: 2.5
    let gDivD2 = -config.gravity / (d * d) // 标准弹: 500, 机炮弹: 250

    let t = tDeg * PI / 180
    let cosT = Math.cos(t)
    if (Math.abs(cosT) < 1e-6) return -999999
    let secT = 1 / cosT
    let tanT = Math.tan(t)
    let innerTerm = (x * secT - k) / (100 * n)
    if (1 - innerTerm <= 0) return null
    let logPart = gDivD2 * Math.log(1 - innerTerm)
    return ((gDivD * secT) / n + tanT) * x + logPart - (gDivD * k) / n + verticalSign * 2
}

// 计算飞行时间（秒）
function flightTime(tDeg, n, k, x) {
    let t = tDeg * PI / 180
    let cosT = Math.cos(t)
    if (Math.abs(cosT) < 1e-6) return 0
    let secT = 1 / cosT
    let innerTerm = (x * secT - k) / (100 * n)
    if (1 - innerTerm <= 1e-9) return 0
    let ticks = Math.log(1 - innerTerm) / Math.log(0.99)
    return ticks / 20
}

// 角度 → Create 齿轮箱格式：总应力齿 → 圈数 + 余数
function formatGearbox(angleDeg) {
    let stress = angleDeg * GEAR_RATIO
    let turns = Math.floor(stress / 360)
    let remainder = stress % 360
    return turns + '圈 ' + remainder.toFixed(1) + '°'
}

// 角度差 → 齿轮箱格式（含正负号）
function formatGearboxDiff(targetDeg, currentDeg) {
    let diff = targetDeg - currentDeg
    while (diff > 180) diff -= 360
    while (diff <= -180) diff += 360
    let totalStress = diff * GEAR_RATIO
    let sign = totalStress >= 0 ? '+' : '-'
    let absStress = Math.abs(totalStress)
    let turns = Math.floor(absStress / 360)
    let remainder = absStress % 360
    return diff.toFixed(2) + '° (' + sign + turns + '圈 ' + sign + remainder.toFixed(1) + '°)'
}

// ============ 仰角数值求解（扫描+二分法）============
// verticalSign: 弹道高度符号 (+1=正立/炮尾在基座上方2格, -1=倒立/炮尾在基座下方2格), 由 vertical_direction 决定
// scanLow/scanHigh: 该基座的可用射界扫描范围 (由正/倒立决定)
//   fixed_cannon_mount(水平): [-30,60]   正立(down): [30,90]    倒立(up): [-90,0]
function solve(sx, sy, sz, tx, ty, tz, charge, config, barrelLen, verticalSign, scanLow, scanHigh) {
    let dx = tx - sx
    let dz = tz - sz
    let R = Math.sqrt(dx*dx + dz*dz)
    let dy = ty - sy
    let n = charge * 2

    if (R < 0.5) {
        // 目标在炮口正上/正下方: 正立=竖直向上(90°), 倒立=竖直向下(-90°)
        return { pitch: verticalSign > 0 ? 90 : -90, dx: dx, dz: dz, error: 0 }
    }

    let lowBound = scanLow
    let highBound = scanHigh
    let step = 0.5
    let solutions = []

    function getDiff(angle) {
        let y = ballisticFunction(angle, n, barrelLen, R, config, verticalSign)
        if (y == null) return null
        return y - dy
    }

    let prevDiff = getDiff(lowBound)
    let stepsCount = Math.floor((highBound - lowBound) / step)

    for (let i = 0; i < stepsCount; i++) {
        let currAngle = lowBound + (i + 1) * step
        let currDiff = getDiff(currAngle)
        if (currDiff == null) {
            prevDiff = null
            continue
        }
        if (prevDiff != null && (prevDiff * currDiff < 0)) {
            // 符号变化 → 二分法精确求解
            let bLow = currAngle - step
            let bHigh = currAngle
            for (let j = 0; j < 30; j++) {
                let bMid = (bLow + bHigh) / 2
                let midDiff = getDiff(bMid)
                if (midDiff == null) { bLow = bMid; continue }
                if (Math.abs(midDiff) < 1e-9) break
                if (midDiff * prevDiff > 0) bLow = bMid
                else bHigh = bMid
            }
            let finalSol = (bLow + bHigh) / 2
            solutions.push({ pitch: finalSol, error: Math.abs(getDiff(finalSol)) })
        } else if (currDiff != null && Math.abs(currDiff) < 1e-5) {
            solutions.push({ pitch: currAngle, error: Math.abs(currDiff) })
        }
        prevDiff = currDiff
    }

    if (solutions.length === 0) return null

    // 按仰角排序，拆分为曲射(pitch>33°)和直射(pitch<=33°)
    solutions.sort(function(a, b) { return a.pitch - b.pitch })
    let curveIdx = -1
    let flatIdx = -1
    for (let i = 0; i < solutions.length; i++) {
        if (solutions[i].pitch > 33) {
            if (curveIdx < 0) curveIdx = i
        } else {
            flatIdx = i
        }
    }

    let preferCurve = Math.abs(dy) > 5 || R > 150
    let best = null

    if (preferCurve && curveIdx >= 0) {
        best = solutions[solutions.length - 1]
    } else if (!preferCurve && flatIdx >= 0) {
        best = solutions[flatIdx]
    } else if (curveIdx >= 0) {
        best = solutions[solutions.length - 1]
    } else if (flatIdx >= 0) {
        best = solutions[flatIdx]
    }

    if (best == null) return null

    return { pitch: best.pitch, dx: dx, dz: dz, error: best.error }
}

// ============ 剪切板读写 ============

// 将瞄准目标/参数写入副手剪切板, 返回 null 或错误信息
// v3: 不再写入 cyaw/cpitch (右键基座时自动读取当前角度)
function writeTargetToClipboard(player, k, tx, ty, tz, detected) {
    let offhand = player.getOffhandItem()
    if (offhand == null || offhand.isEmpty() || offhand.id != 'create:clipboard') {
        return '§c副手必须持有剪切板(create:clipboard)才能写入数据'
    }

    try {
        // 用 KubeJS 物品包装器直接修改 NBT (裁剪板结构: Pages->[0].Entries[])
        let pagesList = new $ListTag()
        let page = new $CompoundTag()
        let entriesList = new $ListTag()

        let e0 = new $CompoundTag()
        e0.putString('Text', '{"text":"目标X: ' + tx.toFixed(2) + '"}')
        e0.putBoolean('Checked', false)
        entriesList.add(e0)

        let e1 = new $CompoundTag()
        e1.putString('Text', '{"text":"目标Y: ' + ty.toFixed(2) + '"}')
        e1.putBoolean('Checked', false)
        entriesList.add(e1)

        let e2 = new $CompoundTag()
        e2.putString('Text', '{"text":"目标Z: ' + tz.toFixed(2) + '"}')
        e2.putBoolean('Checked', false)
        entriesList.add(e2)

        let e3 = new $CompoundTag()
        e3.putString('Text', '{"text":"k: ' + k + '"}')
        e3.putBoolean('Checked', false)
        entriesList.add(e3)

        let e4 = new $CompoundTag()
        e4.putString('Text', '{"text":"弹种: ' + detected.key + '"}')
        e4.putBoolean('Checked', false)
        entriesList.add(e4)

        page.put('Entries', entriesList)
        pagesList.add(page)

        let nbt = offhand.getOrCreateTag()
        nbt.put('Pages', pagesList)
        nbt.putInt('Type', 1)
        nbt.putInt('PreviouslyOpenedPage', 0)
        offhand.nbt = nbt
        return null
    } catch (ex) {
        console.error('[CBC Aim] 写入剪切板出错: ' + ex)
        return '§c写入剪切板出错: ' + ex
    }
}

// 从剪切板物品解析出 { tx, ty, tz, k, ammoKey } 或 null
// v3: 剪切板不再保存 cyaw/cpitch (右键基座时自动读取当前角度)
function readClipboardData(clipboardItem) {
    try {
        let nbtStack = clipboardItem.nbt
        let tag = nbtStack != null ? nbtStack : clipboardItem.getOrCreateTag()
        if (tag == null || !tag.contains('Pages')) {
            return null
        }
        let pages = tag.getList('Pages', 10) // 10 = TAG_COMPOUND
        if (pages.size() == 0) {
            return null
        }
        let page = pages.getCompound(0)
        if (page == null || !page.contains('Entries')) {
            return null
        }
        let entries = page.getList('Entries', 10)

        let tx = null, ty = null, tz = null, k = null
        let ammoKey = null

        for (let i = 0; i < entries.size(); i++) {
            let comp = entries.getCompound(i)
            if (comp == null) continue
            let textJson = comp.getString('Text')
            let text = ''
            try {
                let parsed = JSON.parse(textJson)
                if (parsed != null && parsed.text != null) {
                    text = parsed.text
                }
            } catch (ex) { continue }
            if (text == null || text.length == 0) continue

            if (text.indexOf('目标X:') === 0) {
                tx = parseFloat(text.substring(4).trim())
            } else if (text.indexOf('目标Y:') === 0) {
                ty = parseFloat(text.substring(4).trim())
            } else if (text.indexOf('目标Z:') === 0) {
                tz = parseFloat(text.substring(4).trim())
            } else if (text.indexOf('k:') === 0) {
                k = parseFloat(text.substring(2).trim())
            } else if (text.indexOf('弹种:') === 0) {
                ammoKey = text.substring(3).trim()
            }
        }

        if (tx == null || isNaN(tx) || ty == null || isNaN(ty) || tz == null || isNaN(tz) ||
            k == null || isNaN(k) || ammoKey == null) {
            return null
        }
        return { tx: tx, ty: ty, tz: tz, k: k, ammoKey: ammoKey }
    } catch (ex) {
        console.error('[CBC Aim] 读取剪切板出错: ' + ex)
        return null
    }
}

// ============ 自动读取基座当前角度 (取代手动 cyaw/cpitch) ============
// cannon_mount:  读 getYawOffset(0)/getPitchOffset(0) = 当前 cannonYaw/cannonPitch
//                (与脚本 setYaw/setPitch 写入同一基准)
// fixed_mount:   writeToClipboard 读回当前槽位值, 再按方块朝向基准角反解 (与写入互为逆运算)
// YAW_FLIP:      cannon_mount 内部基准为 facing.toYRot (N=0,E=90,S=180,W=270),
//                显示方位角用南0基准 → 加180°翻转; 若实测方向相反, 改为 0
const YAW_FLIP = 180

// 读取基座当前角度, 返回 { yaw: 显示方位角(南0), pitch: 真实仰角(向上为正), isInverted: 是否倒立,
//                        rawYaw: 内部 cannonYaw(仪表基准), rawPitch: getPitchOffset原始值 }
// 正立/倒立判定规则 (用户确认): 由 blockstate vertical_direction 决定, 与实体无关
//   vertical_direction=down → 正立(炮口朝上)   vertical_direction=up → 倒立(炮口朝下)
// 注意: 不能依赖 getContraptionDirection() 判定 —— 当 mountedContraption 为 null 时
//       CBC 源码返回 Direction.NORTH, 会导致倒立基座被误判为正立!
// 垂直炮塔换算 (CBC 源码推导):
//   真实仰角 θ 与内部 cannonPitch 关系: cp = s_v*90 - θ  (s_v=+1正立/-1倒立)
//   getPitchOffset = cp * downSgn (倒立 downSgn=-1), 反解真实仰角:
//     正立: θ = 90 - rawPitch     倒立: θ = rawPitch - 90
// 注意: 创造仪表(CannonMountDisplaySource)显示内部 cannonPitch/cannonYaw (仪表基准),
//       与 tell 的物理基准差: pitch 差换算量, yaw 差 180°(正立) —— 输出时需同时标注
function readCurrentAngles(block, player) {
    try {
        let cannonBe = block.entity
        if (cannonBe == null) {
            return null
        }
        if (block.id == 'createbigcannons:fixed_cannon_mount') {
            // 固定基座: 水平安装炮塔, pitch/yaw 直接是显示角度 (保持原逻辑)
            let tag = new $CompoundTag()
            let dir = cannonBe.getContraptionDirection() != null ? cannonBe.getContraptionDirection() : $Direction.NORTH
            cannonBe.writeToClipboard(tag, dir)
            let slotYaw = Number(tag.getInt('Yaw'))
            let slotPitch = Number(tag.getInt('Pitch'))
            let baseYaw = Number(dir.toYRot())
            let curYaw = (slotYaw + baseYaw) % 360
            if (curYaw < 0) curYaw += 360
            let axDirStr = String(dir.getAxisDirection())
            let axStr = String(dir.getAxis())
            let flag1 = (axDirStr == 'POSITIVE') == (axStr == 'X')
            let sgn = flag1 ? 1 : -1
            let curPitch = slotPitch * sgn
            console.log('[CBC Aim] 固定基座读回: slotYaw=' + slotYaw + ' 基准=' + baseYaw + ' → yaw=' + curYaw.toFixed(2) + ' | slotPitch=' + slotPitch + ' sgn=' + sgn + ' → pitch=' + curPitch.toFixed(2))
            return { yaw: curYaw, pitch: curPitch, isInverted: false, rawYaw: slotYaw, rawPitch: slotPitch }
        } else {
            // cannon_mount: 正立/倒立由 blockstate vertical_direction 判定 (up=倒立, down=正立)
            let verticalDir = null
            try {
                verticalDir = block.blockState.getValue($BlockStateProperties.VERTICAL_DIRECTION)
            } catch (ex) {
                verticalDir = null
            }
            // 注意: Minecraft Direction 覆写了 toString() 返回小写 name ("up"/"down"),
            //       String(Direction.UP) == "up" (不是 "UP")!
            let isInverted = verticalDir != null && String(verticalDir) == 'up'
            let rawYaw = Number(cannonBe.getYawOffset(0))
            let rawPitch = Number(cannonBe.getPitchOffset(0))
            // Yaw 基准换算: 正立 cannonYaw = yaw_MC+180, 倒立 cannonYaw = yaw_MC (绕竖直轴旋转方向相反)
            let yawFlip = isInverted ? 0 : YAW_FLIP
            let curYaw = (rawYaw + yawFlip) % 360
            if (curYaw < 0) curYaw += 360
            // rawPitch = cannonPitch*downSgn (倒立取反), 反解真实仰角
            let curPitch = isInverted ? (rawPitch - 90) : (90 - rawPitch)
            console.log('[CBC Aim] 炮塔基座读回(' + (isInverted ? '倒立' : '正立') + '): rawYaw=' + rawYaw.toFixed(2) + ' (翻转' + yawFlip + '°→' + curYaw.toFixed(2) + ') rawPitch=' + rawPitch.toFixed(2) + ' → 仰角=' + curPitch.toFixed(2))
            return { yaw: curYaw, pitch: curPitch, isInverted: isInverted, rawYaw: rawYaw, rawPitch: rawPitch }
        }
    } catch (ex) {
        console.error('[CBC Aim] 读取基座当前角度出错: ' + ex)
        return null
    }
}

// ============ 计算并写入基座 ============

function computeAndApplyToBlock(block, player, level, clipboardData) {
    let config = AMMO_TYPES[clipboardData.ammoKey]
    if (config == null) {
        return { ok: false, msg: '§c剪切板中的弹种无法识别: ' + clipboardData.ammoKey }
    }

    // 右键时自动读取基座当前方位角/仰角 (取代手动 cyaw/cpitch)
    let currentAngles = readCurrentAngles(block, player)
    let rawYaw = currentAngles != null ? currentAngles.rawYaw : 0
    let rawPitch = currentAngles != null ? currentAngles.rawPitch : 0
    // 正立/倒立由 blockstate vertical_direction 判定 (readCurrentAngles 已读取):
    //   down=正立(炮口朝上), up=倒立(炮口朝下)
    let isInverted = currentAngles != null && currentAngles.isInverted == true
    let verticalSign = isInverted ? -1 : 1

    // 弹道高度常数与正/倒立判定一致 (由 vertical_direction 决定):
    //   down(正立) → 炮尾在基座上方2格 → 常数 +2
    //   up(倒立)   → 炮尾在基座下方2格 → 常数 -2
    // (assemble: assemblyPos = worldPosition.relative(vertical, -2))
    let ballisticSign = verticalSign

    // 基座坐标 (同原版: 方块底部作为起点)
    let sx = block.pos.x + 0.5
    let sy = block.pos.y
    let sz = block.pos.z + 0.5

    // 仰角扫描范围按基座类型与朝向决定 (各状态的物理可用射界):
    //   fixed_cannon_mount(水平): cannonPitch 配置 [-30,60] → 仰角射界 [-30°,60°]
    //   cannon_mount 正立:        cannonPitch [0,60] → 仰角射界 [30°,90°]
    //   cannon_mount 倒立:        cannonPitch [-90,0] → 仰角射界 [-90°,0°]
    let scanLow = -30, scanHigh = 60
    if (block.id != 'createbigcannons:fixed_cannon_mount') {
        if (isInverted) { scanLow = -90; scanHigh = 0 }
        else { scanLow = 30; scanHigh = 90 }
    }

    // 从装药=1开始递增，找到第一个能命中目标的解
    let charge = 1
    let result = null
    for (charge = 1; charge <= 50; charge++) {
        result = solve(sx, sy, sz, clipboardData.tx, clipboardData.ty, clipboardData.tz, charge, config, clipboardData.k, ballisticSign, scanLow, scanHigh)
        if (result != null) break
    }

    if (result == null) {
        // 分状态提示, 便于玩家判断是射程不足还是射界限制
        let hint
        if (block.id == 'createbigcannons:fixed_cannon_mount') {
            hint = '§c无法命中：目标超出射程或射界(水平基座 -30°~60°)，请靠近目标或加大炮管长k'
            return { ok: false, msg: hint }
        }
        hint = isInverted ? '§c无法命中：目标需位于基座下方或同高(倒立炮塔射界 -90°~0°)，或超出射程' : '§c无法命中：目标需高于基座30°以上(正立炮塔射界 30°~90°)，或超出射程'
        return { ok: false, msg: hint + '，请靠近目标或加大炮管长k' }
    }

    let pitch = result.pitch

    let R = Math.sqrt(result.dx*result.dx + result.dz*result.dz)
    let H = clipboardData.ty - sy
    let accurate = result.error < 5
    let color = accurate ? '§a' : '§e'
    let totalVel = charge + config.addedCharge

    // 方位角 (与原版一致): MC yaw 0=南, 90=西, 180=北, 270=东
    let yaw = Math.atan2(-result.dx, result.dz) * RAD_TO_DEG
    if (yaw < 0) yaw += 360

    // ---- 写入基座实体 ----
    let cannonBe = block.entity
    if (cannonBe == null) {
        return { ok: false, msg: '§c无法获取基座方块实体' }
    }

    let applyNote = ''
    let clipped = false
    let clamped = false
    // 仪表基准 (玩家在游戏中实际看到的数值):
    //   fixed: 滚动槽 slot 值;  cannon_mount: 创造仪表显示内部 cannonPitch/cannonYaw
    let curMeterYaw = rawYaw
    let curMeterPitch = rawPitch
    if (block.id != 'createbigcannons:fixed_cannon_mount') {
        curMeterPitch = isInverted ? -rawPitch : rawPitch   // 仪表 pitch = cannonPitch (倒立时 getPitchOffset 取反)
    }
    let targetMeterYaw = 0
    let targetMeterPitch = 0
    try {
        if (block.id == 'createbigcannons:fixed_cannon_mount') {
            // FixedCannonMount: 不提供公开 setYaw/setPitch, 但它实现
            // Create 的 ClipboardCloneable: readFromClipboard(CompoundTag, Player, Direction, boolean)
            // 写入 int 角度(范围 -45~45) (水平安装炮塔, 角度即显示角度)
            let dir = cannonBe.getContraptionDirection() != null ? cannonBe.getContraptionDirection() : $Direction.NORTH
            let baseYaw = dir.toYRot()

            let yawAdj = yaw - baseYaw
            while (yawAdj > 180) yawAdj -= 360
            while (yawAdj <= -180) yawAdj += 360

            // 方向符号: 与 CBC tick 逻辑一致 (PitchOrientedContraptionEntity.pitch = cannonPitch * sgn, cannonPitch=0)
            let axDirStr = String(dir.getAxisDirection())
            let axStr = String(dir.getAxis())
            let flag1 = (axDirStr == 'POSITIVE') == (axStr == 'X')
            let sgn = flag1 ? 1 : -1
            let pitchAdj = pitch * sgn

            if (yawAdj < -45) { yawAdj = -45; clipped = true }
            if (yawAdj > 45) { yawAdj = 45; clipped = true }
            if (pitchAdj < -45) { pitchAdj = -45; clipped = true }
            if (pitchAdj > 45) { pitchAdj = 45; clipped = true }
            if (clipped) {
                applyNote = ' §c(部分角度超出固定基座可调范围±45°，已截断)'
            }

            let clipTag = new $CompoundTag()
            clipTag.putInt('Pitch', Math.round(pitchAdj))
            clipTag.putInt('Yaw', Math.round(yawAdj))
            cannonBe.readFromClipboard(clipTag, player.minecraftEntity, $Direction.NORTH, false)
            targetMeterYaw = yawAdj
            targetMeterPitch = pitchAdj
        } else {
            // CannonMount: 垂直炮塔
            //   正立/倒立由 vertical_direction 决定 (用户确认规则):
            //     正立(down): cp = 90-θ  (θ∈[30,90] → cp∈[0,60])       cannonYaw = yaw_MC+180
            //     倒立(up):   cp = -90-θ (θ∈[-90,0] → cp∈[-90,0])      cannonYaw = yaw_MC
            //     (垂直炮塔炮口绕竖直轴旋转方向与水平炮塔相反; 正立由 MountedAutocannonContraption 骑乘 yaw=yRotO+180 印证,
            //       倒立因炮口朝下旋转方向再翻转 180°)
            //    弹道高度常数 ballisticSign 与正/倒立一致 (+2/-2)
            // 物理射界保险 clamp (solve 已按扫描范围限定, 此处防边界浮点误差)
            if (pitch < scanLow) { pitch = scanLow; clamped = true }
            if (pitch > scanHigh) { pitch = scanHigh; clamped = true }
            let cp = verticalSign * 90 - pitch
            let cannonYawVal = yaw + (isInverted ? 0 : 180)
            if (cannonYawVal >= 360) cannonYawVal -= 360
            if (clamped) {
                applyNote = ' §c(目标超出炮塔物理射界，仰角已截断到可用范围)'
            }
            cannonBe.setYaw(cannonYawVal)
            cannonBe.setPitch(cp)
            targetMeterYaw = cannonYawVal
            targetMeterPitch = cp
        }

        cannonBe.setChanged()
        level.sendBlockUpdated(block.pos, block.blockState, block.blockState, 3)
        console.log('[CBC Aim] 已写入基座(' + (isInverted ? '倒立' : '正立') + ', 弹道常数' + (ballisticSign > 0 ? '+' : '-') + '2) yaw=' + yaw.toFixed(2) + '(内部' + targetMeterYaw.toFixed(2) + ') pitch=' + pitch.toFixed(2) + '(内部' + targetMeterPitch.toFixed(2) + ') charge=' + charge)
    } catch (ex) {
        console.error('[CBC Aim] 写入基座出错: ' + ex)
        return { ok: false, msg: '§c写入基座出错: ' + ex }
    }

    let yawDisplay = yaw.toFixed(2) + '°'
    let lines = []
    lines.push('§6========== CBC 瞄准结果 ==========')
    lines.push('§e弹种: §f' + config.name + ' (' + clipboardData.ammoKey + ')')
    let facingNote = (isInverted ? '倒立(up)' : '正立(down)') + (block.id != 'createbigcannons:fixed_cannon_mount' ? ' (弹道常数' + (ballisticSign > 0 ? '+' : '-') + '2)' : '')
    lines.push('§e基座: §f[' + sx.toFixed(1) + ', ' + sy.toFixed(1) + ', ' + sz.toFixed(1) + '] (' + facingNote + ')  |  目标: §f[' + clipboardData.tx.toFixed(1) + ', ' + clipboardData.ty.toFixed(1) + ', ' + clipboardData.tz.toFixed(1) + ']')
    lines.push('§e水平距离: §f' + R.toFixed(1) + ' m  |  高度差: §f' + (H >= 0 ? '+' : '') + H.toFixed(1) + ' m')
    lines.push('§e装药: §f' + charge + (config.addedCharge > 0 ? ' (+弹头自带' + config.addedCharge + ')' : '') + '  |  等效初速: §f' + totalVel.toFixed(1))
    // 同时给出物理角度与"仪表基准"(玩家在创造仪表/滚动槽上看到的数值), 避免显示与实际调整对不上
    lines.push(color + '方向角(Yaw): §f' + yawDisplay + '  §7[仪表Yaw: ' + curMeterYaw.toFixed(1) + '°→' + targetMeterYaw.toFixed(1) + '°, 需调 ' + formatGearboxDiff(targetMeterYaw, curMeterYaw) + ']')
    lines.push(color + '仰角(Pitch): §f' + pitch.toFixed(2) + '°' + '   §7[仪表Pitch: ' + curMeterPitch.toFixed(1) + '°→' + targetMeterPitch.toFixed(1) + '°, 需调 ' + formatGearboxDiff(targetMeterPitch, curMeterPitch) + ']')
    if (clipped || clamped) lines.push(applyNote)
    lines.push('§6====================================')
    return { ok: true, msg: lines.join('\n'), yaw: yaw, pitch: pitch, charge: charge }
}

// ============ 指令注册 ============
ServerEvents.commandRegistry(function(event) {
    let Commands = event.commands
    let Arguments = event.arguments

    let L = function(n) { return Commands.literal(n) }
    let A = function(n, mi, ma) { return Commands.argument(n, $DArg.doubleArg(mi, ma)) }

    let rootCbcAimTo = L('cbc_aim_to')
        .requires(function(s) {
            let e = s.getEntity()
            return e !== null && e.isPlayer()
        })

// /cbc_aim_to <k> <tx> <ty> <tz>  → 写入副手剪切板 (cyaw/cpitch 改为右键基座时自动读取)
    rootCbcAimTo.then(
        A('k', 1, 100)
            .then(A('tx', -3e7, 3e7)
                .then(A('ty', -3e7, 3e7)
                    .then(A('tz', -3e7, 3e7)
                        .executes(function(ctx) {
                            try {
                                let playerEnt = ctx.getSource().getEntity()
                                let k = Number(Arguments.DOUBLE.getResult(ctx, 'k'))
                                let tx = Number(Arguments.DOUBLE.getResult(ctx, 'tx'))
                                let ty = Number(Arguments.DOUBLE.getResult(ctx, 'ty'))
                                let tz = Number(Arguments.DOUBLE.getResult(ctx, 'tz'))

                                let detected = getAmmoFromHand(playerEnt)
                                if (detected == null) {
                                    ctx.getSource().sendFailure($Component.literal('§c无法识别弹种: 主手没有持有CBC炮弹物品'))
                                    ctx.getSource().sendFailure($Component.literal('§e识别物品: solid_shot, he_shell, ap_shell, ap_shot, shrapnel_shell, bag_of_grapeshot, smoke_shell, fluid_shell, drop_mortar_shell, mortar_stone, traffic_cone, ap_autocannon_round, flak_autocannon_round, machine_gun_round'))
                                    ctx.getSource().sendFailure($Component.literal('§7提示: 手持CBC炮弹后再次执行指令即可'))
                                    return 0
                                }

                                let err = writeTargetToClipboard(playerEnt, k, tx, ty, tz, detected)
                                if (err != null) {
                                    ctx.getSource().sendFailure($Component.literal(err))
                                    return 0
                                }
                                ctx.getSource().sendSuccess($Component.literal('§a✓ 已写入副手剪切板: 目标[' + tx.toFixed(1) + ', ' + ty.toFixed(1) + ', ' + tz.toFixed(1) + '] 装药=待自动计算 弹种=' + detected.key), false)
                                ctx.getSource().sendSuccess($Component.literal('§7提示: 手持该剪切板右键 炮塔基座(cannon_mount/fixed_cannon_mount) 自动读取当前角度并瞄准'), false)
                                console.log('[CBC Aim] 写入剪切板: k=' + k + ' target=[' + tx + ',' + ty + ',' + tz + '] ammo=' + detected.key)
                                return 1
                            } catch (ex) {
                                ctx.getSource().sendFailure($Component.literal('§c执行出错: ' + ex))
                                console.error('[CBC Aim] ' + ex)
                                return 0
                            }
                        })
                    )
                )
            )
    )

    event.register(rootCbcAimTo)
    console.info('[CBC Aim] 指令已注册: /cbc_aim_to <k> <tx> <ty> <tz> (剪切板式, 当前角度右键自动读取)')
})

// ============================================
// 🎯 剪切板右键炮塔基座 → 自动瞄准
// ============================================

// 通用右键处理
function handleMountRightClick(event) {
    let block = event.block
    let player = event.player
    let level = event.level

    // 检查主手或副手是否有剪切板
    let clipboardItem = null
    let mainItem = player.getMainHandItem()
    let offItem = player.getOffhandItem()
    if (mainItem != null && !mainItem.isEmpty() && mainItem.id == 'create:clipboard') {
        clipboardItem = mainItem
    } else if (offItem != null && !offItem.isEmpty() && offItem.id == 'create:clipboard') {
        clipboardItem = offItem
    }
    if (clipboardItem == null) {
        return
    }

    // 客户端：cancel 阻止 GUI 打开（EventExit 终止客户端 handler）
    if (level.isClientSide()) {
        event.cancel()
        return
    }

    try {
        let data = readClipboardData(clipboardItem)
        if (data == null) {
            player.tell('§c剪切板中没有有效的瞄准数据 (请先 /cbc_aim_to 写入)')
            return
        }
        let result = computeAndApplyToBlock(block, player, level, data)
        player.tell(result.msg)
    } catch (ex) {
        console.error('[CBC Aim] 右键基座出错: ' + ex)
        if (event.player != null) {
            event.player.tell('§c应用剪切板数据出错: ' + ex)
        }
    }
}

BlockEvents.rightClicked("createbigcannons:cannon_mount", function(event) {
    handleMountRightClick(event)
})

BlockEvents.rightClicked("createbigcannons:fixed_cannon_mount", function(event) {
    handleMountRightClick(event)
})