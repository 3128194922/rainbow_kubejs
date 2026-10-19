// 木剑镶嵌系统（wooden_sword_inlay）离线验证：
// 以 KubeJS/Forge 事件替身执行真实的 config.js + main.js，覆盖铁砧镶嵌、随机一致性、属性写入与边界。
// 运行：node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const ATTR_EVENT = 'net.minecraftforge.event.ItemAttributeModifierEvent';
const ANVIL_EVENT = 'net.minecraftforge.event.AnvilUpdateEvent';
// 供属性注册表替身使用的真实属性 ID（与 config.js 的随机池一致）
const KNOWN_ATTRS = [
  'attributeslib:crit_chance', 'attributeslib:crit_damage', 'minecraft:generic.armor',
  'minecraft:generic.attack_damage', 'minecraft:generic.max_health', 'attributeslib:armor_pierce',
  'attributeslib:healing_received', 'caverns_and_chasms:experience_boost', 'minecraft:generic.attack_knockback',
];

// java.util.Random 的最小复刻（48 位 LCG + Java 的 nextInt 算法），保证与游戏内随机序列一致
class JavaRandom {
  constructor(seed) {
    this.seed = (BigInt(Math.trunc(seed)) ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n);
  }
  next(bits) {
    this.seed = (this.seed * 0x5DEECE66Dn + 0xBn) & ((1n << 48n) - 1n);
    return Number(this.seed >> BigInt(48 - bits));
  }
  nextInt(bound) {
    if (bound <= 0) throw new Error('bound must be positive');
    if ((bound & -bound) === bound) return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
    let bits;
    let val;
    do {
      bits = this.next(31);
      val = bits % bound;
    } while (bits - val + (bound - 1) < 0);
    return val;
  }
}

class Tag {
  constructor() { this.map = {}; }
  contains(k) { return Object.prototype.hasOwnProperty.call(this.map, k); }
  putInt(k, v) { this.map[k] = Math.trunc(v); }
  putLong(k, v) { this.map[k] = Math.trunc(v); }
  putString(k, v) { this.map[k] = String(v); }
  putDouble(k, v) { this.map[k] = Number(v); }
  getInt(k) { return Math.trunc(this.map[k]); }
  getLong(k) { return Math.trunc(this.map[k]); }
  getString(k) { return String(this.map[k]); }
  getDouble(k) { return Number(this.map[k]); }
  copy() { const t = new Tag(); t.map = Object.assign({}, this.map); return t; }
}

// ItemStack 替身：保留 id / 数量 / NBT 的读写与深拷贝语义
class Stack {
  constructor(id, count) {
    this.id = id;
    this.count = count == null ? 1 : count;
    this.tag = null;
    this.custom = false;
    this.hover = id;
  }
  getCount() { return this.count; }
  isEmpty() { return this.count <= 0; }
  getNbt() { return this.tag; }
  getOrCreateTag() { if (this.tag == null) this.tag = new Tag(); return this.tag; }
  copy() {
    const s = new Stack(this.id, this.count);
    s.tag = this.tag == null ? null : this.tag.copy();
    s.custom = this.custom;
    s.hover = this.hover;
    return s;
  }
  hasCustomHoverName() { return this.custom; }
  getHoverName() { return { getString: () => this.hover }; }
  setHoverName(component) { this.custom = true; this.hover = component.text; }
  resetHoverName() { this.custom = false; }
}

