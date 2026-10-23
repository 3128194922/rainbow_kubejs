// 运行实际服务端脚本；替身仅覆盖调度、持久状态和世界接口，不代表 Minecraft/Rhino 实测。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
// 追猎者入口已归并到 backroom 目录，沿用原有行为用例验证当前活动脚本。
const script = path.join(__dirname, '../server_scripts/backroom/main.js');

class Tag {
  constructor() { this.values = new Map(); }
  contains(k) { return this.values.has(k); }
  getCompound(k) { return this.values.get(k) || new Tag(); }
  put(k, v) { this.values.set(k, v); }
  getString(k) { return this.values.get(k) || ''; }
  putString(k, v) { this.values.set(k, String(v)); }
  getLong(k) { return this.values.get(k) || 0; }
  putLong(k, v) { this.values.set(k, v); }
  getBoolean(k) { return !!this.values.get(k); }
  putBoolean(k, v) { this.values.set(k, v); }
  getInt(k) { return this.values.get(k) || 0; }
  putInt(k, v) { this.values.set(k, v); }
  getAllKeys() { return [...this.values.keys()]; }
  remove(k) { this.values.delete(k); }
}

function harness() {
  const h = { now: 1000000, tick: 0, entities: [], players: [], runs: new Map(), listeners: {}, pending: [], logs: [], created: 0, chunksLoaded: true, collision: false, support: true, spawnEvents: 0, registered: true, acceptSpawn: true, collisionChecks: [], initialized: [] };
  const level = h.level = {
    dimension: 'backroomroguelike:backroom', persistentData: new Tag(),
    isClientSide: () => false, getTime: () => h.tick,
    getMinBuildHeight: () => -64, getMaxBuildHeight: () => 320,
    getCurrentDifficultyAt: pos => ({ pos }),
    get players() { return h.players; }, get entities() { return h.entities.filter(e => !e.removed); },
    hasChunkAt: () => h.chunksLoaded,
    getBlockState: () => ({ isFaceSturdy: () => h.support, getFluidState: () => ({ isEmpty: () => true }) }),
    noCollision: (entity, box) => { h.collisionChecks.push(box); return !h.collision; }, containsAnyLiquid: () => false,
    getEntity: id => h.entities.find(e => String(e.uuid) === id && !e.removed) || null,
    createEntity: () => {
      h.created++;
      const e = { uuid: 'hunter-' + h.created, type: 'mutantmore:mutant_wither_skeleton', persistentData: new Tag(),
        x: 0, y: 0, z: 0, removed: false, alive: true, moves: [], stops: 0, targets: [],
        getLevel: () => level, isAlive() { return this.alive; }, isRemoved() { return this.removed; },
        getBbWidth: () => 1.25, getBbHeight: () => 3.2,
        setPositionAndRotation(x, y, z) { Object.assign(this, { x, y, z }); },
        getBoundingBox() { return { minX: this.x - 0.625, maxX: this.x + 0.625, minY: this.y, maxY: this.y + 3.2, minZ: this.z - 0.625, maxZ: this.z + 0.625 }; },
        setPersistenceRequired() { this.persistent = true; },
        setTarget(t) { this.targets.push(t); },
        getNavigation() { return { moveTo: (p, speed) => this.moves.push({ p, speed, tick: h.tick }), stop: () => this.stops++ }; },
        discard() { this.removed = true; },
        spawn() {
          const event = { entity: this, level, canceled: false, cancel() { this.canceled = true; } };
          h.spawnEvents++;
          h.listeners.spawned(event);
          if (!event.canceled && h.acceptSpawn) h.entities.push(this);
        },
      };
      return e;
    },
  };
  const server = h.server = {
    scheduleInTicks: (ticks, callback) => h.pending.push(callback),
    getPlayerList: () => ({ getPlayer: uuid => h.players.find(p => p.uuid === uuid) || null }),
  };
  level.getServer = () => server;
  h.player = (uuid, enteredAt = h.now) => {
    const p = { uuid, x: 100, y: -61, z: 100, messages: [], sounds: [],
      isAlive: () => true, isCreative: () => false, isSpectator: () => false,
      getLevel: () => level, tell(message) { this.messages.push(message); },
      playNotifySound(...args) { this.sounds.push(args); },
    };
    h.players.push(p);
    h.runs.set(uuid, { enteredAt: () => enteredAt });
    return p;
  };
  h.load = () => {
    const context = {
      console: { log: v => h.logs.push(String(v)) }, Date: { now: () => h.now }, Math, Number, String,
      CompoundTag: Tag, BlockPos: class { constructor(x, y, z) { Object.assign(this, { x, y, z }); } },
      Direction: { UP: 'up' }, UUID: { fromString: s => s }, SoundSource: { PLAYERS: 'players' },
      ResourceLocation: class { constructor(id) { this.id = id; } },
      ForgeRegistries: { ENTITY_TYPES: { containsKey: () => h.registered }, SOUND_EVENTS: { containsKey: () => true, getValue: () => 'warning' } },
      ForgeEventFactory: { onFinalizeSpawn: (entity, world, difficulty, reason) => { h.initialized.push({ entity, world, difficulty, reason }); entity.equipped = true; } },
      MobSpawnType: { EVENT: 'event' },
      BackroomRunData: { get: () => ({ get: uuid => h.runs.get(uuid) || null }) },
      LevelEvents: { tick: (dimension, fn) => { h.dimension = dimension; h.listeners.tick = fn; } },
      EntityEvents: { spawned: (type, fn) => { h.listeners.spawned = fn; }, death: (type, fn) => { h.listeners.death = fn; } },
      PlayerEvents: { loggedOut: fn => { h.listeners.logout = fn; } },
    };
    vm.runInNewContext(fs.readFileSync(script, 'utf8'), context, { filename: script });
    h.context = context;
  };
  h.step = (millis = 0, ticks = 20) => { h.now += millis; h.tick += ticks; h.listeners.tick({ level, server }); };
  h.live = () => h.entities.filter(e => e.alive && !e.removed);
  h.flush = () => { h.pending.splice(0).forEach(fn => fn()); };
  h.load();
  return h;
}

