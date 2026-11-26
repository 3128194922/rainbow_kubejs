// 执行真实超级激素残影脚本，检查持续 trail 参数和结束时间写入。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const scriptPath = path.join(__dirname, '..', 'server_scripts', 'super_hormone', 'main.js');

function loadScript(options = {}) {
  const trailCalls = [];
  const stored = new Map();
  const context = {
    console,
    global: {},
    Dyeing: {
      trail(level, uuid, args) {
        trailCalls.push({ level, uuid, args });
      },
    },
  };
  if (options.noDyeing) delete context.Dyeing;
  vm.runInNewContext(fs.readFileSync(scriptPath, 'utf8'), context, { filename: scriptPath });
  return { context, trailCalls, stored };
}

function makePlayer(uuid, time, clientSide = false, stored) {
  return {
    level: {
      isClientSide: () => clientSide,
      getTime: () => time,
    },
    persistentData: {
      putLong(key, value) {
        stored.set(key, value);
      },
    },
    getUuid: () => ({ toString: () => uuid }),
  };
}

test('applies a golden trail for the whole super hormone duration', () => {
  const { context, trailCalls, stored } = loadScript();
  const player = makePlayer('player-a', 1000, false, stored);
  const ok = context.global.applySuperHormoneAfterimage(player, 200);

  assert.equal(ok, true);
  assert.equal(trailCalls.length, 1);
  const call = trailCalls[0];
  assert.equal(call.uuid, 'player-a');
  assert.equal(call.args.mode, 'trail');
  assert.equal(call.args.color, 'FFE000');
  assert.equal(call.args.duration_ticks, 210);
  assert.equal(call.args.max_alpha, 0.35);
  assert.equal(stored.get('rainbow:super_hormone_afterimage_until'), 1200);
});

test('falls back to 200 ticks when the skill duration is invalid', () => {
  const { context, trailCalls, stored } = loadScript();
  context.global.applySuperHormoneAfterimage(makePlayer('player-b', 2000, false, stored), 0);
  assert.equal(trailCalls[0].args.duration_ticks, 210);
  assert.equal(stored.get('rainbow:super_hormone_afterimage_until'), 2200);
});

test('ignores client-side players', () => {
  const { context, trailCalls, stored } = loadScript();
  const ok = context.global.applySuperHormoneAfterimage(makePlayer('player-c', 3000, true, stored), 200);
  assert.equal(ok, false);
  assert.equal(trailCalls.length, 0);
  assert.equal(stored.size, 0);
});

test('does nothing when Dyeing is unavailable', () => {
  const { context, stored } = loadScript({ noDyeing: true });
  const ok = context.global.applySuperHormoneAfterimage(makePlayer('player-d', 4000, false, stored), 200);
  assert.equal(ok, false);
  assert.equal(stored.size, 0);
});

test('swallows Dyeing errors and reports failure', () => {
  const { context, stored } = loadScript();
  context.Dyeing.trail = () => {
    throw new Error('dyeing offline');
  };
  const ok = context.global.applySuperHormoneAfterimage(makePlayer('player-e', 5000, false, stored), 200);
  assert.equal(ok, false);
});
