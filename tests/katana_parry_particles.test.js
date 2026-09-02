const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const particleScriptPath = path.join(root, 'startup_scripts', 'damage_indicators', 'main.js');
const particleResourcePath = path.join(root, 'assets', 'rainbow', 'particles', 'katana_hit_cut.json');
const startupConstPath = path.join(root, 'startup_scripts', 'CONST.js');
const tooltipPath = path.join(root, 'client_scripts', 'tooltips.js');

function read(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

test('damage indicator script uses the EEEAB hit-cut animation', () => {
    const script = read(particleScriptPath);

    assert.match(script, /StartupEvents\.registry\(['"]particle_type['"]/);
    assert.match(script, /create\(KATANA_HIT_CUT_PARTICLE, ['"]particlejs['"]\)/);
    assert.match(script, /\["texture\(net\.minecraft\.resources\.ResourceLocation\)"\]\(new ResourceLocation\(['"]eeeabsmobs['"], ['"]hit_cut_1['"]\)\)/);
    assert.match(script, /\.animation\(6, 1, false, 1\)/);
    assert.match(script, /\.lifetime\(5\)/);
    assert.match(script, /\.renderType\(['"]lit['"]\)/);
    assert.doesNotMatch(script, /particlejs:ember/);

    const resource = JSON.parse(read(particleResourcePath));
    assert.deepEqual(resource.textures, [
        'eeeabsmobs:hit_cut_1',
        'eeeabsmobs:hit_cut_2',
        'eeeabsmobs:hit_cut_3',
        'eeeabsmobs:hit_cut_4',
        'eeeabsmobs:hit_cut_5',
        'eeeabsmobs:hit_cut_6'
    ]);
});

test('damage indicator script separates melee hit-cut from katana guard text', () => {
    const script = read(particleScriptPath);

    assert.match(script, /const MELEE_DAMAGE_TYPES\s*=\s*\[/);
    assert.match(script, /LivingAttackEvent/);
    assert.match(script, /ProjectileImpactEvent/);
    assert.match(script, /LivingDamageEvent/);
    assert.match(script, /格挡！/);
    assert.doesNotMatch(script, /AttackEntityEvent/);
    assert.doesNotMatch(script, /eeeabsmobs:chainsword/);
    assert.match(script, /ParticleJS\.spawn/);
    assert.doesNotMatch(script, /\?\./);
});

test('damage indicator script keeps Java class loading in startup CONST and documents the feedback', () => {
    const tooltip = read(tooltipPath);

    assert.match(tooltip, /武士刀[\s\S]*格挡粒子/);
});

test('damage indicator handlers emit hit-cut only for melee and text for katana guard', () => {
    const script = read(particleScriptPath);
    const handlers = {};
    const particleCalls = [];
    const particleBuilderMethods = [
        'text(java.lang.String)',
        'texture(net.minecraft.resources.ResourceLocation)',
        'renderType', 'lifetime', 'scale', 'color', 'alpha', 'gravity', 'friction',
        'behavior', 'animation', 'textColor', 'textOutlineColor', 'textOutline'
    ];

    const sandbox = {
        console: { log() {} },
        Number,
        String,
        isFinite,
        ResourceLocation: function (namespace, pathValue) {
            this.namespace = namespace;
            this.path = pathValue;
        },
        ForgeRegistries: { ITEMS: { getKey: item => item } },
        global: {},
        StartupEvents: {
            registry(type, callback) {
                assert.equal(type, 'particle_type');
                callback({
                    create(id, builderType) {
                        assert.equal(builderType, 'particlejs');
                        const builder = {};
                        for (const method of particleBuilderMethods) {
                            builder[method] = () => builder;
                        }
                        return builder;
                    }
                });
            }
        },
        ForgeEvents: {
            onEvent(name, callback) {
                handlers[name] = callback;
            }
        },
        ParticleJS: {
            spawn(level, particleId, values) {
                particleCalls.push({ kind: 'spawn', particleId, values });
            }
        }
    };

    vm.runInNewContext(script, sandbox, { filename: particleScriptPath });

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
        }),
        getX: () => 10,
        getY: () => 64,
        getZ: () => 10,
        getBbHeight: () => 2.0
    };
    const meleeTarget = {
        level: { isClientSide: () => false },
        getRandomX: () => 20,
        getEyeY: () => 71,
        getRandomZ: () => 20,
        getX: () => 20,
        getY: () => 70,
        getZ: () => 20,
        getBbHeight: () => 2.0
    };

    handlers['net.minecraftforge.event.entity.living.LivingDamageEvent']({
        getEntity: () => meleeTarget,
        getAmount: () => 3,
        getSource: () => ({ getType: () => 'player_attack' })
    });
    handlers['net.minecraftforge.event.entity.living.LivingDamageEvent']({
        getEntity: () => meleeTarget,
        getAmount: () => 3,
        getSource: () => ({ getType: () => 'magic' })
    });
    handlers['net.minecraftforge.event.entity.living.LivingAttackEvent']({
        getEntity: () => entity,
        getSource: () => ({ getType: () => 'player_attack' })
    });

    assert.equal(particleCalls.length, 4);
    assert.equal(particleCalls[0].particleId, 'rainbow:damage_indicator_text');
    assert.equal(particleCalls[1].particleId, 'rainbow:katana_hit_cut');
    assert.equal(particleCalls[0].kind, 'spawn');
    assert.equal(particleCalls[1].kind, 'spawn');
    assert.equal(particleCalls[0].values.count, 1);
    assert.equal(particleCalls[1].values.count, 1);
    assert.equal(particleCalls[2].particleId, 'rainbow:damage_indicator_text');
    assert.equal(particleCalls[2].values.textColor, 0xAA00FF);
    assert.equal(particleCalls[3].particleId, 'rainbow:damage_indicator_text');
    assert.equal(particleCalls[3].values.text, '格挡！');
});
