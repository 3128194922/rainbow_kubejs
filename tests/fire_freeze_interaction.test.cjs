// 火焰 × 冻结互通：加载实际 freeze_util / morefire_events / morefire_compat /
// handleFreezeEffects 脚本，只替换 Java 实体的最小边界。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(relative) {
    return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

class FakeFreezable {
    constructor() {
        this.frozen = false;
        this.ticksFrozen = 0;
        this.fireTicks = 100;
        this.commands = [];
        this.uuid = { toString: () => 'test-uuid' };
        this.level = {
            server: {
                runCommandSilent: command => this.commands.push(command),
                scheduleInTicks: () => {}
            }
        };
    }

    isDeadOrDying() { return false; }
    isPlayer() { return false; }
    tide$isFrozen() { return this.frozen; }
    tide$setFrozen(value) { this.frozen = value; }
    getTicksFrozen() { return this.ticksFrozen; }
    setTicksFrozen(value) { this.ticksFrozen = value; }
    setRemainingFireTicks(value) { this.fireTicks = value; }
}

function freezeHarness() {
    const moreFireClears = [];
    const context = vm.createContext({
        console,
        global: {},
        FreezableMob: FakeFreezable,
        MoreFire: { clearFire: entity => moreFireClears.push(entity) }
    });
    vm.runInContext(read('server_scripts/freeze_util.js'), context, { filename: 'freeze_util.js' });
    return { context, moreFireClears };
}

function moreFireHarness() {
    const hooks = {};
    const attacks = [];
    let meltCalls = 0;
    class ResourceLocation {
        constructor(namespace, path) {
            this.namespace = namespace;
            this.path = path;
        }
    }
    const electrified = { id: 'eeeabsmobs:electrified_effect' };
    class LivingEntity {}
    const context = vm.createContext({
        console,
        global: {
            meltFreeze: () => {
                meltCalls++;
                return true;
            }
        },
        DamageTypeTags: { IS_FIRE: { id: 'minecraft:is_fire' } },
        LivingEntity,
        ForgeRegistries: {
            MOB_EFFECTS: {
                getValue: () => electrified
            }
        },
        ResourceLocation,
        MoreFireEvents: {
            damage: callback => { hooks.damage = callback; },
            fireReplace: () => {},
            fireExtinguish: () => {}
        }
    });
    vm.runInContext(read('server_scripts/morefire_events.js'), context, { filename: 'morefire_events.js' });
    return {
        hooks,
        attacks,
        electrified,
        LivingEntity,
        get meltCalls() { return meltCalls; }
    };
}

function fireEvent(entity, source, amount = 4) {
    let canceled = false;
    return {
        getEntity: () => entity,
        getDamageSource: () => source,
        getAmount: () => amount,
        cancelEvent: () => { canceled = true; },
        get canceled() { return canceled; }
    };
}

function livingEntity(h, attackResult = true) {
    const entity = Object.assign(new (h.LivingEntity)(), {
        electrified: false,
        attackResult,
        attacks: h.attacks,
        hasEffect: effect => effect === h.electrified && entity.electrified === true,
        attack: (source, amount) => {
            h.attacks.push({ source, amount });
            return entity.attackResult;
        },
        damageSources: () => ({
            inFire: () => ({ type: 'minecraft:in_fire' })
        })
    });
    return entity;
}

test('meltFreeze 削减冻结积累；完全冻结时解冻并移除蓝冰 UV', () => {
    const h = freezeHarness();
    const entity = new FakeFreezable();
    entity.ticksFrozen = 100;

    assert.equal(h.context.global.meltFreeze(entity), true);
    assert.equal(entity.ticksFrozen, 60);
    assert.equal(entity.frozen, false);
    assert.equal(entity.commands.length, 0);

    entity.ticksFrozen = 500;
    entity.frozen = true;
    assert.equal(h.context.global.meltFreeze(entity), true);
    assert.equal(entity.ticksFrozen, 0);
    assert.equal(entity.frozen, false);
    assert.deepEqual(entity.commands, ['/dyeing uv remove test-uuid freeze_ice']);
});

test('extinguishEntityFire 同时清理 MoreFire 与剩余燃烧 tick', () => {
    const h = freezeHarness();
    const entity = new FakeFreezable();
    assert.equal(h.context.global.extinguishEntityFire(entity), true);
    assert.equal(entity.fireTicks, 0);
    assert.equal(h.moreFireClears.length, 1);
    assert.equal(h.moreFireClears[0], entity);
});

test('MoreFire 火焰已带 is_fire 时不重复处理', () => {
    const h = moreFireHarness();
    const entity = livingEntity(h);
    const event = fireEvent(entity, { is: tag => tag.id === 'minecraft:is_fire' });
    h.hooks.damage(event);
    assert.equal(event.canceled, false);
    assert.equal(h.attacks.length, 0);
    assert.equal(h.meltCalls, 0);
});

