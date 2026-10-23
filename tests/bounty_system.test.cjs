// 悬赏系统离线测试：执行坐标/权限、两种传送门配置与随机 GUI 逻辑，用替身覆盖地形和模组接口。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const AIR = { isAir: () => true, getFluidState: () => ({ isEmpty: () => true }), getCollisionShape: () => ({ isEmpty: () => true }) };
const STONE = { isAir: () => false, blocksMotion: () => true, getFluidState: () => ({ isEmpty: () => true }), getCollisionShape: () => ({ isEmpty: () => false }) };
const WATER = { isAir: () => false, blocksMotion: () => false, getFluidState: () => ({ isEmpty: () => false }), getCollisionShape: () => ({ isEmpty: () => true }) };
const FLOWER = { isAir: () => false, getFluidState: () => ({ isEmpty: () => true }), getCollisionShape: () => ({ isEmpty: () => true }) };

class Pos {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
  getY() { return this.y; }
}

function harness() {
  const context = {
    console,
    BlockPos: Pos,
    HeightmapTypes: { MOTION_BLOCKING_NO_LEAVES: 'surface' },
    TagKey: { create: (_registry, id) => `#${id}` },
    Registries: { BIOME: 'biome' },
    ResourceLocation: class { constructor(id) { this.id = id; } toString() { return this.id; } },
  };
  const script = fs.readFileSync(path.join(root, 'server_scripts/bounty_system/logic.js'), 'utf8');
  vm.runInNewContext(script, context, { filename: 'logic.js' });
  return context;
}

function level({ ocean = [], water = [], blocked = [], flowers = [], heights = {}, surfaceY = 65 } = {}) {
  const key = (x, z) => `${x},${z}`;
  return {
    dimension: { location: () => 'minecraft:overworld' },
    // 模拟当前世界的动态群系注册表，标签成员通过 HolderSet.contains 查询。
    registryAccess: () => ({ registryOrThrow: () => ({
      getTag(tag) {
        const members = tag === '#minecraft:is_ocean' ? new Set(['minecraft:ocean']) : null;
        return {
          isPresent: () => members !== null,
          get: () => ({ contains: holder => members.has(holder.unwrapKey().orElse(null).location()) }),
        };
      },
    }) }),
    // 默认区块已加载；远处未加载区块的回归用例会覆盖这两个接口。
    getChunkAt() { return {}; },
    getHeightmapPos(_type, pos) { return new Pos(pos.x, heights[key(pos.x, pos.z)] ?? surfaceY, pos.z); },
    getBiome(pos) {
      const id = ocean.includes(key(pos.x, pos.z)) ? 'minecraft:ocean' : 'minecraft:plains';
      return {
        // 复现 Rhino 无法解析 Holder.is(TagKey/ResourceLocation)，禁止回归到歧义调用。
        is() { throw new Error('Holder.is overload is ambiguous'); },
        unwrapKey: () => ({ orElse: () => ({ location: () => id }) }),
      };
    },
    getBlockState(pos) {
      if (water.includes(key(pos.x, pos.z))) return WATER;
      if (pos.y === surfaceY && flowers.includes(key(pos.x, pos.z))) return FLOWER;
      if (pos.y === surfaceY - 1 && !blocked.includes(key(pos.x, pos.z))) return STONE;
      if (pos.y === surfaceY && blocked.includes(key(pos.x, pos.z))) return STONE;
      return AIR;
    },
    getMinBuildHeight: () => -64,
    getMaxBuildHeight: () => 320,
  };
}

function square(cx, cz, radius) {
  const cells = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) cells.push(`${cx + dx},${cz + dz}`);
  }
  return cells;
}

