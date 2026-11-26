const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DISPATCHER = path.join(ROOT, 'startup_scripts', 'system', 'living_tick_dispatcher.js');

function loadDispatcher() {
  const source = fs.readFileSync(DISPATCHER, 'utf8');
  const globalObject = {};
  const logs = [];
  let listener = null;
  const ForgeEvents = {
    onEvent(name, callback) {
      assert.equal(name, 'net.minecraftforge.event.entity.living.LivingEvent$LivingTickEvent');
      listener = callback;
    }
  };
  const run = new Function('global', 'ForgeEvents', 'console', source);
  run(globalObject, ForgeEvents, { log: line => logs.push(String(line)) });
  assert.equal(typeof listener, 'function', 'dispatcher must register one LivingTick listener');
  return { globalObject, listener, logs };
}

test('一个 LivingTick 监听调度多个子函数并共享 entity', () => {
  const { globalObject, listener } = loadDispatcher();
  const calls = [];
  globalObject.registerLivingTickHandler('a', (event, entity) => calls.push(['a', event, entity]));
  globalObject.registerLivingTickHandler('b', (event, entity) => calls.push(['b', event, entity]));

  const entity = { level: { isClientSide: () => false } };
  const event = { entity };
  listener(event);

  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(call => call[0]), ['a', 'b']);
  assert.equal(calls[0][1], event);
  assert.equal(calls[0][2], entity);
  assert.equal(calls[1][2], entity);
});

test('重复注册同一 id 只替换，不重复执行', () => {
  const { globalObject, listener } = loadDispatcher();
  let first = 0;
  let second = 0;
  globalObject.registerLivingTickHandler('same', () => first++);
  globalObject.registerLivingTickHandler('same', () => second++);
  listener({ entity: { level: { isClientSide: () => false } } });
  assert.equal(first, 0);
  assert.equal(second, 1);
});

test('单个子函数抛错不会中断后续子函数', () => {
  const { globalObject, listener, logs } = loadDispatcher();
  let reached = false;
  globalObject.registerLivingTickHandler('broken', () => {
    throw new Error('boom');
  });
  globalObject.registerLivingTickHandler('after', () => {
    reached = true;
  });
  listener({ entity: { level: { isClientSide: () => false } } });
  assert.equal(reached, true);
  assert.ok(logs.some(line => line.includes('broken') && line.includes('boom')));
});

test('客户端实体和空实体不会触发子函数', () => {
  const { globalObject, listener } = loadDispatcher();
  let calls = 0;
  globalObject.registerLivingTickHandler('count', () => calls++);
  listener({ entity: null });
  listener({ entity: { level: { isClientSide: () => true } } });
  assert.equal(calls, 0);
});

test('注销后不再执行', () => {
  const { globalObject, listener } = loadDispatcher();
  let calls = 0;
  globalObject.registerLivingTickHandler('temp', () => calls++);
  globalObject.unregisterLivingTickHandler('temp');
  listener({ entity: { level: { isClientSide: () => false } } });
  assert.equal(calls, 0);
});
