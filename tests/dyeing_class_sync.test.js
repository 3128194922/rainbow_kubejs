const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('Dyeing cleanup only references classes present in the current mod build', () => {
    const serverConst = read('server_scripts/CONST.js');
    const cleanupScript = read('server_scripts/dyeing/main.js');

    // BillboardSavedData 已从当前 Dyeing 模组删除，清理脚本不能继续依赖旧类。
    assert.doesNotMatch(serverConst, /BillboardSavedData/);
    assert.doesNotMatch(cleanupScript, /BillboardSavedData|billboardResult|公告板/);
    assert.match(cleanupScript, /DyeingMod\.getScreenOverlayData\(server\)/);

    // 清理函数需要服务器对象来判断实体白名单，所有调用点都必须显式传入。
    assert.match(cleanupScript, /clearDyeingEntries\(DyeingMod\.getPaintData\(server\), server\)/);
    assert.match(cleanupScript, /clearDyeingEntries\(DyeingMod\.getUVData\(server\), server\)/);
    assert.match(cleanupScript, /clearDyeingEntries\(DyeingMod\.getAreaPaintData\(server\), server\)/);
    assert.match(cleanupScript, /clearDyeingEntries\(DyeingMod\.getScreenOverlayData\(server\), server\)/);
});
