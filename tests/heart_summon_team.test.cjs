// 执行真实心脏召唤处理器，验证僵尸继承 MineTeam 队伍与白队禁止召唤。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'server_scripts', 'curios_skill_system', 'Skillwheel.js'), 'utf8');
const start = script.indexOf('// --- 心脏系列 ---');
const end = script.indexOf('// --- 念力墙（已移除）---', start);
assert.ok(start >= 0 && end > start, '心脏系列代码段标记缺失');

function loadHarness(options) {
  const handlers = {};
  const teamCalls = [];
  const sandbox = {
    console,
    SecoundToTick: seconds => Math.round(seconds * 20),
    Item: { of: id => ({ id, enchant: () => ({ id }) }) },
    registerSkill: (id, handler) => { handlers[id] = handler; },
    MineTeamUtil: {
      getEffectiveTeamColor: () => options.color,
      isNoTeam: color => color == null || color === '' || color === 'white'
    },
    MineTeamSync: {
      applyTeam: (entity, color, sync) => {
        teamCalls.push({ entity, color, sync });
        return true;
      }
    }
  };
  vm.runInNewContext(script.slice(start, end), sandbox, { filename: 'Skillwheel.js#heart' });
  return { handlers, teamCalls };
}

function makePlayer() {
  const player = {
    messages: [],
    effects: [],
    cooldownCalls: [],
    cooldowns: {
      isOnCooldown: () => false,
      addCooldown: (id, ticks) => player.cooldownCalls.push([id, ticks])
    },
    getUuid: () => ({ toString: () => 'owner-uuid' }),
    getBlock: () => ({ pos: { x: 3, y: 64, z: -2 } }),
    tell: message => player.messages.push(message),
    level: {
      created: null,
      createEntity(id) {
        this.created = {
          id,
          nbt: null,
          pos: null,
          slots: {},
          spawned: false,
          uuid: 'summon-uuid',
          persistentData: {
            putBoolean(key, value) { this[key] = value; }
          },
          potionEffects: {
            add(...args) { player.effects.push(args); }
          },
          setNbt(nbt) { this.nbt = nbt; },
          setPos(x, y, z) { this.pos = [x, y, z]; },
          setItemSlot(slot, stack) { this.slots[slot] = stack; },
          spawn() { this.spawned = true; }
        };
        return this.created;
      }
    }
  };
  return player;
}

test('白队玩家无法召唤僵尸，也不进入冷却', () => {
  const { handlers, teamCalls } = loadHarness({ color: 'white' });
  const player = makePlayer();

  handlers['rainbow:rotten_heart']({}, player, {}, false, 0, false);

  assert.equal(player.level.created, null);
  assert.deepEqual(player.cooldownCalls, []);
  assert.deepEqual(teamCalls, []);
  assert.equal(player.messages.length, 1);
  assert.match(player.messages[0], /白色队伍/);
});

test('颜色队伍玩家的僵尸召唤后加入同一 MineTeam 队伍', () => {
  const { handlers, teamCalls } = loadHarness({ color: 'red' });
  const player = makePlayer();

  handlers['rainbow:rotten_heart']({}, player, {}, false, 0, false);

  const entity = player.level.created;
  assert.ok(entity);
  assert.equal(entity.id, 'minecraft:zombie');
  assert.equal(entity.spawned, true);
  assert.equal(entity.nbt, '{IsBaby:1b}');
  assert.equal(entity.persistentData.OwnerName, 'owner-uuid');
  assert.deepEqual(entity.pos, [3.5, 64, -1.5]);
  assert.equal(entity.slots.mainhand.id, 'minecraft:iron_sword');
  assert.equal(entity.slots.head.id, 'minecraft:leather_helmet');
  assert.deepEqual(teamCalls, [{ entity, color: 'red', sync: true }]);
  assert.deepEqual(player.cooldownCalls, [['rainbow:rotten_heart', 400]]);
  assert.equal(player.effects.length, 1);
  assert.equal(player.effects[0][0], 'rainbow:off_work_time');
});

test('白队限制只作用于腐烂心脏，其他心脏仍可召唤', () => {
  const { handlers, teamCalls } = loadHarness({ color: 'white' });
  const player = makePlayer();

  handlers['rainbow:drowned_heart']({}, player, {}, false, 0, false);

  assert.ok(player.level.created);
  assert.equal(player.level.created.id, 'minecraft:drowned');
  assert.equal(player.level.created.spawned, true);
  assert.deepEqual(teamCalls, []);
  assert.deepEqual(player.messages, []);
  assert.deepEqual(player.cooldownCalls, [['rainbow:drowned_heart', 400]]);
});
