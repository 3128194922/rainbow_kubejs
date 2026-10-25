// 分离 startup/server 绑定，复现 ForgeEvents 只在启动脚本中可用的事件边界。
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function harness(data=new Map(),random=()=>.1){
  const hooks={},state=new Map([['eventId','']]),calls=[],commands=[];
  const level={dimension:'minecraft:overworld',isClientSide:()=>false,dayTime:()=>13000,getTime:()=>13000,
    persistentData:{contains:k=>data.has(k),getLong:k=>data.get(k)||0,putLong:(k,v)=>data.set(k,v),getString:k=>data.get(k)||'',putString:(k,v)=>data.set(k,v)},
    server:{runCommandSilent:c=>{commands.push(c);return 1;},scheduleInTicks:()=>{}},
  };
  const c=vm.createContext({global:{},console,Math:Object.assign(Object.create(Math),{random}),
    Component:{literal:x=>x},MobSpawnType:{NATURAL:1},MobCategory:{MONSTER:1},
    MoonJS:{registerPhase:()=>{},getState:()=>state,start:(l,p,o)=>{calls.push([p,o]);state.set('eventId',o.eventId);},stop:()=>state.set('eventId','')},
    LevelEvents:{tick:(id,fn)=>hooks.tick=fn},ServerEvents:{commandRegistry:()=>{}},
    EntityEvents:{spawned:fn=>hooks.spawned=fn},
    ForgeRegistries:{ENTITY_TYPES:{getValue:()=>({getCategory:()=>1})}},ResourceLocation:class{},convertToMiniBoss:()=>{},
  });
  const startup=vm.createContext({console,MoonJS:c.MoonJS,BedSleepingProblem:{NOT_POSSIBLE_NOW:1},
    ForgeEvents:{onEvent:(id,fn)=>{hooks[id]=fn;}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','startup_scripts/parasite_moon/main.js'),'utf8'),startup);
  for(const file of ['server_scripts/parasite_moon/main.js','server_scripts/blood_moon/main.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),c,{filename:file});
  return{c,level,state,hooks,calls,data,commands};
}
test('25%替换同一满月夜只抽一次，脚本重载仍沿用持久选择',()=>{
  let rolls=0;const h=harness(new Map(),()=>{rolls++;return .1;});
  assert.equal(h.c.global.pickAutomaticMoon(h.level,0),'parasite_moon');
  assert.equal(h.c.global.pickAutomaticMoon(h.level,0),'parasite_moon');assert.equal(rolls,1);
  const after=harness(h.data,()=>{throw Error('must not reroll');});
  assert.equal(after.c.global.pickAutomaticMoon(after.level,0),'parasite_moon');
  const normal=harness(new Map(),()=>.25);assert.equal(normal.c.global.pickAutomaticMoon(normal.level,8),'blood_moon');
});
test('自然满月按持久抽签启动寄生月和陨石雨，天亮结束且不停止其他月相',()=>{
  const h=harness(new Map(),()=>.1);h.hooks.tick({level:h.level});
  assert.equal(h.state.get('eventId'),'rainbow:parasite_moon');
  assert.equal(h.commands.filter(c=>c.includes('meteor_shower start')).length,1);
  h.level.dayTime=()=>24000;h.hooks.tick({level:h.level});assert.equal(h.state.get('eventId'),'');
  h.state.set('eventId','other:event');h.hooks.tick({level:h.level});assert.equal(h.state.get('eventId'),'other:event');
});
test('启动脚本注册禁睡事件，仅寄生月拒绝睡眠，服务端重载后仍读取当前月相',()=>{
  const h=harness(),messages=[];
  const sleep=h.hooks['net.minecraftforge.event.entity.player.PlayerSleepInBedEvent'];
  assert.equal(typeof sleep,'function');
  let result=null;
  const event={getEntity:()=>({level:h.level,tell:m=>messages.push(m)}),setResult:r=>result=r};
  h.state.set('eventId','rainbow:parasite_moon');sleep(event);
  assert.equal(result,1);assert.equal(messages.length,1);
  // 重载重新创建脚本词法作用域，保留 global 和外部月相状态；启动事件监听不会重新注册。
  const reloaded=vm.createContext({...h.c});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','server_scripts/parasite_moon/main.js'),'utf8'),reloaded);
  for(const phase of ['', 'rainbow:blood_moon','other:event']){
    result=null;h.state.set('eventId',phase);sleep(event);assert.equal(result,null);
  }
  assert.equal(messages.length,1);
});
