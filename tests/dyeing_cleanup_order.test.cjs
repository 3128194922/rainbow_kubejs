const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadFunctions() {
  const source = fs.readFileSync(path.join(__dirname, '../server_scripts/dyeing/main.js'), 'utf8');
  const code = source.slice(0, source.indexOf('// 服务器加载完成时执行清理'));
  const context = { console };
  vm.runInNewContext(code, context);
  return context;
}

test('a preserved effect stays untouched without requiring a loaded entity', () => {
  const { clearDyeingEntries } = loadFunctions();
  let lookups = 0;
  let removals = 0;
  const server = { getEntity() { lookups++; throw new Error('not available'); } };
  const uuid = { toString: () => 'preserved-uuid' };
  const data = {
    getEntries: () => ({ keySet: () => ({ toArray: () => [uuid] }) }),
    getAll: () => ({ isEmpty: () => false, keySet: () => ({ toArray: () => ['mini_boss_creeper_armor'] }) }),
    removeAll() { removals++; },
  };
  assert.equal(clearDyeingEntries(data, server), '0/0');
  assert.equal(removals, 0);
  assert.equal(lookups, 0);
});

test('non-preserved effects still defer to the mini-boss entity check', () => {
  const { shouldSkipDyeing } = loadFunctions();
  const data = { getAll: () => ({ isEmpty: () => true }) };
  const uuid = { toString: () => 'live-uuid' };
  assert.equal(shouldSkipDyeing(data, { getEntity: () => ({ persistentData: { getBoolean: () => true } }) }, uuid), true);
  assert.equal(shouldSkipDyeing(data, { getEntity: () => null }, uuid), false);
});
