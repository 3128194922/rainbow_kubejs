// 以 KubeJS/Forge 事件替身执行真实脚本，验证血月调度与迷你 Boss 共用路径。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadScript(relativePath, context) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  vm.runInNewContext(source, context, { filename: relativePath });
}

function moonLevel(dayTime) {
  return {
    dimension: 'minecraft:overworld',
    dayTime: () => dayTime,
    isClientSide: () => false,
  };
}

function serverHarness() {
  const listeners = {};
  const calls = { start: [], stop: [], converted: [] };
  const state = new Map([['eventId', '']]);
  const commands = {
    literal(name) {
      return {
        name,
        requires(predicate) { this.permission = predicate; return this; },
        executes(callback) { this.run = callback; return this; },
      };
    },
  };
  const context = {
    global: {},
    console,
    Component: { literal: value => value },
    ServerEvents: { commandRegistry: callback => callback({
      commands,
      register: command => { listeners.command = command; },
    }) },
    LevelEvents: { tick: (dimension, callback) => { listeners.tick = callback; listeners.dimension = dimension; } },
    EntityEvents: { spawned: callback => { listeners.spawned = callback; } },
    MoonJS: {
      getState: () => state,
      start: (level, phase, options) => { calls.start.push({ level, phase, options }); state.set('eventId', options.eventId); },
      stop: level => { calls.stop.push(level); state.set('eventId', ''); },
    },
    convertToMiniBoss: entity => { calls.converted.push(entity); return true; },
  };
  loadScript('server_scripts/blood_moon/main.js', context);
  return { listeners, calls, state, context };
}

test('admin command starts a manual blood moon until next dawn and the scheduler preserves it', () => {
  const { listeners, calls, context } = serverHarness();
  const level = moonLevel(18000);
  const messages = [];
  assert.equal(listeners.command.name, 'bloodmoon');
  assert.equal(listeners.command.permission({ hasPermission: level => level >= 2 }), true);
  assert.equal(listeners.command.permission({ hasPermission: level => level === 3 }), false);
  const result = listeners.command.run({ source: {
    getServer: () => ({ overworld: () => level }),
    sendSuccess: message => messages.push(message),
  } });
  assert.equal(result, 1);
  assert.equal(calls.start.length, 1);
  assert.equal(calls.start[0].options.eventId, 'rainbow:blood_moon_manual');
  assert.equal(calls.start[0].options.durationTicks, 6000);
  assert.equal(context.global.bloodMoonIsActive(level), true);
  level.dayTime = () => 24000;
  listeners.tick({ level });
  assert.equal(calls.stop.length, 0);
  assert.equal(messages.length, 1);
});

test('full moon dusk starts once and dawn ends the event', () => {
  const { listeners, calls } = serverHarness();
  const level = moonLevel(12000);
  assert.equal(listeners.dimension, 'minecraft:overworld');
  listeners.tick({ level });
  listeners.tick({ level });
  assert.equal(calls.start.length, 1);
  assert.equal(calls.start[0].phase, 'blood_moon');
  assert.equal(calls.start[0].options.eventId, 'rainbow:blood_moon');
  assert.ok(calls.start[0].options.intensity > 0);
  level.dayTime = () => 24000;
  listeners.tick({ level });
  assert.equal(calls.stop.length, 1);
});

test('ordinary nights and another active MoonJS event are preserved', () => {
  const { listeners, calls, state } = serverHarness();
  listeners.tick({ level: moonLevel(36000) });
  assert.equal(calls.start.length, 0);
  state.set('eventId', 'other:event');
  listeners.tick({ level: moonLevel(12000) });
  assert.equal(calls.start.length, 0);
  assert.equal(calls.stop.length, 0);
});

test('only tagged new spawns during blood moon are converted, marker is consumed', () => {
  const { listeners, calls, state } = serverHarness();
  state.set('eventId', 'rainbow:blood_moon');
  const scheduled = [];
  const tags = new Map();
  const entity = {
    level: Object.assign(moonLevel(13000), {
      server: { scheduleInTicks: (ticks, callback) => scheduled.push({ ticks, callback }) },
    }),
    isAlive: () => true,
    persistentData: {
      getBoolean: key => tags.get(key) === true,
      putBoolean: (key, value) => tags.set(key, value),
      remove: key => tags.delete(key),
    },
  };
  listeners.spawned({ entity });
  assert.equal(calls.converted.length, 0);
  tags.set('_blood_moon_natural_spawn', true);
  listeners.spawned({ entity });
  listeners.spawned({ entity });
  assert.equal(calls.converted.length, 0);
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].ticks, 1);
  scheduled[0].callback();
  assert.equal(calls.converted.length, 1);
  assert.equal(tags.has('_blood_moon_natural_spawn'), false);
});

