// 本地 KubeJS 将 getYRot 映射为 getYaw；替身只暴露脚本实际可见的方法。
const apostleTestShots = [];
const apostleTestLook = [];
const apostleTestCasts = [];
const apostleTestStops = [];
const apostleTestCastData = apostleTestTag();
const apostleTestCaster = {
    getYaw: () => 90, getX: () => 0, getY: () => 0, getZ: () => 0, getBbHeight: () => 1.95,
    getPersistentData: () => apostleTestCastData,
    getLookControl: () => ({ setLookAt: (x, y, z) => apostleTestLook.push([x, y, z]) }),
    getNavigation: () => ({ stop: () => {}, moveTo: (x, y, z, speed) => apostleTestLook.push([x, y, z]) }),
    triggerAnim: (controller, trigger) => apostleTestCasts.push([controller, trigger]),
    stopTriggeredAnimation: (controller, trigger) => apostleTestStops.push([controller, trigger])
};
const apostleTestOriginalCreateBullet = apostleCreateBullet;
apostleCreateBullet = (owner, x, y, z, dx, dy, dz) => apostleTestShots.push([dx, dy, dz]);
apostleMoveSpiral(apostleTestCaster, apostleTestCastData, 0);
apostleTestAssert(apostleTestShots.length == 2, '螺旋开招必须实际生成两臂弹幕');
apostleTestAssert(apostleTestShots.every(shot => shot.every(Number.isFinite)), '弹幕向量必须是有限数值');
apostleTestAssert(Math.abs(apostleTestShots[0][0] + apostleTestShots[1][0]) < 0.000001, '两臂 X 方向必须相反');
apostleTestAssert(Math.abs(apostleTestShots[0][2] + apostleTestShots[1][2]) < 0.000001, '两臂 Z 方向必须相反');
apostleUpdateSpacing(apostleTestCaster, apostleTestCaster, 0);
apostleTestAssert(apostleTestLook.length == 2, '重合位置仍能计算退避路径');
apostleCreateBullet = apostleTestOriginalCreateBullet;
for (let move = 1; move <= 13; move++) {
    apostleBeginCast(apostleTestCaster, apostleTestCastData, move);
    let controller = apostleTestBuilders['rainbow:apostle'].controllers['apostle_move_' + move];
    apostleTestAssert(controller != null, '招式 ' + move + ' 缺少动作控制器');
    apostleTestAssert(apostleTestCasts[move - 1][0] == 'apostle_move_' + move, '服务端应触发当前招式动作');
    apostleTestAssert(apostleTestCasts[move - 1][1] == controller.trigger, '动画触发 ID 必须匹配');
}
apostleStopCastAnimation(apostleTestCaster, 13);
apostleTestAssert(apostleTestStops[0][0] == 'apostle_move_13', '中断应停止当前动画');
apostleTestAssert(!apostleTestLogs.some(message => message.indexOf('异常') >= 0), '动作和螺旋回调不得出现异常');
