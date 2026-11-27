// 执行真实 KubeJS 脚本，验证圣遗物觉醒与 SetJS 注册契约。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

class Tag {
  constructor() { this.data = {}; }
  contains(key) { return Object.prototype.hasOwnProperty.call(this.data, key); }
  putInt(key, value) { this.data[key] = value; }
  putLong(key, value) { this.data[key] = value; }
  putString(key, value) { this.data[key] = value; }
  putDouble(key, value) { this.data[key] = value; }
  getInt(key) { return this.data[key] || 0; }
  getLong(key) { return this.data[key] || 0; }
  getString(key) { return this.data[key] || ''; }
  getDouble(key) { return this.data[key] || 0; }
  copy() { const result = new Tag(); result.data = { ...this.data }; return result; }
}

class Stack {
  constructor(id) { this.id = id; this.tag = null; }
  getCount() { return 1; }
  isEmpty() { return false; }
  getId() { return { toString: () => this.id }; }
  getNbt() { return this.tag; }
  getOrCreateTag() { if (this.tag == null) this.tag = new Tag(); return this.tag; }
  copy() { const result = new Stack(this.id); result.tag = this.tag == null ? null : this.tag.copy(); return result; }
  hasCustomHoverName() { return false; }
  getHoverName() { return { getString: () => this.id }; }
}

