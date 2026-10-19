// 执行真实 KubeJS 脚本，验证圣遗物觉醒及现有套装系统的判定。
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
  const context = vm.createContext({
    console,
    global: {},
    JavaRandom: class { constructor(seed) { this.seed = Number(seed) | 0; } nextInt(bound) { this.seed = (this.seed * 1664525 + 1013904223) | 0; return (this.seed >>> 0) % bound; } },
    JavaString: { valueOf: (value) => ({ getBytes: () => Buffer.from(String(value)) }) },
    UUID: { nameUUIDFromBytes: (bytes) => bytes.toString() },
    ForgeEvents: { onEvent: (name, fn) => { listeners[name] = fn; } },
    PlayerEvents: { loggedIn() {}, inventoryChanged() {}, tick() {}, loggedOut() {} },
    EntityEvents: { hurt() {}, death() {} },
    Component: { literal: (value) => value },
  });
  for (const file of ['startup_scripts/wooden_sword_inlay/config.js', 'startup_scripts/wooden_sword_inlay/main.js', 'server_scripts/set_system/SetEffect.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  const cfg = context.global.WOODEN_SWORD_INLAY_CONFIG;
  function fullRelic() {
    let stack = new Stack(cfg.relicId);
    const tag = stack.getOrCreateTag();
    tag.putLong(cfg.nbt.seed, 12345);
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
  return { context, cfg, fullRelic, Stack };
}

test('第五次镶嵌写入八元素之一，旧满镶嵌圣遗物按五条词条补算', () => {
  const h = harness();
  const relic = h.fullRelic();
  const tag = relic.getNbt();
  const saved = tag.getString(h.cfg.nbt.element);
  assert.ok(h.cfg.elements[saved], `未知元素 ${saved}`);
  tag.data[h.cfg.nbt.element] = undefined;
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

test('每种元素的 4 件和 5 件阶段分别加相同数值，只计入已佩戴的同元素圣遗物', () => {
  const h = harness();
  const registry = vm.runInContext('SetRegistry', h.context);
  const relic = h.fullRelic();
  const element = h.context.global.getRelicAwakeningElement(relic.getNbt());
  const set = registry['relic_' + element];
  assert.ok(set);
  assert.equal(set.phases.length, 2);
  assert.equal(set.phases[0].requiredCount, 4);
  assert.equal(set.phases[1].requiredCount, 5);
  assert.equal(set.phases[0].effects[0].amount, set.phases[1].effects[0].amount);
  const eq = { vanilla: {}, curios: Array.from({ length: 5 }, (_, index) => ({ type: 'charm', index, stack: relic.copy() })) };
  assert.equal(h.context.isPhaseActive(eq, set.phases[0], set.slots), true);
  assert.equal(h.context.isPhaseActive(eq, set.phases[1], set.slots), true);
  const other = relic.copy();
  // 保持物品 ID 相同，仅改变词条 NBT，直到推导为另一元素。
  let different = null;
  for (let i = 1; i <= 100; i++) {
    other.getNbt().putDouble(h.cfg.nbt.prefix + '0Val', i / 10000);
    if (h.context.global.getRelicAwakeningElement(other.getNbt()) !== element) { different = other.copy(); break; }
  }
  assert.ok(different, '应能构造另一元素的圣遗物');
  eq.curios[4].stack = different;
  assert.equal(h.context.isPhaseActive(eq, set.phases[0], set.slots), true);
  assert.equal(h.context.isPhaseActive(eq, set.phases[1], set.slots), false);
  assert.notEqual(h.context.hashFromEquipped(eq), h.context.hashFromEquipped({ ...eq, curios: eq.curios.map((slot, i) => i === 4 ? { ...slot, stack: relic.copy() } : slot) }));
  eq.curios[4].stack = new Stack('minecraft:diamond');
  assert.equal(h.context.isPhaseActive(eq, set.phases[0], set.slots), true);
  assert.equal(h.context.isPhaseActive(eq, set.phases[1], set.slots), false);
  eq.curios[3].stack = new Stack('minecraft:diamond');
  assert.equal(h.context.isPhaseActive(eq, set.phases[0], set.slots), false);
});

test('八种元素均注册指定属性，4 件与 5 件阶段的 UUID 可分别叠加', () => {
  const h = harness();
  const registry = vm.runInContext('SetRegistry', h.context);
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
  assert.equal(Object.keys(h.cfg.elements).length, 8);
  for (const [id, [attribute, amount]] of Object.entries(expected)) {
    const set = registry['relic_' + id];
    assert.equal(set.phases[0].effects[0].attribute, attribute);
    assert.equal(set.phases[0].effects[0].amount, amount);
    assert.equal(set.phases[1].effects[0].amount, amount);
    assert.notEqual(h.context.setEffectKey('relic_' + id, 0, 0), h.context.setEffectKey('relic_' + id, 1, 0));
  }
});

test('不同 Curios 佩戴槽位和词条下标生成不同 UUID，使多件圣遗物词条叠加', () => {
  const h = harness();
  const relic = h.fullRelic();
  function modifiers(slotUuid) {
    const result = [];
    h.context.applyRelicInlayAttributes({
      stack: relic,
      uuid: slotUuid,
      modify: (attribute, uuid, identifier, amount, operation) => result.push({ attribute, uuid, identifier, amount, operation }),
    });
    return result;
  }
  const first = modifiers({ toString: () => 'slot-1' });
  const second = modifiers({ toString: () => 'slot-2' });
  assert.equal(first.length, 5);
  assert.equal(second.length, 5);
  assert.equal(new Set([...first, ...second].map((entry) => entry.uuid)).size, 10);
  assert.ok(first.every((entry) => entry.operation === 'addition' && entry.amount > 0));
});
