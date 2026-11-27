// 执行真实信标脚本，验证 BEACON_CONFIG.recipes 的匹配、冷却与旧靶子行为。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scriptSource = fs.readFileSync(
  path.join(root, 'server_scripts', 'energizedBeaconCrafting_server.js'),
  'utf8'
);

function createState(id, props) {
  const values = Object.assign({}, props || {});
  return {
    id,
    props: values,
    setValue(prop, value) {
      return createState(id, Object.assign({}, values, { [prop]: value }));
    }
  };
}

function createPos(x, y, z) {
  return {
    x,
    y,
    z,
    offset(dx, dy, dz) {
      return createPos(x + dx, y + dy, z + dz);
    }
  };
}

function createBlock(id, pos, popItems, options) {
  const opts = options || {};
  const block = {
    id,
    pos,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    properties: opts.properties || null,
    tags: opts.tags || [],
    blockState: createState(id),
    hasTag(tag) {
      return block.tags.indexOf(tag) >= 0;
    },
    popItem(item) {
      popItems.push({ item, x: pos.x, y: pos.y, z: pos.z });
    },
    set(newId) {
      block.id = newId;
      block.blockState = createState(newId);
    }
  };
  return block;
}

function loadHarness(recipes) {
  const patched = scriptSource.replace(
    /recipes: \[[\s\S]*?\n  \],/,
    'recipes: ' + JSON.stringify(recipes || []) + ','
  );
  assert.notEqual(patched, scriptSource, '脚本内未找到 recipes 配置块');

  const handlers = {};
  const tasks = [];
  const logs = [];
  const popItems = [];
  const setBlocks = [];
  const sounds = [];
  const blocks = {};

  const player = {
    messages: [],
    displayName: { string: 'Tester' },
    tell(message) {
      player.messages.push(message);
    }
  };

  const level = {
    dimension: 'minecraft:overworld',
    now: 0,
    isClientSide() {
      return false;
    },
    getTime() {
      return level.now;
    },
    getEntitiesWithin() {
      return [];
    },
    getBlock(x, y, z) {
      const key = x + ',' + y + ',' + z;
      if (blocks[key] == null) blocks[key] = createBlock('minecraft:air', createPos(x, y, z), popItems);
      return blocks[key];
    },
    setBlockAndUpdate(pos, state) {
      const block = level.getBlock(pos.x, pos.y, pos.z);
      block.id = state.id;
      block.blockState = state;
      setBlocks.push({ id: state.id, props: state.props });
    },
    playSound(playerArg, x, y, z, id) {
      sounds.push({ x, y, z, id });
    },
    server: {
      scheduleInTicks(ticks, fn) {
        tasks.push({ ticks, fn });
      }
    }
  };

  const sandbox = {
    console: { log: message => logs.push(String(message)) },
    BlockEvents: {
      rightClicked: (id, handler) => {
        handlers.beaconId = id;
        handlers.click = handler;
      }
    },
    Utils: {
      server: {
        scheduleInTicks: (ticks, fn) => tasks.push({ ticks, fn }),
        runCommandSilent: () => {}
      }
    },
    AABB: { ofBlocks: () => ({}) },
    Item: { of: (id, count) => ({ id, count }) },
    BlockProperties: { POWER: 'power' },
    Integer: { valueOf: value => Number(value) }
  };

  vm.runInNewContext(patched, sandbox, { filename: 'energizedBeaconCrafting_server.js' });
  return { handlers, tasks, logs, popItems, setBlocks, sounds, blocks, level, player };
}

function createSections() {
  return [
    { color: [1, 1, 1], dir: { normal: { x: 0, y: 1, z: 0 } }, offset: { x: 0, y: 0, z: 0 } },
    { color: [1, 0.25, 0.25], dir: { normal: { x: 0, y: 1, z: 0 } }, offset: { x: 0, y: 10, z: 0 } }
  ];
}

function createEvent(ctx, options) {
  const opts = options || {};
  const event = {
    hand: opts.hand || 'main_hand',
    item: { id: opts.itemId || 'minecraft:redstone' },
    block: {
      x: 0,
      y: 64,
      z: 0,
      pos: createPos(0, 64, 0),
      entity: { getBeamSections: () => opts.sections || createSections() },
      getPlayersInRadius: () => []
    },
    player: ctx.player,
    level: ctx.level
  };
  event.cancel = () => {
    event.cancelled = true;
  };
  return event;
}

function drainTasks(ctx) {
  let guard = 0;
  while (ctx.tasks.length > 0 && guard < 50) {
    ctx.tasks.shift().fn();
    guard++;
  }
}

function placeCorundum(ctx, color, facing) {
  const pos = createPos(0, 74, 0);
  const block = createBlock('quark:' + color + '_corundum_cluster', pos, ctx.popItems, {
    properties: { facing },
    tags: ['rainbow:corundum_cluster']
  });
  ctx.blocks['0,74,0'] = block;
  return block;
}