test('Forge hooks mark natural hostile spawns and deny sleep only while blood moon is active', () => {
  const listeners = new Map();
  const registered = [];
  let active = true;
  let category = 'MONSTER';
  const context = {
    global: { bloodMoonIsActive: () => active },
    console,
    MoonJS: { registerPhase: (id, options) => registered.push({ id, options }) },
    ForgeEvents: { onEvent: (name, callback) => listeners.set(name, callback) },
    ForgeRegistries: { ENTITY_TYPES: { getValue: () => ({ getCategory: () => category }) } },
    ResourceLocation: function (id) { this.id = id; },
    MobCategory: { MONSTER: 'MONSTER' },
    MobSpawnType: { NATURAL: 'NATURAL' },
    BedSleepingProblem: { NOT_POSSIBLE_NOW: 'NOT_POSSIBLE_NOW' },
  };
  loadScript('startup_scripts/blood_moon/main.js', context);
  assert.equal(registered[0].id, 'blood_moon');
  const marker = new Map();
  const entity = {
    getEncodeId: () => 'minecraft:zombie',
    persistentData: { putBoolean: (key, value) => marker.set(key, value) },
  };
  listeners.get('net.minecraftforge.event.entity.living.MobSpawnEvent$FinalizeSpawn')({
    getSpawnType: () => 'NATURAL',
    getEntity: () => entity,
  });
  assert.equal(marker.get('_blood_moon_natural_spawn'), true);
  marker.clear();
  listeners.get('net.minecraftforge.event.entity.living.MobSpawnEvent$FinalizeSpawn')({
    getSpawnType: () => 'SPAWNER',
    getEntity: () => entity,
  });
  assert.equal(marker.size, 0);
  category = 'CREATURE';
  listeners.get('net.minecraftforge.event.entity.living.MobSpawnEvent$FinalizeSpawn')({
    getSpawnType: () => 'NATURAL',
    getEntity: () => entity,
  });
  assert.equal(marker.size, 0);
  category = 'MONSTER';
  active = false;
  listeners.get('net.minecraftforge.event.entity.living.MobSpawnEvent$FinalizeSpawn')({
    getSpawnType: () => 'NATURAL',
    getEntity: () => entity,
  });
  assert.equal(marker.size, 0);
  active = true;
  let result = null;
  const sleep = listeners.get('net.minecraftforge.event.entity.player.PlayerSleepInBedEvent');
  sleep({ getEntity: () => ({ level: moonLevel(13000), tell: () => {} }), setResult: value => { result = value; } });
  assert.equal(result, 'NOT_POSSIBLE_NOW');
  active = false;
  result = null;
  sleep({ getEntity: () => ({ level: moonLevel(25000), tell: () => {} }), setResult: value => { result = value; } });
  assert.equal(result, null);
});

test('blood moon conversion and existing negative luck conversion use the same miniboss rules', () => {
  let hurt;
  let bossMode = false;
  const context = {
    global: {},
    console: { log: () => {} },
    Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
    TagKey: { create: () => ({}) },
    Registries: { ENTITY_TYPE: {} },
    ResourceLocation: function () {},
    ResourceKey: { create: (registry, id) => ({ registry, id }) },
    BuiltInRegistries: { ENTITY_TYPE: {
      getHolder: () => ({ isPresent: () => true, get: () => ({ is: () => { throw new Error('ambiguous Java overload'); } }) }),
      getTag: () => ({ isPresent: () => true, get: () => ({ contains: () => bossMode }) }),
    } },
    TamableAnimal: class {},
    EntityEvents: { hurt: callback => { hurt = callback; } },
  };
  loadScript('server_scripts/mini_boss_system/blacklist.js', context);
  loadScript('server_scripts/mini_boss_system/main.js', context);
  function mob() {
    const tags = new Map();
    const entity = {
      persistentData: {
        getBoolean: key => tags.get(key) === true,
        putBoolean: (key, value) => tags.set(key, value),
        putString: (key, value) => tags.set(key, value),
        putInt: (key, value) => tags.set(key, value),
      },
      server: { runCommandSilent: () => {} },
      getUuid: () => 'uuid',
      getAttribute: () => ({ getValue: () => 20 }),
      isAlive: () => true,
      isPlayer: () => false,
      getType: () => 'minecraft:zombie',
      setAttributeBaseValue: (key, value) => { entity.maxHealth = value; },
      getMaxHealth: () => entity.maxHealth,
      setHealth: value => { entity.health = value; },
    };
    return { entity, tags };
  }
  const bloodMob = mob();
  const luckMob = mob();
  assert.equal(typeof context.convertToMiniBoss, 'function');
  assert.equal(context.convertToMiniBoss(bloodMob.entity), true);
  hurt({ entity: luckMob.entity, source: { player: { getAttribute: () => ({ getValue: () => -100 }) } } });
  for (const { tags, entity } of [bloodMob, luckMob]) {
    assert.equal(tags.get('isMiniBoss'), true);
    assert.equal(entity.health, 60);
    assert.equal(tags.get('POWER'), '["Explode"]');
    assert.equal(tags.get('POWER_LEVELS'), '{"Explode":3}');
  }
  assert.equal(context.convertToMiniBoss(bloodMob.entity), false);
  bossMode = true;
  const realBoss = mob();
  assert.equal(context.convertToMiniBoss(realBoss.entity), false);
  assert.equal(realBoss.tags.has('isMiniBoss'), false);
});