test('未带 is_fire 的 MoreFire 火伤在感电目标上转为 in_fire 重新结算', () => {
    const h = moreFireHarness();
    const entity = livingEntity(h);
    entity.electrified = true;
    const event = fireEvent(entity, { is: () => false });
    h.hooks.damage(event);

    assert.equal(event.canceled, true);
    assert.equal(h.attacks.length, 1);
    assert.equal(h.attacks[0].source.type, 'minecraft:in_fire');
    assert.equal(h.attacks[0].amount, 4);
});

test('in_fire 无法结算时回退原 MoreFire 伤害源', () => {
    const h = moreFireHarness();
    const entity = livingEntity(h, false);
    entity.electrified = true;
    const originalSource = { is: () => false, kind: 'morefire' };
    const event = fireEvent(entity, originalSource);
    h.hooks.damage(event);

    assert.equal(event.canceled, true);
    assert.equal(h.attacks.length, 2);
    assert.equal(h.attacks[0].source.type, 'minecraft:in_fire');
    assert.equal(h.attacks[1].source, originalSource);
});

test('未带 is_fire 且目标未感电时保留原伤害，但会融化冻结', () => {
    const h = moreFireHarness();
    const entity = livingEntity(h);
    const event = fireEvent(entity, { is: () => false });
    h.hooks.damage(event);

    assert.equal(event.canceled, false);
    assert.equal(h.attacks.length, 0);
    assert.equal(h.meltCalls, 1);
});

test('handleFreezeEffects：火焰伤害优先融冰并跳过冻结触发', () => {
    let meltCalls = 0;
    const context = vm.createContext({
        console,
        global: {
            meltFreeze: () => {
                meltCalls++;
                return true;
            }
        },
        DamageTypeTags: { IS_FIRE: { id: 'minecraft:is_fire' } },
        FreezableMob: FakeFreezable
    });
    vm.runInContext(read('startup_scripts/ForgeEvents/handleFreezeEffects.js'), context, {
        filename: 'handleFreezeEffects.js'
    });

    const victim = new FakeFreezable();
    context.handleFreezeEffects(null, null, victim, { is: tag => tag.id === 'minecraft:is_fire' });
    assert.equal(meltCalls, 1);
});

test('handleFreezeEffects：冻结触发时熄灭火', () => {
    let extinguishCalls = 0;
    const context = vm.createContext({
        console,
        global: {
            freezeEntity: () => false,
            extinguishEntityFire: () => {
                extinguishCalls++;
                return true;
            }
        },
        DamageTypeTags: { IS_FIRE: { id: 'minecraft:is_fire' } },
        FreezableMob: FakeFreezable
    });
    vm.runInContext(read('startup_scripts/ForgeEvents/handleFreezeEffects.js'), context, {
        filename: 'handleFreezeEffects.js'
    });

    const victim = new FakeFreezable();
    victim.ticksFrozen = 1000;
    victim.getBoundingBox = () => ({ getXsize: () => 0.6, getYsize: () => 1.8, getZsize: () => 0.6 });
    victim.level.server = { runCommandSilent: () => {}, scheduleInTicks: () => {} };
    context.handleFreezeEffects(null, null, victim, { is: () => false });
    assert.equal(extinguishCalls, 1);
});

test('morefire_compat 为 MoreFire.list() 中全部火焰设置 minecraft:in_fire', () => {
    const ids = [
        'minecraft:fire', 'minecraft:soul_fire', 'dungeonsdelight:living_fire',
        'endergetic:ender_fire', 'netherexp:ancient_fire',
        'caverns_and_chasms:cupric_fire', 'rainbow:soul_flame', 'test:unconfigured_fire'
    ];
    const fires = new Map();
    function fireStub() {
        const fire = {
            damageType: null,
            setDamageType: value => {
                fire.damageType = value;
                return fire;
            }
        };
        for (const method of [
            'setUseVanillaEntityFireAnimation', 'setDefinitionColor', 'setAutoEntityFireColor',
            'setBlockRainExtinguish', 'setBlockWaterExtinguish', 'setEntityRainExtinguish',
            'setEntityWaterExtinguish', 'setDamage', 'setFireTicks', 'addAttributeModifier'
        ]) {
            fire[method] = () => fire;
        }
        return fire;
    }
    const context = vm.createContext({
        console,
        MoreFire: {
            exists: () => true,
            list: () => ids,
            get: id => {
                if (!fires.has(id)) fires.set(id, fireStub());
                return fires.get(id);
            }
        }
    });
    vm.runInContext(read('server_scripts/morefire_compat.js'), context, { filename: 'morefire_compat.js' });

    assert.equal(fires.size, ids.length);
    for (const id of ids) {
        assert.equal(fires.get(id).damageType, 'minecraft:in_fire', id);
    }
});
