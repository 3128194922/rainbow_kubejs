// 魂火喷火器兼容 MoreFire：判定函数与负路径冒烟测试。
// Java 对象交互（ForgeRegistries/MoreFire/事件字段包装）需游戏内验证，见 README 验证清单。
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');

const ctx = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'startup_scripts/soul_flamethrower/handleSoulFlamethrower.js'), 'utf8'), ctx);

test('fire_stream 伤害类型判定：仅 clanginghowl.fire_stream 命中', () => {
    assert.equal(ctx.isFireStreamDamage('clanginghowl.fire_stream'), true);
    assert.equal(ctx.isFireStreamDamage('minecraft:onFire'), false);
    assert.equal(ctx.isFireStreamDamage('clanginghowl.fire_stream_x'), false);
    assert.equal(ctx.isFireStreamDamage(null), false);
    // 游戏内 getType() 返回 Java 对象，这里用 toString 包装对象模拟
    assert.equal(ctx.isFireStreamDamage({ toString: () => 'clanginghowl.fire_stream' }), true);
    assert.equal(ctx.isFireStreamDamage({ toString: () => 'minecraft:inFire' }), false);
});

test('火焰方块替换判定：fire 与 soul_fire 替换，自定义魂火自身不替换（防递归）', () => {
    assert.equal(ctx.shouldReplaceFireBlock('minecraft:fire'), true);
    assert.equal(ctx.shouldReplaceFireBlock('minecraft:soul_fire'), true);
    assert.equal(ctx.shouldReplaceFireBlock('rainbow:soul_flame'), false);
    assert.equal(ctx.shouldReplaceFireBlock('minecraft:lava'), false);
    assert.equal(ctx.shouldReplaceFireBlock(null), false);
});

test('喷火器替换半径判定：12 格边界内替换', () => {
    assert.equal(ctx.isWithinFlamethrowerRange(0), true);
    assert.equal(ctx.isWithinFlamethrowerRange(100), true);
    assert.equal(ctx.isWithinFlamethrowerRange(144), true);
    assert.equal(ctx.isWithinFlamethrowerRange(145), false);
    assert.equal(ctx.isWithinFlamethrowerRange(null), false);
});

test('LivingHurt 负路径：非 fire_stream 伤害直接返回不触发后续逻辑', () => {
    // source 为 null 与其他伤害类型时不应抛错（后续 ForgeRegistries 解析不应被执行）
    ctx.handleSoulFlamethrowerHurt({ source: null, entity: {} });
    ctx.handleSoulFlamethrowerHurt({
        source: { getType: () => 'minecraft:onFire', getEntity: () => null },
        entity: {}
    });
});

test('附着火焰负路径：null 目标直接返回不报错', () => {
    ctx.igniteSoulFlame(null, 160);
});