// 执行真实的 config.js + main.js，返回监听器、配置与事件构造函数
function inlayHarness() {
  const listeners = {};
  const context = {
    console,
    global: {},
    JavaRandom,
    Component: { literal: (value) => ({ text: String(value) }) },
    UUID: { fromString: (value) => value },
    ResourceLocation: class { constructor(id) { this.id = id; } },
    ForgeRegistries: { ATTRIBUTES: { getValue: (id) => (KNOWN_ATTRS.includes(id.id) ? { id: id.id } : null) } },
    AttributeModifier: class { constructor(uuid, name, amount, operation) { Object.assign(this, { uuid, name, amount, operation }); } },
    AttributeModifierOperation: { ADDITION: 'addition', MULTIPLY_BASE: 'multiply_base', MULTIPLY_TOTAL: 'multiply_total' },
    ForgeEvents: { onEvent: (name, callback) => { listeners[name] = callback; } },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'startup_scripts/wooden_sword_inlay/config.js'), 'utf8'), context, { filename: 'config.js' });
  vm.runInNewContext(fs.readFileSync(path.join(root, 'startup_scripts/wooden_sword_inlay/main.js'), 'utf8'), context, { filename: 'main.js' });
  const cfg = context.global.WOODEN_SWORD_INLAY_CONFIG;

  // 触发铁砧事件：isClient 区分客户端预览与服务端产出
  function anvil(left, right, options) {
    const opts = options == null ? {} : options;
    const event = {
      output: null,
      cost: -1,
      materialCost: -1,
      getLeft: () => left,
      getRight: () => right,
      getName: () => (opts.name === undefined ? null : opts.name),
      getPlayer: () => ({ level: { isClientSide: () => opts.isClient === true } }),
      setOutput: (stack) => { event.output = stack; },
      setCost: (cost) => { event.cost = cost; },
      setMaterialCost: (count) => { event.materialCost = count; },
    };
    listeners[ANVIL_EVENT](event);
    return event;
  }

  // 触发物品属性事件，收集写入的属性修饰器
  function attributes(stack, slot) {
    const modifiers = [];
    listeners[ATTR_EVENT]({
      getItemStack: () => stack,
      getSlotType: () => ({ getName: () => slot }),
      addModifier: (attribute, modifier) => { modifiers.push({ attribute, modifier }); },
    });
    return modifiers;
  }

  // 构造一把已镶嵌 count 次（指定种子）的木剑，用于精确控制随机输入
  function socketedSword(seed, count) {
    const stack = new Stack(cfg.swordId, 1);
    const tag = stack.getOrCreateTag();
    tag.putLong(cfg.nbt.seed, seed);
    tag.putInt(cfg.nbt.count, count);
    return stack;
  }

  // 用真实镶嵌流程叠满 5 个槽位
  function fullSword() {
    let current = new Stack(cfg.swordId, 1);
    for (let i = 0; i < cfg.maxSockets; i++) {
      current = anvil(current, new Stack(cfg.materialId, 1), { isClient: false }).output;
    }
    return current;
  }

  return { cfg, listeners, anvil, attributes, socketedSword, fullSword, Stack };
}

test('首次镶嵌：写入镶嵌记录、费用 5 级、消耗 1 个奇迹物质', () => {
  const h = inlayHarness();
  const { cfg } = h;
  const sword = new h.Stack(cfg.swordId, 1);
  const event = h.anvil(sword, new h.Stack(cfg.materialId, 3), { isClient: false });

  assert.ok(event.output, '服务端应产出镶嵌后的木剑');
  assert.equal(event.output.id, cfg.swordId);
  assert.equal(event.output.getNbt().getInt(cfg.nbt.count), 1);
  assert.match(event.output.getNbt().getString(cfg.nbt.prefix + '0Attr'), /^[a-z_.]+:[a-z_.]+$/);
  assert.ok(event.output.getNbt().getDouble(cfg.nbt.prefix + '0Val') > 0);
  assert.equal(event.cost, cfg.cost.base);
  assert.equal(event.materialCost, 1);
  assert.ok(sword.getNbt().contains(cfg.nbt.seed), '服务端应把随机种子写回输入槽木剑');
});

test('同一输入重复预览不会重新随机（防重 roll）', () => {
  const h = inlayHarness();
  const { cfg } = h;
  const sword = new h.Stack(cfg.swordId, 1);
  const first = h.anvil(sword, new h.Stack(cfg.materialId, 1), { isClient: false }).output;
  const second = h.anvil(sword, new h.Stack(cfg.materialId, 1), { isClient: false }).output;

  assert.equal(second.getNbt().getString(cfg.nbt.prefix + '0Attr'), first.getNbt().getString(cfg.nbt.prefix + '0Attr'));
  assert.equal(second.getNbt().getDouble(cfg.nbt.prefix + '0Val'), first.getNbt().getDouble(cfg.nbt.prefix + '0Val'));
});

test('客户端在拿到种子后预览结果与服务端产物完全一致', () => {
  const h = inlayHarness();
  const { cfg } = h;
  const sword = new h.Stack(cfg.swordId, 1);
  const server = h.anvil(sword, new h.Stack(cfg.materialId, 1), { isClient: false }).output;
  const client = h.anvil(sword.copy(), new h.Stack(cfg.materialId, 1), { isClient: true }).output;

  assert.ok(client, '客户端应能算出预览产物');
  assert.equal(client.getNbt().getString(cfg.nbt.prefix + '0Attr'), server.getNbt().getString(cfg.nbt.prefix + '0Attr'));
  assert.equal(client.getNbt().getDouble(cfg.nbt.prefix + '0Val'), server.getNbt().getDouble(cfg.nbt.prefix + '0Val'));
});

test('客户端尚未同步到种子时不产出，避免与服务端结果不一致', () => {
  const h = inlayHarness();
  const { cfg } = h;
  const event = h.anvil(new h.Stack(cfg.swordId, 1), new h.Stack(cfg.materialId, 1), { isClient: true });
  assert.equal(event.output, null);
});

