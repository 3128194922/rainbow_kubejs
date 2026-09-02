const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const scriptPath = path.join(root, 'startup_scripts', 'damage_indicators', 'main.js');
const resourcePath = path.join(root, 'assets', 'rainbow', 'particles', 'damage_indicator_text.json');
const forgeEventsMainPath = path.join(root, 'startup_scripts', 'ForgeEvents', 'main.js');
const sourcePaths = [
    path.join(root, 'startup_scripts', 'CONST.js'),
    path.join(root, 'startup_scripts', 'ForgeEvents.js'),
    path.join(root, 'startup_scripts', 'ForgeEvents', 'onPlayerHurt.js'),
    path.join(root, 'startup_scripts', 'shield_parry', 'main.js'),
    path.join(root, 'server_scripts', 'EntityEvents.js')
];

function read(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

test('damage indicator registers a ParticleJS text type matching RetroDamageIndicators', () => {
    const script = read(scriptPath);

    assert.match(script, /StartupEvents\.registry\(['"]particle_type['"]/);
    assert.match(script, /DAMAGE_INDICATOR_PARTICLE\s*=\s*['"]rainbow:damage_indicator_text['"];/);
    assert.match(script, /event\.create\(DAMAGE_INDICATOR_PARTICLE, ['"]particlejs['"]\)/);
    assert.match(script, /\.renderType\(['"]text['"]\)/);
    assert.match(script, /\.lifetime\(15, 19\)/);
    assert.match(script, /\.gravity\(1\.3\)/);
    assert.match(script, /\.scale\(1\.0\)/);
    assert.match(script, /\.textOutline\(true\)/);
    assert.match(script, /const PHYSICAL_DAMAGE_TYPES\s*=\s*\[/);
    assert.match(script, /const MAGIC_DAMAGE_TYPES\s*=\s*\[/);
    assert.match(script, /const TRUE_DAMAGE_TYPES\s*=\s*\[/);
    const forgeEventsMain = read(forgeEventsMainPath);
    assert.match(forgeEventsMain, /LivingDamageEvent/);
    assert.doesNotMatch(forgeEventsMain, /global\.spawnDamageIndicator\(/);
    assert.match(script, /ForgeEvents\.onEvent\(['"]net\.minecraftforge\.event\.entity\.living\.LivingDamageEvent['"]/);
    assert.match(script, /global\.spawnDamageIndicator\(/);
    assert.doesNotMatch(script, /\?\./);

    const resource = JSON.parse(read(resourcePath));
    assert.deepEqual(resource.textures, ['particlejs:ember']);
});

test('generic text and damage indicator functions send dynamic ParticleJS text options', () => {
    const script = read(scriptPath);
    const particleCalls = [];
    const sandbox = {
        console: { log() {}, warn() {} },
        Number,
        String,
        Math,
        isFinite,
        global: {},
        ParticleJS: {
            spawn(level, particleId, values) {
                particleCalls.push({ level, particleId, values });
            }
        },
        StartupEvents: {
            registry(type, callback) {
                assert.equal(type, 'particle_type');
                callback({
                    create(id, builderType) {
                        assert.equal(builderType, 'particlejs');
                        const builder = {};
                        [
                            'text', 'renderType', 'lifetime', 'scale', 'color', 'alpha', 'gravity',
                            'friction', 'behavior', 'textColor', 'textOutlineColor', 'textOutline'
                        ].forEach(method => {
                            builder[method] = () => builder;
                        });
                        return builder;
                    }
                });
            }
        },
        ForgeEvents: {
            onEvent() {}
        }
    };

    vm.runInNewContext(script, sandbox, { filename: scriptPath });

    const level = { isClientSide: () => false };
    const entity = {
        level,
        getRandomX: () => 10.25,
        getEyeY: () => 65.0,
        getRandomZ: () => 10.75
    };

    assert.equal(sandbox.global.spawnDamageIndicator(entity, -12.5), true);
    assert.equal(particleCalls.length, 1);
    assert.equal(particleCalls[0].particleId, 'rainbow:damage_indicator_text');
    assert.equal(particleCalls[0].values.x, 10.25);
    assert.equal(particleCalls[0].values.y, 65.0);
    assert.equal(particleCalls[0].values.z, 10.75);
    assert.equal(particleCalls[0].values.dy, 0.3);
    assert.equal(particleCalls[0].values.text, '12.6');
    assert.equal(particleCalls[0].values.textColor, 0xFF0000);
    assert.equal(particleCalls[0].values.textOutlineColor, 0x330000);
    assert.equal(particleCalls[0].values.textOutline, true);

    const player = {
        level,
        getEyePosition: () => ({
            add: () => ({ x: () => 1.0, y: () => 66.0, z: () => 3.0 })
        }),
        getLookAngle: () => ({ scale: () => ({ x: () => 1.0, y: () => 66.0, z: () => 3.0 }) })
    };
    assert.equal(sandbox.global.sendParticleTextInFront(player, '盾反！', 0xFFAA00), true);
    assert.equal(particleCalls.length, 2);
    assert.equal(particleCalls[1].values.text, '盾反！');
    assert.equal(particleCalls[1].values.textColor, 0xFFAA00);

    assert.equal(sandbox.global.sendParticleText(player, 4.0, 65.0, 6.0, '通用文本', 0xFFFFFF, false, 0x000000), true);
    assert.equal(particleCalls.length, 3);
    assert.equal(particleCalls[2].values.x, 4.0);
    assert.equal(particleCalls[2].values.y, 65.0);
    assert.equal(particleCalls[2].values.z, 6.0);
    assert.equal(particleCalls[2].values.text, '通用文本');
    assert.equal(particleCalls[2].values.textOutline, false);

    const damageEventEntity = {
        level,
        getRandomX: () => 20.0,
        getEyeY: () => 70.0,
        getRandomZ: () => 20.0
    };
    sandbox.global.spawnDamageIndicator(damageEventEntity, -8.0, {
        getType: () => 'sonic_boom',
        getMsgId: () => 'sonic_boom'
    });
    sandbox.global.spawnDamageIndicator(damageEventEntity, -4.0, {
        getType: () => 'indirectMagic',
        getMsgId: () => 'indirectMagic'
    });
    sandbox.global.spawnDamageIndicator(damageEventEntity, -2.0, {
        getType: () => 'mob_attack',
        getMsgId: () => 'mob_attack'
    });
    sandbox.global.spawnDamageIndicator(damageEventEntity, -1.0);
    sandbox.global.spawnDamageIndicator(damageEventEntity, -0.5, {
        getType: () => undefined,
        getMsgId: () => undefined
    });

    assert.equal(particleCalls.length, 8);
    assert.equal(particleCalls[3].values.textColor, 0xFFFFFF);
    assert.equal(particleCalls[3].values.textOutlineColor, 0x333333);
    assert.equal(particleCalls[4].values.textColor, 0xAA00FF);
    assert.equal(particleCalls[4].values.textOutlineColor, 0x220033);
    assert.equal(particleCalls[5].values.textColor, 0xFF0000);
    assert.equal(particleCalls[5].values.textOutlineColor, 0x330000);
    assert.equal(particleCalls[6].values.textColor, 0xFF0000);
    assert.equal(particleCalls[6].values.textOutlineColor, 0x330000);
    assert.equal(particleCalls[7].values.textColor, 0xFF0000);
    assert.equal(particleCalls[7].values.textOutlineColor, 0x330000);
});

test('damage indicator owns an independent LivingDamageEvent callback', () => {
    const script = read(scriptPath);
    const callbacks = [];
    const errors = [];
    const sandbox = {
        console: { log(value) { errors.push(value); } },
        Number,
        String,
        Math,
        isFinite,
        global: {
            spawnDamageIndicator(entity, difference, source) {
                callbacks.push({ entity, difference, source });
            }
        },
        ParticleJS: { spawn() {} },
        StartupEvents: {
            registry() {}
        },
        ForgeEvents: {
            onEvent(eventName, callback) {
                if (eventName === 'net.minecraftforge.event.entity.living.LivingDamageEvent') {
                    callbacks.event = callback;
                }
            }
        }
    };

    vm.runInNewContext(script, sandbox, { filename: scriptPath });
    assert.equal(typeof callbacks.event, 'function');

    // 用独立回调替换实际粒子函数，单独验证事件回传的参数契约。
    sandbox.global.spawnDamageIndicator = function (entity, difference, source) {
        callbacks.push({ entity, difference, source });
    };

    const entity = { level: { isClientSide: () => false } };
    const source = { getType: () => 'magic' };
    callbacks.event({
        getEntity: () => entity,
        getAmount: () => 7.5,
        getSource: () => source
    });

    assert.deepEqual(errors, []);
    assert.deepEqual(callbacks[0], { entity, difference: -7.5, source });
});

test('legacy ParticleTextAPI references are removed from KubeJS call sites', () => {
    for (const sourcePath of sourcePaths) {
        assert.doesNotMatch(read(sourcePath), /ParticleTextAPI/);
    }
});
