# Rainbow Power KubeJS 脚本系统

基于 Minecraft 1.20.1 Forge 的大型 RPG 整合包 KubeJS 脚本系统。

---

## 目录

- [自定义物品](#自定义物品)
  - [武器](#武器)
  - [饰品 (Curios)](#饰品-curios)
  - [食物](#食物)
  - [材料与工具](#材料与工具)
  - [逻辑数字](#逻辑数字)
- [自定义方块](#自定义方块)
- [自定义实体](#自定义实体)
- [自定义附魔](#自定义附魔)
- [自定义效果/药水](#自定义效果药水)
- [自定义属性](#自定义属性)
- [自定义流体](#自定义流体)
- [核心系统](#核心系统)
  - [饰品技能轮盘系统](#饰品技能轮盘系统)
  - [绝地潜兵 (Helldivers) 系统](#绝地潜兵-helldivers-系统)
  - [迷你Boss系统](#迷你boss系统)
  - [基因系统](#基因系统)
  - [宠物/佣兵驯服系统](#宠物佣兵驯服系统)
  - [共生徽章系统](#共生徽章系统)
  - [面具系统](#面具系统)
  - [音乐魔法系统](#音乐魔法系统)
  - [后室 (Backrooms) 系统](#后室-backrooms-系统)
  - [副本/悬赏实例系统](#副本悬赏实例系统)
  - [蜂群系统](#蜂群系统)
  - [温度系统](#温度系统)
  - [弓箭系统](#弓箭系统)
  - [伤害系统](#伤害系统)
  - [妖怪化系统](#妖怪化系统)
  - [MBD 机器事件系统](#mbd-机器事件系统)
  - [信标光束能量注入系统](#信标光束能量注入系统)
- [饰品图鉴](#饰品图鉴)
- [Curios 自定义渲染](#curios-自定义渲染)
- [盔甲纹饰祝福系统 (圣经)](#盔甲纹饰祝福系统-圣经)
- [末影 Docker 系列](#末影-docker-系列)
- [网关波次挑战](#网关波次挑战)
- [悬赏车队系统](#悬赏车队系统)
- [许愿喷泉配方](#许愿喷泉配方)
- [灵魂火系统](#灵魂火系统)
- [成就系统](#成就系统)
- [命令系统](#命令系统)
- [UI 修改](#ui-修改)
- [战利品修改](#战利品修改)
- [配方修改](#配方修改)
- [标签系统](#标签系统)
- [Ponder 场景](#ponder-场景)
- [声音系统](#声音系统)
- [全局常量](#全局常量)
- [方块交互机制](#方块交互机制)
- [杂项机制](#杂项机制)

---

## 自定义物品

> 物品注册入口：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)

### 武器

| 物品ID | 类型 | 说明 | 实现位置 |
|--------|------|------|----------|
| `rainbow:biome_of_sword` | 剑 | 群系之刃，右键收集当前群系力量，已收集群系越多越强 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:duel` | 剑 | 决斗剑，对同一类型生物伤害增加 1.5 倍 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:tyrfing` | 剑 | 提尔锋，对有护甲敌人造成额外伤害 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:heavy_axe` | 斧 | 重锤，根据下落加速度造成伤害。配方：`species:kinetic_core` + 烈焰棒 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) 配方：[server_scripts/Recipes.js#L203-L206](server_scripts/Recipes.js#L203-L206) |
| `rainbow:eldritch_pan` | 锅(头部) | 饕餮之锅，攻速极慢但伤害高。右键收集副手食物记录食用种类 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L81-L94](client_scripts/tooltips.js#L81-L94)，渲染：[client_scripts/curios_render.js#L134-L171](client_scripts/curios_render.js#L134-L171) |
| `rainbow:baseball_bat` | 剑 | 棒球棍，右键充能变身 `rainbow:baseball_power` | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L350-L366](client_scripts/tooltips.js#L350-L366) |
| `rainbow:baseball_power` | 剑 | 强力棒球棍，NBT 存储能量值 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L354-L366](client_scripts/tooltips.js#L354-L366) |
| `rainbow:terasword` | 剑 | 泰拉刃，消耗能量发射 TNT 弹射物 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，网络：[server_scripts/NetworkEvents.js](server_scripts/NetworkEvents.js) |
| `rainbow:slime_rod` | 剑 | 黏液棒，右键生成粘液块平台，潜行右键生成救生罩，左键脱下实体装备 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，实体事件：[server_scripts/EntityEvents.js#L12-L25](server_scripts/EntityEvents.js#L12-L25) |
| `rainbow:frostium_pickaxe` | 镐 | 霜冻金属镐，耐久 1500，加速挖掘 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，配方：[server_scripts/Recipes.js#L258-L261](server_scripts/Recipes.js#L258-L261) |

### 饰品 (Curios)

所有饰品均装备在 `curios:charm` 槽位，除非另有说明。

| 物品ID | 说明 | 实现位置 |
|--------|------|----------|
| `rainbow:clawofhorus` | 荷鲁斯之爪（手套槽），被生物盯上时提供暴击率/暴击伤害加成 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:berserk_emblem` | 血战沙场之证，根据损失血量增加属性，联动暴食之符 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L128-L131](client_scripts/tooltips.js#L128-L131) |
| `rainbow:gluttony_charm` | 暴食之符，根据损失饥饿值提供加成，免疫饥饿伤害 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L211-L219](client_scripts/tooltips.js#L211-L219) |
| `rainbow:cruncher_charm` | 贪咀护符，消耗饥饿值自动恢复生命值（饥饿值低于 6 时停止） | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L297-L299](client_scripts/tooltips.js#L297-L299) |
| `rainbow:big_stomach` | 大胃袋，食用/饮用速度 +50%，饱食度满时仍可进食 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L181-L188](client_scripts/tooltips.js#L181-L188) |
| `rainbow:hero_charm` | 武器大师勋章，根据手持武器攻速提供不同加成 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L166-L168](client_scripts/tooltips.js#L166-L168) |
| `rainbow:lucky_charm` | 幸运符文，获得幸运 III 效果，时运 +3 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:mining_charm` | 猎宝者护符，时运 +1，触手距离 +2.15，高亮显示附近 Lootr 战利品箱子 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L159-L162](client_scripts/tooltips.js#L159-L162) |
| `rainbow:monster_charm` | 怪物猎人勋章，每 10 秒获得吸收，按键召唤 EasyNPC 佣兵（复制玩家皮肤） | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L157-L213](server_scripts/curios_skill_system/Skillwheel.js#L157-L213)，tooltip：[client_scripts/tooltips.js#L228-L236](client_scripts/tooltips.js#L228-L236) |
| `rainbow:daawnlight_spirit_origin` | 曙旼始灵，每 10 秒标记周围敌对生物，被标记生物受远程伤害翻倍 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L156-L158](client_scripts/tooltips.js#L156-L158) |
| `rainbow:despair_insignia` | 极限之证，最大生命值锁定为 2，获得攻击/移速/攻速/击退抗性加成 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L203-L210](client_scripts/tooltips.js#L203-L210) |
| `rainbow:reload_core` | 装填核心，充能后使用取消霰弹枪冷却 10 秒 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L397-L406](server_scripts/curios_skill_system/Skillwheel.js#L397-L406)，tooltip：[client_scripts/tooltips.js#L268-L270](client_scripts/tooltips.js#L268-L270) |
| `rainbow:short_core` | 连射核心，充能后大幅提升手摇弩射速 10 秒 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L409-L418](server_scripts/curios_skill_system/Skillwheel.js#L409-L418)，tooltip：[client_scripts/tooltips.js#L275-L279](client_scripts/tooltips.js#L275-L279) |
| `rainbow:lyre` | 天琴座（子菜单技能），4 种技能：鼓舞/战曲/小奏/终曲 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L551-L592](server_scripts/curios_skill_system/Skillwheel.js#L551-L592) |
| `rainbow:eye_of_satori` | 觉之瞳，读心标记怪物，增强友军，开关式激活 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L500-L509](server_scripts/curios_skill_system/Skillwheel.js#L500-L509)，tooltip：[client_scripts/tooltips.js#L300-L302](client_scripts/tooltips.js#L300-L302) |
| `rainbow:lilith_hug` | 莉莉丝之拥，变为吸血鬼 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L293-L296](client_scripts/tooltips.js#L293-L296) |
| `rainbow:sculk_affinity` | 幽匿亲和，站在幽匿方块上 +20% 移动速度 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L424-L427](client_scripts/tooltips.js#L424-L427) |
| `rainbow:gravity_core` | 重力核心，空中潜行增加重力快速落地，落地造成范围伤害 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L595-L603](server_scripts/curios_skill_system/Skillwheel.js#L595-L603)，tooltip：[client_scripts/tooltips.js#L117-L127](client_scripts/tooltips.js#L117-L127) |
| `rainbow:giants_ring` | 巨人戒指，体型 x1.5，步高 +1，冲刺踩踏周围生物 | tooltip：[client_scripts/tooltips.js#L95-L105](client_scripts/tooltips.js#L95-L105) |
| `rainbow:moai_charm` | 石鬼像，生物碰撞箱对你无影响 | tooltip：[client_scripts/tooltips.js#L189-L194](client_scripts/tooltips.js#L189-L194) |
| `rainbow:chronos` | 发条怀表，记录最近 5 秒的位置/血量/饱食度，右键快速倒带回溯 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L216-L344](server_scripts/curios_skill_system/Skillwheel.js#L216-L344)，tooltip：[client_scripts/tooltips.js#L315-L322](client_scripts/tooltips.js#L315-L322) |
| `rainbow:mini_moon` | 迷你月球，右键牵引周围生物，潜行右键推开生物 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L606-L651](server_scripts/curios_skill_system/Skillwheel.js#L606-L651)，tooltip：[client_scripts/tooltips.js#L445-L452](client_scripts/tooltips.js#L445-L452) |
| `rainbow:sprite` | 雪碧，移动时 +10 护甲 / +3 攻击 / +50% 击退抗性 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L453-L456](client_scripts/tooltips.js#L453-L456) |
| `rainbow:ancientaegis` | 远古之庇护，右键绑定在线玩家，受到的伤害转移给绑定对象 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L323-L331](client_scripts/tooltips.js#L323-L331) |
| `rainbow:oceantooth_necklace` | 海牙吊坠，穿甲 +4，与狱牙吊坠互斥 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，配方：[server_scripts/Recipes.js#L105-L108](server_scripts/Recipes.js#L105-L108)，tooltip：[client_scripts/tooltips.js#L335-L342](client_scripts/tooltips.js#L335-L342) |
| `rainbow:infernotooth_necklace` | 狱牙吊坠，穿甲 +8，击杀储存灵魂，手持 spectralibur 时每秒转移灵魂 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L350-L352](client_scripts/tooltips.js#L350-L352) |
| `rainbow:treasure_necklace` | 宝箱吊坠，击杀积累能量，满 100 消耗耐久产出战利品 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L439-L444](client_scripts/tooltips.js#L439-L444) |
| `rainbow:the_wafer` | 圣饼，减免 10% 所受伤害，延长无敌帧至 3s | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L202-L209](client_scripts/tooltips.js#L202-L209) |
| `rainbow:the_bible` | 圣经，根据穿戴的盔甲纹饰和魔法伤害属性动态提供属性加成 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L437-L444](client_scripts/tooltips.js#L437-L444) |
| `rainbow:dice` | 赌徒骰子，击杀生物概率刷新主副手物品冷却 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，实体死亡：[server_scripts/EntityEvents.js#L165-L175](server_scripts/EntityEvents.js#L165-L175)，tooltip：[client_scripts/tooltips.js#L148-L155](client_scripts/tooltips.js#L148-L155) |
| `rainbow:lightning` | 闪电瓶，攻击生物触发连锁闪电（最大连锁 5） | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L175-L177](client_scripts/tooltips.js#L175-L177) |
| `rainbow:mind` | 心灵宝石，右键在玩家朝向方向召唤念力墙 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L83-L117](server_scripts/curios_skill_system/Skillwheel.js#L83-L117)，tooltip：[client_scripts/tooltips.js#L172-L174](client_scripts/tooltips.js#L172-L174) |
| `rainbow:master_ball` | 大师球，击杀储存灵魂，配合莉莉丝之拥可消耗灵魂免死。右键回收被脑控的佣兵生物 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js](server_scripts/curios_skill_system/Skillwheel.js)，tooltip：[client_scripts/tooltips.js#L353-L364](client_scripts/tooltips.js#L353-L364)，灵魂替死：[server_scripts/EntityEvents.js#L110-L134](server_scripts/EntityEvents.js#L110-L134) |
| `rainbow:fire_magic` | 火遁·豪火灭却（技能腰带槽），持续 40 tick 发射 Scorcher 火焰投射物 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Helldivers.js#L108-L121](server_scripts/curios_skill_system/Helldivers.js#L108-L121) |
| `rainbow:ccb` | 共生徽章（踩踩背），右键生物骑乘并控制移动 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L434-L471](server_scripts/curios_skill_system/Skillwheel.js#L434-L471)，服务器：[server_scripts/SymbiosisBadge_Server.js](server_scripts/SymbiosisBadge_Server.js)，启动：[startup_scripts/SymbiosisBadge_Startup.js](startup_scripts/SymbiosisBadge_Startup.js)，tooltip：[client_scripts/tooltips.js#L428-L436](client_scripts/tooltips.js#L428-L436) |
| `rainbow:whistle` | 战壕哨，给主人召唤物施加杀戮欲望，其他生物发光 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L511-L538](server_scripts/curios_skill_system/Skillwheel.js#L511-L538) |
| `rainbow:purified_cloth` | 净化绢布，长按右键擦除副手物品的诅咒附魔和修复代价 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L309-L311](client_scripts/tooltips.js#L309-L311) |
| `rainbow:drowned_heart` | 溺尸之心，技能：召唤幼年溺尸佣兵（铁剑+皮革头盔） | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L44-L80](server_scripts/curios_skill_system/Skillwheel.js#L44-L80) |
| `rainbow:frozen_heart` | 霜冻之心，技能：召唤幼年 chilled 佣兵 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L44-L80](server_scripts/curios_skill_system/Skillwheel.js#L44-L80) |
| `rainbow:gritty_heart` | 沙蚀之心，技能：召唤幼年尸壳佣兵 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L44-L80](server_scripts/curios_skill_system/Skillwheel.js#L44-L80) |
| `rainbow:gunk_heart` | 粘液之心，技能：召唤幼年腐烂僵尸佣兵 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L44-L80](server_scripts/curios_skill_system/Skillwheel.js#L44-L80) |
| `rainbow:rotten_heart` | 腐烂之心，技能：召唤幼年僵尸佣兵 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，技能：[server_scripts/curios_skill_system/Skillwheel.js#L44-L80](server_scripts/curios_skill_system/Skillwheel.js#L44-L80) |

### 食物

| 物品ID | 说明 | 实现位置 |
|--------|------|----------|
| `rainbow:ice_tea` | 牢大冰红茶，获得曼巴之力 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，配方：[server_scripts/Recipes.js#L243-L249](server_scripts/Recipes.js#L243-L249) |
| `rainbow:tengzou_noodles` | 滕州大肉面，回复 20 饥饿值，给予滋养和舒适效果 3 分钟 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:flesh` | 血肉，回复 5 饥饿值，妖怪化状态下显示为"人肉" | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，tooltip：[client_scripts/tooltips.js#L237-L244](client_scripts/tooltips.js#L237-L244) |

### 材料与工具

| 物品ID | 说明 | 实现位置 |
|--------|------|----------|
| `rainbow:instance_pass1` ~ `rainbow:instance_pass5` | 副本通行证 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:super_mechanism` | 超精密构件，合成材料 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，配方：[server_scripts/Recipes.js#L346-L355](server_scripts/Recipes.js#L346-L355) |
| `rainbow:rainbow_stone` | 七彩石 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，配方：[server_scripts/Recipes.js#L447](server_scripts/Recipes.js#L447) |
| `rainbow:miracle` | 奇迹物质 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，配方：[server_scripts/Recipes.js#L361](server_scripts/Recipes.js#L361) |
| `rainbow:coin_1` / `rainbow:coin_2` | 货币 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:amber_bee` | 秘封琥珀，基因提取器，右键生物提取 FruitfulFun 基因 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，配方：[server_scripts/Recipes.js#L279](server_scripts/Recipes.js#L279)，tooltip：[client_scripts/tooltips.js#L367-L398](client_scripts/tooltips.js#L367-L398) |
| `rainbow:cleaver_upgrade` | 斩切刀升级模板 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，配方：[server_scripts/Recipes.js#L513-L517](server_scripts/Recipes.js#L513-L517) |
| `rainbow:raw_voidore` | 虚空粗矿 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，配方：[server_scripts/Recipes.js#L303](server_scripts/Recipes.js#L303) |
| `rainbow:brain` | 村民脑子，耐久 300 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:living_metal` | 活体金属 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:controller` | 远程标靶信号器，潜行右键靶子绑定坐标，普通右键靶子远程发出红石信号 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，方块右键：[server_scripts/BlockEvents.js#L254-L284](server_scripts/BlockEvents.js#L254-L284)，配方：[server_scripts/Recipes.js#L212-L215](server_scripts/Recipes.js#L212-L215) |
| `rainbow:mini_ender_chest` | 便携末影箱 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:nbt_util` | NBT 工具，右键实体输出 NBT 到日志 | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |
| `rainbow:golden_finger` | 金手指，让两个生物互相骑乘（大象骑村民触发成就） | 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js) |

### 逻辑数字

用于自动化或逻辑计算，9 个数字 + 5 个运算符 + 1 个错误值：

| 物品ID | 说明 |
|--------|------|
| `rainbow:zero` ~ `rainbow:nine` | 数字 0-9 |
| `rainbow:plus` / `rainbow:minus` / `rainbow:multiply` / `rainbow:divide` | 运算符 |
| `rainbow:missingno` | 不可计算（除零/超出范围） |

> 注册：[startup_scripts/Registry/Registry_item.js](startup_scripts/Registry/Registry_item.js)，逻辑合成：[server_scripts/Recipes.js#L460-L494](server_scripts/Recipes.js#L460-L494)，运算符生成：[server_scripts/Recipes.js#L364](server_scripts/Recipes.js#L364)

---

## 自定义方块

| 方块ID | 说明 | 实现位置 |
|--------|------|----------|
| `rainbow:luckyblock` | 幸运方块，铲子挖掘，草地音效 | 注册：[startup_scripts/Registry/Registry_block.js](startup_scripts/Registry/Registry_block.js) |
| `rainbow:origin_ice_ore` | 始冰矿，铁级镐挖掘，掉落 `legendary_monsters:primal_ice_shard` | 注册：[startup_scripts/Registry/Registry_block.js](startup_scripts/Registry/Registry_block.js)，战利品：[server_scripts/Loot.js#L275-L279](server_scripts/Loot.js#L275-L279) |
| `rainbow:void_ore` | 虚空矿，铁级镐挖掘，掉落 `rainbow:raw_voidore`，80% 概率挖掘时传送到附近末地石 | 注册：[startup_scripts/Registry/Registry_block.js](startup_scripts/Registry/Registry_block.js)，战利品：[server_scripts/Loot.js#L282-L287](server_scripts/Loot.js#L282-L287)，传送：[server_scripts/discord.js#L200-L241](server_scripts/discord.js#L200-L241) |
| `rainbow:soul_hex_block` | 灵脂蜡块，每 20 tick 标记周围 5 格内非玩家实体 | 注册：[startup_scripts/Registry/Registry_block.js](startup_scripts/Registry/Registry_block.js)，tooltip：[client_scripts/tooltips.js#L408-L410](client_scripts/tooltips.js#L408-L410) |

> Docker 通用型方块注册：[startup_scripts/docker/main.js](startup_scripts/docker/main.js)

---

## 自定义实体

| 实体ID | 说明 | 实现位置 |
|--------|------|----------|
| `rainbow:tnt_arrow` | 延迟 TNT 箭，击中实体即爆，击中方块延迟 40 tick 爆炸 | 注册：[startup_scripts/Registry/Registry_entity.js](startup_scripts/Registry/Registry_entity.js) |

---

## 自定义附魔

| 附魔ID | 说明 | 实现位置 |
|--------|------|----------|
| `rainbow:last_stand` | 屹立不倒，适用护甲，最高 2 级 | 注册：[startup_scripts/Registry/Registry_enchantment.js](startup_scripts/Registry/Registry_enchantment.js) |
| `rainbow:living_fire_aspect` | 生灵火·火焰附加，适用武器，最高 2 级 | 注册：[startup_scripts/Registry/Registry_enchantment.js](startup_scripts/Registry/Registry_enchantment.js) |
| `rainbow:ender_fire_aspect` | 末影火·火焰附加，适用武器，最高 2 级 | 注册：[startup_scripts/Registry/Registry_enchantment.js](startup_scripts/Registry/Registry_enchantment.js) |

---

## 自定义效果/药水

> 注册入口：[startup_scripts/Effects.js](startup_scripts/Effects.js)、[startup_scripts/YoukaiEffects.js](startup_scripts/YoukaiEffects.js)、[startup_scripts/kjs6_registering_effects_&_potions.js](startup_scripts/kjs6_registering_effects_&_potions.js)

| 效果ID | 类型 | 说明 |
|--------|------|------|
| `rainbow:tag` | 有害 | 标记，使远程伤害翻倍 |
| `rainbow:obey_command` | 有益 | 服从命令，使生物攻击被标记目标 |
| `rainbow:killing_desire` | 有益 | 杀戮欲望，使生物攻击被发光标记的目标 |
| `rainbow:taunt_effect` | 有害 | 嘲讽，每 20 tick 嘲讽周围生物攻击自己 |
| `rainbow:democratic_save` | 有益 | 民主保佑 |
| `rainbow:manba` | 有益 | 曼巴之力，攻击带有速度伤害加成 |
| `rainbow:off_work_time` | 有益 | 下班时间 |
| `rainbow:reload_buff` | 有益 | 装填核心 Buff，移除霰弹枪冷却 |
| `rainbow:short_buff` | 有益 | 连射核心 Buff，大幅提升手摇弩射速 |
| `rainbow:void` | 有益 | 虚化，免疫伤害 |
| `rainbow:youkaified` | - | 妖怪化 |
| `rainbow:youkaifying` | - | 半妖怪化 |

---

## 自定义属性

> 注册：[startup_scripts/Attribute.js](startup_scripts/Attribute.js)

| 属性ID | 说明 |
|--------|------|
| `rainbow:generic.extra_summoning` | 额外召唤物数量 |
| `rainbow:generic.boom_damage` | 爆炸伤害倍率 |
| `rainbow:generic.thrown_damage` | 投掷伤害倍率 |
| `rainbow:generic.pet_damage` | 宠物伤害倍率 |

---

## 自定义流体

> 注册：[startup_scripts/Registry/Registry_fluid.js](startup_scripts/Registry/Registry_fluid.js)

| 流体ID | 说明 |
|--------|------|
| `rainbow:oil` | 石油，黑色，密度 2200，粘度 2200。配方：粑粑+蟑螂翅碎片加热搅拌 |
| `rainbow:number_water` | 液态逻辑，绿色桶，温度 1000，粘度 1500，密度 6000。配方：超精密构件 + 石油超高热搅拌 |

---

## 核心系统

### 饰品技能轮盘系统

通过技能轮盘 UI 触发饰品主动技能。技能注册在 Skillwheel.js 中，网络包 `skillwheel` 触发。

> 实现：[server_scripts/curios_skill_system/Skillwheel.js](server_scripts/curios_skill_system/Skillwheel.js)

**技能列表：**

| 技能饰品 | 效果 | 冷却 | 代码行 |
|----------|------|------|--------|
| 心脏系列 x5 | 召唤对应幼年佣兵（铁剑+皮革头盔+消失诅咒） | 20s | L44-L80 |
| 心灵宝石 | 在玩家朝向方向召唤念力墙 | 30s | L83-L117 |
| 怪物护符 | 召唤 EasyNPC 人形佣兵（复制玩家皮肤+AI 目标） | - | L157-L213 |
| 发条怀表 | 5 秒时间回溯 + 重置最近结构 | - | L216-L344 |
| 装填核心 | 消耗 100 能量获得装填 Buff | 10s | L397-L406 |
| 连射核心 | 消耗 100 能量获得连射 Buff | 10s | L409-L418 |
| 共生徽章 | 5 格射线检测生物并骑乘 | - | L434-L471 |
| 皇家法杖 | 触发原版皇家法杖右键效果 | - | L474-L497 |
| 觉之瞳 | 开关 NBT `is_open` 状态 | - | L500-L509 |
| 战壕哨 | 16 格范围内友军获得杀戮欲望 / 敌军发光 | - | L511-L538 |
| 虚空蠕虫之眼 | 获得虚化效果（免疫伤害） | - | L540-L548 |
| 天琴座 | 子菜单：鼓舞(抗性)/战曲(力量)/小奏(治疗)/终曲(伤害) | 1s | L551-L592 |
| 重力核心 | 向上弹射 10 格 | - | L595-L603 |
| 迷你月球 | 引力场：牵引(右键) / 推开(潜行右键)，附加 6 点伤害 | - | L606-L651 |

### 绝地潜兵 (Helldivers) 系统

独立的技能系统，网络包 `helldivers` 触发，专用于动作类技能饰品。

> 实现：[server_scripts/curios_skill_system/Helldivers.js](server_scripts/curios_skill_system/Helldivers.js)

| 技能饰品 | 效果 | 代码行 |
|----------|------|--------|
| `rainbow:fire_magic` | 火遁·豪火灭却，持续 40 tick 发射 Scorcher 火焰投射物（DungeonNowLoading 集成） | L108-L121 |

### 迷你Boss系统

**触发条件：** 玩家幸运值 ≤ 0 时攻击生物（驯服生物除外），概率触发

> 实现：[server_scripts/mini_boss_system/main.js](server_scripts/mini_boss_system/main.js)，战利品：[server_scripts/mini_boss_system/loot.js](server_scripts/mini_boss_system/loot.js)，AI：[server_scripts/mini_boss_system/IA.js](server_scripts/mini_boss_system/IA.js)

**触发逻辑：** 每次攻击检测幸运值，无条件触发（`1 &&`），随机抽取 1-4 次词条（去重），生命值 x3。实体添加红色油漆层标识。

**词条系统（6 种）：**

| 词条 | 效果 |
|------|------|
| 自愈 (Regenerate) | 每 20 tick 回血 2 点 |
| 援军 (Reinforce) | 召唤 3 只同种生物 |
| 领袖 (Leader) | 每 40 tick 给周围同种生物上 buff |
| 挖掘 (Dig) | 自动挖掘路径上的障碍方块 |
| 隐匿 (Stealth) | 无目标时持续隐身 |
| 演化 (Evolve) | 已定义，未实现 AI |

> 战利品表 `rainbow:mini_boss_extra`：[server_scripts/mini_boss_system/loot.js](server_scripts/mini_boss_system/loot.js)（钻石/绿宝石/金锭/铁锭/经验瓶/末影珍珠/黑曜石/超精密构件/奇迹物质/下界合金碎片）

### 基因系统

> 启动配置：[startup_scripts/gene_system/config.js](startup_scripts/gene_system/config.js) + [startup_scripts/gene_system/main.js](startup_scripts/gene_system/main.js)
> 基因逻辑：[server_scripts/gene/gene_logic.js](server_scripts/gene/gene_logic.js)
> 基因交互：[server_scripts/gene/interaction.js](server_scripts/gene/interaction.js)
> 物品事件：[server_scripts/gene_system/IItemEvents.js](server_scripts/gene_system/IItemEvents.js)

- **基因提取：** `rainbow:amber_bee` 右键生物提取基因，读取 FruitfulFun 基因数据写入 NBT
- **基因属性映射：** `global.GeneEffectMap` 在 [startup_scripts/gene_system/config.js](startup_scripts/gene_system/config.js) 中定义
- **工具提示：** 按 ALT 查看 `rainbow:amber_bee` 的基因详情

### 宠物/佣兵驯服系统

> 启动：[startup_scripts/pet_system/MobTameStartup.js](startup_scripts/pet_system/MobTameStartup.js)
> 服务器：[server_scripts/pet_system/MobTameServer.js](server_scripts/pet_system/MobTameServer.js)
> Jade 客户端：[client_scripts/pet_system/JadeEvents.js](client_scripts/pet_system/JadeEvents.js)

- **可驯服生物：** 铁傀儡（通过 `EntityJSEvents.modifyEntity`）
- **驯服机制：** 有 OwnerName 持久化数据即为驯服
- **骑乘控制：** 完整的 WASD 移动/跳跃/飞行/游泳逻辑
- **Jade 显示：** 被精神控制的生物显示 `[召唤物]` 标签
- **战利品：** 被驯服的生物不掉落任何物品

### 共生徽章系统

> 启动：[startup_scripts/SymbiosisBadge_Startup.js](startup_scripts/SymbiosisBadge_Startup.js)
> 服务器：[server_scripts/SymbiosisBadge_Server.js](server_scripts/SymbiosisBadge_Server.js)
> 技能：[server_scripts/curios_skill_system/Skillwheel.js#L434-L471](server_scripts/curios_skill_system/Skillwheel.js#L434-L471)

- **物品：** `rainbow:ccb`
- **功能：** 5 格射线检测生物并骑乘（凋灵/末影龙除外）
- **属性加成：** 坐骑获得 +20 最大生命值 / +10 护甲 / +5 攻击
- **仇恨跟随：** 骑乘时攻击目标，坐骑自动对目标产生仇恨

### 面具系统

> 启动：[startup_scripts/mask/ForgeEvent.js](startup_scripts/mask/ForgeEvent.js)
> 生物 Tick：[server_scripts/mask/MobTick.js](server_scripts/mask/MobTick.js)
> 生物技能：[server_scripts/mask/MobSkill.js](server_scripts/mask/MobSkill.js)

处理面具生物的行为逻辑和技能释放。

### 音乐魔法系统

> 网络事件：[server_scripts/music_magic/NetWorkEvents.js](server_scripts/music_magic/NetWorkEvents.js)

处理音乐魔法相关网络包。

### 后室 (Backrooms) 系统

**进入方式：** 背包界面按 `W W S S A A D D B A B A`

> 客户端：[client_scripts/backroom/tobackroom.js](client_scripts/backroom/tobackroom.js)
> 网络事件：[server_scripts/backroom/NetworkEvents.js](server_scripts/backroom/NetworkEvents.js)
> 突变系统：[server_scripts/backroom/mutant.js](server_scripts/backroom/mutant.js)
> 战利品：[server_scripts/backroom/loot.js](server_scripts/backroom/loot.js)
> 启动：[startup_scripts/backrooms/ForgeEvents.js](startup_scripts/backrooms/ForgeEvents.js) + [startup_scripts/backrooms/item.js](startup_scripts/backrooms/item.js)

- **传送：** 传入后室维度 `backroom:backroom`，Y=-62，冒险模式
- **逃出：** 再次输入秘籍，传送回主世界，生存模式，所有物品掉落并清空
- **死亡：** 死后室时所有物品掉落在后室

**战利品房间：**

| 房间类型 | 战利品 | 实现位置 |
|----------|--------|----------|
| 普通房 | 藤椒面条 + 32 个矿物 | [server_scripts/backroom/loot.js](server_scripts/backroom/loot.js) |
| 高级房 | 藤椒面条/橡胶 + 陶片 + 矿物 | [server_scripts/backroom/loot.js](server_scripts/backroom/loot.js) |
| 隐藏房 | 陶片 + 随机附魔书 + 锻造模板 | [server_scripts/backroom/loot.js](server_scripts/backroom/loot.js) |
| 密码房 | 神器/饰品 + 陶片 + 附魔书 + 锻造模板 | [server_scripts/backroom/loot.js](server_scripts/backroom/loot.js) |

### 副本/悬赏实例系统

> 客户端：[client_scripts/Instance/item_key_tootips.js](client_scripts/Instance/item_key_tootips.js)
> 服务器：[server_scripts/Instance/inventory_closed_event.js](server_scripts/Instance/inventory_closed_event.js)

- **悬赏物品：** `bountiful:bounty` 右键领取，生成随机坐标（1000-10000 格范围）
- **副本类型：** `rainbow1` ~ `rainbow5`（僵尸波/怪物扩展 boss）
- **启动条件：** 在目标坐标 50 格内右键悬赏物品
- **完成奖励：** 获得对应副本通行证
- **坐标提示：** 悬赏物品 tooltip 显示坐标信息

### 蜂群系统

> 实体事件：[server_scripts/bee_like/EntityEvents.js](server_scripts/bee_like/EntityEvents.js)
> 物品事件：[server_scripts/bee_like/ItemEvents.js](server_scripts/bee_like/ItemEvents.js)
> Jade 启动：[startup_scripts/bee_like/JadeEvents.js](startup_scripts/bee_like/JadeEvents.js)
> Jade 客户端：[client_scripts/bee_like/JadeEvents/JadeEvents.js](client_scripts/bee_like/JadeEvents/JadeEvents.js)

蜜蜂相关实体事件和物品交互。

### 温度系统

> 实现：[server_scripts/temperature.js](server_scripts/temperature.js)

封装了两个温度测量函数到全局对象：
- **`global.getTideTemperature(player, level)`** - 获取 Tide Mod 气候计温度（摄氏度），使用 `TideUtils.getTemperatureAt()` + `mcTempToRealTemp()`
- **`global.getOreganizedHeatLevel(player)`** - 获取 Oreganized 温度计热度等级 (0-8)，使用 `ThermometerItem.ambientMeasurement()`

### 弓箭系统

> 服务端 Tick：[server_scripts/bow/PlayerTick.js](server_scripts/bow/PlayerTick.js)
> 客户端渲染：[client_scripts/bow/render.js](client_scripts/bow/render.js)

- **拉弓进度条：** 服务端每 2 tick 发送拉弓进度，客户端在准心下方渲染渐变色进度条（红→黄→绿）
- **满弓音效：** 满弓时播放 UI 音效

### 伤害系统

一套完整的伤害处理管线（大部分集中在 [startup_scripts/ForgeEvents.js](startup_scripts/ForgeEvents.js)），包含以下子模块：

> 入口：[startup_scripts/ForgeEvents/main.js](startup_scripts/ForgeEvents/main.js)
> 主事件：[startup_scripts/ForgeEvents.js](startup_scripts/ForgeEvents.js)

| 文件 | 功能 | 实现位置 |
|------|------|----------|
| `customAttributeDamage.js` | 自定义属性伤害计算 | [startup_scripts/ForgeEvents/customAttributeDamage.js](startup_scripts/ForgeEvents/customAttributeDamage.js) |
| `handleCuriosEffects.js` | 饰品效果处理 + Bible 纹饰祝福 | [startup_scripts/ForgeEvents/handleCuriosEffects.js](startup_scripts/ForgeEvents/handleCuriosEffects.js) |
| `handleWeaponEffects.js` | 武器效果处理 | [startup_scripts/ForgeEvents/handleWeaponEffects.js](startup_scripts/ForgeEvents/handleWeaponEffects.js) |
| `handleNonPlayerDamage.js` | 非玩家伤害处理 | [startup_scripts/ForgeEvents/handleNonPlayerDamage.js](startup_scripts/ForgeEvents/handleNonPlayerDamage.js) |
| `handleCoreCharging.js` | 核心充能处理 | [startup_scripts/ForgeEvents/handleCoreCharging.js](startup_scripts/ForgeEvents/handleCoreCharging.js) |
| `onPlayerHurt.js` | 玩家受伤事件 | [startup_scripts/ForgeEvents/onPlayerHurt.js](startup_scripts/ForgeEvents/onPlayerHurt.js) |
| `onNonPlayerHurt.js` | 非玩家受伤事件 | [startup_scripts/ForgeEvents/onNonPlayerHurt.js](startup_scripts/ForgeEvents/onNonPlayerHurt.js) |
| `onEntityHurt.js` | 实体受伤事件 | [startup_scripts/ForgeEvents/onEntityHurt.js](startup_scripts/ForgeEvents/onEntityHurt.js) |
| `onBeforePlayerHurt.js` | 玩家受伤前事件 | [startup_scripts/ForgeEvents/onBeforePlayerHurt.js](startup_scripts/ForgeEvents/onBeforePlayerHurt.js) |
| `onBeforeNonPlayerHurt.js` | 非玩家受伤前事件 | [startup_scripts/ForgeEvents/onBeforeNonPlayerHurt.js](startup_scripts/ForgeEvents/onBeforeNonPlayerHurt.js) |
| `onBeforeNonEntityHurt.js` | 非实体受伤前事件 | [startup_scripts/ForgeEvents/onBeforeNonEntityHurt.js](startup_scripts/ForgeEvents/onBeforeNonEntityHurt.js) |
| `ForgeEvent.js` | 通用 Forge 事件 | [startup_scripts/ForgeEvents/ForgeEvent.js](startup_scripts/ForgeEvents/ForgeEvent.js) |

**核心 ForgeEvent 新增机制：** [startup_scripts/ForgeEvents.js](startup_scripts/ForgeEvents.js)

| 机制 | 说明 |
|------|------|
| 霜冻镐加速 | 挖掘硬度 > 5 的方块时挖掘速度 x16 |
| 棒球棍能量 | 每次攻击消耗能量，归零变回普通棒球棍 |
| 决斗剑类型 | 初始化已攻击类型计数 NBT |
| 邪恶面具 | 依据生物血量/武器类型动态增加属性，非同类怪物不主动攻击 |
| 饕餮之锅 | 已食用食物数 > 0 时攻击额外造成百分比伤害 |
| 群系之剑 | 已收集群系数 > 0 时攻击附加百分比伤害 |
| 怪肉消化 | 食用 `#rainbow:monster_meat` 30% 概率获得半妖怪化，累计 5 分钟转妖怪化 |
| 虚空嬗变 | `rainbow:raw_voidore` 可转化为 `createutilities:void_steel_ingot` |
| 防化服免疫 | 穿戴全套 `alexscaves:hazmat_*` 免疫中毒/凋零/辐照 |
| 睡眠噩梦 | 玩家醒来时概率在周围生成幻翼 |
| 下班时间 | `rainbow:off_work_time` 效果结束时丢弃手上物品 |
| 宝箱吊坠计数 | 击杀生物记录到 `kill` NBT |
| 大师球灵魂 | 击杀生物储存灵魂到 `Souls` NBT |
| 短射buff到期 | `rainbow:short_buff` 结束时射出 `alexscaves:ice_chunk` 投射物 |

### 妖怪化系统

> 实现：[startup_scripts/YoukaiEffects.js](startup_scripts/YoukaiEffects.js)

- **触发：** 食用 `#rainbow:monster_meat` 标签食物有 30% 概率获得半妖怪化
- **半妖怪化：** 食物数值 x2，持续累计超过 5 分钟转化为妖怪化
- **妖怪化：** 食物数值 x3，吃怪肉延长持续时间，怪肉在 tooltip 中显示为"人肉"

### MBD 机器事件系统

> 实现：[server_scripts/MBDServerEvents.js](server_scripts/MBDServerEvents.js)

处理多方块机器 (Multiblock Machines) 的 Tick 事件（当前代码已注释，预留给 `mbd2:fire_machine`）。

### 信标光束能量注入系统

> 实现：[server_scripts/energizedBeaconCrafting_server.js](server_scripts/energizedBeaconCrafting_server.js)

- 玩家手持红石右键信标，触发光束扫描
- 扫描光束经过的实体，根据光束颜色给予着火效果（RGB 亮度 → 强度映射）
- 检测光束路径上的刚玉簇 (`rainbow:corundum_cluster`)，激活其反方向的靶子方块（60 tick 后复位）

---

## 饰品图鉴

### 护符槽 (Charm)
荷鲁斯之爪、血战沙场之证、暴食之符、贪咀护符、大胃袋、武器大师勋章、幸运符文、猎宝者护符、怪物猎人勋章、曙旼始灵、极限之证、装填核心、连射核心、天琴座、觉之瞳、莉莉丝之拥、幽匿亲和、重力核心、巨人戒指、石鬼像、发条怀表、迷你月球、雪碧、远古之庇护、海牙吊坠、狱牙吊坠、宝箱吊坠、圣经、赌徒骰子、闪电瓶、心灵宝石、脑控回收器、共生徽章、战壕哨、净化绢布、心脏系列 x5、黏液棒

### 背部 (Back)
TNT、核弹、TNT 桶、破片炸弹、孢子炸弹、末地烛、精灵（`mysticartifacts:artifact_spirit`）、皇家法杖、所有旗帜（16 种）、create 背罐（铜/下界合金）

> 标签：[server_scripts/Tag.js#L74-L77](server_scripts/Tag.js#L74-L77) + [server_scripts/Tag.js#L117](server_scripts/Tag.js#L117)

### 头部 (Head)
饕餮之锅、煎锅、金切肉刀、篮子

> 标签：[server_scripts/Tag.js#L79-L81](server_scripts/Tag.js#L79-L81)

### 技能腰带 (Belt)
火遁·豪火灭却

---

## Curios 自定义渲染

> 实现：[client_scripts/curios_render.js](client_scripts/curios_render.js)

| 渲染物品 | 槽位 | 效果描述 |
|----------|------|----------|
| `rainbow:sunglasses` | head | 太阳镜，翻转 180° 跟随头部旋转，缩放 0.9 | 
| `farmersdelight:skillet` | head | 煎锅，翻转 180° 平贴在头顶 | 
| `dungeonsdelight:golden_cleaver` | head | 金切肉刀，斜插在头侧 | 
| `rainbow:eldritch_pan` | head | 饕餮之锅，戴在头顶向下偏移 1 格 | 
| `farmersdelight:basket` | head | 篮子，略向下偏移 | 
| `minecraft:tnt` | back | TNT，背部居中 | 
| `alexscaves:nuclear_bomb` | back | 核弹，背部居中 | 
| `rottencreatures:tnt_barrel` | back | TNT 桶，背部居中 | 
| `oreganized:shrapnel_bomb` | back | 破片炸弹，背部居中 | 
| `savage_and_ravage:spore_bomb` | back | 孢子炸弹，背部居中 | 
| `minecraft:end_rod` | back | 末地烛，背部向上 0.9 格，旋转 -45° | 
| `create:netherite_backtank` | back | 下界合金背罐，背部放大 2x | 
| `create:copper_backtank` | back | 铜背罐，背部放大 2x | 
| `royalvariations:royal_staff` | back | 皇家法杖，背部竖直显示 | 
| 16 种旗帜 | back | 各色旗帜，背部放大 1.5x | 

---

## 盔甲纹饰祝福系统 (圣经)

> 实现：[startup_scripts/ForgeEvents/handleCuriosEffects.js](startup_scripts/ForgeEvents/handleCuriosEffects.js) 中 `handleBibleEffects()` 函数

`rainbow:the_bible` 根据玩家穿戴的盔甲纹饰和魔法伤害属性提供加成，共支持 25+ 种纹饰：

| 纹饰 | 加成属性 |
|------|----------|
| rim | 护甲 + 韧性 + 击退抗性 |
| vex | 攻击力 + 暴击率 + 暴击伤害 |
| raiser | 生命值 + 治疗加成 + 幽灵生命 |
| sentry | 护甲 + 保护穿透 + 步高 |
| shaper | 触及距离 + 挖掘速度 + 经验加成 |
| host | 生命偷取 + 过量治疗 + C&C 生命偷取 |
| silence | 闪避 + 潜行 + 移速 |
| petrified | 韧性 + 护甲 + 击退抗性 |
| forger | 挖掘速度 + 经验 + 幸运 |
| plate | 护甲 + 击退抗性 + 保护穿透 |
| spirit | 魔法伤害 + 魔法保护 + 火焰伤害 |
| tide | 游泳速度 + 重力减免 + 移速 |
| rib | 攻击力 + 生命偷取 |
| spire | 飞行速度 + 触及距离 + 跟随范围 |
| druid | 治疗加成 + 魔法伤害 + 芬芳 |
| apostle | 幽灵生命 + 过量治疗 + 经验 |
| core | 攻击力 + 护甲 + 移速 |
| exile | 箭矢伤害 + 箭矢速度 + 拉弓速度 |
| valor | 攻击力 + 暴击率 + 暴击伤害 |
| ward | 韧性 + 护甲 + 保护穿透 |
| eye | 触及距离 + 闪避 + 幸运 |
| trim_modifier | 幸运 + 挖掘速度 + 步高 |
| immolate | 火焰伤害 + 生命偷取 |
| dune | 护甲 + 移速 + 步高 |
| coast | 游泳速度 + 重力减免 + 移速 |
| wild | 移速 + 攻击力 + 闪避 |
| rift | 触及距离 + 攻击击退 |
| snout | 火焰伤害 + 护甲 + 攻击力 |
| wayfinder | 移速 + 幸运 + 经验 |

---

## Docker 通用型系统

> 注册：[startup_scripts/docker/main.js](startup_scripts/docker/main.js)
> 交互：[server_scripts/docker/docker_interaction.js](server_scripts/docker/docker_interaction.js)
> 旧版配方已注释：[server_scripts/Recipes.js#L72-L93](server_scripts/Recipes.js#L72-L93)

**统一后的 Docker 方块** `rainbow:docker`，潜行右键可在 6 种模式间循环切换，面向上方不传输：

| 模式 | 名称 | 功能 |
|------|------|------|
| 0 | 末影型 | 红石脉冲 → 将物品转移到绑定者的末影箱 |
| 1 | 末影加强型 | 红石脉冲 → 将物品转移到绑定者的物品栏 |
| 2 | 玩家坐标代理 | 红石脉冲 → 实时记录绑定者的坐标和维度 |
| 3 | 背包代理 | 红石脉冲 → 同步绑定者物品栏 9-35 槽到方块库存 |
| 4 | 物品栏代理 | 红石脉冲 → 同步绑定者快捷栏 0-8 槽到方块库存 |
| 5 | 末影箱代理 | 红石脉冲 → 同步绑定者末影箱到方块库存 |

- **绑定：** 潜行右键绑定 UUID
- **代理模式 (mode ≥ 2)：** 玩家下线自动清空方块库存
- **旧版 6 独立方块已废弃**，由统一 Docker 替代

---

## 网关波次挑战

> 配置：[data/gateways/gateways/](data/gateways/gateways/)
> 配方移除：[server_scripts/Recipes.js#L11-L18](server_scripts/Recipes.js#L11-L18)（移除原版网关珍珠配方）

| 网关 ID | 说明 |
|----------|------|
| `overworldian_nights` | 主世界夜晚，4 波次 |
| `hellish_fortress` | 地狱堡垒 |
| `emerald_grove` | 翡翠树林 |
| `ettle_nest` | 艾特尔巢穴 |
| `netherexp` | 下界扩展 |
| `alexs_hell` | Alex 地狱 |
| `endless/blaze` | 无尽烈焰人 |
| `basic/blaze` | 基础烈焰人 |
| `basic/enderman` | 基础末影人 |
| `basic/slime` | 基础史莱姆 |

**装备套装：** 铁套、铁套+钻石武器、金套+斧、链甲+弓

---

## 悬赏车队系统

> 配置：[data/](data/) 目录内 caravan 相关文件

包含 8 种车队类型，每种 3 个等级：

| 车队 | 生态群系 | 货物 |
|------|----------|------|
| 沙漠矿工 | 沙漠 | 矿石类 |
| 沙漠收割者 | 沙漠 | 农作物 |
| 沙漠盗墓者 | 沙漠 | 宝藏类 |
| 丛林收割者 | 丛林 | 农作物 |
| 丛林盗墓者 | 丛林 | 宝藏类 |
| 丛林异域 | 丛林 | 异域物品 |
| 平原掠夺者 | 平原 | 补给 |
| 平原收割者 | 平原 | 农作物 |
| 平原染料商 | 平原 | 染料 |
| 雪地矿工 | 雪地 | 矿石类 |
| 雪地猎人 | 雪地 | 毛皮 |
| 雪地渔夫 | 雪地 | 鱼类 |
| 沼泽矿工 | 沼泽 | 矿石类 |
| 沼泽收割者 | 沼泽 | 农作物 |
| 沼泽炼金术士 | 沼泽 | 炼金材料 |

---

## 许愿喷泉配方

> 配置：[data/](data/) 目录内 wishing_well 相关文件

共 50+ 个许愿喷泉配方，覆盖几乎所有原版结构。

---

## 灵魂火系统

> 配置：[data/soul_fire_d/fires/](data/soul_fire_d/fires/)

自定义灵魂火配方，覆盖原版、下界扩展、末地扩展、地下城美食。

---

## 成就系统

> 配置：[data/rainbow/advancements/](data/rainbow/advancements/)

| 成就ID | 名称 | 说明 |
|--------|------|------|
| `root` | 彩虹动力 | 根成就 |
| `super` | 遥遥领先 | 获得超精密构件 |
| `overkill` | 赶尽杀绝 | 一击造成 18 点伤害 |
| `democracy` | 民主庇佑 | 穿戴完整民主套装 |
| `ccb` | - | 大象骑乘村民 |
| `haniba` | - | - |
| `hite_player` | - | - |
| `jiangjiang` | - | - |
| `jiulong` | - | - |
| `luguan` | - | - |
| `shejin` | - | - |
| `theenchest` | - | - |
| `thehuman` | - | - |
| `whatcis` | - | - |

---

## 命令系统

> 实现：[server_scripts/PlayerEvents.js](server_scripts/PlayerEvents.js)

| 命令 | 说明 |
|------|------|
| `/tpa <玩家名>` | 传送到指定玩家（禁止传送到后室） |
| `/back` | 返回死亡地点 |

---

## UI 修改

### 工具提示
> 实现：[client_scripts/tooltips.js](client_scripts/tooltips.js)

- **食物自动提示：** `#rainbow:food_tooltip` 标签物品自动显示食物效果（名称+等级+时长），使用 `MobEffectUtil.formatDuration` 格式化
- **按 SHIFT 查看详细：** 巨人戒指、重力核心、血战沙场之证、赌徒骰子、大胃王、冒险护符、绝望之证、暴食之符、金猪护符、怪物护符、时空核心、远古神盾、共生徽章、迷你月球
- **按 ALT 查看详细：** 秘封琥珀（显示基因信息+属性效果）
- **NBT 信息显示：** 装填/连射核心能量值、强力棒球棍能量、饕餮之锅已食用数、信标球绑定坐标、海牙吊坠耐久、狱牙吊坠灵魂数、宝箱吊坠击杀数、远古神盾绑定 UUID
- **新增 tooltip：** 圣饼（10% 减伤+3s 无敌帧）、大师球（灵魂储存+莉莉丝联动免死）、荷鲁斯之爪（生物盯上时暴击加成）

### JEI 修改
> 实现：[client_scripts/jei.js](client_scripts/jei.js)

- 隐藏物品：结构方块、拼图方块、屏障、调试棒、命令方块

### 背包界面
> 打开菜单按钮客户端：[client_scripts/open_menu_button_client.js](client_scripts/open_menu_button_client.js)
> 打开菜单按钮服务器：[server_scripts/open_menu_button_server.js](server_scripts/open_menu_button_server.js)
> 引导提示：[client_scripts/keytips/invScreen.js](client_scripts/keytips/invScreen.js)

- 左下角"文本显示"按钮（切换引导提示开关 `global.isEnabled`）
- 引导提示高亮饰品栏、属性栏、时装栏，显示半透明遮罩和指示线

### 悬赏物品提示
> 实现：[client_scripts/Instance/item_key_tootips.js](client_scripts/Instance/item_key_tootips.js)

- `bountiful:bounty` 显示副本坐标和"右键开启"

### 弓蓄力进度条
> 服务端：[server_scripts/bow/PlayerTick.js](server_scripts/bow/PlayerTick.js)
> 客户端：[client_scripts/bow/render.js](client_scripts/bow/render.js)

- 屏幕中央下方渲染渐变色进度条（红→黄→绿）

---

## 战利品修改

> 实现：[server_scripts/Loot.js](server_scripts/Loot.js)

### 实体掉落
- 疣猪 → 火腿（`netherexp:hogham`）
- 流浪商人 → 绿宝石
- 蟑螂 → 粑粑（`alexscaves:guano`）
- 笼头怪 → 废料（`dungeonsdelight:stained_scrap`）
- 僵尸 → 腐烂之心（权重 1/11）
- 尸壳 → 沙蚀之心（权重 1/11）
- 溺尸 → 溺尸之心（权重 1/11）
- chilled → 霜冻之心（权重 1/11）
- 粘液僵尸 → 粘液之心（权重 1/11）

### 方块掉落
- 始冰矿 → 始冰碎片（`legendary_monsters:primal_ice_shard`）
- 末地矿 → 末地原矿（`rainbow:raw_endore`）
- 末影篝火 → 末地石
- 旗帜工作台 → 工作台本身

### 钓鱼
- 添加 `rainbow:ccb`（权重 1/11）

### 猫的晨礼
- 添加粑粑（`alexscaves:guano`，权重 10）

### 佣兵无掉落
- 被驯服生物（`OwnerName` 不为空）：不掉落任何物品

### 灵脂蜡块 docker 掉落
- 被 `forge:spawn_type=MOB_SUMMONED` 且有 docker 数据的实体可配置额外掉落
- 新增 `rainbow:rainbow_chest` 战利品表，`rainbow:soul_hex_block` 标记的怪物击杀后触发该战利品

---

## 配方修改

> 实现：[server_scripts/Recipes.js](server_scripts/Recipes.js)

### 配方删除/替换
- 删除附魔金苹果配方
- 删除 7 个网关珍珠配方
- 删除 `environmental:cherry_pie` / `truffle_pie`
- 替换背包单元箱配方（铁粒 → 潜影盒）
- 删除虚空钢锭混合配方
- 删除 15+ 个 HMaG 物品配方

### 自定义配方（精选列表）

| 输出 | 配方简述 | 代码行 |
|------|----------|--------|
| `rainbow:super_mechanism` | 精密构件 + 下界之星 + 下界音之器 + 下界之声 → 序列组装（概率产出 + 废料返回） | L346-L355 |
| `rainbow:oil` (流体) | 粑粑 + 蟑螂翅碎片 → 加热搅拌 | L337 |
| `rainbow:number_water` (流体) | 超精密构件 + 石油 → 超高热搅拌 | L358 |
| `rainbow:miracle` | 液态逻辑 1000mb → 七彩石 | L361 |
| `rainbow:rainbow_stone` | 9 种刚玉簇 → 9 个七彩石 | L447 |
| 逻辑数字合成 | 360 个配方：Num1 + Op + Num2 = 结果 | L460-L494 |
| `create:creative_motor` | 7x7 大型配方，消耗大量超精密构件 | L392-L400 |
| `rainbow:ice_tea` | 冰 + 柠檬 + 糖 → 农夫乐事烹饪（蜂蜜瓶容器） | L243-L249 |
| `rainbow:docker_ender` | 木板 + 末影箱 | L73-L76 |
| `rainbow:frostium_pickaxe` | 3x 始冰碎片 + 2x 木棍 | L258-L261 |
| `rainbow:amber_bee` | 琥珀好奇心 + 玻璃瓶 | L279 |
| `rainbow:heavy_axe` | 动能核心 + 烈焰棒 | L203-L206 |
| `rainbow:controller` | 创造发射器 + 铁锭 + 铁按钮 | L212-L215 |
| `rainbow:oceantooth_necklace` | 海带 + 鲨鱼牙齿 | L105-L108 |
| `mysticartifacts:ender_kunai` | 虚空钢锭 + 紫水晶碎片 + 末影珍珠 | L197-L200 |
| 命名牌复制 | 线 + 木板 + 命名牌 → 保留模板不退材 | L225 |
| 传送石降价 | 绿宝石 + 末影珍珠 | L219 |
| 音乐播放器 | 唱片机 + 铁锭 + 红石 | L269 |
| 光盘刻录机 | 音符盒 + 铁锭 + 红石 | L272 |
| 计算机 | 红石灯 + 铁锭 + 红石中继器 | L275 |
| 下界反应堆 | 4x 下界合金锭 + 4x 黑曜石 + 钻石 | L424 |

### Create 产线配方（精选）

| 配方 | 说明 | 代码行 |
|------|------|--------|
| 熔渣 → 红石/萤石/铅/银 | 4 种副产品产线 | L312-L373 |
| 毒化烂泥 → 未加工废料 | 8x 废料 + 金属桶 | L178 |
| 黑石 → 煤炭 + 下界合金碎片 | 极低概率 (0.01%) | L306 |
| 泥土 → 燧石 | 粉碎，500tick | L222 |
| 下界岩量产 | 岩浆 + 圆石 + 煤粉 → 搅拌 | L316 |
| 黄铜块 | 锌块 + 铜块 → 加热搅拌 | L416 |
| 液态经验 → 青金石 | 200mb 经验 + 精炼石棉 | L419 |
| 超经验 | 古籍 + 青金石 + 1000mb 经验 → 超高热搅拌 | L423 |
| 腐肉制作 | 咖喱肉类 → 缠魂 | L282 |
| 煤炭转化 | 木炭 → 缠魂（75% 概率） | L291 |
| 缠魂棒 | 烈焰棒 → 缠魂（75% 概率） | L300 |
| 臭屁瓶 | 粑粑 + 瓶装云 → 搅拌 | L334 |
| 细雪桶 | 水桶 → 缠魂 | L294 |
| 雪球 | 细雪桶 + 圆石 → 5x 雪球 + 桶 | L297 |
| 凋零骷髅头 | 玩家头 → 缠魂 | L343 |

### 切石机加强
- 铁门 → 3x 铁栏杆
- 大齿轮 → 小齿轮
- 大水车 → 水车
- 齿轮 → 传动杆
- 南瓜 → 雕刻南瓜

### 光源合成
- 火把 x1-9 → 对应亮度 1-9
- 灯笼 x1-6 → 对应亮度 10-15

### 斩切刀锻造升级
- 农夫乐事刀 + 对应材料 + `rainbow:cleaver_upgrade` → 对应 dungeon 斩切刀（锻造台）

---

## 标签系统

> 实现：[server_scripts/Tag.js](server_scripts/Tag.js)

### 物品标签
| 标签 | 内容 |
|------|------|
| `rainbow:food` | 所有食物（`global.foodlist`） |
| `curios:charm` | create 背罐、皇家法杖、死亡之眼、剑群护符、号角、虚空蠕虫之眼、冰茶 |
| `curios:back` | TNT/破片炸弹/孢子炸弹/末地烛/精灵/全部 16 种旗帜 |
| `curios:head` | 煎锅/饕餮之锅/金切肉刀/篮子 |
| `skillwheel:skills` / `skillwheel:skills_ui` | 全部 21 个技能饰品 + 邪恶面具 |
| `skillwheel:submenu` | 天琴座 |
| `minecraft:arrows` | 霜冻箭/铅弹/TNT箭/毒性箭/幽匿箭/下界之声/空爆箭/虚空箭 |
| `rainbow:monster_meat` | 怪肉 |
| `rainbow:docker` | 4 种后室发射器 |
| `rainbow:oldbook` | 古籍（`quark:ancient_tome`） |
| `rainbow:food_tooltip` | 自动提示标签（atmospheric/cavedelight/dungeonsdelight/species） |
| `rainbow:pika` | 回旋镖（pickarang/flamerang） |
| `offhandattack:is_duel` | 刀具 |
| `offhandattack:is_hands` | 棒球棍/斩首剑/强力棒球棍 |
| `rainbow:venison` | 鹿肉（raw_venison/venison） |

### 方块标签
| 标签 | 内容 |
|------|------|
| `create:chest_mounted_storage` | 全部 quark 箱子（17 种）+ 虚空箱 |
| `rainbow:void_ore_replaceable` | 末地石 |
| `rainbow:archaeology` | 可疑的沙子/沙砾/灵魂沙等 6 种 |
| `rainbow:corundum_cluster` | 全部 9 种刚玉簇 |

---

## Ponder 场景

> 实现：[client_scripts/ponder.js](client_scripts/ponder.js)

- 衣壳体（`alexsmobs:capsid`）的思索场景——展示如何右键放入物品

---

## 声音系统

> 实现：[startup_scripts/sound.js](startup_scripts/sound.js)

自定义声音注册，包括：
- `rainbow:voice.skillwheel` - 技能轮盘通用音效
- `rainbow:voice.eye_of_satori` - 觉之瞳音效
- `rainbow:voice.whistle` - 战壕哨音效
- `rainbow:voice.null` - 空音效（天琴座）
- `rainbow:voice.inspiration` - 天琴座·鼓舞
- `rainbow:voice.improvement` - 天琴座·战曲
- `rainbow:voice.sonatina` - 天琴座·小奏
- `rainbow:voice.the_end` - 天琴座·终曲
- `rainbow:voice.tenshi` - 迷你月球音效

---

## 全局常量

> 启动常量：[startup_scripts/CONST.js](startup_scripts/CONST.js)
> 服务器常量：[server_scripts/CONST.js](server_scripts/CONST.js)
> 客户端常量：[client_scripts/CONST.js](client_scripts/CONST.js)

- `global.foodlist` - 所有食物 ID 列表
- `global.swordlist` - 所有剑 ID 列表
- `global.attributes` - 所有属性 key 列表
- `global.deathRecords` - 死亡记录
- `global.isEnabled` - UI 引导提示开关
- `global.SUPER_MECHAISM` - 超精密构件合成成功率
- `global.GeneEffectMap` - 基因效果映射表
- `global.CURIONUMBER` - 饰品栏数量
- `global.CURSES` - 诅咒附魔列表（消失诅咒 + 绑定诅咒）
- `global.NEWFILENUMBER` - 新文件计数器
- `global.MAX_STORAGE` - 最大存储量
- `global.biomelist` - 群系列表（60+ 群系，UTF+ 引用）
- `global.COLORS` - 颜色映射（包括 16 种标准色 + link/aqua 等扩展色）
- `global.allEnchantments` - 全部附魔注册表导出

---

## 方块交互机制

> 实现：[server_scripts/discord.js](server_scripts/discord.js)、[server_scripts/BlockEvents.js](server_scripts/BlockEvents.js)

### 发射器末影珍珠骑乘
发射器发射末影珍珠时，同时生成一个 `falling_block`（伪装成发射器）骑乘在珍珠上飞行。

> [server_scripts/discord.js#L35-L63](server_scripts/discord.js#L35-L63)

### Create 扳手旋转原版红石方块
手持 `create:wrench` 右键活塞/发射器/投掷器/漏斗/观察者/中继器/比较器，按 Create 逻辑旋转方向。

> [server_scripts/discord.js#L65-L125](server_scripts/discord.js#L65-L125)

### Shift+右键调整音符盒音调
潜行右键音符盒降低一个半音，播放声音和音符粒子。

> [server_scripts/discord.js#L128-L172](server_scripts/discord.js#L128-L172)

### 虚空矿石传送机制
挖掘虚空矿 80% 概率传送到周围末地石位置。

> [server_scripts/discord.js#L200-L241](server_scripts/discord.js#L200-L241)

### Create 流体管道窗口切换
空手右键 `create:encased_fluid_pipe` 切换管道窗口开关。

> [server_scripts/BlockEvents.js#L104-L121](server_scripts/BlockEvents.js#L104-L121)

### Boss 召唤
手持对应钥匙右键核心方块召唤 Boss：
- `rainbow:organ_core` + `rainbow:core_key` → 无限傀儡
- `rainbow:brood_eetle_core` + `rainbow:brood_eetle_key` → 末影甲壳虫

> [server_scripts/BlockEvents.js#L59-L62](server_scripts/BlockEvents.js#L59-L62)

### 捏雪球
空手右键雪块/雪层获得雪球（消耗 1 饱食度）。

> [server_scripts/BlockEvents.js#L66-L68](server_scripts/BlockEvents.js#L66-L68)

### 切洋葱效果
在砧板上切洋葱/巨型洋葱时，攻击半径内恶魂、转化黑曜石为哭泣黑曜石。

> [server_scripts/BlockEvents.js#L72-L79](server_scripts/BlockEvents.js#L72-L79)

### 天空竞技场祭坛
右键祭坛自动设置 `rainbow:gauntlet` 唱片。

> [server_scripts/BlockEvents.js#L96-L99](server_scripts/BlockEvents.js#L96-L99)

### 远程标靶信号器
潜行右键靶子绑定坐标和维度，跨维度远程发送红石信号。

> [server_scripts/BlockEvents.js#L254-L284](server_scripts/BlockEvents.js#L254-L284)

### 末影 Docker 绑定
潜行右键绑定玩家 UUID，Shift+右键循环切换 6 种模式，普通右键显示绑定信息。

> [server_scripts/docker/docker_interaction.js](server_scripts/docker/docker_interaction.js)

---

## 杂项机制

### 核弹侦测
> [server_scripts/EntityEvents.js#L82-L89](server_scripts/EntityEvents.js#L82-L89)

当 `alexscaves:nuclear_bomb` 实体生成时，服务器广播和日志输出坐标警告。

### 实体替换
> [server_scripts/EntityEvents.js#L100-L106](server_scripts/EntityEvents.js#L100-L106)

- `shifted_lens:flying_fish` → 替换为 `alexsmobs:flying_fish`

### 实体禁生成
> [server_scripts/EntityEvents.js#L67-L96](server_scripts/EntityEvents.js#L67-L96)

- 禁止 `youkaisfeasts:deer` 和 `youkaisfeasts:crab` 生成

### 自爆背包
> [server_scripts/EntityEvents.js#L137-L159](server_scripts/EntityEvents.js#L137-L159)

死亡时如果背部饰品栏有爆炸物，自动召唤对应爆炸实体并清空槽位：
- TNT → `minecraft:tnt`
- 破片炸弹 → `oreganized:shrapnel_bomb`
- 孢子炸弹 → `savage_and_ravage:spore_bomb`
- 核弹 → `alexscaves:nuclear_bomb`（播放核弹警报，延迟 2 秒爆炸）

### 黏液棒脱衣
> [server_scripts/EntityEvents.js#L11-L25](server_scripts/EntityEvents.js#L11-L25)

手持黏液棒攻击生物，移除其所有护甲并掉落。

### 撼俑免疫动能伤害
> [server_scripts/EntityEvents.js#L28-L30](server_scripts/EntityEvents.js#L28-L30)

`species:quake` 免疫 `generic` 类型伤害（防止崩溃）。

### 赌徒骰子冷却
> [server_scripts/EntityEvents.js#L165-L175](server_scripts/EntityEvents.js#L165-L175)

击杀生物时根据幸运值概率重置主副手物品冷却。

### 怪物护符狂暴
> [server_scripts/EntityEvents.js#L177-L179](server_scripts/EntityEvents.js#L177-L179)

佩戴怪物猎人勋章击杀生物获得狂暴效果 5 秒。

### 大师球 + 莉莉丝拥抱：灵魂替死
> [server_scripts/EntityEvents.js#L110-L134](server_scripts/EntityEvents.js#L110-L134)

同时佩戴大师球（`rainbow:master_ball`）和莉莉丝之拥时，致死伤害消耗 1 灵魂抵消，回满血量。

### 矿车/船安装
> [server_scripts/ItemEvents.js](server_scripts/ItemEvents.js)

手持箱子右键船 → 转化为箱船；手持箱子/熔炉/TNT/漏斗等右键矿车 → 转化为对应功能矿车。

### 回旋镖抛掷
> [server_scripts/ItemEvents.js](server_scripts/ItemEvents.js)

右键带 `#rainbow:pika` 标签的回旋镖（pickarang/flamerang），自动抛掷背包中所有回旋镖。

### 纸潜行右键
> [server_scripts/ItemEvents.js](server_scripts/ItemEvents.js)

消耗纸获得粑粑（恶搞功能）。

### 月光水晶右键看月亮
> [server_scripts/ItemEvents.js](server_scripts/ItemEvents.js)

获得迷你月球。

### 赏金任务物品检测
> [server_scripts/PlayerEvents.js#L46-L50](server_scripts/PlayerEvents.js#L46-L50)

物品栏变更时自动检测赏金任务物品 `BountyItemEvent(player)`。

### 下界音之器
> tooltip：[client_scripts/tooltips.js#L411-L413](client_scripts/tooltips.js#L411-L413)

`rainbow:docker_nether_on` 收集附近唱片机音乐，产生下界之音。配方使用 `rainbow:docker_nether_off` + 钻石。

### 防化服免疫
> tooltip：[client_scripts/tooltips.js#L414-L417](client_scripts/tooltips.js#L414-L417)

穿戴全套 `alexscaves:hazmat_*` 时免疫中毒、凋零、辐照效果和伤害。

### 村民英雄礼物
> 已注释：[server_scripts/Loot.js#L68-L121](server_scripts/Loot.js#L68-L121)

各职业村民英雄礼物表（已注释）：
- 制箭师 → 鲨鱼牙箭
- 屠夫 → 血肉巧克力慕斯
- 牧师 → 附魔金苹果
- 农民 → 滕州大肉面
- 渔夫 → 鳞甲
- 皮匠 → 熊皮
- 图书管理员 → 精准采集附魔书
- 石匠 → 武器大师勋章
- 武器匠 → 净化绢布
- 工具匠 → 黏液棒

### 切洋葱获得蔬菜皮
> [server_scripts/Recipes.js#L96-L103](server_scripts/Recipes.js#L96-L103)

农夫乐事切洋葱额外产出 `overweight_farming:vegetable_peels`。

### 逻辑数字运算
> [server_scripts/Recipes.js#L460-L494](server_scripts/Recipes.js#L460-L494)

360 个自动生成配方：任意两个逻辑数字 + 运算符 → 计算结果（不可计算时产出 `missingno`）。

### 七彩石材料转化
> [server_scripts/Recipes.js#L449-L451](server_scripts/Recipes.js#L449-L451)

七彩石 + Create 材料 + 岩浆 → 64 个该材料（循环量产）。

### 说明书配方
> [server_scripts/Recipes.js#L194](server_scripts/Recipes.js#L194)

泥土 → Patchouli 百科全书。

### 创造蛋糕
> [server_scripts/Recipes.js#L209](server_scripts/Recipes.js#L209)

`missingno` + `plus` + `plus` → 创造性闪耀蛋糕。