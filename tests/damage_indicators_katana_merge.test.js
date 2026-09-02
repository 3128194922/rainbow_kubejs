const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scriptPath = path.join(root, 'startup_scripts', 'damage_indicators', 'main.js');
const oldKatanaPath = path.join(root, 'startup_scripts', 'katana_parry_particles', 'main.js');

function read(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function createParticleBuilder() {
    const builder = {};
    [
        'text(java.lang.String)',
        'texture(net.minecraft.resources.ResourceLocation)'
    ].forEach(method => {
        builder[method] = () => builder;
    });
    [
        'renderType', 'lifetime', 'scale', 'color', 'alpha', 'gravity', 'friction',
        'behavior', 'textColor', 'textOutlineColor', 'textOutline', 'animation'
    ].forEach(method => {
        builder[method] = () => builder;
    });
    return builder;
}

function createSandbox() {
    const particleCalls = [];
    const callbacks = {};
    const textCalls = [];
    const sandbox = {
        console: { log() {}, warn() {} },
        Number,
        String,
        Math,
        isFinite,
        global: {},
        ResourceLocation: function (namespace, pathValue) {
            this.namespace = namespace;
            this.path = pathValue;
        },
        ParticleJS: {
            spawn(level, particleId, values) {
                particleCalls.push({ level, particleId, values });
            }
        },
        StartupEvents: {
            registry(type, callback) {
                callback({
                    create() {
                        return createParticleBuilder();
                    }
                });
            }
        },
        ForgeEvents: {
            onEvent(eventName, callback) {
                callbacks[eventName] = callback;
            }
        }
    };

    sandbox.global.sendParticleTextInFront = function (entity, text, color) {
        textCalls.push({ entity, text, color });
        return true;
    };
    vm.runInNewContext(read(scriptPath), sandbox, { filename: scriptPath });
    return { sandbox, particleCalls, callbacks, textCalls };
}

test('damage indicator merges katana particle handling and removes the old entry point', () => {
    const script = read(scriptPath);

    assert.match(script, /const MELEE_DAMAGE_TYPES\s*=\s*\[/);
    assert.match(script, /rainbow:katana_hit_cut/);
    assert.match(script, /LivingDamageEvent/);
    assert.match(script, /LivingAttackEvent/);
    assert.match(script, /格挡！/);
    assert.doesNotMatch(script, /isChainswordStack/);
    assert.equal(fs.existsSync(oldKatanaPath), false);
});

test('melee damage creates hit_cut and damage number, while non-melee damage only creates number', () => {
    const { callbacks, particleCalls } = createSandbox();
    const damageEvent = callbacks['net.minecraftforge.event.entity.living.LivingDamageEvent'];
    assert.equal(typeof damageEvent, 'function');

    const level = { isClientSide: () => false };
    const entity = {
        level,
        getRandomX: () => 10.0,
        getEyeY: () => 65.0,
        getRandomZ: () => 10.0,
        getX: () => 10.0,
        getY: () => 64.0,
        getZ: () => 10.0,
        getBbHeight: () => 2.0
    };

    damageEvent({
        getEntity: () => entity,
        getAmount: () => 5.0,
        getSource: () => ({ getType: () => 'player_attack', getMsgId: () => 'player_attack' })
    });
    assert.equal(particleCalls.length, 2);
    assert.equal(particleCalls[0].particleId, 'rainbow:damage_indicator_text');
    assert.equal(particleCalls[0].values.textColor, 0xFF0000);
    assert.equal(particleCalls[1].particleId, 'rainbow:katana_hit_cut');

    damageEvent({
        getEntity: () => entity,
        getAmount: () => 5.0,
        getSource: () => ({ getType: () => 'magic', getMsgId: () => 'magic' })
    });
    assert.equal(particleCalls.length, 3);
    assert.equal(particleCalls[2].particleId, 'rainbow:damage_indicator_text');
    assert.equal(particleCalls[2].values.textColor, 0xAA00FF);
});

test('katana guard creates a text particle without requiring damage number generation', () => {
    const { callbacks, particleCalls } = createSandbox();
    const attackEvent = callbacks['net.minecraftforge.event.entity.living.LivingAttackEvent'];
    assert.equal(typeof attackEvent, 'function');

    const entity = {
        level: { isClientSide: () => false },
        isAlive: () => true,
        isUsingItem: () => true,
        getUseItem: () => ({ id: 'mysticartifacts:katana' }),
        getEyePosition: () => ({
            add: () => ({ x: () => 1.0, y: () => 66.0, z: () => 3.0 })
        }),
        getLookAngle: () => ({
            scale: () => ({ x: () => 1.0, y: () => 66.0, z: () => 3.0 })
        })
    };
    attackEvent({
        getEntity: () => entity,
        getSource: () => ({ getType: () => 'player_attack' })
    });

    assert.equal(particleCalls.length, 1);
    assert.equal(particleCalls[0].values.text, '格挡！');
    assert.equal(particleCalls[0].values.textColor, 0xFFAA00);
});
