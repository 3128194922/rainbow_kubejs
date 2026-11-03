const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

class Player {
  getItemInHand() { return { id: this.item || 'rainbow:han_sword' }; }
  server = { scheduleInTicks() {} };
}

function handler() {
  const code = fs.readFileSync(path.join(__dirname, '../startup_scripts/ForgeEvents/handleWeaponEffects.js'), 'utf8');
  const errors = [];
  const context = {
    Player, console: { log(value) { errors.push(String(value)); } },
  };
  vm.runInNewContext(`${code}\nthis.callback = event => handleHanSwordExecution(event, event.getEntity(), event.getSource());`, context);
  return { callback: context.callback, errors };
}

function damageEvent(source, health = 4) {
  let amount = 2;
  const target = { level: { isClientSide: () => false }, isAlive: () => true, getHealth: () => health, getMaxHealth: () => 20, getX: () => 0, getY: () => 0, getZ: () => 0 };
  return { getEntity: () => target, getSource: () => source, isCanceled: () => false, getAmount: () => amount, setAmount(value) { amount = value; } };
}

test('environmental damage returns without exceptions or modification', () => {
  const { callback, errors } = handler();
  const event = damageEvent({ getType: () => 'onFire', getActual() { throw new Error('unexpected lookup'); } });
  callback(event);
  assert.equal(event.getAmount(), 2);
  assert.deepEqual(errors, []);
});

test('only a low-health target hit by a player with the sword receives lethal damage', () => {
  const { callback, errors } = handler();
  const player = new Player();
  const source = { getType: () => 'player', getActual: () => player };
  const low = damageEvent(source, 4);
  callback(low);
  assert.equal(low.getAmount(), 4);
  const boundary = damageEvent(source, 5);
  callback(boundary);
  assert.equal(boundary.getAmount(), 2);
  player.item = 'minecraft:stick';
  const wrongWeapon = damageEvent(source, 4);
  callback(wrongWeapon);
  assert.equal(wrongWeapon.getAmount(), 2);
  assert.deepEqual(errors, []);
});
