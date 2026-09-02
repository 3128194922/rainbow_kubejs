const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const scriptPath = path.resolve(__dirname, '..', 'server_scripts', 'pet_system', 'MobTameServer.js');

// 回归测试：Java.loadClass 得到的 AABB 必须使用六参数构造器创建视线扫描盒。
test('远程宠物控制使用兼容 Java AABB 构造器', () => {
    const script = fs.readFileSync(scriptPath, 'utf8');

    assert.match(script, /new AABB\(eyePos\.x\(\), eyePos\.y\(\), eyePos\.z\(\), end\.x\(\), end\.y\(\), end\.z\(\)\)/);
    assert.doesNotMatch(script, /AABB\.of\(eyePos\.x\(\), eyePos\.y\(\), eyePos\.z\(\), end\.x\(\), end\.y\(\), end\.z\(\)\)/);
});