function harness() {
  const listeners = {};
  const sets = {};
  const calls = [];
  let relicConfig = null;
  const SetJS = {
    clear() { calls.push('clear'); for (const key of Object.keys(sets)) delete sets[key]; },
    setRelicConfig(config) { calls.push('setRelicConfig'); relicConfig = config; },
    registerSet(id, config) { calls.push('registerSet:' + id); sets[id] = config; },
    count() { return Object.keys(sets).length; },
  };
  const context = vm.createContext({
    console,
    global: {},
    SetJS,
    JavaRandom: class { constructor(seed) { this.seed = Number(seed) | 0; } nextInt(bound) { this.seed = (this.seed * 1664525 + 1013904223) | 0; return (this.seed >>> 0) % bound; } },
    JavaString: { valueOf: (value) => ({ getBytes: () => Buffer.from(String(value)) }) },
    UUID: { nameUUIDFromBytes: (bytes) => bytes.toString() },
    ForgeEvents: { onEvent: (name, fn) => { listeners[name] = fn; } },
  });
  for (const file of [
    'startup_scripts/wooden_sword_inlay/config.js',
    'startup_scripts/wooden_sword_inlay/main.js',
    'server_scripts/set_system/SetEffect.js',
  ]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  const cfg = context.global.WOODEN_SWORD_INLAY_CONFIG;
  function fullRelic() {
    let stack = new Stack(cfg.relicId);
    stack.getOrCreateTag().putLong(cfg.nbt.seed, 12345);
    for (let i = 0; i < 5; i++) {
      const event = {
        getLeft: () => stack,
        getRight: () => new Stack(cfg.materialId),
        getPlayer: () => ({ level: { isClientSide: () => false } }),
        getName: () => null,
        setOutput(output) { this.output = output; },
        setCost() {}, setMaterialCost() {},
      };
      listeners['net.minecraftforge.event.AnvilUpdateEvent'](event);
      assert.ok(event.output, `第 ${i + 1} 次镶嵌必须产出`);
      stack = event.output;
    }
    return stack;
  }
  return { context, cfg, fullRelic, sets, calls, get relicConfig() { return relicConfig; } };
}

test('第五次镶嵌写入八元素之一，旧满镶嵌圣遗物按五条词条补算', () => {
  const h = harness();
  const relic = h.fullRelic();
  const tag = relic.getNbt();
  const saved = tag.getString(h.cfg.nbt.element);
  assert.ok(h.cfg.elements[saved], `未知元素 ${saved}`);
  delete tag.data[h.cfg.nbt.element];
  assert.equal(h.context.global.getRelicAwakeningElement(tag), saved);
  tag.putDouble(h.cfg.nbt.prefix + '0Val', tag.getDouble(h.cfg.nbt.prefix + '0Val') + 0.005);
  assert.ok(h.cfg.elements[h.context.global.getRelicAwakeningElement(tag)]);
});

test('未满五条和缺失词条的圣遗物不计入元素套装', () => {
  const h = harness();
  const relic = h.fullRelic();
  assert.equal(h.context.global.getRelicAwakeningElement(new Tag()), null);
  relic.getNbt().putInt(h.cfg.nbt.count, 4);
  assert.equal(h.context.global.getRelicAwakeningElement(relic.getNbt()), null);
  relic.getNbt().putInt(h.cfg.nbt.count, 5);
  delete relic.getNbt().data[h.cfg.nbt.prefix + '3Attr'];
  assert.equal(h.context.global.getRelicAwakeningElement(relic.getNbt()), null);
});

test('definitions 先 clear 再注册，并把圣遗物参数交给 SetJS', () => {
  const h = harness();
  assert.equal(h.calls[0], 'clear');
  assert.ok(h.relicConfig, '必须调用 setRelicConfig');
  assert.equal(h.relicConfig.maxSockets, 5);
  assert.equal(h.relicConfig.countKey, h.cfg.nbt.count);
  assert.equal(h.relicConfig.prefix, h.cfg.nbt.prefix);
  assert.equal(h.relicConfig.elementKey, h.cfg.nbt.element);
  assert.deepEqual(Array.from(h.relicConfig.elements), Object.keys(h.cfg.elements));
});

test('八种元素均注册 4 件与 5 件阶段，属性和数值与旧实现一致', () => {
  const h = harness();
  const expected = {
    water: ['attributeslib:dodge_chance', 0.05],
    mountain: ['minecraft:generic.knockback_resistance', 0.10],
    wind: ['minecraft:generic.movement_speed', 0.10],
    thunder: ['attributeslib:crit_chance', 0.05],
    marsh: ['attributeslib:crit_damage', 0.15],
    fire: ['minecraft:generic.attack_damage', 2],
    earth: ['minecraft:generic.max_health', 4],
    heaven: ['minecraft:generic.flying_speed', 0.10],
  };
  assert.equal(Object.keys(expected).length, 8);
  for (const [element, [attribute, amount]] of Object.entries(expected)) {
    const set = h.sets['relic_' + element];
    assert.ok(set, `缺少 relic_${element}`);
    assert.equal(set.phases.length, 2);
    assert.equal(set.phases[0].requiredCount, 4);
    assert.equal(set.phases[1].requiredCount, 5);
    assert.equal(set.phases[0].effects[0].attribute, attribute);
    assert.equal(set.phases[0].effects[0].amount, amount);
    assert.equal(set.phases[1].effects[0].attribute, attribute);
    assert.equal(set.phases[1].effects[0].amount, amount);
    assert.equal(set.slots.length, 5);
    assert.equal(set.slots[0].curios, true);
    assert.equal(set.slots[0].item, h.cfg.relicId);
    assert.equal(set.slots[0].relicElement, element);
  }
});

test('琥珀金/骑士套装保留原有阶段数值，并提供客户端 tooltip 描述', () => {
  const h = harness();
  const cases = [
    ['oreganized:electrum', '琥珀金套装', 'oreganized:kinetic_damage', 4,
      ['oreganized:electrum_helmet', 'oreganized:electrum_chestplate',
        'oreganized:electrum_leggings', 'oreganized:electrum_boots']],
    ['royalvariations:royal_knight', '骑士套装', 'rainbow:generic.pet_damage', 4,
      ['royalvariations:royal_knight_helmet', 'royalvariations:royal_knight_cuirass',
        'royalvariations:royal_knight_leggings', 'royalvariations:royal_knight_boots']],
  ];
  for (const [id, name, attribute, slotCount, items] of cases) {
    const set = h.sets[id];
    assert.ok(set, `缺少 ${id}`);
    assert.equal(set.name, name);
    assert.equal(set.slots.length, slotCount);
    assert.deepEqual(Array.from(set.slots, (slot) => slot.item), items);
    assert.equal(set.phases[0].requiredCount, 2);
    assert.equal(set.phases[0].effects[0].attribute, attribute);
    assert.equal(set.phases[0].effects[0].amount, 1);
    assert.equal(set.phases[1].requiredCount, 4);
    assert.equal(set.phases[1].effects[0].attribute, attribute);
    assert.equal(set.phases[1].effects[0].amount, 2);
    assert.equal(set.desc.length, 2);
    assert.match(set.desc[1], /共 \+3/);
  }
});

test('套装默认按玩家套装注册，定义中不得出现实体 target', () => {
  const h = harness();
  const ids = Object.keys(h.sets);
  assert.ok(ids.length > 0);
  for (const id of ids) {
    const target = h.sets[id].target;
    assert.ok(target == null || target === 'player', `${id} 只能是玩家套装`);
  }
  const source = fs.readFileSync(path.join(root, 'server_scripts/set_system/SetEffect.js'), 'utf8');
  assert.doesNotMatch(source, /target\s*:\s*['"]entity['"]/);
});

test('KubeJS 侧不再保留旧套装引擎入口', () => {
  const source = fs.readFileSync(path.join(root, 'server_scripts/set_system/SetEffect.js'), 'utf8');
  assert.doesNotMatch(source, /PlayerEvents\.tick/);
  assert.doesNotMatch(source, /isPhaseActive/);
  assert.doesNotMatch(source, /applyAttribute/);
  assert.ok(fs.existsSync(path.join(root, 'server_scripts/set_system/SetEffect.legacy.js.disabled')));
  assert.ok(fs.existsSync(path.join(root, 'client_scripts/set_system/SetTooltip.legacy.js.disabled')));
});
