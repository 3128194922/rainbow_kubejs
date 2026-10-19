// 执行真实神射手脚本，检查弹道落点、伤害叠乘和未发布命中事件的弹幕。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'startup_scripts', 'sharpshooter_charm', 'main.js');

class Tag {
  constructor() { this.values = new Map(); }
  putString(key, value) { this.values.set(key, value); }
  putLong(key, value) { this.values.set(key, value); }
  putDouble(key, value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError('putDouble requires a number');
    this.values.set(key, value);
  }
  getString(key) { return this.values.get(key) || ''; }
  getLong(key) { return this.values.get(key) || 0; }
  getDouble(key) { return this.values.get(key) || 0; }
}

class Vec3 {
  constructor(x, y, z) {
    if (![x, y, z].every(value => typeof value === 'number' && Number.isFinite(value))) {
      throw new TypeError('Vec3 constructor requires numeric coordinates');
    }
    this._x = x;
    this._y = y;
    this._z = z;
  }
  // Java Vec3 同名字段与方法在 Rhino 中冲突；脚本必须调用方法取得数字。
  x() { return this._x; }
  y() { return this._y; }
  z() { return this._z; }
}

class Projectile {
  constructor(owner, y, velocityY = 0) {
    this.owner = owner;
    this.y = y;
    this.velocityY = velocityY;
    this.tag = new Tag();
    this.level = { isClientSide: () => false, getTime: () => 100 };
  }
  getOwner() { return this.owner; }
  getPersistentData() { return this.tag; }
  getX() { return 0; }
  getY() { return this.y; }
  getZ() { return 0; }
  getDeltaMovement() { return new Vec3(0, this.velocityY, 5); }
}

class AbstractArrow extends Projectile {}

function loadScript() {
  const handlers = new Map();
  const particles = [];
  const context = vm.createContext({
    console,
    global: { sendParticleText: (...args) => { particles.push(args); return true; } },
    Vec3,
    Projectile,
    AbstractArrow,
    DamageTypeTags: { IS_PROJECTILE: 'projectile' },
    ForgeEvents: { onEvent: (name, callback) => handlers.set(name, callback) },
    hasCurios: (player, id) => player.charm && id === 'rainbow:sharpshooter_charm',
    hasContextCurio: (damageContext, role, player, id) => player.charm && id === 'rainbow:sharpshooter_charm',
  });
  if (fs.existsSync(scriptPath)) {
    vm.runInContext(fs.readFileSync(scriptPath, 'utf8'), context, { filename: scriptPath });
  }
  return { context, handlers, particles };
}

function makeScene(hitY, options = {}) {
  const shooter = {
    charm: options.charm !== false,
    isPlayer: () => true,
    getX: () => 0,
    getY: () => 0,
    getZ: () => 0,
  };
  const target = {
    getUuid: () => 'target-1',
    getX: () => 0,
    getY: () => 0,
    getZ: () => 10,
    getEyeHeight: () => 1.6,
    getEyeY: () => 1.6,
    isAlive: () => true,
    getBoundingBox: () => ({
      contains: point => Math.abs(point.x()) <= 0.5 && point.y() >= 0 && point.y() <= 2 && Math.abs(point.z() - 10) <= 0.5,
      clip: (start, end) => {
        if (Math.abs(start.x()) > 0.5 || Math.abs(end.x()) > 0.5) return { orElse: () => null };
        if (end.z() < 9.5 && start.z() < 9.5) return { orElse: () => null };
        const ratio = (9.5 - start.z()) / (end.z() - start.z());
        if (ratio < 0 || ratio > 1) return { orElse: () => null };
        const point = new Vec3(0, start.y() + ratio * (end.y() - start.y()), 9.5);
        return { orElse: () => point.y() >= 0 && point.y() <= 2 ? point : null };
      },
    }),
    level: { isClientSide: () => false, getTime: () => 100 },
  };
  const projectile = options.arrow
    ? new AbstractArrow(shooter, hitY, options.velocityY || 0)
    : new Projectile(shooter, hitY, options.velocityY || 0);
  if (options.projectileZ != null) projectile.getZ = () => options.projectileZ;
  const source = {
    actual: shooter,
    immediate: projectile,
    is: tag => tag === 'projectile',
  };
  const event = {
    amount: 10,
    getAmount() { return this.amount; },
    setAmount(value) { this.amount = value; },
  };
  return { shooter, target, projectile, source, event, context: { attacker: shooter, isRangeDamage: true } };
}

test('命中事件中的头部落点触发伤害加成，并在目标头部显示红色爆头文字', () => {
  // 射手距目标 10 格：基础 10 点伤害按 1 + 10 × 10% 结算为 20 点。
  const { context, handlers, particles } = loadScript();
  assert.equal(typeof context.applySharpshooterDamage, 'function');
  const scene = makeScene(0);
  const callback = handlers.get('net.minecraftforge.event.entity.ProjectileImpactEvent');
  assert.equal(typeof callback, 'function');
  callback({
    getProjectile: () => scene.projectile,
    getRayTraceResult: () => ({ getType: () => 'ENTITY', getEntity: () => scene.target, getLocation: () => new Vec3(0, 1.6, 9.5) }),
  });
  context.applySharpshooterDamage(scene.event, scene.shooter, scene.target, scene.source, scene.context);
  assert.equal(scene.event.amount, 20);
  assert.equal(particles.length, 1);
  assert.equal(particles[0][0], scene.target);
  assert.equal(particles[0][4], '爆头！');
  assert.equal(particles[0][5], 0xFF0000);
  assert.ok(particles[0][2] > scene.target.getEyeY());
});

