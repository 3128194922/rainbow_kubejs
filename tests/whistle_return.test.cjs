const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '../server_scripts/curios_skill_system/Skillwheel.js'), 'utf8');
const start = script.indexOf('// --- 鸦羽骨哨 ---');
const end = script.indexOf('// --- 虚空之眼 ---', start);
assert.ok(start >= 0 && end > start);

class Tag {
    constructor() { this.values = new Map(); }
    putString(key, value) { this.values.set(key, String(value)); }
    putDouble(key, value) { this.values.set(key, Number(value)); }
    putFloat(key, value) { this.values.set(key, Number(value)); }
    putLong(key, value) { this.values.set(key, Number(value)); }
    put(key, value) { this.values.set(key, value); }
    getString(key) { return this.values.get(key) || ''; }
    getDouble(key) { return this.values.get(key) || 0; }
    getFloat(key) { return this.values.get(key) || 0; }
    getLong(key) { return this.values.get(key) || 0; }
    getCompound(key) { return this.values.get(key) || new Tag(); }
    contains(key) { return this.values.has(key); }
    remove(key) { this.values.delete(key); }
}

let now = 1000;
let tasks = [];
let callbacks = {};
let levels = [];
let returnOrder = [];
const server = {
    overworld: () => ({ getTime: () => now }),
    getTickCount: () => now,
    scheduleInTicks: (ticks, callback) => tasks.push({ at: now + ticks, callback }),
    getAllLevels: () => levels
};
function level(id) {
    return {
        // KubeJS LevelKJS.dimension 暴露 ResourceLocation，脚本中常表现为字符串。
        dimension: id,
        getEntitiesWithin: () => entities,
        getAllEntities() { return entities.filter(entity => entity.level === this); },
        getTime: () => now,
        isClientSide: () => false
    };
}
const origin = level('minecraft:overworld');
const world = level('miniworld:player_owner');
const other = level('minecraft:the_nether');
levels = [origin, world, other];
let entities = [];
function entity(id, isPlayer, x, y, z) {
    return {
        id, x, y, z, yaw: 30, pitch: 12, level: origin, persistentData: new Tag(), server,
        getId() { return id; }, getUuid() { return { toString: () => id }; },
        getX() { return this.x; }, getY() { return this.y; }, getZ() { return this.z; },
        // 与 KubeJS 6 EntityMixin 的 JS 映射保持一致，不暴露原版朝向方法名。
        getYaw() { return this.yaw; }, getPitch() { return this.pitch; },
        getBoundingBox() { return { inflate: () => ({}) }; },
        isPlayer: () => isPlayer, isRemoved: () => false, isAlive: () => true,
        setPos(nx, ny, nz) { this.x = nx; this.y = ny; this.z = nz; },
        setPositionAndRotation(nx, ny, nz, yaw, pitch) {
            this.setPos(nx, ny, nz); this.yaw = yaw; this.pitch = pitch;
        },
        setDeltaMovement() {},
        // 实际执行传送器回调，覆盖普通实体进入个人维度时的朝向读取。
        changeDimension(destination, teleporter) {
            this.portalInfo = teleporter.getPortalInfo(this, destination, null);
            this.level = destination;
            this.setPos(this.portalInfo.pos.x, this.portalInfo.pos.y, this.portalInfo.pos.z);
            this.yaw = this.portalInfo.yaw;
            // Forge 默认 placeEntity 保留当前 pitch，生产代码需要在返回后恢复保存的 pitch。
            if (destination === origin) returnOrder.push(id);
            return this;
        },
        teleportTo(dimension, nx, ny, nz, yaw, pitch) {
            returnOrder.push(id);
            this.level = levels.find(candidate => candidate.dimension === dimension);
            this.x = nx; this.y = ny; this.z = nz; this.yaw = yaw; this.pitch = pitch;
        },
        tell() {}
    };
}
const owner = entity('owner', true, 1, 65, 2);
const guest = entity('guest', true, 3, 65, 4);
const mob = entity('mob', false, 5, 65, 6);
// 模拟命令式 teleportTo 被外部取消而不抛异常：普通实体返回必须使用可确认结果的 Forge 传送器。
mob.teleportTo = function() {};
owner.cooldowns = { isOnCooldown: () => false, addCooldown: () => {} };
entities = [owner, guest, mob];

const sandbox = {
    console,
    CompoundTag: Tag,
    Text: { red: value => value, aqua: value => value },
    Vec3: Object.assign(function(x, y, z) { this.x = x; this.y = y; this.z = z; }, { ZERO: {} }),
    PortalInfo: function(position, motion, yaw, pitch) { this.pos = position; this.yaw = yaw; this.pitch = pitch; },
    ITeleporter: function() {},
    JavaAdapter: function(_, impl) { return impl; },
    MiniWorldApi: {
        ensureWorld: () => ({ location: () => 'miniworld:player_owner' }),
        enter: target => { target.level = world; target.setPos(8.5, -63, 8.5); return true; }
    },
    registerSkillSound() {},
    registerSkill: (_, callback) => { callbacks.skill = callback; },
    ServerEvents: { tick: callback => { callbacks.tick = callback; } },
    PlayerEvents: { tick: callback => { callbacks.playerTick = callback; } }
};
vm.runInNewContext(script.slice(start, end), sandbox);

