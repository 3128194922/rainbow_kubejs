// 纳垢赐福离线验证：
// 用 TheBuff 替身执行真实的 server_scripts/radiation/main.js，
// 覆盖首层附着、30% 时长继承、10 层上限、动态上限与超额伤害。
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const SCRIPT_PATH = path.resolve(__dirname, '../server_scripts/radiation/main.js')
const RADIATION_ID = 'thebuff:radiation'

function makeCollection(list) {
    return {
        iterator() {
            let index = 0
            return {
                hasNext() { return index < list.length },
                next() { const value = list[index]; index++; return value },
            }
        },
    }
}

function makeEntity(id, harmfulCount) {
    const effects = []
    for (let i = 0; i < harmfulCount; i++) {
        effects.push({ getEffect: () => ({ getCategory: () => 'HARMFUL' }) })
    }
    // 非负面效果不应计入上限
    effects.push({ getEffect: () => ({ getCategory: () => 'BENEFICIAL' }) })
    return {
        id,
        getId: () => id,
        isAlive: () => true,
        getActiveEffects: () => makeCollection(effects),
    }
}

function createHarness() {
    const instances = new Map()
    const damageLog = []
    const sandbox = {}
    sandbox.global = sandbox
    sandbox.console = { log: () => {} }

    function mergeDuration(current, incoming) {
        if (current < 0 || incoming < 0) return -1
        return Math.max(current, incoming)
    }

    sandbox.TheBuff = {
        getInstance(target) {
            const entry = instances.get(target.id)
            if (!entry) return null
            return {
                amplifier: entry.amplifier,
                duration: entry.duration,
                isPermanent: () => entry.duration < 0,
            }
        },
        apply(target, id, duration, amplifier) {
            assert.equal(id, RADIATION_ID)
            const entry = instances.get(target.id)
            if (!entry) {
                instances.set(target.id, { amplifier, duration })
            } else {
                entry.amplifier = Math.max(entry.amplifier, amplifier)
                entry.duration = mergeDuration(entry.duration, duration)
            }
            // 模拟 TheBuff 在 apply 内同步触发 onApply，再由 startup 回调消费超额伤害
            sandbox.global.consumeRadiationExcess({
                entity: target,
                damage: amount => damageLog.push({ entityId: target.id, amount }),
            })
            return true
        },
        setDuration(target, id, duration) {
            assert.equal(id, RADIATION_ID)
            const entry = instances.get(target.id)
            if (!entry) return false
            entry.duration = duration
            return true
        },
    }

    vm.createContext(sandbox)
    vm.runInContext(fs.readFileSync(SCRIPT_PATH, 'utf8'), sandbox, { filename: SCRIPT_PATH })
    return { sandbox, instances, damageLog }
}

function apply(harness, target, baseDuration) {
    return harness.sandbox.global.applyRadiation(target, { id: 999 }, baseDuration)
}

test('纳垢赐福首次附着为 1 层、20 tick，且不造成即时伤害', () => {
    const harness = createHarness()
    const entity = makeEntity(1, 0)
    assert.equal(apply(harness, entity, 20), true)
    const state = harness.instances.get(1)
    assert.equal(state.amplifier, 0)
    assert.equal(state.duration, 20)
    assert.deepEqual(harness.damageLog, [])
})

test('已有纳垢赐福时层数 +1，新时长 = 20 + 旧剩余 30%', () => {
    const harness = createHarness()
    const entity = makeEntity(2, 0)
    apply(harness, entity, 20)
    apply(harness, entity, 20)
    const state = harness.instances.get(2)
    assert.equal(state.amplifier, 1)
    assert.equal(state.duration, 20 + Math.floor(20 * 0.3))
})

test('无负面药水时上限为 10 层，超出层数立即结算等量伤害', () => {
    const harness = createHarness()
    const entity = makeEntity(3, 0)
    for (let i = 0; i < 10; i++) apply(harness, entity, 20)
    assert.equal(harness.instances.get(3).amplifier, 9)
    assert.deepEqual(harness.damageLog, [])

    apply(harness, entity, 20)
    assert.equal(harness.instances.get(3).amplifier, 9)
    assert.deepEqual(harness.damageLog, [{ entityId: 3, amount: 1 }])
})

test('每个负面药水效果使上限 +1', () => {
    const harness = createHarness()
    const entity = makeEntity(4, 2)
    for (let i = 0; i < 12; i++) apply(harness, entity, 20)
    assert.equal(harness.instances.get(4).amplifier, 11)
    assert.deepEqual(harness.damageLog, [])

    apply(harness, entity, 20)
    assert.equal(harness.instances.get(4).amplifier, 11)
    assert.deepEqual(harness.damageLog, [{ entityId: 4, amount: 1 }])
})

test('永久纳垢赐福再次附着时保持永久', () => {
    const harness = createHarness()
    const entity = makeEntity(5, 0)
    harness.instances.set(5, { amplifier: 4, duration: -1 })
    apply(harness, entity, 20)
    const state = harness.instances.get(5)
    assert.equal(state.amplifier, 5)
    assert.equal(state.duration, -1)
})

test('旧层数高于当前上限时不因药水消失而掉层', () => {
    const harness = createHarness()
    const entity = makeEntity(6, 0)
    harness.instances.set(6, { amplifier: 11, duration: 20 })
    apply(harness, entity, 20)
    const state = harness.instances.get(6)
    assert.equal(state.amplifier, 11)
    assert.equal(state.duration, 20 + Math.floor(20 * 0.3))
    assert.deepEqual(harness.damageLog, [{ entityId: 6, amount: 1 }])
})
