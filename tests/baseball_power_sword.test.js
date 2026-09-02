const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const registryPath = path.resolve(__dirname, '..', 'startup_scripts', 'Registry', 'Registry_item.js');

// 回归测试：先驱者动力剑的注册代码必须是可执行代码，不能只留在历史块注释中。
test('先驱者动力剑注册了普通形态和充能形态', () => {
    const script = fs.readFileSync(registryPath, 'utf8');
    const executableScript = script.replace(/\/\*[\s\S]*?\*\//g, '');

    assert.match(executableScript, /event\.create\("rainbow:baseball_bat",\s*"sword"\)/);
    assert.match(executableScript, /event\.create\("rainbow:baseball_power",\s*"sword"\)/);
    assert.match(executableScript, /baseball_bat[\s\S]*?attackDamageBonus\(7\.0\)/);
    assert.match(executableScript, /baseball_power[\s\S]*?attackDamageBonus\(19\.0\)/);
});
