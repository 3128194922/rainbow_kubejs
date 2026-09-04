const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scriptPath = path.join(root, 'startup_scripts', 'quantum_mandel', 'main.js');

function loadApi() {
    const code = fs.readFileSync(scriptPath, 'utf8');
    const sandbox = {
        console,
        StartupEvents: { registry() {}, modifyCreativeTab() {} },
        ForgeEvents: { onEvent() {} },
        InteractionResult: { SUCCESS: 'SUCCESS' },
        ClickAction: { SECONDARY: 'SECONDARY' },
        ForgeRegistries: {},
        ResourceLocation: function ResourceLocation() {}
    };
    vm.runInNewContext(code + '\nthis.__api = { isQuantumKeyExpired, ensureQuantumKeyCreationTime, isMandelBrickUnlocked, setMandelBrickUnlocked };', sandbox, { filename: scriptPath });
    return sandbox.__api;
}

function createTag(values) {
    return {
        values,
        contains(key) {
            return Object.prototype.hasOwnProperty.call(this.values, key);
        },
        getLong(key) {
            return this.values[key];
        },
        putLong(key, value) {
            this.values[key] = value;
        },
        getBoolean(key) {
            return this.values[key] === true;
        },
        putBoolean(key, value) {
            this.values[key] = value;
        }
    };
}

test('quantum key expires only after 1200 ticks', () => {
    const api = loadApi();
    const tag = createTag({ CreationTime: 1000 });
    const stack = { hasTag: () => true, getTag: () => tag };

    assert.equal(api.isQuantumKeyExpired(stack, 2200, 1200), false);
    assert.equal(api.isQuantumKeyExpired(stack, 2201, 1200), true);
});

test('quantum key without creation time is initially valid and can be initialized', () => {
    const api = loadApi();
    const values = {};
    const tag = createTag(values);
    const stack = {
        hasTag: () => false,
        getTag: () => null,
        getOrCreateTag: () => tag
    };
    const level = { getTime: () => 4567 };

    assert.equal(api.isQuantumKeyExpired(stack, 9999, 1200), false);
    api.ensureQuantumKeyCreationTime(stack, level);
    assert.equal(values.CreationTime, 4567);
});

test('mandel brick stores and reads its unlocked marker', () => {
    const api = loadApi();
    const values = {};
    const tag = createTag(values);
    const stack = { getTag: () => tag, getOrCreateTag: () => tag };

    assert.equal(api.isMandelBrickUnlocked(stack), false);
    api.setMandelBrickUnlocked(stack, true);
    assert.equal(api.isMandelBrickUnlocked(stack), true);
    assert.equal(values.Unlocked, true);
});

test('quantum mandel integration registers Forge interception points without item duplication', () => {
    const script = fs.readFileSync(scriptPath, 'utf8');
    assert.match(script, /ForgeEvents\.onEvent\(['"]net\.minecraftforge\.event\.ItemStackedOnOtherEvent['"]/) 
    assert.match(script, /ForgeEvents\.onEvent\(['"]net\.minecraftforge\.event\.entity\.player\.PlayerInteractEvent\$RightClickItem['"]/) 
    assert.match(script, /ForgeEvents\.onEvent\(['"]net\.minecraftforge\.event\.entity\.player\.PlayerInteractEvent\$RightClickBlock['"]/) 
    assert.match(script, /StartupEvents\.registry\(['"]item['"]/) 
    assert.match(script, /const QUANTUM_KEY_ID = ['"]rainbow:quantum_key['"]/) 
    assert.match(script, /const MANDEL_BRICK_ID = ['"]rainbow:mandel_brick['"]/) 
    assert.match(script, /event\.create\(QUANTUM_KEY_ID/) 
    assert.match(script, /event\.create\(MANDEL_BRICK_ID/) 
    assert.doesNotMatch(script, /Java\.loadClass/) 
});

test('quantum mandel integration hides the two original MysticArtifacts entries', () => {
    const script = fs.readFileSync(scriptPath, 'utf8');
    assert.match(script, /StartupEvents\.modifyCreativeTab/);
    assert.match(script, /mysticartifacts:quantum_key/);
    assert.match(script, /mysticartifacts:mandel_brick/);
    assert.match(script, /event\.add\(\[Item\.of\(QUANTUM_KEY_ID\), Item\.of\(MANDEL_BRICK_ID\)\]\)/);
});
