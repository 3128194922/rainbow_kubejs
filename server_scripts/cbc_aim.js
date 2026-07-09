// priority: 0
// ============================================
// CBC 火炮瞄准计算工具 (自动识别弹种)
// 用法:
//   /cbc_aim_to <k> <cyaw> <cpitch> <tx> <ty> <tz>                    - 自动底座坐标(射线)+自动识别弹种
//   /cbc_aim_to <sx> <sy> <sz> <k> <cyaw> <cpitch> <tx> <ty> <tz>    - 手动底座坐标+自动识别弹种
// 参数: k=炮管长  cyaw=当前方位角(南0)  cpitch=当前仰角(水平0)
// 装药量由系统自动计算最小需求，齿轮箱输出含角度差+序列分解
// 识别物品: solid_shot, he_shell, ap_shell, ap_shot, shrapnel_shell,
//           bag_of_grapeshot, smoke_shell, fluid_shell, drop_mortar_shell,
//           mortar_stone, traffic_cone,
//           ap_autocannon_round, flak_autocannon_round, machine_gun_round (机炮弹药)
// ============================================

const $DArg = Java.loadClass('com.mojang.brigadier.arguments.DoubleArgumentType')
const $Component = Java.loadClass('net.minecraft.network.chat.Component')

// ============ 弹药类型弹道参数 ============
// 数据来源: Create Big Cannons v6 源码 munition_properties/projectiles/*.json
var AMMO_TYPES = {
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
        name: '迫击炮弹(Drop Mortar)',
        gravity: -0.05,
        drag: 0.01,
        quadratic: false,
        addedCharge: 2.0
    },
    mortar_stone: {
        name: '迫击石(Mortar Stone)',
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
    // 数据来源: Create Big Cannons v6 源码 munition_properties/projectiles/
    // ap_autocannon.json, flak_autocannon.json, machine_gun_bullet.json
    // 机炮弹药 gravity=-0.025(减半重力，弹道更平直), drag=0.01(与常规炮弹相同)
    ap_autocannon_round: {
        name: 'AP自动炮弹(AP Autocannon)',
        gravity: -0.025,
        drag: 0.01,
        quadratic: false,
        addedCharge: 0
    },
    flak_autocannon_round: {
        name: '高射自动炮弹(Flak Autocannon)',
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

// ============ 物品ID→弹药类型映射 (用于自动检测) ============
var ITEM_TO_AMMO = {
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
    // ============ 机炮弹药 (Autocannon) ============
    'createbigcannons:ap_autocannon_round': 'ap_autocannon_round',
    'createbigcannons:flak_autocannon_round': 'flak_autocannon_round',
    'createbigcannons:machine_gun_round': 'machine_gun_round'
}

// 从玩家主手物品自动识别弹药类型, 返回 { key, config } 或 null
function getAmmoFromHand(player) {
    try {
        var stack = player.getMainHandItem()
        if (stack == null || stack.isEmpty()) {
            return null
        }
        var itemId = stack.getItem().id
        var key = ITEM_TO_AMMO[itemId]
        if (key != null) {
            return { key: key, config: AMMO_TYPES[key] }
        }
        return null
    } catch (ex) {
        console.error('[CBC Aim] getAmmoFromHand出错: ' + ex)
        return null
    }
}

var G_MUL = 1.0         // 维度重力倍率
var D_MUL = 1.0         // 维度阻力倍率
var MAX_TICKS = 800     // 最大模拟tick数
var PITCH_MIN = -30     // 最小仰角（度）范围限制：-30 ~ 60
var PITCH_MAX = 60      // 最大仰角（度）范围限制：-30 ~ 60
var PITCH_TOL = 0.005   // 仰角精度
var MAX_ITER = 60       // 最大迭代次数
var GEAR_RATIO = 8      // Create 齿轮箱传动比（8:1 = 8圈应力齿=1圈输出）

// ============ 弹道模型（Python 解析算法）============

// Math.PI 在 KubeJS Rhino 中返回 undefined，需硬编码
var PI = 3.141592653589793
var RAD_TO_DEG = 180 / PI

// 通用弹道函数：给定仰角、速度系数 n、炮管长 k、水平距离 x、弹药配置 config，返回高度 y
// 使用 config.gravity 和 config.drag 替代硬编码常量，兼容不同弹种
function ballisticFunction(tDeg, n, k, x, config) {
    var g = config.gravity
    var d = config.drag
    if (d <= 0) d = 0.01    // 安全兜底

    // g 为负值（如 -0.05），d 为正值（如 0.01）
    // 标准弹: -g/d = 5, -g/d² = 500
    // 机炮弹: -g/d = 2.5, -g/d² = 250
    var gDivD = -g / d
    var gDivD2 = -g / (d * d)

    var t = tDeg * PI / 180
    var cosT = Math.cos(t)
    if (Math.abs(cosT) < 1e-6) return -999999
    var secT = 1 / cosT
    var tanT = Math.tan(t)
    var innerTerm = (x * secT - k) / (100 * n)
    if (1 - innerTerm <= 0) return null
    var logPart = gDivD2 * Math.log(1 - innerTerm)
    return ((gDivD * secT) / n + tanT) * x + logPart - (gDivD * k) / n + 2
}

// 计算飞行时间（秒）
function flightTime(tDeg, n, k, x) {
    var t = tDeg * PI / 180
    var cosT = Math.cos(t)
    if (Math.abs(cosT) < 1e-6) return 0
    var secT = 1 / cosT
    var innerTerm = (x * secT - k) / (100 * n)
    if (1 - innerTerm <= 1e-9) return 0
    var ticks = Math.log(1 - innerTerm) / Math.log(0.99)
    return ticks / 20
}

// 将角度转换为 Create 齿轮箱格式：总应力齿 → 圈数 + 余数
function formatGearbox(angleDeg) {
    var stress = angleDeg * GEAR_RATIO
    var turns = Math.floor(stress / 360)
    var remainder = stress % 360
    return turns + '圈 ' + remainder.toFixed(1) + '°'
}

// 角度差 → 齿轮箱格式（含正负号）
function formatGearboxDiff(targetDeg, currentDeg) {
    var diff = targetDeg - currentDeg
    while (diff > 180) diff -= 360
    while (diff <= -180) diff += 360
    var totalStress = diff * GEAR_RATIO
    var sign = totalStress >= 0 ? '+' : '-'
    var absStress = Math.abs(totalStress)
    var turns = Math.floor(absStress / 360)
    var remainder = absStress % 360
    return diff.toFixed(2) + '° (' + sign + turns + '圈 ' + sign + remainder.toFixed(1) + '°)'
}

// 齿轮箱序列：角度 × 次数 分解
function gearboxSequence(targetDeg, currentDeg) {
    var diff = targetDeg - currentDeg
    while (diff > 180) diff -= 360
    while (diff <= -180) diff += 360
    var totalStress = diff * GEAR_RATIO
    var absStress = Math.abs(totalStress)
    var turns = Math.floor(absStress / 360)
    var remainder = absStress % 360
    var parts = []
    if (turns > 0) parts.push('角度 360° ×' + turns + '次')
    if (remainder > 0.1) parts.push('角度 ' + remainder.toFixed(1) + '° ×1次')
    return parts.length > 0 ? parts.join(' + ') : '0次'
}

// ============ 仰角数值求解（Python 扫描+二分法）============

function solve(sx, sy, sz, tx, ty, tz, charge, config, barrelLen) {
    var dx = tx - sx, dz = tz - sz
    var R = Math.sqrt(dx*dx + dz*dz)
    var dy = ty - sy
    var n = charge * 2  // v0.5+ 模式：装药×2 = 速度系数

    if (R < 0.5) {
        return { pitch: 90, dx: dx, dz: dz, error: 0 }
    }

    var lowBound = PITCH_MIN
    var highBound = PITCH_MAX
    var step = 0.5
    var solutions = []

    function getDiff(angle) {
        var y = ballisticFunction(angle, n, barrelLen, R, config)
        if (y == null) return null
        return y - dy
    }

    // 扫描角度区间，寻找符号变化（即解）
    var prevDiff = getDiff(lowBound)
    var stepsCount = Math.floor((highBound - lowBound) / step)

    for (var i = 0; i < stepsCount; i++) {
        var currAngle = lowBound + (i + 1) * step
        var currDiff = getDiff(currAngle)
        if (currDiff == null) {
            prevDiff = null
            continue
        }
        if (prevDiff != null && (prevDiff * currDiff < 0)) {
            // 符号变化 → 该区间内存在解 → 二分法精确求解
            var bLow = currAngle - step
            var bHigh = currAngle
            for (var j = 0; j < 30; j++) {
                var bMid = (bLow + bHigh) / 2
                var midDiff = getDiff(bMid)
                if (midDiff == null) { bLow = bMid; continue }
                if (Math.abs(midDiff) < 1e-9) break
                if (midDiff * prevDiff > 0) bLow = bMid
                else bHigh = bMid
            }
            var finalSol = (bLow + bHigh) / 2
            var finalErr = Math.abs(getDiff(finalSol))
            solutions.push({ pitch: finalSol, error: finalErr })
        } else if (currDiff != null && Math.abs(currDiff) < 1e-5) {
            solutions.push({ pitch: currAngle, error: Math.abs(currDiff) })
        }
        prevDiff = currDiff
    }

    if (solutions.length === 0) return null

    // 按仰角排序，拆分为曲射(pitch>33°)和直射(pitch<=33°)
    solutions.sort(function(a, b) { return a.pitch - b.pitch })
    var curveIdx = -1
    var flatIdx = -1
    for (var i = 0; i < solutions.length; i++) {
        if (solutions[i].pitch > 33) {
            if (curveIdx < 0) curveIdx = i
        } else {
            flatIdx = i
        }
    }

    var preferCurve = Math.abs(dy) > 5 || R > 150
    var best = null

    if (preferCurve && curveIdx >= 0) {
        // 条件满足且曲射有解 → 选最高仰角曲射解
        best = solutions[solutions.length - 1]
    } else if (!preferCurve && flatIdx >= 0) {
        // 条件不满足且直射有解 → 选最高仰角直射解（最接近33°）
        best = solutions[flatIdx]
    } else if (curveIdx >= 0) {
        // 回退：曲射有解就用曲射
        best = solutions[solutions.length - 1]
    } else if (flatIdx >= 0) {
        // 回退：直射有解就用直射
        best = solutions[flatIdx]
    }

    if (best == null) return null

    return { pitch: best.pitch, dx: dx, dz: dz, error: best.error }
}

// ============ 指令处理 ============

function doAim(ctx, sx, sy, sz, tx, ty, tz, barrelLen, cyaw, cpitch, config, ammoKey) {
    var src = ctx.getSource()

    var dx = tx - sx, dz = tz - sz
    var tgtR = Math.sqrt(dx*dx + dz*dz)

    // 从装药=1开始递增，找到第一个能命中目标的解
    var charge = 1
    var result = null
    for (charge = 1; charge <= 50; charge++) {
        result = solve(sx, sy, sz, tx, ty, tz, charge, config, barrelLen)
        if (result != null) break
    }

    if (result == null) {
        src.sendSuccess($Component.literal('§c无法命中：目标超出射程，请靠近或使用手动底座7参模式'), false)
        return 1
    }

    // 仰角限制在 -30° ~ 60° 范围内
    if (result.pitch != null) {
        if (result.pitch < -30) result.pitch = -30
        if (result.pitch > 60) result.pitch = 60
    }

    var R = tgtR
    var H = ty - sy
    var ok = result.error < 5
    var color = ok ? '§a' : '§e'
    var totalVel = charge + config.addedCharge

    var yawDeg = Math.atan2(-dx, dz) * RAD_TO_DEG
    if (yawDeg < 0) yawDeg += 360 // 规范化为 0-360（atan2 返回 -180~180）
    var yawDisplay = yawDeg.toFixed(2) + '°'

    src.sendSuccess($Component.literal('§6========== CBC 瞄准计算结果 =========='), false)
    src.sendSuccess($Component.literal('§e弹药类型: §f' + config.name + ' (' + ammoKey + ')'), false)
    src.sendSuccess($Component.literal('§e起点: §f[' + sx.toFixed(1) + ', ' + sy.toFixed(1) + ', ' + sz.toFixed(1) + ']  |  炮管长: §f' + barrelLen + ' m'), false)
    src.sendSuccess($Component.literal('§e目标: §f[' + tx.toFixed(1) + ', ' + ty.toFixed(1) + ', ' + tz.toFixed(1) + ']'), false)
    src.sendSuccess($Component.literal('§e水平距离: §f' + R.toFixed(1) + ' m  |  高度差: §f' + (H >= 0 ? '+' : '') + H.toFixed(1) + ' m  |  ' + (Math.abs(H) > 5 || R > 150 ? '§a曲射优先' : '§7直射优先')), false)
    src.sendSuccess($Component.literal('§e装药量: §f' + charge + (config.addedCharge > 0 ? ' (含弹头自带 +' + config.addedCharge + ')' : '')), false)
    src.sendSuccess($Component.literal('§e等效初速度: §f' + totalVel.toFixed(1)), false)
    src.sendSuccess($Component.literal(''), false)
    src.sendSuccess($Component.literal(color + '方向角(Yaw): §f' + yawDisplay + '  §7[需调: ' + formatGearboxDiff(yawDeg, cyaw) + ']'), false)
    src.sendSuccess($Component.literal(color + '仰角(Pitch): §f' + result.pitch.toFixed(2) + '°  §7[需调: ' + formatGearboxDiff(result.pitch, cpitch) + '] '), false)
    src.sendSuccess($Component.literal(''), false)
    src.sendSuccess($Component.literal('§6===================================='), false)

    // ===== 写入副手剪切板（如持有） =====
    try {
        var player = src.getEntity()
        if (player != null && player.isPlayer()) {
            var offhand = player.getOffhandItem()
            if (offhand != null && !offhand.isEmpty() && offhand.id == 'create:clipboard') {
                var $CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag')
                var $ListTag = Java.loadClass('net.minecraft.nbt.ListTag')

                var tag = offhand.getOrCreateTag()
                var pagesList = new $ListTag()
                var page = new $CompoundTag()
                var entriesList = new $ListTag()

                var e0 = new $CompoundTag()
                e0.putString('Text', '{"text":"方向角: ' + yawDeg.toFixed(2) + '°"}')
                e0.putBoolean('Checked', false)
                entriesList.add(e0)

                var e1 = new $CompoundTag()
                e1.putString('Text', '{"text":"仰角: ' + result.pitch.toFixed(2) + '°"}')
                e1.putBoolean('Checked', false)
                entriesList.add(e1)

                var e2 = new $CompoundTag()
                e2.putString('Text', '{"text":"水平距离: ' + R.toFixed(1) + ' m"}')
                e2.putBoolean('Checked', false)
                entriesList.add(e2)

                var e3 = new $CompoundTag()
                e3.putString('Text', '{"text":"高度差: ' + (H >= 0 ? '+' : '') + H.toFixed(1) + ' m"}')
                e3.putBoolean('Checked', false)
                entriesList.add(e3)

                var e4 = new $CompoundTag()
                e4.putString('Text', '{"text":"装药量: ' + charge + '"}')
                e4.putBoolean('Checked', false)
                entriesList.add(e4)

                var e5 = new $CompoundTag()
                e5.putString('Text', '{"text":"弹药: ' + config.name + '"}')
                e5.putBoolean('Checked', false)
                entriesList.add(e5)

                page.put('Entries', entriesList)
                pagesList.add(page)

                tag.put('Pages', pagesList)
                tag.putInt('Type', 1)
                tag.putInt('PreviouslyOpenedPage', 0)

                offhand.nbt = tag

                src.sendSuccess($Component.literal('§a✓ 已将方向角/仰角数据写入副手剪切板'), false)
            }
        }
    } catch (ex) {
        console.error('[CBC Aim] 写入剪切板出错: ' + ex)
    }

    return 1
}

// ============ 指令注册 ============

ServerEvents.commandRegistry(function(event) {
    var Commands = event.commands
    var Arguments = event.arguments

    var L = function(n) { return Commands.literal(n) }
    var A = function(n, mi, ma) { return Commands.argument(n, $DArg.doubleArg(mi, ma)) }

    // 执行体: 从玩家获取detected, 再用指定坐标跑doAim
    function makeExec(sx, sy, sz) {
        return function(ctx) {
            try {
                var p = ctx.getSource().getEntity()
                var k = Number(Arguments.DOUBLE.getResult(ctx, 'k'))
                var cyaw = Number(Arguments.DOUBLE.getResult(ctx, 'cyaw'))
                var cpitch = Number(Arguments.DOUBLE.getResult(ctx, 'cpitch'))
                var tx = Number(Arguments.DOUBLE.getResult(ctx, 'tx'))
                var ty = Number(Arguments.DOUBLE.getResult(ctx, 'ty'))
                var tz = Number(Arguments.DOUBLE.getResult(ctx, 'tz'))
                var detected = getAmmoFromHand(p)
                if (detected == null) {
                    ctx.getSource().sendFailure($Component.literal('§c无法识别弹种: 主手没有持有CBC炮弹物品'))
                    ctx.getSource().sendFailure($Component.literal('§e识别物品: solid_shot, he_shell, ap_shell, ap_shot, shrapnel_shell, bag_of_grapeshot, smoke_shell, fluid_shell, drop_mortar_shell, mortar_stone, traffic_cone, ap_autocannon_round, flak_autocannon_round, machine_gun_round'))
                    ctx.getSource().sendFailure($Component.literal('§7提示: 手持CBC炮弹后再次执行指令即可'))
                    return 0
                }
                return doAim(ctx, sx, sy, sz, tx, ty, tz, k, cyaw, cpitch, detected.config, detected.key)
            } catch (ex) {
                ctx.getSource().sendFailure($Component.literal('§c执行出错: ' + ex))
                console.error('[CBC Aim] ' + ex)
                return 0
            }
        }
    }

    var rootCbcAimTo = L('cbc_aim_to')
        .requires(function(s) {
            var e = s.getEntity()
            return e !== null && e.isPlayer()
        })

    // 路径1: /cbc_aim_to <k> <cyaw> <cpitch> <tx> <ty> <tz>  → 自动底座坐标(射线)
    rootCbcAimTo.then(
        A('k', 1, 50)
            .then(A('cyaw', 0, 360)
                .then(A('cpitch', -30, 60)
                    .then(A('tx', -3e7, 3e7)
                        .then(A('ty', -3e7, 3e7)
                            .then(A('tz', -3e7, 3e7)
                                .executes(function(ctx) {
                                    try {
                                        var p = ctx.getSource().getEntity()
                                        var sx = p.x, sy = p.y, sz = p.z
                                        // 射线检测玩家正对的方块作为初始坐标
                                        var hit = p.rayTrace(100, false)
                                        if (hit != null) {
                                            var block = hit.block
                                            if (block != null) {
                                                var pos = block.pos
                                                if (pos != null) {
                                                    sx = pos.x + 0.5
                                                    sy = pos.y
                                                    sz = pos.z + 0.5
                                                }
                                            }
                                        }
                                        return makeExec(sx, sy, sz)(ctx)
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
                )
            )

    // 路径2: /cbc_aim_to <sx> <sy> <sz> <k> <cyaw> <cpitch> <tx> <ty> <tz> → 手动起点
    rootCbcAimTo.then(
        A('sx', -3e7, 3e7)
            .then(A('sy', -3e7, 3e7)
                .then(A('sz', -3e7, 3e7)
                    .then(A('k', 1, 50)
                        .then(A('cyaw', 0, 360)
                            .then(A('cpitch', -30, 60)
                                .then(A('tx', -3e7, 3e7)
                                    .then(A('ty', -3e7, 3e7)
                                        .then(A('tz', -3e7, 3e7)
                                            .executes(function(ctx) {
                                                try {
                                                    var sx = Number(Arguments.DOUBLE.getResult(ctx, 'sx'))
                                                    var sy = Number(Arguments.DOUBLE.getResult(ctx, 'sy'))
                                                    var sz = Number(Arguments.DOUBLE.getResult(ctx, 'sz'))
                                                    var k = Number(Arguments.DOUBLE.getResult(ctx, 'k'))
                                                    var cyaw = Number(Arguments.DOUBLE.getResult(ctx, 'cyaw'))
                                                    var cpitch = Number(Arguments.DOUBLE.getResult(ctx, 'cpitch'))
                                                    var p = ctx.getSource().getEntity()
                                                    var tx = Number(Arguments.DOUBLE.getResult(ctx, 'tx'))
                                                    var ty = Number(Arguments.DOUBLE.getResult(ctx, 'ty'))
                                                    var tz = Number(Arguments.DOUBLE.getResult(ctx, 'tz'))
                                                    var detected = getAmmoFromHand(p)
                                                    if (detected == null) {
                                                        ctx.getSource().sendFailure($Component.literal('§c无法识别弹种: 主手没有持有CBC炮弹物品'))
                                                        ctx.getSource().sendFailure($Component.literal('§e识别物品: solid_shot, he_shell, ap_shell, ap_shot, shrapnel_shell, bag_of_grapeshot, smoke_shell, fluid_shell, drop_mortar_shell, mortar_stone, traffic_cone, ap_autocannon_round, flak_autocannon_round, machine_gun_round'))
                                                        ctx.getSource().sendFailure($Component.literal('§7提示: 手持CBC炮弹后再次执行指令即可'))
                                                        return 0
                                                    }
                                                    return doAim(ctx, sx, sy, sz, tx, ty, tz, k, cyaw, cpitch, detected.config, detected.key)
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
                        )
                    )
                )
            )
    )

    event.register(rootCbcAimTo)

    console.info('[CBC Aim] 指令已注册: /cbc_aim_to <k> <cyaw> <cpitch> <tx> <ty> <tz> (自动底座+自动最小装药+齿轮箱序列)')
})

// ============================================
// 🎯 剪切板右键写入炮架角度
// 手持 create:clipboard 右键 cannon_mount / fixed_cannon_mount 时，
// 从剪切板第1-2条目读取方向角/仰角并写入 BlockEntity
// ============================================
BlockEvents.rightClicked("createbigcannons:cannon_mount", function(event) {
    var block = event.block
    var player = event.player
    var level = event.level
    var hand = event.hand

    console.log('[CBC Aim-DBG] rightClicked fired | block=' + block.id + ' hand=' + hand + ' side=' + (level.isClientSide() ? 'CLIENT' : 'SERVER'))

    // 检查主手或副手是否有剪切板
    var clipboardItem = null
    var mainItem = player.getMainHandItem()
    var offItem = player.getOffhandItem()
    if (mainItem != null && !mainItem.isEmpty() && mainItem.id == 'create:clipboard') {
        clipboardItem = mainItem
        console.log('[CBC Aim-DBG] 主手检测到剪切板')
    } else if (offItem != null && !offItem.isEmpty() && offItem.id == 'create:clipboard') {
        clipboardItem = offItem
        console.log('[CBC Aim-DBG] 副手检测到剪切板')
    }
    if (clipboardItem == null) {
        console.log('[CBC Aim-DBG] 未检测到剪切板，跳过')
        return
    }

    // 客户端：cancel 阻止 GUI 打开（EventExit 终止客户端 handler，正常行为）
    // 服务端：不 cancel，否则 EventExit 会跳过后续 NTT/BE 修改代码
    if (level.isClientSide()) {
        event.cancel()
        console.log('[CBC Aim-DBG] 客户端 cancel 已调用，阻止 GUI')
        return
    }

    console.log('[CBC Aim-DBG] 服务端：不调用 cancel，直接处理...')

    console.log('[CBC Aim-DBG] 开始处理服务端逻辑...')

    try {
        var tag = clipboardItem.getOrCreateTag()
        console.log('[CBC Aim-DBG] tag=' + (tag == null ? 'null' : 'ok') + ' containsPages=' + (tag != null ? tag.contains('Pages') : 'N/A'))
        if (tag == null || !tag.contains('Pages')) {
            player.tell('§c剪切板中没有数据')
            return
        }

        var pages = tag.getList('Pages', 10) // 10 = TAG_COMPOUND
        console.log('[CBC Aim-DBG] pages.size=' + pages.size())
        if (pages.size() == 0) {
            player.tell('§c剪切板中没有数据')
            return
        }

        var page = pages.getCompound(0)
        console.log('[CBC Aim-DBG] page containsEntries=' + page.contains('Entries'))
        if (!page.contains('Entries')) {
            player.tell('§c剪切板数据页中没有条目')
            return
        }

        var entries = page.getList('Entries', 10)
        console.log('[CBC Aim-DBG] entries.size=' + entries.size())
        if (entries.size() < 2) {
            player.tell('§c剪切板数据条目不足（需要至少2条：方向角+仰角）')
            return
        }

        // 解析条目0（方向角）和条目1（仰角）
        var text0Json = entries.getCompound(0).getString('Text')
        var text1Json = entries.getCompound(1).getString('Text')
        console.log('[CBC Aim-DBG] raw text0=' + text0Json)
        console.log('[CBC Aim-DBG] raw text1=' + text1Json)

        var text0 = JSON.parse(text0Json)
        var text1 = JSON.parse(text1Json)
        var display0 = text0.text
        var display1 = text1.text
        console.log('[CBC Aim-DBG] parsed display0=' + display0 + ' display1=' + display1)

        if (display0 == null || display1 == null) {
            player.tell('§c无法解析剪切板文本组件数据')
            return
        }

        // 提取数值: 格式 "方向角: 123.45°" 或 "仰角: 12.34°"
        var yawParts = display0.split(': ')
        var pitchParts = display1.split(': ')
        console.log('[CBC Aim-DBG] yawParts.len=' + yawParts.length + ' pitchParts.len=' + pitchParts.length)
        if (yawParts.length < 2 || pitchParts.length < 2) {
            player.tell('§c剪切板数据格式错误，需要 "方向角: 数值°" 和 "仰角: 数值°"')
            return
        }

        var yawStr = yawParts[1].replace('°', '').trim()
        var pitchStr = pitchParts[1].replace('°', '').trim()
        var yaw = parseFloat(yawStr)
        var pitch = parseFloat(pitchStr)
        console.log('[CBC Aim-DBG] yaw=' + yaw + ' pitch=' + pitch + ' isNaN=' + (isNaN(yaw) || isNaN(pitch)))

        if (isNaN(yaw) || isNaN(pitch)) {
            player.tell('§c剪切板数据中的角度值无效')
            return
        }

        // 写入炮架 BlockEntity
        var be = block.entity
        console.log('[CBC Aim-DBG] block.entity=' + (be == null ? 'null' : be.getClass().getName()))
        if (be == null) {
            player.tell('§c无法获取方块实体')
            return
        }

        if (block.id == 'createbigcannons:cannon_mount') {
            // CannonMountBlockEntity 有公开 setter
            // 注意：仅当已组装(assembled)且转速为0时生效，否则tick中会覆盖
            console.log('[CBC Aim-DBG] 准备调用 CannonMount.setYaw/setPitch')
            be.setYaw(yaw)
            be.setPitch(pitch)
            console.log('[CBC Aim-DBG] CannonMount.setYaw/setPitch 调用完成')
        }

        // 标记更新并同步客户端
        be.setChanged()
        level.sendBlockUpdated(block.pos, block.blockState, block.blockState, 3)
        console.log('[CBC Aim-DBG] setChanged + sendBlockUpdated 完成')

        player.tell('§a✓ 炮架角度已应用: 方向角=' + yaw.toFixed(2) + '°, 仰角=' + pitch.toFixed(2) + '°')
        console.log('[CBC Aim-DBG] 全部完成')

    } catch (ex) {
        console.error('[CBC Aim] 右键炮架写入角度出错: ' + ex)
        if (event.player != null) {
            event.player.tell('§c应用剪切板数据出错: ' + ex)
        }
    }
})