callbacks.skill({ server }, owner, {}, false, 0, false);
assert.equal(owner.level, world);
assert.equal(guest.level, world);
assert.equal(mob.level, world);
assert.deepEqual([mob.portalInfo.yaw, mob.portalInfo.pitch], [30, 12], 'The teleporter must preserve entity rotation');
assert.equal(tasks.length, 1, 'A return task should be scheduled');
assert.equal(tasks[0].at, 1200, 'The return must be due after 200 ticks');

now = 1199;
callbacks.tick({ server });
assert.equal(owner.level, world, 'The skill must last the full 10 seconds');
// 维度内改变朝向后，返回时必须恢复进入前的朝向。
for (const target of entities) { target.yaw = -90; target.pitch = -45; }
now = 1200;
tasks[0].callback();
assert.deepEqual(returnOrder, ['mob', 'guest', 'owner'], 'Other entities return before the owner');
for (const [target, x, y, z] of [[owner, 1, 65, 2], [guest, 3, 65, 4], [mob, 5, 65, 6]]) {
    assert.equal(target.level, origin);
    assert.deepEqual([target.x, target.y, target.z, target.yaw, target.pitch], [x, y, z, 30, 12]);
}

// 模拟 /reload 丢弃调度任务：持久返回点仍能让服务端 tick 完成传送。
now = 1300;
tasks = [];
returnOrder = [];
callbacks.skill({ server }, owner, {}, false, 0, false);
assert.equal(tasks.length, 1);
tasks = [];
guest.level = other;
now = 1499;
callbacks.playerTick({ player: owner });
assert.equal(owner.level, world);
now = 1500;
callbacks.playerTick({ player: owner });
assert.deepEqual(returnOrder, ['mob', 'guest', 'owner']);
assert.equal(owner.level, origin);
assert.equal(guest.level, origin);
assert.equal(mob.level, origin);

// Forge changeDimension 会重建实体；返回记录必须清理新实体，而不能只操作失效的旧引用。
now = 1600;
tasks = [];
returnOrder = [];
const clonedMob = entity('cloned-mob', false, 5, 65, 6);
clonedMob.changeDimension = function(destination, teleporter) {
    const moved = entity('cloned-mob', false, this.x, this.y, this.z);
    moved.persistentData.values = new Map(this.persistentData.values);
    moved.changeDimension = this.changeDimension;
    moved.portalInfo = teleporter.getPortalInfo(this, destination, null);
    moved.level = destination;
    moved.setPos(moved.portalInfo.pos.x, moved.portalInfo.pos.y, moved.portalInfo.pos.z);
    moved.yaw = moved.portalInfo.yaw;
    this.isRemoved = () => true;
    entities = entities.filter(candidate => candidate !== this);
    entities.push(moved);
    return moved;
};
entities = [owner, clonedMob];
callbacks.skill({ server }, owner, {}, false, 0, false);
let activeMob = entities.find(candidate => candidate.id === 'cloned-mob');
assert.notEqual(activeMob, clonedMob);
now = 1800;
tasks[0].callback();
const returnedMob = entities.find(candidate => candidate.id === 'cloned-mob');
assert.notEqual(returnedMob, activeMob);
assert.equal(returnedMob.level, origin);
assert.deepEqual([returnedMob.x, returnedMob.y, returnedMob.z], [5, 65, 6]);
assert.equal(returnedMob.persistentData.contains('WhistlePersonalWorldReturn'), false);

// 一次被 Forge 拒绝时保留返回记录和维度内玩家，下一次持续检查可恢复，避免维度提前卸载。
now = 1900;
tasks = [];
entities = [owner, mob];
callbacks.skill({ server }, owner, {}, false, 0, false);
const moveMob = mob.changeDimension;
mob.changeDimension = () => null;
now = 2100;
const retryLogs = [];
const originalLog = console.log;
console.log = message => retryLogs.push(message);
try { tasks[0].callback(); } finally { console.log = originalLog; }
assert.ok(retryLogs.some(message => message.includes('跨维度返回被拒绝')));
assert.equal(owner.level, world, 'The world must stay loaded while a mob is pending');
assert.equal(mob.persistentData.contains('WhistlePersonalWorldReturn'), true);
mob.changeDimension = moveMob;
now = 2120;
callbacks.tick({ server });
assert.equal(mob.level, origin);
assert.equal(owner.level, origin);
console.log('whistle timed return: PASS');