test('坐标筛选跳过海洋、液体地面和没有站立空间的候选点', () => {
  const ctx = harness();
  const config = { minDistance: 10, maxDistance: 10, maxAttempts: 4, biomeBlacklist: ['#minecraft:is_ocean'] };
  const world = level({ ocean: ['10,0'], water: square(0, 10, 4), blocked: square(-10, 0, 4) });
  const samples = [0, 0, 0, 0.25, 0, 0.5, 0, 0.75];
  let next = 0;
  const target = ctx.rainbowBountyFindTarget(world, { x: 0, z: 0 }, config, () => samples[next++]);
  assert.ok(target.x === 0);
  assert.equal(target.y, 65);
  assert.equal(target.z, -10);
  assert.equal(target.dimension, 'minecraft:overworld');
});

test('候选点全部不安全时不发放坐标', () => {
  const ctx = harness();
  const config = { minDistance: 10, maxDistance: 10, maxAttempts: 2, biomeBlacklist: ['#minecraft:is_ocean'] };
  const world = level({ ocean: ['10,0'] });
  assert.equal(ctx.rainbowBountyFindTarget(world, { x: 0, z: 0 }, config, () => 0), null);
});

test('未加载的远处超平坦区块先加载再取高度，负高度地表可正常接取和复核', () => {
  const ctx = harness();
  const world = level({ surfaceY: -60 });
  const loaded = new Set();
  const chunkKey = pos => `${Math.floor(pos.x / 16)},${Math.floor(pos.z / 16)}`;
  const originalHeight = world.getHeightmapPos.bind(world);
  // Minecraft 1.20.1 对未加载区块返回最低高度；加载后才返回真实地表。
  world.getHeightmapPos = (type, pos) => loaded.has(chunkKey(pos))
    ? originalHeight(type, pos) : new Pos(pos.x, -64, pos.z);
  world.getChunkAt = pos => { loaded.add(chunkKey(pos)); return {}; };
  const config = { minDistance: 1608, maxDistance: 1608, maxAttempts: 1, biomeBlacklist: ['#minecraft:is_ocean'] };
  const target = ctx.rainbowBountyFindTarget(world, { x: 0, z: 8 }, config, () => 0);
  assert.ok(target);
  assert.deepEqual([target.x, target.y, target.z], [1608, -60, 8]);
  assert.equal(loaded.size, 1);
  // 模拟接取后卸载，再在委托书触发时重新读取候选区块。
  loaded.clear();
  const spawn = ctx.rainbowBountyFindSpawn(world, target, config.biomeBlacklist, 4);
  assert.ok(spawn);
  assert.deepEqual([spawn.x, spawn.y, spawn.z], [1608, -60, 8]);
});

test('群系黑名单兼容标签和直接 ID，未定义标签不误拦截', () => {
  const ctx = harness();
  const world = level({ ocean: ['1,0'] });
  assert.equal(ctx.rainbowBountyBiomeAllowed(world, 1, 65, 0, ['#minecraft:is_ocean']), false);
  assert.equal(ctx.rainbowBountyBiomeAllowed(world, 0, 65, 0, ['#minecraft:is_ocean']), true);
  assert.equal(ctx.rainbowBountyBiomeAllowed(world, 0, 65, 0, ['minecraft:plains']), false);
  assert.equal(ctx.rainbowBountyBiomeAllowed(world, 0, 65, 0, ['#test:missing']), true);
});

test('候选中心不能站立时改用同一片区域附近的安全位置', () => {
  const ctx = harness();
  const config = { minDistance: 10, maxDistance: 10, maxAttempts: 1, biomeBlacklist: ['#minecraft:is_ocean'] };
  const target = ctx.rainbowBountyFindTarget(level({ blocked: ['10,0'] }), { x: 0, z: 0 }, config, () => 0);
  assert.ok(target);
  assert.ok(Math.abs(target.x - 10) <= 3 && Math.abs(target.z) <= 3);
  assert.ok(!(target.x === 10 && target.z === 0));
});

