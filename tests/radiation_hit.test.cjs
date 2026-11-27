// 纳垢之剑命中路径离线验证：
// 执行真实的 server_scripts/radiation/EntityEvents.js，
// 锁定玩家近战判定、单次附着时长（10 秒）与错误来源过滤。
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const SCRIPT_PATH = path.resolve(__dirname, '../server_scripts/radiation/EntityEvents.js')
const SWORD_ID = 'rainbow:uranium_sword'

function createHarness() {
    const applied = []
    let handler = null
    const sandbox = {}
    sandbox.global = {
        applyRadiation(target, source, duration) {
            applied.push({ target, source, duration })
            return true
        },
    }
    sandbox.EntityEvents = {
        hurt(callback) {
            handler = callback
        },
    }
    sandbox.console = { log: () => {} }

    vm.createContext(sandbox)
    vm.runInContext(fs.readFileSync(SCRIPT_PATH, 'utf8'), sandbox, { filename: SCRIPT_PATH })
    return { applied, fire: event => handler(event) }
}

function makeEvent(options) {
    const stack = options.stack === undefined ? { id: SWORD_ID } : options.stack
    const player = options.player === undefined
        ? { id: 1, getMainHandItem: () => stack }
        : options.player
    const type = options.type === undefined ? 'player' : options.type
    const alive = options.alive === undefined ? true : options.alive
    return {
        source: {
            player,
            getType: () => type,
        },
        entity: {
            isAlive: () => alive,
        },
    }
}

test('玩家主手纳垢之剑命中时附着 200 tick', () => {
    const harness = createHarness()
    const event = makeEvent({})
    harness.fire(event)
    assert.equal(harness.applied.length, 1)
    assert.equal(harness.applied[0].duration, 200)
})

test('非玩家来源不触发', () => {
    const harness = createHarness()
    harness.fire(makeEvent({ player: null }))
    assert.equal(harness.applied.length, 0)
})

test('非 player 伤害类型不触发（例如 TheBuff 周期伤害）', () => {
    const harness = createHarness()
    harness.fire(makeEvent({ type: 'thebuff.buff' }))
    assert.equal(harness.applied.length, 0)
})

test('主手不是纳垢之剑时不触发', () => {
    const harness = createHarness()
    harness.fire(makeEvent({ stack: { id: 'minecraft:iron_sword' } }))
    assert.equal(harness.applied.length, 0)
})

test('目标已死亡时不触发', () => {
    const harness = createHarness()
    harness.fire(makeEvent({ alive: false }))
    assert.equal(harness.applied.length, 0)
})