test('正式维度：满 5 分钟生成一只；生成位置为 32～40 格，持续到下个检查周期也不重复', () => {
  const h = harness(); const p = h.player('p1');
  assert.equal(h.dimension, 'backroomroguelike:backroom');
  h.step(); h.step(299999); assert.equal(h.live().length, 0);
  h.step(1); assert.equal(h.live().length, 1);
  const e = h.live()[0];
  assert.ok(Math.hypot(e.x - p.x, e.z - p.z) >= 32 && Math.hypot(e.x - p.x, e.z - p.z) <= 40);
  assert.equal(e.persistent, true); assert.equal(e.moves[0].p, p); assert.equal(e.moves[0].speed, 1.2);
  h.step(300000); assert.equal(h.live().length, 1);
});

test('两个玩家错开开局，生成与寻路对象按本局独立绑定', () => {
  const h = harness(); const a = h.player('a'); h.step();
  h.step(120000); const b = h.player('b'); h.step();
  h.step(180000); assert.equal(h.live().length, 1); assert.equal(h.live()[0].moves[0].p, a);
  h.step(120000); assert.equal(h.live().length, 2); assert.equal(h.live()[1].moves[0].p, b);
});

test('袭击期每秒寻路；平静期停止旧导航，随后每 30 秒寻路', () => {
  const h = harness(); h.player('p'); h.step(); h.step(300000);
  const e = h.live()[0]; let n = e.moves.length;
  h.step(1000); assert.equal(e.moves.length, n + 1);
  h.step(179000); assert.ok(e.stops >= 1); assert.ok(e.targets.includes(null));
  n = e.moves.length; h.step(1000); assert.equal(e.moves.length, n);
  h.step(29000, 580); assert.equal(e.moves.length, n + 1);
});

test('没有本局、已过期本局与创造/旁观玩家不生成', () => {
  const h = harness(); h.player('no-run'); h.runs.delete('no-run');
  h.player('expired', h.now - 1200000); const c = h.player('creative', h.now - 300000); c.isCreative = () => true;
  const s = h.player('spectator', h.now - 300000); s.isSpectator = () => true;
  h.step(); assert.equal(h.created, 0);
});

test('完整实体碰撞、脚下支撑或区块加载不合格时不生成', () => {
  for (const [key, value] of [['collision', true], ['support', false], ['chunksLoaded', false]]) {
    const h = harness(); h.player('p'); h.step(); h[key] = value; h.step(300000);
    assert.equal(h.live().length, 0, key);
    assert.ok(h.created <= 1, '一次生成检查仅创建一个待放置实体');
  }
});

test('脚本重载与实体区块卸载均保留名额，不生成第二只', () => {
  const h = harness(); h.player('p'); h.step(); h.step(300000);
  const e = h.live()[0]; h.load(); h.step(300000); assert.equal(h.live().length, 1);
  h.entities = []; h.load(); h.step(300000); assert.equal(h.created, 1);
  h.entities.push(e); h.step(); assert.equal(e.removed, false);
});

test('撤离/离线仅清理标记实体；旧本局实体重新加载时拒绝入场', () => {
  const h = harness(); h.player('p'); h.step(); h.step(300000);
  const e = h.live()[0]; const natural = { uuid: 'natural', persistentData: new Tag(), alive: true, isAlive: () => true };
  h.entities.push(natural); h.runs.delete('p'); h.step();
  assert.equal(e.removed, true); assert.equal(natural.removed, undefined);
  h.runs.set('p', { enteredAt: () => h.now });
  const ev = { entity: e, level: h.level, canceled: false, cancel() { this.canceled = true; } };
  h.listeners.spawned(ev); assert.equal(ev.canceled, true);
});

