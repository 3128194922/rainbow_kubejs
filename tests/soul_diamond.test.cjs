// 以 KubeJS/Curios 事件替身执行真实脚本，验证心灵宝石的越级经验暂存与返还。
// 运行：node --test "tests/*.test.cjs"
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

// 迷你 CompoundTag 替身：脚本只用到 getInt / putInt
class NbtStub {
  constructor() {
    this.data = new Map();
  }

  getInt(key) {
    return this.data.has(key) ? this.data.get(key) : 0;
  }

  putInt(key, value) {
    this.data.set(key, value);
    return this;
  }
}

function makeStack(id) {
  const stack = { id };
  let nbt = null;
  Object.defineProperty(stack, 'nbt', {
    get() {
      return nbt;
    },
    // KubeJS 中 stack.nbt = {} 会转换成 CompoundTag，这里等价替换成替身
    set(value) {
      const next = new NbtStub();
      if (value != null && typeof value === 'object') {
        Object.keys(value).forEach(key => next.data.set(key, value[key]));
      }
      nbt = next;
    },
  });
  return stack;
}

function makePlayer(level, progress) {
  return {
    experienceLevel: level,
    experienceProgress: progress,
    totalExperience: 0,
    isPlayer: () => true,
    level: { isClientSide: () => false },
  };
}

// 事件替身：拦截 StartupEvents.registry 与 CuriosJSCapabilityBuilder，抓出心灵宝石的 onEquip / onUnequip
function loadRegistryScript() {
  const captured = { attributes: [], onEquip: null, onUnequip: null };
  let currentItemId = null;

  function curiosBuilder() {
    const proxy = new Proxy({}, {
      get(target, prop) {
        if (prop === 'then') return undefined;
        return (...args) => {
          if (prop === 'addAttribute' && currentItemId === 'rainbow:soul_diamond') {
            captured.attributes.push({
              attribute: String(args[0]),
              identifier: args[1],
              amount: args[2],
              operation: String(args[3]),
            });
          }
          if (prop === 'onEquip' && currentItemId === 'rainbow:soul_diamond') captured.onEquip = args[0];
          if (prop === 'onUnequip' && currentItemId === 'rainbow:soul_diamond') captured.onUnequip = args[0];
          return proxy;
        };
      },
    });
    return proxy;
  }

  function itemBuilder(id) {
    currentItemId = id;
    const proxy = new Proxy({}, {
      get(target, prop) {
        if (prop === 'then') return undefined;
        return () => proxy;
      },
    });
    return proxy;
  }

  const context = createSandbox({
    console,
    CuriosJSCapabilityBuilder: { create: () => curiosBuilder() },
    StartupEvents: {
      registry: (type, callback) => callback({ create: id => itemBuilder(id) }),
    },
  });

  const source = fs.readFileSync(path.join(root, 'startup_scripts', 'Registry', 'Registry_curios.js'), 'utf8');
  vm.runInNewContext(source, context, { filename: 'startup_scripts/Registry/Registry_curios.js' });

  return captured;
}

