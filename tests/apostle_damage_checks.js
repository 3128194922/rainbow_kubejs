// 验证真实注册回调 → 服务端伤害函数；重复调用可暴露 Rhino 局部 const 初始化异常。
apostleTestAttributeEvents.forEach(callback => callback({ create: (id, callback) => {
    callback({ add: (name, value) => apostleTestAttributes.push([name, value]) });
} }));
apostleTestAssert(apostleTestAttributes.length == 5, '默认属性必须成功注册五项');
const apostleTestLevel = { isClientSide: () => false };
const apostleTestOwner = {
    isAlive: () => true, getType: () => 'rainbow:apostle', getId: () => 1,
    damageSources: () => ({ mobAttack: owner => ({ owner: owner }) })
};
function apostleTestTarget() {
    let tag = apostleTestTag();
    let target = new Player();
    target.health = 20;
    target.isAlive = () => true;
    target.getType = () => 'minecraft:player';
    target.getId = () => 2;
    target.getPersistentData = () => tag;
    target.isSpectator = () => false;
    target.isCreative = () => false;
    target.getHealth = () => target.health;
    target.attack = (source, amount) => { target.health -= amount; return true; };
    return target;
}
function apostleTestHit(target, amount, owner, client) {
    let tag = apostleTestTag();
    tag.putDouble('apostleDamage', amount);
    let projectile = {
        discarded: false,
        getLevel: () => client ? { isClientSide: () => true } : apostleTestLevel,
        getOwner: () => owner, getPersistentData: () => tag,
        discard: () => { projectile.discarded = true; }
    };
    apostleTestBuilders['rainbow:apostle_bullet'].callbacks.onHitEntity({ entity: projectile, result: { getEntity: () => target } });
    return projectile;
}
const apostleTestVictim = apostleTestTarget();
for (let hit = 0; hit < 3; hit++) {
    apostleTestAssert(apostleTestHit(apostleTestVictim, 2, apostleTestOwner, false).discarded, '命中后应清理弹幕');
}
apostleTestAssert(apostleTestVictim.health == 14, '三次命中应各扣 2 点');
apostleTestHit(apostleTestVictim, 5, apostleTestOwner, false);
apostleTestAssert(apostleTestVictim.health == 9, '冲击波弹应扣 5 点');
apostleTestHit(apostleTestVictim, 0, apostleTestOwner, false);
apostleTestAssert(apostleTestVictim.health == 7, '旧弹幕无伤害标签时默认 2 点');
apostleTestHit(apostleTestVictim, 2, apostleTestOwner, true);
apostleTestHit(apostleTestVictim, 2, null, false);
apostleTestVictim.getPersistentData().putLong('apostleFaction', 1);
apostleTestHit(apostleTestVictim, 2, apostleTestOwner, false);
apostleTestAssert(apostleTestVictim.health == 7, '客户端、无主人弹幕和同阵营不得扣血');
apostleTestVictim.getPersistentData().putLong('apostleFaction', 0);
apostleTestVictim.isCreative = () => true;
apostleTestHit(apostleTestVictim, 2, apostleTestOwner, false);
apostleTestAssert(apostleTestVictim.health == 7, '创造模式不得扣血');
apostleTestVictim.isCreative = () => false;
apostleTestVictim.isSpectator = () => true;
apostleTestHit(apostleTestVictim, 2, apostleTestOwner, false);
apostleTestAssert(apostleTestVictim.health == 7, '旁观模式不得扣血');
apostleTestVictim.isSpectator = () => false;
apostleTestVictim.attack = () => false;
apostleTestHit(apostleTestVictim, 2, apostleTestOwner, false);
apostleTestAssert(apostleTestVictim.health == 7, '无敌帧或伤害事件拒伤时不得强制扣血');
apostleTestAssert(apostleTestLogs.some(message => message.indexOf('伤害未扣除生命值') >= 0), '拒伤应保留诊断日志');
apostleTestAssert(!apostleTestLogs.some(message => message.indexOf('异常') >= 0), '所有命中回调不得出现异常');