// 黑名单专项：blacklist.js 的 MB_ENTITY_BLACKLIST / MB_POWER_BLACKLIST 在共用转化路径生效。
// blacklistSource 非空时以此源码注入替代真实 blacklist.js 的 const 声明（同一 context 词法作用域）。
function minibossContext(blacklistSource) {
  let hurt;
  const context = {
    global: {},
    console: { log: () => {} },
    Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
    TagKey: { create: () => ({}) },
    Registries: { ENTITY_TYPE: {} },
    ResourceLocation: function () {},
    ResourceKey: { create: (registry, id) => ({ registry, id }) },
    BuiltInRegistries: { ENTITY_TYPE: {
      getHolder: () => ({ isPresent: () => true, get: () => ({}) }),
      getTag: () => ({ isPresent: () => false, get: () => ({ contains: () => false }) }),
    } },
    TamableAnimal: class {},
    EntityEvents: { hurt: callback => { hurt = callback; } },
  };
  if (blacklistSource) {
    vm.runInNewContext(blacklistSource, context, { filename: 'injected blacklist.js' });
  } else {
    loadScript('server_scripts/mini_boss_system/blacklist.js', context);
  }
  loadScript('server_scripts/mini_boss_system/main.js', context);
  return { context, getHurt: () => hurt };
}

function minibossMob(id) {
  const tags = new Map();
  const dyeCalls = [];
  const entity = {
    persistentData: {
      getBoolean: key => tags.get(key) === true,
      putBoolean: (key, value) => tags.set(key, value),
      putString: (key, value) => tags.set(key, value),
      putInt: (key, value) => tags.set(key, value),
    },
    server: { runCommandSilent: command => dyeCalls.push(command) },
    getUuid: () => 'uuid',
    getAttribute: () => ({ getValue: () => 20 }),
    isAlive: () => true,
    isPlayer: () => false,
    getType: () => id,
    setAttributeBaseValue: (key, value) => { entity.maxHealth = value; },
    getMaxHealth: () => entity.maxHealth,
    setHealth: value => { entity.health = value; },
  };
  return { entity, tags, dyeCalls };
}

test('miniboss entity and power blacklists are enforced on the shared conversion path', () => {
  const { context } = minibossContext(`
    const MB_ENTITY_BLACKLIST = ['minecraft:villager', 'blockedmod:*'];
    const MB_POWER_BLACKLIST = { 'minecraft:zombie': ['Explode'] };
  `);
  // 实体黑名单：精确 id 与命名空间通配均拒绝转化，不写标记、不执行 Dyeing 外观命令
  const villager = minibossMob('minecraft:villager');
  const blocked = minibossMob('blockedmod:golem');
  assert.equal(context.convertToMiniBoss(villager.entity), false);
  assert.equal(context.convertToMiniBoss(blocked.entity), false);
  assert.equal(villager.tags.has('isMiniBoss'), false);
  assert.equal(villager.dyeCalls.length, 0);
  // 词条黑名单：僵尸仍转化成功，但抽不到被禁的 Explode（固定随机 0.5 时抽中 Disarm）
  const zombie = minibossMob('minecraft:zombie');
  assert.equal(context.convertToMiniBoss(zombie.entity), true);
  assert.equal(zombie.tags.get('isMiniBoss'), true);
  assert.equal(zombie.tags.get('POWER'), '["Disarm"]');
  assert.equal(zombie.tags.get('POWER_LEVELS'), '{"Disarm":3}');
});

test('entity whose powers are all blacklisted skips miniboss conversion entirely', () => {
  // '*' 全局禁用 POWER 当前全部 17 个词条 → 可用池为空 → 视同实体黑名单
  const { context } = minibossContext(`
    const MB_ENTITY_BLACKLIST = [];
    const MB_POWER_BLACKLIST = { '*': ['Dig','Regenerate','Reinforce','Leader','Stealth','Evolve','Parasite','Adapt','Explode','Disarm','HeavyArmor','Dispel','Shadow','Assassin','Rigidity','Fury','Drain'] };
  `);
  const mob = minibossMob('minecraft:zombie');
  assert.equal(context.convertToMiniBoss(mob.entity), false);
  assert.equal(mob.tags.has('isMiniBoss'), false);
  assert.equal(mob.dyeCalls.length, 0);
});
