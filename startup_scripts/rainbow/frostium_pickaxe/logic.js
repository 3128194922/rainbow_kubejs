// 始冰镐范围模式的纯逻辑函数，供 main.js 和 Node 测试共同使用。

const FROSTIUM_PICKAXE_MODES = [3, 5, 7]

function getNextFrostiumMode(currentMode) {
    let index = FROSTIUM_PICKAXE_MODES.indexOf(Number(currentMode))
    if (index < 0) return FROSTIUM_PICKAXE_MODES[0]
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
    if (FROSTIUM_PICKAXE_MODES.indexOf(normalizedMode) < 0) normalizedMode = 3

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
