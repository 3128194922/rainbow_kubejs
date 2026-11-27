// 圣主之血：TheBuff 特殊状态注册与光环附着离线验证。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(root, 'startup_scripts', 'accessory_rebalance', 'main.js');
const FORGE_MAIN_PATH = path.join(root, 'startup_scripts', 'ForgeEvents', 'main.js');

function loadHarness() {
    const registries = [];
    const buffs = new Map();
    const applied = [];
    const itemIds = [];
    let curioTick = null;

    const builder = {
        name(value) { this.spec.name = value; return this; },
        color(value) { this.spec.color = value; return this; },
        category(value) { this.spec.category = value; return this; },
        maxLevel(value) { this.spec.maxLevel = value; return this; },
        applyImmediately(value) { this.spec.applyImmediately = value; return this; },
        showInHud(value) { this.spec.showInHud = value; return this; },
        onApply(callback) { this.spec.onApply = callback; return this; },
        onExpire(callback) { this.spec.onExpire = callback; return this; },
    };

    const capability = {
        canUnequip() { return this; },
        canEquip() { return this; },
        curioTick(handler) { curioTick = handler; return this; },
    };

    const itemBuilder = {
        rarity() { return this; },
        maxStackSize() { return this; },
        tag() { return this; },
        attachCuriosCapability(value) { this.capability = value; return this; },
    };

    const sandbox = {
        console: { log() {} },
        StartupEvents: {
            registry(type, callback) {
                registries.push(type);
                if (type === 'thebuff:buff') {
                    callback({
                        create(id) {
                            const spec = { id };
                            const api = Object.create(builder);
                            api.spec = spec;
                            buffs.set(id, spec);
                            return api;
                        },
                    });
                } else if (type === 'item') {
                    callback({
                        create(id) {
                            itemIds.push(id);
                            return Object.create(itemBuilder);
                        },
                    });
                }
            },
        },
        CuriosJSCapabilityBuilder: { create: () => Object.create(capability) },
        canUnequipNotOnCooldown: () => true,
        hasCurios: () => false,
        UUID: { fromString: value => ({ value }) },
        AttributeModifierOperation: { ADDITION: 'addition' },
        AttributeModifier: class {
            constructor(uuid, name, amount, operation) {
                this.uuid = uuid;
                this.name = name;
                this.amount = amount;
                this.operation = operation;
            }
        },
        TheBuff: {
            apply(target, id, duration, amplifier) {
                applied.push({ target, id, duration, amplifier });
                return true;
            },
        },
    };

    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(SCRIPT_PATH, 'utf8'), sandbox, { filename: SCRIPT_PATH });

    const player = {
        age: 20,
        entities: [],
        isLiving: () => true,
        isAlive: () => true,
        level: {
            isClientSide: () => false,
            getEntitiesWithin: () => player.entities,
        },
        boundingBox: { inflate: () => null },
        getX: () => 0,
        getY: () => 0,
        getZ: () => 0,
    };

    return {
        player,
        registries,
        buffs,
        applied,
        itemIds,
        tick() { curioTick({ entity: () => player }, {}); },
    };
}

function makeEntity(x, y, z) {
    return {
        isLiving: () => true,
        isAlive: () => true,
        getX: () => x,
        getY: () => y,
        getZ: () => z,
    };
}

test('火焰易伤注册为 TheBuff 特殊状态，属性与原药水效果一致', () => {
    const harness = loadHarness();
    assert.ok(harness.registries.includes('thebuff:buff'));
    assert.ok(!harness.registries.includes('mob_effect'));
    assert.deepEqual(harness.itemIds, ['rainbow:holy_blood', 'rainbow:holy_cross']);

    const spec = harness.buffs.get('rainbow:fire_vulnerability');
    assert.ok(spec);
    assert.equal(spec.name, '火焰易伤');
    assert.equal(spec.color, '#A51D3B');
    assert.equal(spec.category, 'harmful');
    assert.equal(spec.maxLevel, 1);
    assert.equal(spec.applyImmediately, false);
    assert.equal(spec.showInHud, true);
});

test('状态附着时挂 -25% 火焰抗性，移除时清理同一修饰符', () => {
    const harness = loadHarness();
    const spec = harness.buffs.get('rainbow:fire_vulnerability');
    const modifiers = new Map();
    const entity = {
        getAttribute(id) {
            assert.equal(id, 'moreattribute:fire_immunity');
            return {
                removeModifier(uuid) { modifiers.delete(uuid.value); },
                addTransientModifier(modifier) { modifiers.set(modifier.uuid.value, modifier); },
            };
        },
    };

    spec.onApply({ entity, amplifier: 0 });
    const modifier = modifiers.get('6f2f8b1e-2a0e-4e4c-9f0a-5b7d3c1e8a21');
    assert.ok(modifier);
    assert.equal(modifier.name, 'holy_blood_fire_vulnerability');
    assert.equal(modifier.amount, -0.25);
    assert.equal(modifier.operation, 'addition');

    spec.onExpire({ entity });
    assert.equal(modifiers.size, 0);
});

test('光环只对 5 格内存活生物附着 40 tick 火焰易伤', () => {
    const near = makeEntity(3, 0, 4);
    const far = makeEntity(6, 0, 0);
    const harness = loadHarness();
    harness.player.entities = [harness.player, near, far];

    harness.tick();

    assert.deepEqual(harness.applied, [
        { target: near, id: 'rainbow:fire_vulnerability', duration: 40, amplifier: 0 },
    ]);
});

test('旧药水强制附着入口已移除，TheBuff 天然覆盖药水免疫', () => {
    const src = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(!src.includes('potionEffects.add'));
    assert.ok(src.includes("TheBuff.apply(target, 'rainbow:fire_vulnerability', 40, 0)"));

    const forgeMain = fs.readFileSync(FORGE_MAIN_PATH, 'utf8');
    assert.ok(!forgeMain.includes("ForgeEvents.onEvent('com.morecallback.event.MobEffectImmuneEvent'"));
    assert.ok(!fs.existsSync(path.join(root, 'startup_scripts', 'ForgeEvents', 'handleHolyBlood.js')));
});
