const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadHandler() {
  const source = fs.readFileSync(path.join(__dirname, '../client_scripts/tooltips.js'), 'utf8');
  const prefix = source.slice(0, source.indexOf('//手套'));
  let handler;
  const component = { withStyle() { return this; } };
  vm.runInNewContext(prefix, {
    ItemEvents: { tooltip(fn) { fn({ addAdvanced(filter, callback) { assert.equal(filter, '#rainbow:food_tooltip'); handler = callback; } }); } },
    Text: { translate() { return component; } },
  });
  return handler;
}

test('food effects are displayed without calling an Item tag method', () => {
  const handler = loadHandler();
  const effect = { getEffect: () => ({ getCategory: () => ({ getTooltipFormatting: () => 'blue' }) }), getDescriptionId: () => 'effect.test', getAmplifier: () => 0, getDuration: () => 20 };
  const food = { effects: { isEmpty: () => false, size: () => 1, get: () => ({ first: effect }) } };
  const lines = [];
  handler({ mod: 'minecraft', item: { foodProperties: food } }, false, { add(index, line) { lines.splice(index, 0, line); } });
  assert.equal(lines.length, 1);
});

test('dungeonsdelight food remains excluded from custom effect tooltips', () => {
  const handler = loadHandler();
  const food = { effects: { isEmpty: () => false, size: () => 1, get() { throw new Error('excluded food was inspected'); } } };
  handler({ mod: 'dungeonsdelight', item: { foodProperties: food } }, false, { add() { throw new Error('unexpected tooltip'); } });
});