test('悬赏凭证只能由接取者在原维度且距目标16格内触发一次', () => {
  const ctx = harness();
  const state = { id: 'rainbow:clear_horde', token: 'token-1', status: 'accepted', dimension: 'minecraft:overworld', x: 100, y: 65, z: 200 };
  const card = { owner: 'alice', id: 'rainbow:clear_horde', token: 'token-1' };
  const player = { uuid: 'alice', dimension: 'minecraft:overworld', x: 116, y: 65, z: 200 };
  assert.equal(ctx.rainbowBountyCanTrigger(player, state, card, 16), true);
  assert.equal(ctx.rainbowBountyCanTrigger({ ...player, x: 116.1 }, state, card, 16), false);
  assert.equal(ctx.rainbowBountyCanTrigger({ ...player, dimension: 'minecraft:the_nether' }, state, card, 16), false);
  assert.equal(ctx.rainbowBountyCanTrigger(player, { ...state, status: 'spawned' }, card, 16), false);
  assert.equal(ctx.rainbowBountyCanTrigger(player, state, { ...card, owner: 'bob' }, 16), false);
});

test('触发前目标被占用时，可在附近找到另一安全地面', () => {
  const ctx = harness();
  const world = level({ blocked: ['0,0'] });
  const spawn = ctx.rainbowBountyFindSpawn(world, { x: 0, y: 65, z: 0 }, ['#minecraft:is_ocean'], 2);
  assert.ok(spawn);
  assert.notDeepEqual([spawn.x, spawn.z], [0, 0]);
  assert.equal(spawn.y, 65);
});

test('可穿过的花草不妨碍站立，实体方块和液体仍被拒绝', () => {
  const ctx = harness();
  assert.equal(ctx.rainbowBountyCanStand(level({ flowers: ['0,0'] }), 0, 65, 0), true);
  assert.equal(ctx.rainbowBountyCanStand(level({ blocked: ['0,0'] }), 0, 65, 0), false);
  assert.equal(ctx.rainbowBountyCanStand(level({ water: ['0,0'] }), 0, 65, 0), false);
});

test('随机展示最多三个已注册传送门对应的悬赏且不重复', () => {
  const ctx = harness();
  const bounties = [
    { id: 'a', gateway: { id: 'gate:a' } },
    { id: 'b', gateway: 'gate:b' },
    { id: 'c', gateway: { id: 'gate:c' } },
    { id: 'd', gateway: 'gate:d' },
  ];
  const available = id => id !== 'gate:b';
  const offers = ctx.rainbowBountyPickOffers(bounties, 3, available, () => 0);
  assert.equal(offers.length, 3);
  assert.equal(new Set(offers.map(offer => offer.id)).size, 3);
  assert.ok(offers.every(offer => offer.id !== 'b'));
  const refreshed = ctx.rainbowBountyPickOffers(bounties, 2, available, () => 0, ['a', 'c']);
  assert.ok(refreshed.some(offer => offer.id === 'd'));
  assert.equal(ctx.rainbowBountyPickOffers(bounties, 8, available, () => 0).length, 3);
  assert.equal(ctx.rainbowBountyPickOffers(bounties, 3, () => false, () => 0).length, 0);
});

