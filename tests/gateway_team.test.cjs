// 执行真实传送门编队脚本，验证 GatewaysJS 生成事件 -> MineTeam 隐藏队伍编队。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scriptPath = path.join(root, 'server_scripts', 'gateway_team', 'main.js');
const script = fs.readFileSync(scriptPath, 'utf8');

function loadHarness(overrides, options) {
  const opts = options || {};
  const handlers = {};
  const created = [];
  const assigned = [];
  const logs = [];
  const api = Object.assign({
    createHiddenTeam: (server, id, color, name) => {
      created.push({ server, id, color, name });
      return 'mine_team_hidden_' + id;
    },
    assignHiddenTeam: (entity, id) => {
      assigned.push({ entity, id });
      return true;
    }
  }, overrides || {});
  const sandbox = {
    console: { log: message => logs.push(String(message)) },
    GatewaysEvents: {
      waveEntitySpawned: handler => { handlers.spawn = handler; }
    },
    ServerEvents: {
      loaded: handler => { handlers.loaded = handler; },
      unloaded: handler => { handlers.unloaded = handler; }
    },
    MineTeamAPI: opts.missingApi ? null : api
  };
  vm.runInNewContext(script, sandbox, { filename: 'gateway_team/main.js' });
  return { handlers, created, assigned, logs };
}

function makeEvent(server) {
  const waveEntity = { name: 'mob-1', toString: () => 'Mob[mob-1]' };
  return {
    entity: { serverLevel: server },
    waveEntity
  };
}

test('首个波次生成时创建隐藏队伍并把怪物编入队伍', () => {
  const { handlers, created, assigned, logs } = loadHarness();
  const server = { name: 'server' };
  const event = makeEvent(server);

  handlers.spawn(event);

  assert.equal(created.length, 1);
  assert.equal(created[0].server, server);
  assert.equal(created[0].id, 'gateway');
  assert.equal(created[0].color, '#8B5CF6');
  assert.equal(created[0].name, '传送门军团');

  assert.equal(assigned.length, 1);
  assert.equal(assigned[0].entity, event.waveEntity);
  assert.equal(assigned[0].id, 'gateway');
  assert.deepEqual(logs, []);
});

test('同一服务端的后续波次不再重复创建队伍', () => {
  const { handlers, created, assigned } = loadHarness();
  const server = { name: 'server' };

  handlers.spawn(makeEvent(server));
  handlers.spawn(makeEvent(server));

  assert.equal(created.length, 1);
  assert.equal(assigned.length, 2);
});

test('服务端加载时预建队伍，首个波次直接编队', () => {
  const { handlers, created, assigned } = loadHarness();
  const server = { name: 'server' };

  handlers.loaded({ server });
  handlers.spawn(makeEvent(server));

  assert.equal(created.length, 1);
  assert.equal(created[0].server, server);
  assert.equal(assigned.length, 1);
});

test('世界卸载后重新创建队伍', () => {
  const { handlers, created } = loadHarness();
  const first = { name: 'first' };
  const second = { name: 'second' };

  handlers.loaded({ server: first });
  handlers.unloaded({});
  handlers.spawn(makeEvent(second));

  assert.equal(created.length, 2);
  assert.equal(created[0].server, first);
  assert.equal(created[1].server, second);
});

test('创建队伍异常时只记录日志，不编队也不抛出', () => {
  const { handlers, assigned, logs } = loadHarness({
    createHiddenTeam: () => { throw new Error('boom'); }
  });

  assert.doesNotThrow(() => handlers.spawn(makeEvent({ name: 'server' })));
  assert.equal(assigned.length, 0);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /创建隐藏队伍失败/);
});

test('编队失败时记录日志，不影响传送门生成', () => {
  const { handlers, logs } = loadHarness({
    assignHiddenTeam: () => false
  });
  const event = makeEvent({ name: 'server' });

  assert.doesNotThrow(() => handlers.spawn(event));
  assert.equal(logs.length, 1);
  assert.match(logs[0], /未能加入队伍/);
});

test('waveEntity 为空时跳过编队', () => {
  const { handlers, created, assigned } = loadHarness();

  handlers.spawn({ entity: { serverLevel: { name: 'server' } }, waveEntity: null });

  assert.equal(created.length, 0);
  assert.equal(assigned.length, 0);
});

test('缺少 MineTeamAPI 时只提示一次并跳过', () => {
  const { handlers, created, assigned, logs } = loadHarness({}, { missingApi: true });
  const server = { name: 'server' };

  handlers.spawn(makeEvent(server));
  handlers.spawn(makeEvent(server));

  assert.equal(created.length, 0);
  assert.equal(assigned.length, 0);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /未找到 MineTeamAPI/);
});
