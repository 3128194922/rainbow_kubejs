// 执行实际飘字脚本；只替换 Forge 和 ParticleJS 边界，验证合并数量与命中归属。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const CRITICAL = 'com.morecallback.event.ApothicCriticalHitEvent';
const DAMAGE = 'net.minecraftforge.event.entity.living.LivingDamageEvent';
const TICK = 'net.minecraftforge.event.TickEvent$ServerTickEvent';

function harness() {
    const hooks = new Map();
    const particles = [];
    const errors = [];
    const context = vm.createContext({
        console: { log: value => errors.push(String(value)) },
        global: {},
        StartupEvents: { registry: () => {} },
        ForgeEvents: { onEvent: (id, callback) => hooks.set(id, callback) },
        ParticleJS: { spawn: (level, id, options) => particles.push({ level, id, ...options }) }
    });
    const file = path.join(__dirname, '..', 'startup_scripts', 'damage_indicators', 'main.js');
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
    const level = { isClientSide: () => false, getTime: () => 100 };
    function entity(id, x = 20) {
        return {
            level, getUuid: () => id, getX: () => x, getY: () => 64,
            getZ: () => 30, getEyeY: () => 65.6, getBbHeight: () => 1.8,
            getRandomX: () => x, getRandomZ: () => 30
        };
    }
    function fire(id, event) {
        assert.ok(hooks.has(id), '未注册事件：' + id);
        hooks.get(id)(event);
        assert.deepEqual(errors, []);
    }
    return {
        particles, entity, level, fire,
        crit: (target, source) => fire(CRITICAL, { getTarget: () => target, getDamageSource: () => source }),
        damage: (target, source, amount = 12.25) => fire(DAMAGE, {
            getEntity: () => target, getSource: () => source, getAmount: () => amount
        })
    };
}

// DamageSource 继承 Java Object.equals；同类型的两次攻击仍是不同伤害源实例。
function source(type = 'arrow') {
    return { getMsgId: () => type, equals(other) { return this === other; } };
}

test('普通命中只生成一个伤害文本粒子，坐标来自受击目标', () => {
    const h = harness();
    h.damage(h.entity('victim'), source());
    assert.equal(h.particles.length, 1);
    assert.equal(h.particles[0].text, '12.3');
    assert.deepEqual([h.particles[0].x, h.particles[0].y, h.particles[0].z], [20, 65.6, 30]);
});

test('暴击事件不单独飘字，最终伤害合并为一个文本且标记只消费一次', () => {
    const h = harness(), target = h.entity('victim'), hit = source();
    h.crit(target, hit);
    assert.equal(h.particles.length, 0);
    h.damage(target, hit);
    assert.equal(h.particles.length, 1);
    assert.equal(h.particles[0].text, '暴击 12.3！');
    assert.equal(h.particles[0].textColor, 0xFF5555);
    assert.equal(h.particles[0].textOutlineColor, 0x550000);
    h.damage(target, hit);
    assert.equal(h.particles[1].text, '12.3');
});

test('同一目标的其他伤害源不会抢走暴击标记', () => {
    const h = harness(), target = h.entity('victim'), hit = source();
    h.crit(target, hit);
    h.damage(target, source());
    h.damage(target, hit);
    assert.deepEqual(h.particles.map(p => p.text), ['12.3', '暴击 12.3！']);
});

test('同一伤害源命中其他目标不会串用暴击标记', () => {
    const h = harness(), target = h.entity('victim'), hit = source();
    h.crit(target, hit);
    h.damage(h.entity('other', 40), hit);
    h.damage(target, hit);
    assert.deepEqual(h.particles.map(p => p.text), ['12.3', '暴击 12.3！']);
});

test('被取消伤害的未消费标记在tick结束清理，下一次攻击显示普通数字', () => {
    const h = harness(), target = h.entity('victim'), hit = source();
    h.crit(target, hit);
    h.fire(TICK, { phase: 'END' });
    h.damage(target, hit);
    assert.deepEqual(h.particles.map(p => p.text), ['12.3']);
});

test('tick开始阶段不清除正在等待伤害的标记', () => {
    const h = harness(), target = h.entity('victim'), hit = source();
    h.crit(target, hit);
    h.fire(TICK, { phase: 'START' });
    h.damage(target, hit);
    assert.deepEqual(h.particles.map(p => p.text), ['暴击 12.3！']);
});

test('下一tick的命中不继承迟到的旧暴击标记', () => {
    const h = harness(), target = h.entity('victim'), hit = source();
    h.crit(target, hit);
    h.level.getTime = () => 101;
    h.damage(target, hit);
    assert.deepEqual(h.particles.map(p => p.text), ['12.3']);
});

test('同一Java伤害源的不同脚本包装通过equals匹配', () => {
    const h = harness(), target = h.entity('victim'), identity = {};
    const wrap = () => ({ getMsgId: () => 'arrow', identity, equals(other) { return this.identity === other.identity; } });
    h.crit(target, wrap());
    h.damage(target, wrap());
    assert.deepEqual(h.particles.map(p => p.text), ['暴击 12.3！']);
});

// 普通命中保留分类颜色；发生暴击时整条文本改为更醒目的专用红色。
test('魔法和真实伤害普通命中保留分类颜色，暴击统一为亮红色', () => {
    for (const [type, color] of [['magic', 0xAA00FF], ['generic', 0xFFFFFF]]) {
        const h = harness(), target = h.entity('victim'), hit = source(type);
        h.damage(target, hit);
        assert.equal(h.particles[0].textColor, color);
        h.crit(target, hit);
        h.damage(target, hit);
        assert.equal(h.particles.length, 2);
        assert.equal(h.particles[1].text, '暴击 12.3！');
        assert.equal(h.particles[1].textColor, 0xFF5555);
        assert.equal(h.particles[1].textOutlineColor, 0x550000);
    }
});

test('客户端事件不生成文本或暴击标记', () => {
    const h = harness(), target = h.entity('victim'), hit = source();
    h.level.isClientSide = () => true;
    h.crit(target, hit);
    h.damage(target, hit);
    assert.equal(h.particles.length, 0);
    h.level.isClientSide = () => false;
    h.damage(target, hit);
    assert.deepEqual(h.particles.map(p => p.text), ['12.3']);
});