test('原版弓箭命中结果给的是目标脚下坐标时，仍按箭轨迹判定爆头', () => {
  const { context, handlers, particles } = loadScript();
  const scene = makeScene(1.6, { projectileZ: 8, arrow: true });
  handlers.get('net.minecraftforge.event.entity.ProjectileImpactEvent')({
    getProjectile: () => scene.projectile,
    getRayTraceResult: () => ({
      getType: () => 'ENTITY',
      getEntity: () => scene.target,
      getLocation: () => new Vec3(0, 0, 10),
    }),
  });
  context.applySharpshooterDamage(scene.event, scene.shooter, scene.target, scene.source, scene.context);
  assert.equal(scene.event.amount, 20);
  assert.equal(particles.length, 1);
});

test('原版弓箭射中身体时，即使命中结果仍是脚下坐标也不触发爆头', () => {
  const { context, handlers, particles } = loadScript();
  const scene = makeScene(0.8, { projectileZ: 8, arrow: true });
  handlers.get('net.minecraftforge.event.entity.ProjectileImpactEvent')({
    getProjectile: () => scene.projectile,
    getRayTraceResult: () => ({
      getType: () => 'ENTITY',
      getEntity: () => scene.target,
      getLocation: () => new Vec3(0, 0, 10),
    }),
  });
  context.applySharpshooterDamage(scene.event, scene.shooter, scene.target, scene.source, scene.context);
  assert.equal(scene.event.amount, 10);
  assert.equal(particles.length, 0);
});

test('身体命中不触发爆头、距离增伤或爆头文字', () => {
  const { context, handlers, particles } = loadScript();
  const scene = makeScene(1.6, { projectileZ: 8 });
  handlers.get('net.minecraftforge.event.entity.ProjectileImpactEvent')({
    getProjectile: () => scene.projectile,
    getRayTraceResult: () => ({ getType: () => 'ENTITY', getEntity: () => scene.target, getLocation: () => new Vec3(0, 0.8, 9.5) }),
  });
  context.applySharpshooterDamage(scene.event, scene.shooter, scene.target, scene.source, scene.context);
  assert.equal(scene.event.amount, 10);
  assert.equal(particles.length, 0);
});

test('未发布命中事件时，用可追溯弹幕的轨迹判定头部', () => {
  const { context } = loadScript();
  const scene = makeScene(1.6, { projectileZ: 8 });
  context.applySharpshooterDamage(scene.event, scene.shooter, scene.target, scene.source, scene.context);
  assert.equal(scene.event.amount, 20);
});

test('未佩戴护符或没有可追溯弹幕时，不产生爆头倍率', () => {
  const { context } = loadScript();
  const withoutCharm = makeScene(1.6, { charm: false, projectileZ: 8 });
  context.applySharpshooterDamage(withoutCharm.event, withoutCharm.shooter, withoutCharm.target, withoutCharm.source, withoutCharm.context);
  assert.equal(withoutCharm.event.amount, 10);
  const noProjectile = makeScene(1.6);
  noProjectile.source.immediate = null;
  context.applySharpshooterDamage(noProjectile.event, noProjectile.shooter, noProjectile.target, noProjectile.source, noProjectile.context);
  assert.equal(noProjectile.event.amount, 10);
});

test('伤害源未提供攻击者时，仍可沿弹幕所有者追溯到佩戴者', () => {
  const { context } = loadScript();
  const scene = makeScene(1.6, { projectileZ: 8 });
  scene.source.actual = null;
  scene.context.attacker = null;
  context.applySharpshooterDamage(scene.event, null, scene.target, scene.source, scene.context);
  assert.equal(scene.event.amount, 20);
});

test('缓存中的旧命中点不覆盖本次轨迹判定', () => {
  const { context, handlers } = loadScript();
  const scene = makeScene(0.8, { projectileZ: 8 });
  handlers.get('net.minecraftforge.event.entity.ProjectileImpactEvent')({
    getProjectile: () => scene.projectile,
    getRayTraceResult: () => ({ getType: () => 'ENTITY', getEntity: () => scene.target, getLocation: () => new Vec3(0, 1.6, 9.5) }),
  });
  scene.projectile.level.getTime = () => 101;
  context.applySharpshooterDamage(scene.event, scene.shooter, scene.target, scene.source, scene.context);
  assert.equal(scene.event.amount, 10);
});

test('模组弹幕不继承 Projectile 时，伤害类型标签仍可启用轨迹判定', () => {
  const { context } = loadScript();
  const scene = makeScene(1.6, { projectileZ: 8 });
  const original = scene.projectile;
  scene.source.immediate = {
    level: original.level,
    getX: () => original.getX(),
    getY: () => original.getY(),
    getZ: () => original.getZ(),
    getDeltaMovement: () => original.getDeltaMovement(),
    getPersistentData: () => original.getPersistentData(),
  };
  context.applySharpshooterDamage(scene.event, scene.shooter, scene.target, scene.source, scene.context);
  assert.equal(scene.event.amount, 20);
});

test('可追溯弹幕爆头后获得距离增伤，不依赖旧远程伤害分类', () => {
  const { context } = loadScript();
  const scene = makeScene(1.6, { projectileZ: 8 });
  scene.context.isRangeDamage = false;
  context.applySharpshooterDamage(scene.event, scene.shooter, scene.target, scene.source, scene.context);
  assert.equal(scene.event.amount, 20);
});

test('爆头距离超过20格时增伤倍率封顶为3倍', () => {
  // 射手距目标 30 格，但倍率只按前 20 格计算。
  const { context } = loadScript();
  const scene = makeScene(1.6, { projectileZ: 8 });
  scene.shooter.getZ = () => -20;
  context.applySharpshooterDamage(scene.event, scene.shooter, scene.target, scene.source, scene.context);
  assert.equal(scene.event.amount, 30);
});