test('取消死亡后仍存活时不释放名额，确认死亡后到下个周期才补充', () => {
  const h = harness(); h.player('p'); h.step(); h.step(300000); const e = h.live()[0];
  h.listeners.death({ entity: e, level: h.level, server: h.server }); h.flush();
  h.step(300000); assert.equal(h.created, 1);
  e.alive = false; h.listeners.death({ entity: e, level: h.level, server: h.server }); h.flush(); h.entities = [];
  h.step(1000); assert.equal(h.created, 1);
  h.step(299000); assert.equal(h.created, 2);
});

test('真正离线时清理已加载实体，并拒绝未加载旧实体在重连后抢占新名额', () => {
  const h = harness(); const p = h.player('p'); h.step(); h.step(300000); const old = h.live()[0];
  h.entities = []; h.listeners.logout({ player: p }); h.players = [];
  h.players = [p]; h.step(300000); assert.equal(h.live().length, 1);
  const ev = { entity: old, level: h.level, canceled: false, cancel() { this.canceled = true; } };
  h.listeners.spawned(ev); assert.equal(ev.canceled, true);
  const current = h.live()[0]; h.listeners.logout({ player: p }); assert.equal(current.removed, true);
});

test('同一玩家新开局会清除旧实体，且新一局仍需满 5 分钟', () => {
  const h = harness(); h.player('p'); h.step(); h.step(300000); const old = h.live()[0];
  const entered = h.now; h.runs.set('p', { enteredAt: () => entered }); h.step();
  assert.equal(old.removed, true); assert.equal(h.live().length, 0);
  h.step(300000); assert.equal(h.live().length, 1); assert.equal(h.created, 2);
});

test('安全检测传入完整碰撞箱，邻块未加载时不查询碰撞、不生成', () => {
  const h = harness(); h.player('p'); h.step(); h.step(300000);
  assert.ok(h.collisionChecks.length > 0);
  const box = h.collisionChecks[0]; assert.ok(Math.abs(box.maxY - box.minY - 3.2) < 1e-9); assert.equal(box.maxX - box.minX, 1.25);
  const other = harness(); other.player('p'); other.step(); other.chunksLoaded = false; other.step(300000);
  assert.equal(other.collisionChecks.length, 0); assert.equal(other.live().length, 0);
});

test('生成被外部取消会释放名额，下一周期可再次生成；缺实体模组时无创建调用', () => {
  const h = harness(); h.player('p'); h.step(); h.acceptSpawn = false; h.step(300000);
  assert.equal(h.live().length, 0); h.acceptSpawn = true; h.step(300000); assert.equal(h.live().length, 1);
  const other = harness(); other.player('p'); other.step(); other.registered = false; other.step(300000);
  assert.equal(other.created, 0); assert.ok(other.logs.some(v => v.includes('实体未注册')));
});

test('缺少模组本局 API 时安全跳过并限流日志', () => {
  const h = harness(); h.player('p'); h.context.BackroomRunData = null;
  h.step(300000); h.step(1000); assert.equal(h.created, 0); assert.equal(h.logs.length, 1);
});

test('可配置为共享维度 tick 时钟；所有玩家在同一维度周期检查生成', () => {
  const h = harness(); h.player('a'); h.step(); h.step(120000); h.player('b');
  vm.runInContext("BACKROOM_HUNTERS.clock = 'dimension'", h.context);
  h.tick = 5980; h.step(); assert.equal(h.live().length, 2);
});

test('仅有过期实体且维度无人时清理，未标记的自然实体保留', () => {
  const h = harness(); h.player('p'); h.step(); h.step(300000); const old = h.live()[0];
  const natural = { uuid: 'natural', persistentData: new Tag(), alive: true, isAlive: () => true };
  h.entities.push(natural); h.players = []; h.step();
  assert.equal(old.removed, true); assert.equal(natural.removed, undefined);
});

test('生成走 Forge 原生初始化，确保突变凋灵骷髅的双刀等出生逻辑执行', () => {
  const h = harness(); h.player('p'); h.step(); h.step(300000);
  assert.equal(h.initialized.length, 1); assert.equal(h.initialized[0].reason, 'event');
  assert.equal(h.initialized[0].world, h.level); assert.equal(h.live()[0].equipped, true);
});

test('第 6 分钟离线重连不提前补充，严格等第 10 分钟生成检查', () => {
  const h = harness(); const p = h.player('p'); h.step(); h.step(300000);
  h.listeners.logout({ player: p }); h.players = []; h.step(60000);
  h.players = [p]; h.step(); assert.equal(h.live().length, 0); assert.equal(h.created, 1);
  h.step(240000); assert.equal(h.created, 2);
});
