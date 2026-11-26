// 执行真实主动闪避残影脚本，检查事件入口、Dyeing 参数和重复事件抑制。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const scriptPath = path.join(__dirname, '..', 'startup_scripts', 'dodge_afterimage', 'main.js');

function loadScript(options = {}) {
  const handlers = [];
  const trailCalls = [];
  const context = {
    console,
    global: {},
    ForgeEvents: {
      onEvent(name, handler) {
        handlers.push({ name, handler });
      },
    },
    Dyeing: {
      trail(level, uuid, args) {
        trailCalls.push({ level, uuid, args });
      },
    },
  };
  if (options.noDyeing) delete context.Dyeing;
  vm.runInNewContext(fs.readFileSync(scriptPath, 'utf8'), context, { filename: scriptPath });
  return { context, handlers, trailCalls };
}

function makePlayer(uuid, time, clientSide = false) {
  return {
    level: {
      isClientSide: () => clientSide,
      getTime: () => time,
    },
    getUuid: () => ({ toString: () => uuid }),
  };
}

function fireRoll(handlers, player, rollDuration = 8) {
  const entry = handlers.find(item => item.name === 'net.combatroll.forge.event.CombatRollEvent');
  assert.ok(entry, 'CombatRollEvent handler should be registered');
  entry.handler({
    getPlayer: () => player,
    getRollDuration: () => rollDuration,
  });
}

test('registers the CombatRoll event handler', () => {
  const { handlers } = loadScript();
  assert.deepEqual(handlers.map(item => item.name), ['net.combatroll.forge.event.CombatRollEvent']);
});

test('applies a trail afterimage with the roll duration plus linger ticks', () => {
  const { handlers, trailCalls } = loadScript();
  fireRoll(handlers, makePlayer('player-a', 100), 8);

  assert.equal(trailCalls.length, 1);
  const call = trailCalls[0];
  assert.equal(call.uuid, 'player-a');
  assert.equal(call.args.mode, 'trail');
  assert.equal(call.args.color, '8FE9FF');
  assert.equal(call.args.duration_ticks, 10);
  assert.equal(call.args.lifetime, 10);
  assert.equal(call.args.render_delay, 1);
  assert.equal(call.args.track_range, 64);
});

test('falls back to the server roll duration when the event value is invalid', () => {
  const { handlers, trailCalls } = loadScript();
  fireRoll(handlers, makePlayer('player-b', 200), 0);
  assert.equal(trailCalls[0].args.duration_ticks, 10);
});

test('ignores duplicate events for the same roll', () => {
  const { handlers, trailCalls } = loadScript();
  const player = makePlayer('player-c', 300);
  fireRoll(handlers, player, 8);
  fireRoll(handlers, player, 8);
  assert.equal(trailCalls.length, 1);
});

test('applies again once the duplicate window has passed', () => {
  const { handlers, trailCalls } = loadScript();
  fireRoll(handlers, makePlayer('player-d', 400), 8);
  fireRoll(handlers, makePlayer('player-d', 403), 8);
  assert.equal(trailCalls.length, 2);
});

test('ignores client-side players', () => {
  const { handlers, trailCalls } = loadScript();
  fireRoll(handlers, makePlayer('player-e', 500, true), 8);
  assert.equal(trailCalls.length, 0);
});

test('does nothing when Dyeing is unavailable', () => {
  const { handlers } = loadScript({ noDyeing: true });
  assert.doesNotThrow(() => fireRoll(handlers, makePlayer('player-f', 600), 8));
});

test('swallows Dyeing errors without breaking the event', () => {
  const { context, handlers } = loadScript();
  context.Dyeing.trail = () => {
    throw new Error('dyeing offline');
  };
  assert.doesNotThrow(() => fireRoll(handlers, makePlayer('player-g', 700), 8));
});
