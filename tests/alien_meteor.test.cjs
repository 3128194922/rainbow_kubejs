// 执行实际玩法函数；替身仅模拟 KubeJS/实体边界，验证异星陨石主动技能行为。
// 复现 2026-10-25 报告：手持 rainbow:mini_moon 通过技能轮盘触发后，
// 持续 AOE（粒子与伤害）完全不执行。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load(file, ctx) { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file }); }

function harness() {
  const hooks = {};
  const ctx = vm.createContext({
    console,
    global: {},
    PlayerEvents: {
      tick: fn => { hooks.tick = fn; },
      loggedOut: fn => { hooks.loggedOut = fn; },
    },
    hasCurios: (e, id) => e.curios.includes(id),
  });
  load('server_scripts/alien_meteor/main.js', ctx);
  return { ctx, hooks };
}

function makePersist() {
  const store = {};
  return {
    getLong: k => store[k] || 0,
    putLong: (k, v) => { store[k] = v; },
    remove: k => { delete store[k]; },
    has: k => k in store,
  };
}

function playerFixture() {
  const p = {
    curios: [],
    hands: { main_hand: null, off_hand: null },
    persistentData: makePersist(),
    age: 0,
    alive: true,
    anims: [], aoeCalls: [], commands: [], cooldownsAdded: [],
  };
  p.getItemInHand = hand => p.hands[hand] || { id: 'minecraft:air', isEmpty: () => true };
  p.isAlive = () => p.alive;
  p.isPlayer = () => true;
  p.getUuid = () => ({ toString: () => 'player-1' });
  p.getX = () => 10; p.getY = () => 64; p.getZ = () => -20;
  p.cooldowns = {
    isOnCooldown: id => p.cooldownsAdded.some(c => c.id === id && p.age < c.untilTick),
    addCooldown: (id, ticks) => { p.cooldownsAdded.push({ id, untilTick: p.age + ticks }); },
  };
  p.level = { isClientSide: () => false, getTime: () => 1000 + p.age };
  p.server = { runCommandSilent: cmd => { p.commands.push(cmd); } };
  return p;
}

// 气场命令：边界对应 AOE 半径 5；初次 20 tick 扩张一次（play_count=1 + end 保持全尺寸），之后 40 tick/圈无限旋转直到技能结束
const AURA_ADD_CMD = 'dyeing area add scale alien_meteor_aura player-1 -5 0 -5 5 3 5 FFFFFFFF 0.25 1.0 0.45 0.35 20 1 end 40 -1';
const AURA_REMOVE_CMD = 'dyeing area remove player-1 alien_meteor_aura';

// 供 startAlienMeteor / tick 处理器使用的全局替身
function installGlobals(ctx, player) {
  ctx.global.playPlayerAnim = (p, anim) => { player.anims.push(anim); return true; };
  ctx.global.rebalanceAoe = (p, x, y, z, radius, damage, type, kind, parent) => {
    player.aoeCalls.push({ x, y, z, radius, damage, type, kind, parent });
  };
}

function runTicks(hooks, player, count) {
  for (let i = 0; i < count; i++) { player.age++; hooks.tick({ player }); }
}

test('手持触发（主手持有、未装备 Curios）后持续 AOE 与白色矩形气场正常执行', () => {
  const { ctx, hooks } = harness();
  const p = playerFixture();
  p.hands.main_hand = { id: 'rainbow:mini_moon', isEmpty: () => false };
  installGlobals(ctx, p);

  ctx.global.startAlienMeteor(p);
  assert.equal(p.anims.length, 1, '开启时应播放动画');
  assert.ok(p.persistentData.has('AlienMeteorUntil'), '开启时应写入 AlienMeteorUntil');
  assert.ok(p.commands.includes(AURA_ADD_CMD), '开启时应添加 Dyeing 白色矩形气场');

  // 200 tick 持续期内推进 200 tick，每 20 tick 一次脉冲
  runTicks(hooks, p, 200);
  assert.ok(p.persistentData.has('AlienMeteorUntil'), '持续期内手持触发不得清除状态');
  assert.equal(p.aoeCalls.length, 10, '200 tick 内应产生 10 次 AOE 脉冲');
  assert.equal(p.commands.filter(c => c === AURA_ADD_CMD).length, 1, '持续期内不得重复添加气场');
  assert.ok(!p.commands.some(c => c.startsWith('particle ')), '特效应改用 Dyeing 气场而非原版粒子');
  const first = p.aoeCalls[0];
  assert.deepEqual(
    { radius: first.radius, damage: first.damage, type: first.type, kind: first.kind },
    { radius: 5, damage: 6, type: 'alien_meteor', kind: 'root' }
  );
});

