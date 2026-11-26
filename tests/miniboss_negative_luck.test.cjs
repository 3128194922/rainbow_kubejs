const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function harness(randomValue = 0.5, luck = -100) {
  let hurt = null;
  const converted = [];
  const context = {
    global: { convertToMiniBoss: entity => { converted.push(entity); return true; } },
    console: { log: () => {} },
    Math: Object.assign(Object.create(Math), { random: () => randomValue }),
    TamableAnimal: class {},
    EntityEvents: { hurt: callback => { hurt = callback; } },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'server_scripts/mini_boss_system/negative_luck.js'), 'utf8'),
    context, { filename: 'server_scripts/mini_boss_system/negative_luck.js' });
  return { context, getHurt: () => hurt, converted, player: { luck } };
}

function entity(overrides = {}) {
  return Object.assign({
    persistentData: {},
    isPlayer: () => false,
  }, overrides);
}

function source(player) {
  return { player: player == null ? null : { getAttribute: () => ({ getValue: () => player.luck }) } };
}

test('负幸运达到概率时调用 KubeJS 转化 API', () => {
  const h = harness(0.5, -100);
  const target = entity();
  h.getHurt()({ entity: target, source: source(h.player) });
  assert.equal(h.converted.length, 1);
  assert.equal(h.converted[0], target);
});

test('非负幸运、非玩家伤害、玩家目标和已驯服目标不转化', () => {
  for (const [random, luck, target, src] of [
    [0.5, 0, entity(), source({ luck: 0 })],
    [0.5, -100, entity(), source(null)],
    [0.5, -100, entity({ isPlayer: () => true }), source({ luck: -100 })],
    [0.5, -100, null, source({ luck: -100 })],
  ]) {
    const h = harness(random, luck);
    const actualTarget = target == null ? new h.context.TamableAnimal() : target;
    h.getHurt()({ entity: actualTarget, source: src });
    assert.equal(h.converted.length, 0);
  }
});

test('概率未命中时不转化', () => {
  const h = harness(0.99, -50);
  h.getHurt()({ entity: entity(), source: source(h.player) });
  assert.equal(h.converted.length, 0);
});
