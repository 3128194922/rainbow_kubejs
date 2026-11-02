const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('performance commands send messages through the supported Component API', () => {
  class Node {
    constructor(name) { this.name = name; this.children = []; }
    requires() { return this; }
    then(child) { this.children.push(child); return this; }
    executes(fn) { this.run = fn; return this; }
  }
  let root;
  let resets = 0;
  const messages = [];
  const ctx = { source: { sendSuccess(message) { messages.push(message); }, getPlayer: () => null, getServer: () => ({}) } };
  const sandbox = {
    ServerEvents: { commandRegistry(fn) { fn({ commands: { literal: name => new Node(name), argument: name => new Node(name) }, register(node) { root = node; } }); } },
    IntegerArgumentType: { integer() {} }, Integer: {},
    Component: { literal: value => value },
    perfProbeReport: () => ['probe'], perfResetProbes: () => { resets++; },
    perfStartMonitor: () => 'monitor started', console: { info() {}, log() {} },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../server_scripts/system/perf/main.js'), 'utf8'), sandbox);
  const child = name => root.children.find(node => node.name === name);
  assert.equal(child('stats').run(ctx), 1);
  assert.equal(child('reset').run(ctx), 1);
  assert.equal(child('monitor').run(ctx), 1);
  assert.equal(resets, 1);
  assert.deepEqual(messages, ['probe', '§a埋点统计已清零', 'monitor started']);
});