function placeBlock(ctx, id, x, y, z, tags) {
  const block = createBlock(id, createPos(x, y, z), ctx.popItems, { tags: tags || [] });
  ctx.blocks[x + ',' + y + ',' + z] = block;
  return block;
}

test('注册信标右键事件', () => {
  const ctx = loadHarness([]);
  assert.equal(ctx.handlers.beaconId, 'minecraft:beacon');
});

test('红色刚玉 + 铁块命中配方：掉落产物并消耗方块', () => {
  const ctx = loadHarness([
    { color: 'red', catalyst: 'minecraft:iron_block', output: 'minecraft:gold_ingot', count: 2, consume: true }
  ]);
  placeCorundum(ctx, 'red', 'north');
  placeBlock(ctx, 'minecraft:iron_block', 0, 74, 1);

  ctx.handlers.click(createEvent(ctx));
  assert.equal(ctx.tasks.length, 1);
  assert.equal(ctx.tasks[0].ticks, 20);
  drainTasks(ctx);

  assert.equal(ctx.popItems.length, 1);
  assert.deepEqual(ctx.popItems[0].item, { id: 'minecraft:gold_ingot', count: 2 });
  assert.equal(ctx.blocks['0,74,1'].id, 'minecraft:air');
  assert.equal(ctx.player.messages.length, 1);
  assert.match(ctx.player.messages[0], /minecraft:gold_ingot/);
});

test('同一催化剂方块受冷却限制，冷却结束后可再次合成', () => {
  const ctx = loadHarness([
    { catalyst: 'minecraft:iron_block', output: 'minecraft:gold_ingot', cooldown: 20 }
  ]);
  placeCorundum(ctx, 'red', 'north');
  placeBlock(ctx, 'minecraft:iron_block', 0, 74, 1);

  ctx.handlers.click(createEvent(ctx));
  drainTasks(ctx);
  assert.equal(ctx.popItems.length, 1);

  ctx.level.now = 10;
  ctx.handlers.click(createEvent(ctx));
  drainTasks(ctx);
  assert.equal(ctx.popItems.length, 1, '冷却中不应再次合成');

  ctx.level.now = 20;
  ctx.handlers.click(createEvent(ctx));
  drainTasks(ctx);
  assert.equal(ctx.popItems.length, 2, '冷却结束后应再次合成');
});

test('催化剂标签匹配，color 省略表示不限颜色', () => {
  const ctx = loadHarness([
    { catalyst: '#forge:storage_blocks/iron', output: 'minecraft:gold_ingot' }
  ]);
  placeCorundum(ctx, 'white', 'east');
  placeBlock(ctx, 'minecraft:iron_block', -1, 74, 0, ['forge:storage_blocks/iron']);

  ctx.handlers.click(createEvent(ctx));
  drainTasks(ctx);

  assert.equal(ctx.popItems.length, 1);
  assert.deepEqual(ctx.popItems[0].item, { id: 'minecraft:gold_ingot', count: 1 });
});

test('配方按顺序匹配，第一条生效', () => {
  const ctx = loadHarness([
    { color: 'red', catalyst: 'minecraft:stone', output: 'minecraft:diamond' },
    { catalyst: 'minecraft:stone', output: 'minecraft:emerald' }
  ]);
  placeCorundum(ctx, 'red', 'north');
  placeBlock(ctx, 'minecraft:stone', 0, 74, 1);

  ctx.handlers.click(createEvent(ctx));
  drainTasks(ctx);

  assert.equal(ctx.popItems.length, 1);
  assert.equal(ctx.popItems[0].item.id, 'minecraft:diamond');
});

test('颜色不匹配时不合成', () => {
  const ctx = loadHarness([
    { color: 'blue', catalyst: 'minecraft:iron_block', output: 'minecraft:diamond' }
  ]);
  placeCorundum(ctx, 'red', 'north');
  placeBlock(ctx, 'minecraft:iron_block', 0, 74, 1);

  ctx.handlers.click(createEvent(ctx));
  drainTasks(ctx);

  assert.equal(ctx.popItems.length, 0);
});

test('无配方命中时保留旧行为：靶子按光束亮度输出信号并复位', () => {
  const ctx = loadHarness([]);
  placeCorundum(ctx, 'white', 'north');
  placeBlock(ctx, 'minecraft:target', 0, 74, 1);

  ctx.handlers.click(createEvent(ctx));
  assert.equal(ctx.tasks[0].ticks, 20);
  drainTasks(ctx);

  assert.equal(ctx.popItems.length, 0);
  assert.equal(ctx.setBlocks.length, 2);
  assert.equal(ctx.setBlocks[0].id, 'minecraft:target');
  assert.equal(ctx.setBlocks[0].props.power, 7);
  assert.equal(ctx.setBlocks[1].props.power, 0);
});

test('触发物品或手不匹配时不扫描', () => {
  const ctx = loadHarness([]);
  placeCorundum(ctx, 'red', 'north');

  ctx.handlers.click(createEvent(ctx, { itemId: 'minecraft:stick' }));
  ctx.handlers.click(createEvent(ctx, { hand: 'off_hand' }));

  assert.equal(ctx.tasks.length, 0);
});