test('Curios 装备触发同样正常执行', () => {
  const { ctx, hooks } = harness();
  const p = playerFixture();
  p.curios.push('rainbow:mini_moon');
  installGlobals(ctx, p);

  ctx.global.startAlienMeteor(p);
  runTicks(hooks, p, 20);
  assert.equal(p.aoeCalls.length, 1, '装备触发时每 20 tick 应有一次 AOE');
  assert.ok(p.commands.includes(AURA_ADD_CMD), '装备触发同样应添加气场');
});

test('物品既不在 Curios 也不在手（丢掉/移出）时终止持续 AOE 并移除气场', () => {
  const { ctx, hooks } = harness();
  const p = playerFixture();
  p.hands.main_hand = { id: 'rainbow:mini_moon', isEmpty: () => false };
  installGlobals(ctx, p);

  ctx.global.startAlienMeteor(p);
  runTicks(hooks, p, 5);
  // 玩家把物品丢出去：手上变空、Curios 也未装备
  p.hands.main_hand = null;
  runTicks(hooks, p, 40);
  assert.ok(!p.persistentData.has('AlienMeteorUntil'), '物品离开后应清除状态');
  assert.equal(p.aoeCalls.length, 0, '物品离开后不得再触发 AOE');
  assert.ok(p.commands.includes(AURA_REMOVE_CMD), '物品离开后应移除气场');
});

test('到期后清除状态、移除气场并不再造成伤害', () => {
  const { ctx, hooks } = harness();
  const p = playerFixture();
  p.curios.push('rainbow:mini_moon');
  installGlobals(ctx, p);

  ctx.global.startAlienMeteor(p);
  runTicks(hooks, p, 200);
  assert.ok(p.persistentData.has('AlienMeteorUntil'), '200 tick 结束时仍在持续期内');
  assert.ok(!p.commands.includes(AURA_REMOVE_CMD), '持续期内不应移除气场');
  runTicks(hooks, p, 1);
  assert.ok(!p.persistentData.has('AlienMeteorUntil'), '到期后应清除状态');
  assert.ok(p.commands.includes(AURA_REMOVE_CMD), '到期后应移除气场');
  const pulses = p.aoeCalls.length;
  runTicks(hooks, p, 40);
  assert.equal(p.aoeCalls.length, pulses, '到期后不得再触发 AOE');
});

test('开启时设置 15 秒冷却，冷却中不可重复开启', () => {
  const { ctx, hooks } = harness();
  const p = playerFixture();
  p.curios.push('rainbow:mini_moon');
  installGlobals(ctx, p);

  ctx.global.startAlienMeteor(p);
  assert.deepEqual(p.cooldownsAdded, [{ id: 'rainbow:mini_moon', untilTick: 300 }], '应加 300 tick 冷却');

  p.persistentData.remove('AlienMeteorUntil');
  ctx.global.startAlienMeteor(p);
  assert.equal(p.anims.length, 1, '冷却中重复开启应被拒绝');
  assert.ok(!p.persistentData.has('AlienMeteorUntil'), '冷却中不得重新写入状态');
  assert.equal(p.commands.filter(c => c === AURA_ADD_CMD).length, 1, '冷却中不得重复添加气场');
});

test('下线时清理持续状态并移除气场', () => {
  const { ctx, hooks } = harness();
  const p = playerFixture();
  p.curios.push('rainbow:mini_moon');
  installGlobals(ctx, p);

  ctx.global.startAlienMeteor(p);
  hooks.loggedOut({ player: p });
  assert.ok(!p.persistentData.has('AlienMeteorUntil'), '下线应清除状态');
  assert.ok(p.commands.includes(AURA_REMOVE_CMD), '下线应移除气场');
});
