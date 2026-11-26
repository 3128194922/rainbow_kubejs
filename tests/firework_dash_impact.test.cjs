const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'startup_scripts', 'ForgeEvents', 'handleFireworkDash.js');

function loadModule() {
  const globalObject = {};
  const log = [];
  class Vec3d {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  }
  const source = fs.readFileSync(SOURCE, 'utf8');
  new Function('global', 'Vec3d', 'console', source)(globalObject, Vec3d, {
    log: line => log.push(String(line))
  });
  return { globalObject, log, Vec3d };
}

function makeData() {
  const values = new Map();
  return {
    getInt: key => values.get(key) || 0,
    getDouble: key => values.get(key) || 0,
    getFloat: key => values.get(key) || 0,
    putInt: (key, value) => values.set(key, value),
    putDouble: (key, value) => values.set(key, value),
    putFloat: (key, value) => values.set(key, value),
    remove: key => values.delete(key),
    has: key => values.has(key)
  };
}

function makeEntity() {
  const scheduled = [];
  const attacks = [];
  const entity = {
    alive: true,
    horizontalCollision: false,
    hurtMarked: false,
    movement: null,
    persistentData: makeData(),
    isAlive() {
      return this.alive;
    },
    setDeltaMovement(value) {
      this.movement = value;
    },
    attack(source, amount) {
      attacks.push({ source, amount });
    },
    damageSources() {
      return {
        generic: () => ({ type: 'generic' }),
        playerAttack: source => ({ type: 'player', source })
      };
    },
    level: {
      getEntity() {
        return null;
      },
      server: {
        scheduleInTicks(ticks, callback) {
          scheduled.push({ ticks, callback });
        }
      }
    }
  };
  return { entity, scheduled, attacks };
}

test('烟花拳套冲撞按 10 tick 调度并结束清理', () => {
  const { globalObject } = loadModule();
  const { entity, scheduled } = makeEntity();

  globalObject.startFireworkDashImpact(entity, 1, 0, 7, 42);
  assert.equal(scheduled.length, 1);
  assert.equal(entity.persistentData.getInt('FireworkDashImpactTicks'), 10);

  let steps = 0;
  while (scheduled.length > 0 && steps < 20) {
    const next = scheduled.shift();
    assert.equal(next.ticks, 1);
    next.callback();
    steps++;
  }

  assert.equal(steps, 10);
  assert.equal(entity.hurtMarked, true);
  assert.equal(entity.movement.y, 0.4);
  assert.equal(entity.persistentData.has('FireworkDashImpactTicks'), false);
});

test('烟花拳套撞墙只结算一次二次伤害', () => {
  const { globalObject } = loadModule();
  const { entity, scheduled, attacks } = makeEntity();
  entity.horizontalCollision = true;

  globalObject.startFireworkDashImpact(entity, 1, 0, 7, 42);
  scheduled.shift().callback();

  assert.equal(attacks.length, 1);
  assert.equal(attacks[0].amount, 7);
  assert.equal(scheduled.length, 0);
  assert.equal(entity.persistentData.has('FireworkDashImpactTicks'), false);
});
