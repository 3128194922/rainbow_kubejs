const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const armorScriptPath = path.join(root, 'startup_scripts', 'democracy_armor', 'main.js');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('democracy armor registers a rainbow armor tier matching MysticArtifacts', () => {
    const script = read(path.join('startup_scripts', 'democracy_armor', 'main.js'));

    assert.match(script, /ItemEvents\.armorTierRegistry\(/);
    assert.match(script, /const DEMOCRACY_ARMOR_TIER = ['"]rainbow:democracy['"]/);
    assert.match(script, /event\.add\(DEMOCRACY_ARMOR_TIER, ['"]iron['"]/);
    assert.match(script, /setDurabilityMultiplier\(26\)/);
    assert.match(script, /setSlotProtections\(\[6, 9, 11, 6\]\)/);
    assert.doesNotMatch(script, /Java\.to/);
    assert.match(script, /setEnchantmentValue\(25\)/);
    assert.match(script, /setToughness\(4\)/);
    assert.match(script, /setKnockbackResistance\(0\)/);
    assert.match(script, /setRepairIngredient\(Ingredient\.of\(['"]mysticartifacts:rubber['"]\)\)/);
    assert.match(script, /SoundEvents\.ARMOR_EQUIP_NETHERITE/);
});

test('democracy armor registers all four rainbow armor item types and reuses textures', () => {
    const script = fs.readFileSync(armorScriptPath, 'utf8');
    const pieces = ['helmet', 'chestplate', 'leggings', 'boots'];

    assert.match(script, /StartupEvents\.registry\(['"]item['"]/, 'item registry event is present');
    for (const piece of pieces) {
        assert.match(script, new RegExp("rainbow:democracy_" + piece));
        assert.match(script, new RegExp("event\\.create\\(DEMOCRACY_" + piece.toUpperCase() + "_ID, ['\\\"]" + piece + "['\\\"]\\)"));
        assert.match(script, new RegExp("rainbow:item/democracy_" + piece));
    }
    assert.match(script, /\.tier\(DEMOCRACY_ARMOR_TIER\)/);
});

test('democracy armor inventory icons use local rainbow textures', () => {
    const script = fs.readFileSync(armorScriptPath, 'utf8');
    const pieces = ['helmet', 'chestplate', 'leggings', 'boots'];

    for (const piece of pieces) {
        const texturePath = path.join(root, 'assets', 'rainbow', 'textures', 'item', 'democracy_' + piece + '.png');
        assert.equal(fs.existsSync(texturePath), true, 'rainbow inventory texture exists: ' + piece);
        assert.match(script, new RegExp("\\.texture\\(['\"]rainbow:item/democracy_" + piece + "['\"]\\)"));
    }
    assert.doesNotMatch(script, /mysticartifacts:item\/democracy_(helmet|chestplate|leggings|boots)/);
});

test('democracy armor replaces the old active references in gameplay and presentation data', () => {
    const hurtScript = read(path.join('startup_scripts', 'ForgeEvents', 'onBeforeNonEntityHurt.js'));
    const tooltipScript = read(path.join('client_scripts', 'tooltips.js'));
    const advancement = read(path.join('data', 'rainbow', 'advancements', 'democracy.json'));
    const recipes = read(path.join('server_scripts', 'Recipes.js'));
    const armorScript = fs.readFileSync(armorScriptPath, 'utf8');

    assert.match(hurtScript, /rainbow:democracy_chestplate/);
    assert.match(hurtScript, /rainbow:democracy_boots/);
    assert.match(hurtScript, /rainbow:democracy_helmet/);
    assert.match(hurtScript, /rainbow:democracy_leggings/);
    assert.match(tooltipScript, /rainbow:democracy_helmet/);
    assert.match(tooltipScript, /rainbow:democracy_chestplate/);
    assert.match(tooltipScript, /rainbow:democracy_leggings/);
    assert.match(tooltipScript, /rainbow:democracy_boots/);
    assert.match(advancement, /rainbow:democracy_chestplate/);
    assert.match(advancement, /rainbow:democracy_helmet/);
    assert.match(advancement, /rainbow:democracy_leggings/);
    assert.match(advancement, /rainbow:democracy_boots/);
    assert.match(recipes, /rainbow:democracy_helmet/);
    assert.match(recipes, /rainbow:democracy_chestplate/);
    assert.match(recipes, /rainbow:democracy_leggings/);
    assert.match(recipes, /rainbow:democracy_boots/);
    assert.match(armorScript, /StartupEvents\.modifyCreativeTab\(/);
    assert.match(armorScript, /mysticartifacts:democracy_helmet/);
    assert.match(armorScript, /Item\.of\(DEMOCRACY_HELMET_ID, ['"]\{Damage:0\}['"]\)/);
});

test('democracy armor render layers are copied byte-for-byte from MysticArtifacts', () => {
    const targetDir = path.join(root, 'assets', 'rainbow', 'textures', 'models', 'armor');
    const sourceDir = 'E:/Server_mod/MysticArtifacts/src/main/resources/assets/mysticartifacts/textures/models/armor';

    for (const layer of ['democracy_layer_1.png', 'democracy_layer_2.png']) {
        const targetPath = path.join(targetDir, layer);
        const sourcePath = path.join(sourceDir, layer);
        assert.equal(fs.existsSync(sourcePath), true, 'MysticArtifacts source layer exists: ' + layer);
        assert.equal(fs.existsSync(targetPath), true, 'rainbow target layer exists: ' + layer);
        assert.deepEqual(fs.readFileSync(targetPath), fs.readFileSync(sourcePath), 'layer matches source: ' + layer);
    }
});
