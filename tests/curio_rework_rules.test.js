const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('狂怒面具使用受伤10点充能和rainbow:fury效果', () => {
    const hurt = read('startup_scripts/ForgeEvents/onPlayerHurt.js');
    const rework = read('startup_scripts/ForgeEvents/handleCurioRework.js');
    const effects = read('startup_scripts/Effects.js');
    const skillwheel = read('server_scripts/curios_skill_system/Skillwheel.js');

    assert.match(hurt + rework, /rainbow:fury/);
    assert.match(hurt, /10/);
    assert.match(rework, /FURY_DURATION_TICKS = 220/);
    assert.match(rework, /rainbow:voice\.animals/);
    assert.match(rework, /FuryPitch/);
    assert.doesNotMatch(hurt + skillwheel, /rainbow:cooldowns_reduction/);
    assert.match(effects, /rainbow:fury/);
    assert.doesNotMatch(effects, /event\.create\("rainbow:cooldowns_reduction"\)/);
});

test('狂怒面具音调从1.0递增到2.0后回到1.0', () => {
    const rework = read('startup_scripts/ForgeEvents/handleCurioRework.js');
    const sandbox = { ForgeEvents: { onEvent: () => {} }, console: console };
    vm.runInNewContext(rework + '\nthis.__pitch = { get: getFuryPitch, next: advanceFuryPitch };', sandbox);

    assert.equal(sandbox.__pitch.next(1.0), 1.1);
    assert.equal(sandbox.__pitch.next(1.9), 2.0);
    assert.equal(sandbox.__pitch.next(2.0), 1.0);
});

test('狂怒药水图标复用狂怒面具激活贴图', () => {
    const source = path.join(root, 'assets/rainbow/textures/item/fury_mask_on.png');
    const target = path.join(root, 'assets/rainbow/textures/mob_effect/fury.png');

    assert.equal(fs.existsSync(source), true);
    assert.equal(fs.existsSync(target), true);
    assert.deepEqual(fs.readFileSync(target), fs.readFileSync(source));
});

test('野兽面具使用10秒闪避药水效果并在受伤时重置，不再用NBT存层数', () => {
    const hurt = read('startup_scripts/ForgeEvents/onPlayerHurt.js');
    const rework = read('startup_scripts/ForgeEvents/handleCurioRework.js');
    const effects = read('startup_scripts/Effects.js');
    const beastHandler = rework.match(/function handleBeastMaskHurt[\s\S]*?\n}\n\nfunction handleFuryMaskHurt/);

    assert.match(hurt, /rainbow:beast_dodge/);
    assert.match(rework, /BEAST_DODGE_EFFECT_TICKS = 200/);
    assert.ok(beastHandler);
    assert.doesNotMatch(beastHandler[0], /DodgeLevel/);
    assert.doesNotMatch(beastHandler[0], /getCurioTagForRework/);
    assert.doesNotMatch(hurt, /minecraft:absorption/);
    assert.match(effects, /attributeslib:dodge_chance/);
});

test('葵花宝典设置100%治疗削减并被动监听翻滚免疫', () => {
    const registry = read('startup_scripts/Registry/Registry_curios.js');
    const beforeHurt = read('startup_scripts/ForgeEvents/onBeforePlayerHurt.js');
    const forgeEvents = read('startup_scripts/ForgeEvents/main.js');
    const skillwheel = read('server_scripts/curios_skill_system/Skillwheel.js');

    assert.match(registry, /healing_received[\s\S]{0,120}-1\.0/);
    assert.doesNotMatch(skillwheel, /registerSkill\(['"]rainbow:fist_of_seven_wounds/);
    assert.match(forgeEvents, /net\.combatroll\.forge\.event\.CombatRollEvent/);
    assert.match(beforeHurt, /getPlayer\(\)/);
    assert.match(beforeHurt, /getRollDuration\(\)/);
    assert.match(beforeHurt, /getCuriosItem\(player, ['"]rainbow:fist_of_seven_wounds['"]\)/);
    assert.doesNotMatch(beforeHurt, /sunflower_roll_pending/);
});

test('极限证章只保留负幸运及指定属性，不再增加攻击或致死', () => {
    const registry = read('startup_scripts/Registry/Registry_curios.js');
    const deathHandler = read('startup_scripts/ForgeEvents/handleDespairInsigniaDeath.js');
    const tooltip = read('client_scripts/tooltips.js');

    assert.match(registry, /generic\.luck/);
    assert.match(registry, /-25/);
    assert.match(registry, /generic\.armor/);
    assert.match(registry, /generic\.armor_toughness/);
    assert.match(registry, /experience_gained/);
    assert.match(registry, /modifyFortuneLevel/);
    assert.match(registry, /modifyLootingLevel/);
    assert.doesNotMatch(registry, /despair_insignia[\s\S]{0,260}generic\.attack_damage[\s\S]{0,80}100\.0/);
    assert.doesNotMatch(deathHandler, /1e10/);
    assert.match(tooltip, /rainbow:despair_insignia/);
});

test('相关饰品提示与当前功能和NBT状态一致', () => {
    const tooltip = read('client_scripts/tooltips.js');

    assert.doesNotMatch(tooltip, /DodgeLevel/);
    assert.match(tooltip, /Client\.player\.getEffect/);
    assert.match(tooltip, /当前闪避层数/);
    assert.match(tooltip, /FuryPitch/);
    assert.match(tooltip, /下次音调/);
    assert.match(tooltip, /当前生命伤害 \+7%/);
    assert.doesNotMatch(tooltip, /冷却缩减效果/);
});

test('葵花宝典待免伤时显示Dyeing层，触发后移除并播放反馈', () => {
    const skillwheel = read('server_scripts/curios_skill_system/Skillwheel.js');
    const beforeHurt = read('startup_scripts/ForgeEvents/onBeforePlayerHurt.js');
    const textParticle = read('startup_scripts/damage_indicators/main.js');

    assert.doesNotMatch(skillwheel, /fist_of_seven_wounds/);
    assert.match(beforeHurt, /SUNFLOWER_INVULNERABILITY_DYEING_ID/);
    assert.match(beforeHurt, /SUNFLOWER_INVULNERABILITY_DYEING_COLOR = "80808080"/);
    assert.match(beforeHurt, /dyeing paint add static/);
    assert.match(beforeHurt, /dyeing paint remove/);
    assert.match(beforeHurt, /sendParticleTextInFront\(victim, "免疫伤害！"/);
    assert.match(beforeHurt, /playSound\(null,[\s\S]{0,180}minecraft:item\.totem\.use/);
    assert.match(beforeHurt, /event\.setCanceled\(true\)/);
    assert.match(textParticle, /global\.sendParticleTextInFront\s*=/);
});

test('葵花宝典不再通过主动技能强制回传CombatRollEvent', () => {
    const serverConst = read('server_scripts/CONST.js');
    const combatRoll = read('server_scripts/combatroll_util.js');

    assert.doesNotMatch(serverConst, /CombatRollPlatformImpl/);
    assert.doesNotMatch(combatRoll, /publishEvent/);
    assert.doesNotMatch(combatRoll, /publishRollEvent/);
});
