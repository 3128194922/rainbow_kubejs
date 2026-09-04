const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const registryPath = path.join(root, 'startup_scripts', 'Registry', 'Registry_curios.js');
const particlePath = path.join(root, 'startup_scripts', 'damage_indicators', 'main.js');

function read(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

test('肩甲骑马时使用0.3速度阈值并跳过玩家、马匹和友军', () => {
    const registry = read(registryPath);
    const tooltip = read(path.join(root, 'client_scripts', 'tooltips.js'));

    assert.match(registry, /ridingHorse\s*=\s*vehicle\s*!=\s*null[\s\S]{0,180}instanceof\s+AbstractHorse/);
    assert.match(registry, /SPEED_THRESHOLD\s*=\s*ridingHorse\s*\?\s*0\.3\s*:\s*1\.0/);
    assert.match(registry, /COLLISION_RADIUS\s*=\s*ridingHorse\s*\?\s*2\.0\s*:\s*1\.0/);
    assert.match(registry, /BASE_DAMAGE\s*=\s*ridingHorse\s*\?\s*8\s*:\s*2/);
    assert.match(registry, /target\s+instanceof\s+Player/);
    assert.match(registry, /target\s+instanceof\s+AbstractHorse/);
    assert.match(registry, /target\.getId\(\)\s*===\s*vehicle\.getId\(\)/);
    assert.match(registry, /target\.isAlliedTo\(entity\)/);
    assert.match(tooltip, /骑马时速度阈值降低，碰撞范围扩大/);
});

function createParticleSandbox() {
    const callbacks = {};
    const textCalls = [];
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

    const sandbox = {
        console: { log() {}, warn() {} },
        Number,
        String,
        Math,
        isFinite,
        global: {
            sendParticleTextInFront(entity, text, color) {
                textCalls.push({ entity, text, color });
                return true;
            }
        },
        ResourceLocation: function (namespace, pathValue) {
            this.namespace = namespace;
            this.path = pathValue;
        },
        ParticleJS: { spawn() {} },
        StartupEvents: {
            registry(type, callback) {
                callback({ create: () => builder });
            }
        },
        ForgeEvents: {
            onEvent(eventName, callback) {
                callbacks[eventName] = callback;
            }
        }
    };

    vm.runInNewContext(read(particlePath), sandbox, { filename: particlePath });
    sandbox.global.sendParticleTextInFront = function (entity, text, color) {
        textCalls.push({ entity, text, color });
        return true;
    };
    return { callbacks, textCalls };
}

test('morecallback三个战斗事件显示对应文本粒子', () => {
    const { callbacks, textCalls } = createParticleSandbox();
    const critical = callbacks['com.morecallback.event.ApothicCriticalHitEvent'];
    const dodge = callbacks['com.morecallback.event.ApothicDodgeEvent'];
    const vanilla = callbacks['com.morecallback.event.VanillaCriticalHitEvent'];

    assert.equal(typeof critical, 'function');
    assert.equal(typeof dodge, 'function');
    assert.equal(typeof vanilla, 'function');

    const attacker = { level: { isClientSide: () => false } };
    const target = { level: { isClientSide: () => false } };
    critical({ getAttacker: () => attacker });
    dodge({ getTarget: () => target });
    vanilla({ getPlayer: () => attacker, isSuppressed: () => false });

    assert.deepEqual(textCalls.map(call => call.text), ['暴击！', '闪避！', '跳劈！']);
});

test('被优先级逻辑抑制的原版跳劈不显示文本粒子', () => {
    const { callbacks, textCalls } = createParticleSandbox();
    const vanilla = callbacks['com.morecallback.event.VanillaCriticalHitEvent'];
    const player = { level: { isClientSide: () => false } };

    vanilla({ getPlayer: () => player, isSuppressed: () => true });

    assert.equal(textCalls.length, 0);
});
