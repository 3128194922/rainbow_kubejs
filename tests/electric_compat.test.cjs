// 执行实际电系兼容脚本；只替换 Forge 注册表、事件总线和实体边界。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DAMAGE = 'net.minecraftforge.event.entity.living.LivingDamageEvent';
const LIGHTNING_TAG = { id: 'minecraft:is_lightning' };
const EFFECTS = {
    'eeeabsmobs:electrified_effect': { id: 'eeeabsmobs:electrified_effect' },
    'cataclysm:wetness': { id: 'cataclysm:wetness' }
};

class FakeMobEffectInstance {
    constructor(effect, duration, amplifier, ambient, visible, showIcon) {
        this.effect = effect;
        this.duration = duration;
        this.amplifier = amplifier;
        this.ambient = ambient;
        this.visible = visible;
        this.showIcon = showIcon;
    }
}

function harness() {
    const hooks = new Map();
    const errors = [];
    class ResourceLocation {
        constructor(namespace, path) {
            this.namespace = namespace;
            this.path = path;
        }
    }
    const context = vm.createContext({
        console: { log: value => errors.push(String(value)) },
        global: {},
        ForgeEvents: { onEvent: (id, callback) => hooks.set(id, callback) },
        ForgeRegistries: {
            MOB_EFFECTS: {
                getValue: location => EFFECTS[location.namespace + ':' + location.path] || null
            }
        },
        ResourceLocation,
        DamageTypeTags: { IS_LIGHTNING: LIGHTNING_TAG },
        MobEffectInstance: FakeMobEffectInstance
    });
    const file = path.join(__dirname, '..', 'startup_scripts', 'electric_compat', 'main.js');
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
    assert.ok(hooks.has(DAMAGE), '未注册 LivingDamageEvent');
    return { hooks, errors };
}

function source(options = {}) {
    const lightning = options.lightning === true;
    return {
        is: tag => lightning && tag === LIGHTNING_TAG,
        getType: () => options.type || 'generic',
        getImmediate: () => options.direct || null,
        getActual: () => options.attacker || null
    };
}

function direct(type) {
    return { getType: () => type };
}

function victim(options = {}) {
    const applied = [];
    const wetnessAmplifier = options.wetnessAmplifier;
    return {
        applied,
        level: { isClientSide: () => false },
        hasEffect: effect => effect.id === 'cataclysm:wetness' && wetnessAmplifier != null,
        getEffect: effect => {
            if (effect.id !== 'cataclysm:wetness' || wetnessAmplifier == null) return null;
            return { getAmplifier: () => wetnessAmplifier };
        },
        addEffect: instance => {
            applied.push(instance);
            return true;
        }
    };
}

function fire(hooks, target, damageSource, amount = 10) {
    let current = amount;
    const event = {
        isCanceled: () => false,
        getEntity: () => target,
        getSource: () => damageSource,
        getAmount: () => current,
        setAmount: value => { current = value; }
    };
    hooks.get(DAMAGE)(event);
    return current;
}

test('lightning 标签伤害不再重复乘潮湿，但会附着感电', () => {
    const h = harness();
    const target = victim({ wetnessAmplifier: 1 });
    const amount = fire(h.hooks, target, source({ lightning: true, type: 'cataclysm.lightning' }), 10);

    assert.equal(amount, 10);
    assert.deepEqual(target.applied.map(instance => instance.effect.id), ['eeeabsmobs:electrified_effect']);
    assert.equal(target.applied[0].duration, 200);
    assert.equal(target.applied[0].amplifier, 0);
    assert.deepEqual(h.errors, []);
});

test('eeeabsmobs 电涌等通用伤害类型按灾变公式补潮湿增伤并附着感电', () => {
    const h = harness();
    const target = victim({ wetnessAmplifier: 1 });
    const amount = fire(h.hooks, target, source({ type: 'mob', direct: direct('eeeabsmobs:surge') }), 10);

    assert.equal(amount, 14);
    assert.deepEqual(target.applied.map(instance => instance.effect.id), ['eeeabsmobs:electrified_effect']);
    assert.deepEqual(h.errors, []);
});

test('铳械连锁闪电按 indirectMagic + bullet 判定为电系', () => {
    const h = harness();
    const target = victim({ wetnessAmplifier: 0 });
    const amount = fire(h.hooks, target, source({ type: 'indirectMagic', direct: direct('irons_artifice:bullet') }), 10);

    assert.equal(amount, 12);
    assert.deepEqual(target.applied.map(instance => instance.effect.id), ['eeeabsmobs:electrified_effect']);
    assert.deepEqual(h.errors, []);
});

test('铳械普通子弹伤害不会被误判为电系', () => {
    const h = harness();
    const target = victim({ wetnessAmplifier: 3 });
    const amount = fire(h.hooks, target, source({
        type: 'death.attack.irons_artifice.bullet',
        direct: direct('irons_artifice:bullet')
    }), 10);

    assert.equal(amount, 10);
    assert.equal(target.applied.length, 0);
    assert.deepEqual(h.errors, []);
});

test('观察者的 mobAttack 电击按攻击者兜底判定', () => {
    const h = harness();
    const target = victim();
    const amount = fire(h.hooks, target, source({
        type: 'mob',
        attacker: direct('eeeabsmobs:relic_observer')
    }), 10);

    assert.equal(amount, 10);
    assert.deepEqual(target.applied.map(instance => instance.effect.id), ['eeeabsmobs:electrified_effect']);
    assert.deepEqual(h.errors, []);
});

test('非电系伤害既不增伤也不附着感电', () => {
    const h = harness();
    const target = victim({ wetnessAmplifier: 3 });
    const amount = fire(h.hooks, target, source({ type: 'arrow' }), 10);

    assert.equal(amount, 10);
    assert.equal(target.applied.length, 0);
    assert.deepEqual(h.errors, []);
});

test('数据包把所有电系伤害并入 minecraft:is_lightning', () => {
    const file = path.join(__dirname, '..', 'data', 'minecraft', 'tags', 'damage_type', 'is_lightning.json');
    const tag = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(tag.replace, false);
    for (const id of [
        'cataclysm:lightning',
        'cataclysm:storm_bringer',
        'cataclysm:player_ceraunus',
        'cataclysm:emp',
        'clanginghowl:lightning',
        'mysticartifacts:lightning_bottle_chain'
    ]) {
        assert.ok(tag.values.includes(id), '缺少电系伤害类型：' + id);
    }
});