test('内嵌传送门按属性注册，单独指定的复杂传送门不重复注册', () => {
  const registered = [];
  const context = {
    global: {}, console,
    ServerEvents: { recipes: callback => callback({}) },
    Gateway: { customBuilder: id => {
      const gate = { id, waves: [], rewards: [], rules: {} };
      const builder = {
        name(value) { gate.name = value; return this; },
        size(value) { gate.size = value; return this; },
        color(value) { gate.color = value; return this; },
        tooltipText(value) { gate.tooltipText = value; return this; },
        bossEvent(mode, fog) { gate.bossEvent = { mode, fog }; return this; },
        spawnRange(value) { gate.rules.spawnRange = value; return this; },
        leashRange(value) { gate.rules.leashRange = value; return this; },
        playerDamageOnly(value) { gate.rules.playerDamageOnly = value; return this; },
        addWave(callback) {
          const wave = { entities: [] };
          callback({
            addEntity(type, count) { wave.entities.push({ type, count }); },
            maxTime(value) { wave.maxTime = value; },
            setupTime(value) { wave.setupTime = value; },
            addReward(item, count) { wave.reward = { item, count }; },
          });
          gate.waves.push(wave);
          return this;
        },
        addReward(item, count) { gate.rewards.push({ item, count }); return this; },
        register() { registered.push(gate); return this; },
      };
      return builder;
    } },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'startup_scripts/bounty_system/config.js'), 'utf8'), context);
  // 当前配置全部为 Boss 内嵌门；用独立引用样例继续验证复杂传送门不会被重复注册。
  context.global.RAINBOW_BOUNTY_CONFIG.bounties.push({ id: 'test:external', gateway: 'test:existing_gateway' });
  vm.runInNewContext(fs.readFileSync(path.join(root, 'server_scripts/bounty_system/gateways.js'), 'utf8'), context);
  context.rainbowBountyRegisterGateways();
  const bounties = context.global.RAINBOW_BOUNTY_CONFIG.bounties;
  const local = bounties.filter(bounty => typeof bounty.gateway !== 'string');
  assert.equal(registered.length, local.length);
  assert.equal(new Set(registered.map(gate => gate.id)).size, local.length);
  for (const bounty of local) {
    const gate = registered.find(entry => entry.id === bounty.gateway.id);
    assert.ok(gate, bounty.id);
    assert.equal(gate.name, bounty.name);
    assert.equal(gate.size, bounty.gateway.size);
    assert.equal(gate.color, bounty.gateway.color);
    if (bounty.gateway.tooltipText != null) assert.equal(gate.tooltipText, bounty.gateway.tooltipText);
    if (bounty.gateway.bossEvent != null) assert.equal(gate.bossEvent.mode, bounty.gateway.bossEvent.mode);
    assert.equal(gate.waves.length, bounty.gateway.waves.length);
    assert.equal(gate.rewards.length, bounty.gateway.rewards.length);
    assert.ok(gate.waves.every(wave => wave.entities.length > 0));
    if (bounty.gateway.rules.spawnRange != null) assert.equal(gate.rules.spawnRange, bounty.gateway.rules.spawnRange);
    for (let i = 0; i < gate.waves.length; i++) {
      assert.equal(gate.waves[i].maxTime, bounty.gateway.waves[i].maxTime);
      assert.equal(gate.waves[i].setupTime, bounty.gateway.waves[i].setupTime);
      if (bounty.gateway.waves[i].rewards != null) {
        assert.equal(gate.waves[i].reward.item, bounty.gateway.waves[i].rewards[0].item);
      }
    }
  }
  assert.ok(bounties.some(bounty => typeof bounty.gateway === 'string'));
});