// 沙箱：保留真实内建对象（Math、JSON 等），其余未定义的脚本全局
// （canUnequipNotOnCooldown、ancientAegisCanEquip 等注册期函数引用）统一给自我返回的替身函数
function createSandbox(extra) {
  const base = {};
  Object.getOwnPropertyNames(globalThis).forEach(key => {
    if (key === 'global' || key === 'globalThis') return;
    base[key] = globalThis[key];
  });
  Object.assign(base, extra);

  const autoFn = new Proxy(function () {}, {
    get(target, prop) {
      if (prop === 'then' || typeof prop === 'symbol') return undefined;
      return autoFn;
    },
    apply() {
      return autoFn;
    },
  });

  const sandbox = new Proxy(Object.create(null), {
    has: () => true,
    get(target, prop) {
      if (typeof prop === 'symbol') return target[prop];
      if (Object.prototype.hasOwnProperty.call(base, prop)) return base[prop];
      if (Object.prototype.hasOwnProperty.call(target, prop)) return target[prop];
      return autoFn;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });

  return vm.createContext(sandbox);
}

// 独立参考实现（wiki 公式）：从 0 级升到 level 级的累计经验
function xpToReachLevel(level) {
  if (level <= 16) return level * level + 6 * level;
  if (level <= 31) return Math.floor(2.5 * level * level - 40.5 * level + 360);
  return Math.floor(4.5 * level * level - 162.5 * level + 2220);
}

function xpNeededForNextLevel(level) {
  if (level >= 30) return 112 + (level - 30) * 9;
  if (level >= 15) return 37 + (level - 15) * 5;
  return 7 + level * 2;
}

const HOLD_XP = xpToReachLevel(100);

test('心灵宝石注册了经验获取 +50% 与经验等级上限 100 级属性', () => {
  const reg = loadRegistryScript();
  assert.deepEqual(reg.attributes, [
    { attribute: 'attributeslib:experience_gained', identifier: 'soul_diamond_experience', amount: 0.5, operation: 'multiply_total' },
    { attribute: 'moreattribute:max_experience_level', identifier: 'soul_diamond_experience_level', amount: 101, operation: 'addition' },
  ]);
  assert.equal(typeof reg.onEquip, 'function');
  assert.equal(typeof reg.onUnequip, 'function');
});

test('佩戴时把超过 100 级的经验压到正好 100 级，并暂存超出部分；卸下时原样返还', () => {
  const reg = loadRegistryScript();
  const player = makePlayer(150, 0.3);
  const slotContext = { entity: () => player };
  const stack = makeStack('rainbow:soul_diamond');
  const empty = makeStack('minecraft:air');
  const totalBefore = xpToReachLevel(150) + Math.round(0.3 * xpNeededForNextLevel(150));

  reg.onEquip(slotContext, empty, stack);
  assert.equal(player.experienceLevel, 100, '等级被压到正好 100 级');
  assert.equal(player.experienceProgress, 0, '级内进度归零');
  assert.equal(player.totalExperience, HOLD_XP, '经验总量与 100 级一致');
  assert.equal(stack.nbt.getInt('SoulDiamondStoredXp'), totalBefore - HOLD_XP, '超出部分写入饰品 NBT');

  reg.onUnequip(slotContext, empty, stack);
  assert.equal(stack.nbt.getInt('SoulDiamondStoredXp'), 0, '返还后清空暂存，避免重复返还');
  assert.equal(player.experienceLevel, 150, '卸下后回到原等级');
  assert.ok(Math.abs(player.experienceProgress - 0.3) * xpNeededForNextLevel(150) < 1, '级内进度误差小于 1 点经验');
});

test('onEquip / onUnequip 参数顺序互换时依然能取到心灵宝石本体', () => {
  const reg = loadRegistryScript();
  const player = makePlayer(200, 0);
  const slotContext = { entity: () => player };
  const stack = makeStack('rainbow:soul_diamond');
  const empty = makeStack('minecraft:air');
  const totalBefore = xpToReachLevel(200);

  reg.onEquip(slotContext, stack, empty); // 宝石在第 2 个参数
  assert.equal(player.experienceLevel, 100);
  assert.equal(stack.nbt.getInt('SoulDiamondStoredXp'), totalBefore - HOLD_XP);

  reg.onUnequip(slotContext, stack, empty);
  assert.equal(stack.nbt.getInt('SoulDiamondStoredXp'), 0);
  assert.equal(player.experienceLevel, 200);
});

test('未超过 100 级时不压缩等级、不写入暂存', () => {
  const reg = loadRegistryScript();
  const player = makePlayer(37, 0.42);
  const stack = makeStack('rainbow:soul_diamond');

  reg.onEquip({ entity: () => player }, stack, makeStack('minecraft:air'));

  assert.equal(player.experienceLevel, 37);
  assert.ok(Math.abs(player.experienceProgress - 0.42) < 1e-6);
  assert.equal(stack.nbt.getInt('SoulDiamondStoredXp'), 0);
});

test('等级刚好 100 级但有余量进度时，把余量进度也暂存起来', () => {
  const reg = loadRegistryScript();
  const player = makePlayer(100, 0.5);
  const stack = makeStack('rainbow:soul_diamond');

  reg.onEquip({ entity: () => player }, stack, makeStack('minecraft:air'));

  assert.equal(player.experienceLevel, 100);
  assert.equal(player.experienceProgress, 0);
  assert.equal(stack.nbt.getInt('SoulDiamondStoredXp'), Math.round(0.5 * xpNeededForNextLevel(100)));
});

test('客户端、非玩家实体与不匹配物品都不触发压缩', () => {
  const reg = loadRegistryScript();

  const clientPlayer = makePlayer(150, 0.5);
  clientPlayer.level.isClientSide = () => true;
  reg.onEquip({ entity: () => clientPlayer }, makeStack('rainbow:soul_diamond'), makeStack('minecraft:air'));
  assert.equal(clientPlayer.experienceLevel, 150, '客户端不处理');

  const mob = { isPlayer: () => false, level: { isClientSide: () => false } };
  reg.onEquip({ entity: () => mob }, makeStack('rainbow:soul_diamond'), makeStack('minecraft:air'));

  const otherPlayer = makePlayer(150, 0.5);
  reg.onEquip({ entity: () => otherPlayer }, makeStack('minecraft:air'), makeStack('minecraft:air'));
  assert.equal(otherPlayer.experienceLevel, 150, '物品 id 不匹配时不动玩家经验');
});

test('宝石内残留暂存经验时：重复佩戴不翻倍，玩家经验被清空也不会抹掉暂存', () => {
  const reg = loadRegistryScript();
  const slotContext = { entity: () => null };
  const empty = makeStack('minecraft:air');

  // 场景一：NBT 残留 5000（返还后清空失败），玩家 150 级重新佩戴 → 暂存仍为 5000
  const stale = makeStack('rainbow:soul_diamond');
  stale.nbt = {};
  stale.nbt.putInt('SoulDiamondStoredXp', 5000);
  const playerA = makePlayer(150, 0);
  reg.onEquip({ entity: () => playerA }, stale, empty);
  assert.equal(stale.nbt.getInt('SoulDiamondStoredXp'), xpToReachLevel(150) - HOLD_XP);

  // 场景二：玩家经验归零（死亡后重戴），不压缩等级，宝石里原有的 5000 点保留
  const kept = makeStack('rainbow:soul_diamond');
  kept.nbt = {};
  kept.nbt.putInt('SoulDiamondStoredXp', 5000);
  const playerB = makePlayer(5, 0.2);
  reg.onEquip({ entity: () => playerB }, kept, empty);
  assert.equal(playerB.experienceLevel, 5, '没有越级经验就不压缩');
  assert.equal(kept.nbt.getInt('SoulDiamondStoredXp'), 5000, '原有暂存不被抹掉');

  // 卸下时把 5000 点还给玩家
  reg.onUnequip({ entity: () => playerB }, kept, empty);
  assert.equal(kept.nbt.getInt('SoulDiamondStoredXp'), 0);
  assert.equal(xpToReachLevel(playerB.experienceLevel) + Math.round(playerB.experienceProgress * xpNeededForNextLevel(playerB.experienceLevel)), xpToReachLevel(5) + Math.round(0.2 * xpNeededForNextLevel(5)) + 5000);
  assert.equal(slotContext.entity(), null);
});
