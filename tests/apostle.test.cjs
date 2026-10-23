// Node 验证脚本行为与资源一致性；Rhino 声明兼容性另由 apostle_rhino_test.ps1 执行实际引擎检查。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
function harness() {
  const context = vm.createContext({});
  for (const file of ['tests/apostle_harness.js', 'startup_scripts/apostle/main.js', 'server_scripts/apostle/main.js']) {
    vm.runInContext(read(file), context, { filename: file });
  }
  return context;
}
test('registered projectile hit callback applies damage and respects target exclusions', () => {
  vm.runInContext(read('tests/apostle_damage_checks.js'), harness());
});
test('spiral uses mapped yaw API and all 13 skills trigger matching controllers', () => {
  vm.runInContext(read('tests/apostle_actions_checks.js'), harness());
});
test('active action suppresses walking; idle/move resume once action ends', () => {
  const context = harness();
  vm.runInContext(`
    let active = true;
    let moving = true;
    let played = '';
    let animationEvent = {
      getEntity: () => ({ getId: () => 1, getAnimatableInstanceCache: () => ({
        getManagerForId: () => ({ getAnimationControllers: () => ({
          get: name => ({ isPlayingTriggeredAnimation: () => active && name == 'apostle_move_7' })
        }) })
      }) }),
      isMoving: () => moving, thenLoop: name => { played = name; }
    };
    let callback = apostleTestBuilders['rainbow:apostle'].controllers.apostle_locomotion.callback;
    apostleTestAssert(callback(animationEvent) == false && played == '', '施法时停止步态');
    active = false;
    apostleTestAssert(callback(animationEvent) == true && played == 'animation.apostle.move', '恢复移动');
    moving = false;
    apostleTestAssert(callback(animationEvent) == true && played == 'animation.apostle.idle', '恢复待机');
  `, context);
});
test('target loss and natural completion stop the correct action on the server', () => {
  const context = harness();
  vm.runInContext(read('tests/apostle_actions_checks.js'), context);
  vm.runInContext(`
    apostleTestCaster.getLevel = () => ({ isClientSide: () => false });
    apostleTestCaster.getTarget = () => null;
    apostleTestCastData.putLong('apostleAge', 1);
    global.apostleTick(apostleTestCaster);
    apostleTestAssert(apostleTestCastData.getLong('apostleState') == 0, '目标失效收招');
    apostleTestAssert(apostleTestStops.length == 2, '目标失效停止动画');
    global.apostleIsValidTarget = () => true;
    apostleTestCaster.getTarget = () => apostleTestCaster;
    apostleCastTick = () => {};
    apostleTestCastData.putLong('apostleState', 1);
    apostleTestCastData.putLong('apostleMove', 7);
    apostleTestCastData.putLong('apostleMoveTick', 69);
    global.apostleTick(apostleTestCaster);
    apostleTestAssert(apostleTestCastData.getLong('apostleState') == 0, '到时结束');
    apostleTestAssert(apostleTestStops[2][0] == 'apostle_move_7', '自然结束停止当前动作');
  `, context);
});
test('all registered action resources exist and exactly match skill durations', () => {
  const context = harness();
  const controllers = vm.runInContext("apostleTestBuilders['rainbow:apostle'].controllers", context);
  const durations = vm.runInContext('APOSTLE_MOVE_DURATION', context);
  const animations = JSON.parse(read('assets/rainbow/animations/entity/apostle.animation.json')).animations;
  for (let move = 1; move <= 13; move++) {
    const info = controllers['apostle_move_' + move];
    assert.ok(animations[info.animation], `missing ${info.animation}`);
    assert.equal(animations[info.animation].animation_length * 20, durations[move], info.animation);
    assert.notEqual(animations[info.animation].loop, true);
  }
});
test('animation bones exist, keys stay within duration and every action returns to neutral', () => {
  const animations = JSON.parse(read('assets/rainbow/animations/entity/apostle.animation.json')).animations;
  const geometry = JSON.parse(read('assets/rainbow/geo/entity/apostle.geo.json'))['minecraft:geometry'][0];
  const bones = new Set(geometry.bones.map(bone => bone.name));
  for (const [name, animation] of Object.entries(animations)) {
    for (const [bone, channels] of Object.entries(animation.bones)) {
      assert.ok(bones.has(bone), `${name}: unknown bone ${bone}`);
      for (const [channel, track] of Object.entries(channels)) {
        const entries = Array.isArray(track) ? [[0, track]] : Object.entries(track).sort((a,b) => Number(a[0])-Number(b[0]));
        for (const [time, value] of entries) {
          assert.ok(Number.isFinite(Number(time)) && Number(time) <= animation.animation_length, `${name}: bad timestamp`);
          const vector = value.post || value;
          assert.ok(vector.length == 3 && vector.every(Number.isFinite), `${name}: invalid vector`);
        }
        if (!animation.loop) {
          const value = entries.at(-1)[1];
          assert.deepEqual(value.post || value, channel === 'scale' ? [1,1,1] : [0,0,0], `${name}: ${bone}.${channel} must reset`);
        }
      }
    }
  }
});
test('Blockbench project contains exactly the exported animation IDs and matching durations', () => {
  const model = JSON.parse(read('model_sources/apostle/apostle.bbmodel'));
  const exported = JSON.parse(read('assets/rainbow/animations/entity/apostle.animation.json')).animations;
  assert.deepEqual(model.animations.map(a=>a.name).sort(), Object.keys(exported).sort());
  for (const animation of model.animations) assert.equal(animation.length, exported[animation.name].animation_length);
});