test('GUI 在五项以内全部展示，超过五项随机展示五项并提供刷新按钮', () => {
  const screens = [];
  const store = {};
  const logs = [];
  let interactHandler;
  let buttonHandler;
  let nextToken = 0;
  const context = {
    global: {}, console: { log: message => logs.push(message) },
    rainbowBountyRegisterGateways() {},
    ItemEvents: { entityInteracted(callback) { interactHandler = callback; }, firstRightClicked() {} },
    ForgeRegistries: { VILLAGER_PROFESSIONS: { getKey: profession => profession } },
    GUIJSEvents: { button(callback) { buttonHandler = callback; } },
    Gateway: { exists: id => id !== 'gate:disabled' },
    UUID: { randomUUID: () => 'session-' + ++nextToken },
    GuiJS: {
      createGui(id, callback) {
        const screen = { id, buttons: [], labels: [] };
        callback({
          title(value) { screen.title = value; }, size() {},
          label(_x, _y, value) { screen.labels.push(value); },
          button(buttonId, _x, _y, _width, _height, label) { screen.buttons.push({ id: buttonId, label }); },
        });
        screens.push(screen);
      },
      openCustom() {},
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'startup_scripts/bounty_system/config.js'), 'utf8'), context);
  // 使用实际配置验证五项全展示，再检查不足五项、超过五项和不可用传送门。
  context.global.RAINBOW_BOUNTY_CONFIG.bounties.push({ id: 'disabled', name: '不可用', gateway: 'gate:disabled' });
  vm.runInNewContext(fs.readFileSync(path.join(root, 'server_scripts/bounty_system/logic.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(root, 'server_scripts/bounty_system/main.js'), 'utf8'), context);
  const player = {
    getUuid: () => 'player-uuid',
    level: { getTime: () => 100, isClientSide: () => false },
    persistentData: {
      putString(key, value) { store[key] = value; },
      putInt(key, value) { store[key] = value; },
      putLong(key, value) { store[key] = value; },
      putDouble(key, value) { store[key] = value; },
      getString(key) { return store[key] || ''; },
      getInt(key) { return store[key] || 0; },
    },
  };
  // cancel 在 KubeJS 6 中抛出正常退出信号，必须交回事件框架而非误记为打开失败。
  const exit = new Error('EventExit: result');
  const interaction = {
    getLevel: () => player.level, getHand: () => 'MAIN_HAND', getPlayer: () => player,
    getTarget: () => ({ getType: () => 'minecraft:villager', x: 0, y: 65, z: 0,
      getVillagerData: () => ({ getProfession: () => 'minecraft:nitwit' }) }),
    cancel() { throw exit; },
  };
  assert.throws(() => interactHandler(interaction), error => error === exit);
  assert.deepEqual(logs, []);
  const first = screens.at(-1);
  assert.equal(first.buttons.filter(button => button.id.startsWith('accept:')).length, 5);
  assert.ok(first.buttons.some(button => button.id.startsWith('reroll:')));
  assert.ok(first.buttons.every(button => button.label !== '不可用'));
  assert.equal(store.RainbowBountyOfferCount, 5);
  context.rainbowBountyBoardNearby = () => true;
  const oldToken = store.RainbowBountyBoardToken;
  buttonHandler({ guiId: first.id, player, buttonId: 'reroll:' + oldToken });
  assert.equal(screens.length, 2);
  assert.notEqual(store.RainbowBountyBoardToken, oldToken);
  buttonHandler({ guiId: first.id, player, buttonId: first.buttons.find(button => button.id.startsWith('accept:')).id });
  assert.equal(screens.length, 2);
  const availableGateways = context.global.RAINBOW_BOUNTY_CONFIG.bounties.slice(0, 3).map(bounty => bounty.gateway.id);
  context.Gateway.exists = id => availableGateways.includes(id);
  context.rainbowBountyOpenBoard(player);
  assert.equal(screens.at(-1).buttons.filter(button => button.id.startsWith('accept:')).length, 3);
  assert.equal(store.RainbowBountyOfferCount, 3);
  context.global.RAINBOW_BOUNTY_CONFIG.bounties.push(
    { id: 'test:extra1', name: '额外悬赏1', gateway: 'test:gate1' },
    { id: 'test:extra2', name: '额外悬赏2', gateway: 'test:gate2' },
  );
  context.Gateway.exists = id => id !== 'gate:disabled';
  context.global.RAINBOW_BOUNTY_CONFIG.guiOfferCount = 99;
  context.rainbowBountyOpenBoard(player);
  const selected = screens.at(-1).buttons.filter(button => button.id.startsWith('accept:'));
  assert.equal(selected.length, 5);
  assert.equal(new Set(selected.map(button => button.label)).size, 5);
  assert.ok(selected.every(button => button.label !== '不可用'));
  assert.equal(store.RainbowBountyOfferCount, 5);
  context.Gateway.exists = () => false;
  context.rainbowBountyOpenBoard(player);
  assert.equal(screens.at(-1).buttons.filter(button => button.id.startsWith('accept:')).length, 0);
  // 真正的 GUI 错误仍需记录，且不能取消未成功打开界面的村民交互。
  context.rainbowBountyOpenBoard = () => { throw new Error('GUI unavailable'); };
  let canceled = false;
  interactHandler({ ...interaction, cancel() { canceled = true; } });
  assert.equal(canceled, false);
  assert.ok(logs.some(message => message.includes('打开村民界面失败') && message.includes('GUI unavailable')));
});
