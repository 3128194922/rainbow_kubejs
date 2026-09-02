const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('startup gene system gets AttributeModifierOperation from startup CONST', () => {
    const startupConst = read('startup_scripts/CONST.js');
    const geneScript = read('startup_scripts/gene_system/main.js');

    // 启动脚本不能依赖 server_scripts 的常量作用域。
    assert.match(
        startupConst,
        /AttributeModifierOperation\s*=\s*Java\.loadClass\(['"]net\.minecraft\.world\.entity\.ai\.attributes\.AttributeModifier\$Operation['"]\)/
    );
    assert.match(geneScript, /AttributeModifierOperation\./);
    assert.doesNotMatch(geneScript, /Java\.loadClass/);
});

test('field guide reader only uses the loaded FieldGuideServerManager name', () => {
    const reader = read('server_scripts/fieldguide_reader.js');

    // 旧的 FGServerManager 懒加载变量已被集中常量替代，不能残留调用点。
    assert.doesNotMatch(reader, /\bFGServerManager\b/);
    assert.match(reader, /FieldGuideServerManager\.getInstance\(\)/);
});
