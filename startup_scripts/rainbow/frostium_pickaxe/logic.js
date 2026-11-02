// 始冰镐范围模式的纯逻辑函数，供 main.js 和 Node 测试共同使用。

// 模式数组保留原轮换顺序；独立索引表负责常数时间合法性和序号查询。
const FROSTIUM_PICKAXE_MODES = [1, 3, 5, 7]
const FROSTIUM_PICKAXE_MODE_INDEX = { '1': 0, '3': 1, '5': 2, '7': 3 }

function getNextFrostiumMode(currentMode) {
    let index = FROSTIUM_PICKAXE_MODE_INDEX[String(Number(currentMode))]
    if (index === undefined) return FROSTIUM_PICKAXE_MODES[0]
    return FROSTIUM_PICKAXE_MODES[(index + 1) % FROSTIUM_PICKAXE_MODES.length]
}

function getFrostiumPlane(viewVector) {
    let x = Math.abs(Number(viewVector.x))
    let y = Math.abs(Number(viewVector.y))
    let z = Math.abs(Number(viewVector.z))

    if (y >= x && y >= z) return 'y'
    if (x >= z) return 'x'
    return 'z'
}

function getFrostiumPlaneFromFace(face) {
    if (face == 'up' || face == 'down') return 'y'
    if (face == 'east' || face == 'west') return 'x'
    if (face == 'north' || face == 'south') return 'z'
    return null
}

function getFrostiumTargets(center, mode, plane) {
    let normalizedMode = Number(mode)
    if (FROSTIUM_PICKAXE_MODE_INDEX[String(normalizedMode)] === undefined) normalizedMode = 1

    let radius = (normalizedMode - 1) / 2
    let targets = []

    for (let first = -radius; first <= radius; first++) {
        for (let second = -radius; second <= radius; second++) {
            if (plane == 'x') {
                targets.push({ x: center.x, y: center.y + first, z: center.z + second })
            } else if (plane == 'z') {
                targets.push({ x: center.x + first, y: center.y + second, z: center.z })
            } else {
                targets.push({ x: center.x + first, y: center.y, z: center.z + second })
            }
        }
    }

    return targets
}