test('五次镶嵌费用递增 5/10/15/20/25，满 5 次后不再产出', () => {
  const h = inlayHarness();
  const { cfg } = h;
  let current = new h.Stack(cfg.swordId, 1);
  for (let i = 1; i <= cfg.maxSockets; i++) {
    const event = h.anvil(current, new h.Stack(cfg.materialId, 1), { isClient: false });
    assert.equal(event.cost, cfg.cost.base + cfg.cost.perSocket * (i - 1), `第 ${i} 次镶嵌费用`);
    assert.equal(event.output.getNbt().getInt(cfg.nbt.count), i);
    current = event.output;
  }
  for (let i = 0; i < cfg.maxSockets; i++) {
    assert.ok(current.getNbt().contains(cfg.nbt.prefix + i + 'Attr'), `第 ${i + 1} 个槽位应有属性记录`);
  }
  const full = h.anvil(current, new h.Stack(cfg.materialId, 64), { isClient: false });
  assert.equal(full.output, null, '满 5 次应交回原版处理');
});

test('属性修饰器：主手 5 条且 UUID 唯一、副手与非木剑不生效', () => {
  const h = inlayHarness();
  const { cfg } = h;
  const sword = h.fullSword();
  const mainhand = h.attributes(sword, 'mainhand');

  assert.equal(mainhand.length, cfg.maxSockets);
  assert.equal(new Set(mainhand.map((m) => m.modifier.uuid)).size, cfg.maxSockets, 'UUID 必须两两不同');
  mainhand.forEach((entry, index) => {
    assert.equal(entry.modifier.uuid, cfg.uuids[index]);
    assert.equal(entry.modifier.operation, 'addition');
    assert.ok(entry.modifier.amount > 0);
    // 属性注册表能解析时应传入 Attribute 对象，而不是字符串
    const attrId = sword.getNbt().getString(cfg.nbt.prefix + index + 'Attr');
    assert.equal(entry.attribute.id, attrId);
  });
  assert.equal(h.attributes(sword, 'offhand').length, 0);
  assert.equal(h.attributes(new h.Stack('minecraft:stone_sword', 1), 'mainhand').length, 0);
});

test('非法输入不产出：材料不对 / 左槽非木剑 / 整堆木剑', () => {
  const h = inlayHarness();
  const { cfg } = h;
  assert.equal(h.anvil(new h.Stack(cfg.swordId, 1), new h.Stack('minecraft:diamond', 1), {}).output, null);
  assert.equal(h.anvil(new h.Stack('minecraft:iron_sword', 1), new h.Stack(cfg.materialId, 1), {}).output, null);
  assert.equal(h.anvil(new h.Stack(cfg.swordId, 2), new h.Stack(cfg.materialId, 1), {}).output, null);
  assert.equal(h.anvil(new h.Stack(cfg.swordId, 1), new h.Stack(cfg.materialId, 1), { name: '' }).output.getNbt().getInt(cfg.nbt.count), 1);
});

test('铁砧改名会写进镶嵌产物', () => {
  const h = inlayHarness();
  const { cfg } = h;
  const event = h.anvil(new h.Stack(cfg.swordId, 1), new h.Stack(cfg.materialId, 1), { name: '测试木剑' });
  assert.equal(event.output.hover, '测试木剑');
});

test('随机抽样：所有槽位数值落在配置范围内且覆盖全部属性', () => {
  const h = inlayHarness();
  const { cfg } = h;
  const ids = Object.keys(cfg.attributes);
  const seen = new Set();
  for (let seed = 1; seed <= 300; seed++) {
    for (let index = 0; index < cfg.maxSockets; index++) {
      const output = h.anvil(h.socketedSword(seed * 7919, index), new h.Stack(cfg.materialId, 1), { isClient: false }).output;
      const id = output.getNbt().getString(cfg.nbt.prefix + index + 'Attr');
      const amount = output.getNbt().getDouble(cfg.nbt.prefix + index + 'Val');
      const def = cfg.attributes[id];
      assert.ok(def, `属性 ${id} 必须在配置表中`);
      assert.ok(amount >= def.min - 1e-9 && amount <= def.max + 1e-9, `${id} 数值 ${amount} 超出 ${def.min}~${def.max}`);
      seen.add(id);
    }
  }
  assert.equal(seen.size, ids.length, '抽样应覆盖全部属性');
  assert.equal(ids.length, 9);
});

test('配置契约：9 个属性、5 个 UUID、最多 5 次镶嵌', () => {
  const h = inlayHarness();
  const { cfg } = h;
  assert.equal(cfg.swordId, 'minecraft:wooden_sword');
  assert.equal(cfg.materialId, 'rainbow:miracle');
  assert.equal(cfg.maxSockets, 5);
  assert.equal(Object.keys(cfg.attributes).length, 9);
  assert.equal(cfg.uuids.length, 5);
  ['attributeslib:crit_chance', 'attributeslib:crit_damage', 'minecraft:generic.armor',
    'minecraft:generic.attack_damage', 'minecraft:generic.max_health', 'attributeslib:armor_pierce',
    'attributeslib:healing_received', 'caverns_and_chasms:experience_boost', 'minecraft:generic.attack_knockback']
    .forEach((id) => assert.ok(cfg.attributes[id], `配置缺少属性 ${id}`));
});
