const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const mainPath = path.join(root, 'server_scripts', 'cannon_target', 'main.js');
const itemRegistryPath = path.join(root, 'startup_scripts', 'Registry', 'Registry_item.js');

function loadMath() {
    assert.equal(fs.existsSync(mainPath), true, '炮击标定器服务端入口尚未创建');
    const source = fs.readFileSync(mainPath, 'utf8');
    const sandbox = {
        console: { log() {}, warn() {}, error() {} },
        Math,
        Number,
        String,
        isFinite,
        global: {},
        ItemEvents: { rightClicked() {} },
        BlockEvents: { rightClicked() {} }
    };
    vm.runInNewContext(source, sandbox, { filename: mainPath });
    return sandbox.global.cannonTargetMath;
}

test('物理目标点转换为 Minecraft 方位角和仰角', () => {
    const math = loadMath();
    const result = math.physicalAngles(0.5, 64, 0.5, 10.5, 64, 0.5, 180);

    assert.equal(Math.round(result.yaw), 270);
    assert.equal(Math.round(result.pitch), 0);
});

test('普通和倒立垂直炮台使用 CBC 内部角度基准', () => {
    const math = loadMath();
    const normal = math.verticalMountAngles(270, 30, false, 60, 60);
    const inverted = math.verticalMountAngles(270, -30, true, 60, 60);

    assert.equal(normal.yaw, 90);
    assert.equal(normal.pitch, 60);
    assert.equal(inverted.yaw, 270);
    assert.equal(inverted.pitch, -60);
});

test('固定炮台调节值限制在 CBC 的正负45度范围', () => {
    const math = loadMath();
    const result = math.fixedMountAdjustments(350, 60, 0, 1);

    assert.equal(result.yawAdjustment, -10);
    assert.equal(result.pitchAdjustment, 45);
    assert.equal(result.clipped, true);
});

test('新物品注册但不注册同名 kuchiyose_scroll 物品', () => {
    const registry = fs.readFileSync(itemRegistryPath, 'utf8');

    assert.match(registry, /event\.create\(['"]rainbow:cannon_targeter['"]\)/);
    assert.doesNotMatch(registry, /event\.create\(['"]rainbow:kuchiyose_scroll['"]\)/);
});
