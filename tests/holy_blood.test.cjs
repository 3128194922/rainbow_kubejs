// 圣主之血火焰易伤强制附着：MobEffectImmuneEvent 处理逻辑与 main.js 注册冒烟测试。
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');

const ctx = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'startup_scripts/ForgeEvents/handleHolyBlood.js'), 'utf8'), ctx);

test('火焰易伤强制附着，其他药水的免疫判定不受影响', () => {
    let forceApply = null;
    // getEffectId() 在游戏内返回 Java String，这里分别用 JS 字符串与 toString 包装对象模拟。
    const jsStringEvent = { getEffectId: () => 'rainbow:fire_vulnerability', setForceApply: v => forceApply = v };
    ctx.handleHolyBloodForceAttach(jsStringEvent);
    assert.equal(forceApply, true);

    forceApply = null;
    const javaStringEvent = { getEffectId: () => ({ toString: () => 'rainbow:fire_vulnerability' }), setForceApply: v => forceApply = v };
    ctx.handleHolyBloodForceAttach(javaStringEvent);
    assert.equal(forceApply, true);

    forceApply = null;
    ctx.handleHolyBloodForceAttach({ getEffectId: () => 'minecraft:poison', setForceApply: v => forceApply = v });
    assert.equal(forceApply, null);

    forceApply = null;
    ctx.handleHolyBloodForceAttach({ getEffectId: () => 'rainbow:fire_vulnerability_x', setForceApply: v => forceApply = v });
    assert.equal(forceApply, null);
});

test('药水免疫实体场景：isOriginalAllowed 为 false 时同样强制附着', () => {
    let forceApply = null;
    const immuneEvent = {
        getEntityTypeId: () => 'cataclysm:the_harbinger',
        getEffectId: () => 'rainbow:fire_vulnerability',
        isOriginalAllowed: () => false,
        setForceApply: v => forceApply = v
    };
    ctx.handleHolyBloodForceAttach(immuneEvent);
    assert.equal(forceApply, true);
});

test('anka Boss 场景：MobEffectHighPriorityEvent（覆写 addEffect 门控）同样强制附着', () => {
    // vzling BossEntity 覆写 addEffect 丢弃有害效果，LivingEntity 路径不触发，
    // 只会回传 MobEffectHighPriorityEvent（无 isOriginalAllowed，带 getSource）。
    let forceApply = null;
    const ankaEvent = {
        getEntityTypeId: () => 'anka_mobs:ancient_wraith',
        getEffectId: () => 'rainbow:fire_vulnerability',
        getSource: () => null,
        setForceApply: v => forceApply = v
    };
    ctx.handleHolyBloodForceAttach(ankaEvent);
    assert.equal(forceApply, true);
});

test('ForgeEvents/main.js 双事件均已注册且旧 CanBeAffectedEvent 监听已移除', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'startup_scripts/ForgeEvents/main.js'), 'utf8');
    assert.ok(src.includes("com.morecallback.event.MobEffectHighPriorityEvent"));
    assert.ok(src.includes("com.morecallback.event.MobEffectImmuneEvent"));
    assert.ok(src.includes('handleHolyBloodForceAttach'));
    // 新版 morecallback 中免疫实体在 addEffect 头部即被拒，旧事件不会触发，注册必须已迁移。
    assert.ok(!src.includes("com.morecallback.event.CanBeAffectedEvent"));
});
