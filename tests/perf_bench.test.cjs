const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('microbenchmark completes using KubeJS 1.20.1 distance API', () => {
  const messages = [];
  const level = { getDimension: () => 'test', getEntitiesWithin: () => [], getEntities: () => [] };
  const player = {
    username: 'test', getLevel: () => level, getX: () => 0, getY: () => 0, getZ: () => 0,
    getUuid: () => ({ toString: () => 'id' }), getDistanceSq: () => 0,
    getItemBySlot: () => ({ id: 'minecraft:stone' }),
    persistentData: { getLong: () => 0, putString() {}, getString: () => '', remove() {} },
  };
  let nanos = 0;
  const context = {
    MCUtil: { getNanos() { return nanos += 100000; } },
    Item: { of: () => ({}) }, AABB: class {}, console: { info() {}, log() {} },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../server_scripts/system/perf/bench.js'), 'utf8'), context);
  context.perfRunBench(player, 100, 50, line => messages.push(line));
  assert.ok(messages.some(line => line.includes('微基准结果')));
  assert.ok(messages.some(line => line.includes('getDistanceSq')));
  assert.ok(!messages.some(line => line.includes('执行失败')));
});
