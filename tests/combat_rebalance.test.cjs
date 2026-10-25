// 执行实际玩法函数；替身仅模拟 Forge/实体边界，验证公式与派生行为。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load(file, ctx) { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, {filename:file}); }
function harness() {
  const hooks = {};
  const ctx = vm.createContext({console, global:{}, ForgeEvents:{onEvent:(id, fn) => {hooks[id]=fn;}},
    hasCurios:(e,id) => e.curios.includes(id),
    hasContextCurio:(c,r,e,id) => e != null && e.curios.includes(id),
    getUnholyCrossLastHurtField:() => ({getFloat:e=>e.lastHurt,setFloat:(e,v)=>{e.lastHurt=v;}}),
    DamageTypeTags:{IS_PROJECTILE:'projectile'},
    ResourceLocation:class {constructor(a,b){this.id=b?`${a}:${b}`:a;} toString(){return this.id;}},
    Registries:{DAMAGE_TYPE:'damage'}, ResourceKey:{create:(r,id)=>String(id)},
    DamageSource:class {constructor(holder,direct,actual){this.id=holder;this.direct=direct;this.actual=actual;} getType(){return this.id.split(':')[1];} equals(o){return this===o;}},
  });
  load('startup_scripts/combat_rebalance/main.js',ctx);
  return {ctx,hooks};
}
function entity(id='victim') {
  const e={id,curios:[],health:100,lastHurt:9,invulnerableTime:17,hits:[],attrs:{},
    isPlayer:()=>id==='player',isLiving:()=>true,isAlive:()=>e.health>0,
    getUuid:()=>id,getId:()=>id,getX:()=>0,getY:()=>0,getZ:()=>0,
    getAttributeValue:key=>e.attrs[key] || 0,
    getActiveEffects:()=>e.effects || [],getTeam:()=>null,getOwner:()=>null,
    cooldowns:{isOnCooldown:()=>false,addCooldown:()=>{}},
    boundingBox:{inflate:()=>({})},
  };
  e.level={isClientSide:()=>false,registryAccess:()=>({registryOrThrow:()=>({getHolderOrThrow:x=>x})}),getEntitiesWithin:()=>[]};
  e.attack=(source,amount)=>{e.hits.push({source,amount});e.lastHurt=amount;e.health-=amount;return true;};
  return e;
}
test('神圣十字架以20点预算产生8/8/4，原事件归零且无敌帧/lastHurt恢复',()=>{
  const {ctx}=harness(),a=entity('player'),v=entity();a.curios=['rainbow:holy_cross'];
  const ev={amount:20,getAmount(){return this.amount;},setAmount(x){this.amount=x;}};
  assert.equal(ctx.rebalanceSplitDamage(ev,a,v,{},null),true);
  assert.equal(ev.amount,0);assert.deepEqual(v.hits.map(x=>x.amount),[8,8,4]);
  assert.equal(v.invulnerableTime,17);assert.equal(v.lastHurt,9);
});
test('异常子伤害也必须恢复伤害链、无敌帧和lastHurt',()=>{
  const {ctx}=harness(),a=entity('player'),v=entity();v.attack=()=>{v.lastHurt=1;throw Error('fixture');};
  assert.equal(ctx.rebalanceDealDamage(a,v,'holy_true',4,'holy',null),false);
  assert.equal(v.invulnerableTime,17);assert.equal(v.lastHurt,9);
  assert.equal(ctx.rebalanceActiveHit(v,null),null);
});
test('派生矩阵单向终止，同时允许神圣三段各触发亵渎',()=>{
  const {ctx}=harness();
  for(const kind of ['root','holy','kinetic','lpecac']) assert.equal(ctx.rebalanceCanProc(kind,'unholy'),true);
  for(const proc of ['holy','kinetic','lpecac','unholy']) assert.equal(ctx.rebalanceCanProc('unholy',proc),false);
  assert.equal(ctx.rebalanceCanProc('lpecac','kinetic'),false);
  assert.equal(ctx.rebalanceCanProc('kinetic','lpecac'),true);
});
test('中毒III与凋零II为3.5倍，单一DOT与普通magic攻击不增幅',()=>{
  const {ctx}=harness(),v=entity();
  const effect=(id,n,duration)=>({getDescriptionId:()=>id,getAmplifier:()=>n-1,getDuration:()=>duration});
  v.effects=[effect('effect.minecraft.poison',3,250),effect('effect.minecraft.wither',2,400)];
  const poisonSource={getMsgId:()=> 'magic',getType:()=> 'magic'};
  assert.equal(ctx.rebalanceDotMultiplier(v,poisonSource,null),3.5);
  assert.equal(ctx.rebalanceDotMultiplier(v,poisonSource,entity('attacker')),1);
  v.effects.pop();assert.equal(ctx.rebalanceDotMultiplier(v,poisonSource,null),1);
});
test('雷电瓶连锁zap不参与分裂，三种类型串形态全识别且无误判',()=>{
  const {ctx}=harness(),a=entity('player'),v=entity();
  for(const t of ['death.attack.mysticartifacts.lightning_bottle_chain','mysticartifacts:lightning_bottle_chain','lightning_bottle_chain']){
    const context={damageType:t};
    assert.equal(ctx.rebalanceIsBottleZap(context),true);
    const ev={amount:20,getAmount(){return this.amount;},setAmount(x){this.amount=x;}};
    assert.equal(ctx.rebalanceSplitDamage(ev,a,v,{},context),false);
    assert.equal(ev.amount,20);
  }
  assert.equal(ctx.rebalanceIsBottleZap({damageType:'lightningBolt'}),false);
  assert.equal(ctx.rebalanceIsBottleZap({damageType:'player'}),false);
  assert.equal(ctx.rebalanceIsBottleZap(null),false);
});
test('zap不进入派生入口，普通root仍触发kinetic派生',()=>{
  const {ctx}=harness(),a=entity('player'),v=entity();
  a.curios=['rainbow:ice_tea'];a.attrs['oreganized:kinetic_damage']=10;
  const mkEv=()=>({amount:5,getAmount(){return this.amount;},setAmount(x){this.amount=x;}});
  ctx.rebalanceProcDamage(mkEv(),a,v,{},null);
  assert.equal(v.hits.length,1);
  ctx.rebalanceProcDamage(mkEv(),a,v,{},{damageType:'death.attack.mysticartifacts.lightning_bottle_chain'});
  assert.equal(v.hits.length,1);
});
test('最终分摊20点时本人15、队友共5；无队友时保留20',()=>{
  const {ctx}=harness(),v=entity('player'),b=entity('b'),c=entity('c');v.curios=['rainbow:ancientaegis'];
  ctx.global.getAncientAegisDamageTargets=()=>[b,c];
  const ev={amount:20,getAmount(){return this.amount;},setAmount(x){this.amount=x;}};
  ctx.rebalanceShareDamage(ev,v,{getType:()=> 'player'},null);
  assert.equal(ev.amount,15);assert.equal(b.hits[0].amount,2.5);assert.equal(c.hits[0].amount,2.5);
  ctx.global.getAncientAegisDamageTargets=()=>[];ev.amount=20;
  ctx.rebalanceShareDamage(ev,v,{getType:()=> 'player'},null);assert.equal(ev.amount,20);
});
test('转移失败份额返还本人，古圣头骨接收债务视为成功',()=>{
  const {ctx}=harness(),v=entity('player'),b=entity('b');v.curios=['rainbow:ancientaegis'];
  ctx.global.getAncientAegisDamageTargets=()=>[b];b.attack=()=>false;
  const ev={amount:20,getAmount(){return this.amount;},setAmount(x){this.amount=x;}};
  ctx.rebalanceShareDamage(ev,v,{getType:()=> 'player'},null);assert.equal(ev.amount,20);
  b.curios=['rainbow:ancient_skull'];b.nbtDebt=0;ctx.rebalanceReadDebt=e=>e.nbtDebt;
  b.attack=(s,n)=>{b.nbtDebt+=n;return false;};
  ctx.rebalanceShareDamage(ev,v,{getType:()=> 'player'},null);assert.equal(ev.amount,15);
});
test('适应首次放行，记录后I/II/III只减25%/50%/75%，容量最高3',()=>{
  for(const rank of [1,2,3]){
    const {ctx}=harness(),v=entity(),data=new Map([['isMiniBoss',true],['_mb_p_Adapt',true],['_mb_lvl_Adapt',rank]]);
    v.persistentData={getBoolean:k=>data.get(k)===true,getInt:k=>data.get(k)||0,getString:k=>data.get(k)||'',putString:(k,x)=>data.set(k,x)};
    load('startup_scripts/mini_boss_system/damage.js',ctx);
    const ev={amount:100,getAmount(){return this.amount;},setAmount(x){this.amount=x;}};
    ctx.handleMiniBossPowers(ev,null,v,{getType:()=> 'arrow'});assert.equal(ev.amount,100);
    ctx.handleMiniBossPowers(ev,null,v,{getType:()=> 'arrow'});assert.equal(ev.amount,100*(1-rank*.25));
    for(const kind of ['magic','fire','fall']) ctx.mbRecordAdaptDamage(v,{getType:()=>kind});
    assert.equal(JSON.parse(data.get('_mb_adapt_types')).length,rank);
  }
});
test('寻友护符每名在线玩家增加5%的挖掘/经验/受到治疗',()=>{
  const {ctx}=harness(),attrs=[];ctx.StartupEvents={registry:()=>{}};
  load('startup_scripts/accessory_rebalance/main.js',ctx);
  ctx.rebalanceFriendAttributes({slotContext:{entity:()=>({server:{players:{size:()=>4}}})},modify:(...x)=>attrs.push(x)});
  assert.deepEqual(attrs.map(x=>[x[0],x[2],x[3]]),[
    ['attributeslib:mining_speed',.2,'multiply_total'],['attributeslib:experience_gained',.2,'multiply_total'],['attributeslib:healing_received',.2,'multiply_total']]);
});
test('无法被索敌buff拒绝新目标且不会被隐匿监听反向标成暴露',()=>{
  const {ctx,hooks}=harness(),p=entity('player');let state=true;
  p.hasEffect=id=>id==='rainbow:invisible';p.getLevel=()=>p.level;
  ctx.global.getStealthState=()=>state;ctx.global.setStealthState=(e,x)=>{state=x;};
  load('startup_scripts/stealth_system/main.js',ctx);
  // 已有脚本会覆盖读写函数，因此用持久数据验证真实状态写入。
  const data=new Map();p.persistentData={contains:k=>data.has(k),getBoolean:k=>data.get(k)||false,putBoolean:(k,x)=>data.set(k,x)};
  let newTarget=p;
  hooks['net.minecraftforge.event.entity.living.LivingChangeTargetEvent']({getNewTarget:()=>newTarget,setNewTarget:x=>{newTarget=x;}});
  assert.equal(newTarget,null);assert.equal(ctx.global.getStealthState(p),true);
});
test('死亡Clone恢复失效cap后复制完整队伍、记分板和同步，finally再次失效原cap',()=>{
  const {ctx,hooks}=harness();let revived=false,initialized=false,joined=null;
  const old={data:{color:'red',pvp:true,extra:42}},fresh={data:{copy:x=>Object.assign(fresh.data,x)},init:()=>{initialized=true;}};
  const original={reviveCaps:()=>{revived=true;},invalidateCaps:()=>{revived=false;}};
  const player={level:{isClientSide:()=>false},getScoreboardName:()=> 'Alice',server:{getScoreboard:()=>({getPlayerTeam:n=>n,addPlayerToTeam:(n,t)=>{joined=[n,t];}})}};
  old.data.getColor=()=>old.data.color;fresh.data.getColor=()=>fresh.data.color;
  ctx.MineTeamCapability={get:e=>({orElse:()=>e===original?(revived?old:null):fresh})};
  load('startup_scripts/team_persistence/main.js',ctx);
  hooks['net.minecraftforge.event.entity.player.PlayerEvent$Clone']({isWasDeath:()=>true,getEntity:()=>player,getOriginal:()=>original});
  assert.equal(fresh.data.color,'red');assert.equal(fresh.data.pvp,true);assert.equal(fresh.data.extra,42);
  assert.equal(initialized,true);assert.deepEqual(joined,['Alice','red']);assert.equal(revived,false);
});
