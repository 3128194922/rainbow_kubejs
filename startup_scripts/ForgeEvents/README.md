# ForgeEvents 代码结构说明

本文档说明 `startup_scripts/ForgeEvents` 当前的代码组织方式，便于后续定位逻辑、添加功能和排查启动错误。

适用环境：Minecraft 1.20.1、Forge 47.4.20、KubeJS 6（当前项目使用 KubeJS 2001.6.5）。

## 一、目录关系

```text
startup_scripts/
├─ ForgeEvents.js                 # 根目录事件入口，处理通用事件和部分历史逻辑
└─ ForgeEvents/
   ├─ README.md                   # 本说明文档
   ├─ main.js                     # 战斗事件主入口
   ├─ context.js                  # 事件上下文、伤害类型和 Curios 索引工具
   ├─ tables.js                   # 固定 ID 分发表和转化表
   ├─ ForgeEvent.js               # 实体加入世界、召唤位置处理
   ├─ handleFireworkDash.js       # 烟花拳套冲撞和撞墙伤害
   ├─ handleAttackWeapon.js       # 攻击事件中的武器逻辑
   ├─ handleAttackCurios.js       # 攻击事件中的饰品逻辑
   ├─ handleItemAttributeModifier.js # 物品动态属性修改
   ├─ handleProjectileIFrame.js   # 抛射物无敌帧处理
   ├─ handleBackstabDamage.js     # 背刺伤害
   ├─ handleFreezeEffects.js      # 冻结效果
   ├─ handleWeaponEffects.js      # 受伤时的武器特效
   ├─ handleCuriosEffects.js      # 受伤时的饰品特效
   ├─ handleDespairInsigniaDeath.js # 极限证相关受伤逻辑
   ├─ handleTheBible.js           # 圣经伤害抵消
   ├─ handleBigStomach.js         # 大胃袋伤害抵消
   ├─ handleCoreCharging.js       # 核心充能和狂怒面具逻辑
   ├─ handleNonPlayerDamage.js    # 非玩家攻击者伤害处理
   ├─ customAttributeDamage.js    # 自定义伤害属性
   ├─ onBeforePlayerHurt.js       # 玩家受伤前逻辑
   ├─ onBeforeNonPlayerHurt.js    # 非玩家受伤前逻辑
   ├─ onBeforeNonEntityHurt.js    # 通用实体受伤前逻辑
   ├─ onPlayerHurt.js             # 玩家受伤逻辑
   ├─ onNonPlayerHurt.js          # 非玩家受伤逻辑
   ├─ onEntityHurt.js             # 通用实体受伤逻辑
   ├─ onPlayerDamaged.js          # 玩家受伤后逻辑
   ├─ onNonPlayerDamaged.js       # 非玩家受伤后逻辑
   └─ onEntityDamaged.js          # 通用实体受伤后逻辑
```

`startup_scripts` 会自动加载脚本，不需要在 `main.js` 中手动 `import` 其他文件。这里的“主入口”是项目代码组织约定：事件注册集中在入口，具体功能放在处理器文件中。

## 二、事件入口

### 1. `ForgeEvents/main.js`

这是战斗相关的核心事件入口，当前注册以下事件：

| 事件 | 处理内容 |
| --- | --- |
| `LivingAttackEvent` | 受伤前判定，区分玩家、非玩家和通用实体逻辑 |
| `LivingHurtEvent` | 伤害计算过程中的武器、饰品、背刺、冻结、自定义属性等逻辑 |
| `LivingDamageEvent` | 伤害结算后的玩家、非玩家、通用实体及伤害抵消逻辑 |
| `AttackEntityEvent` | 玩家攻击实体时的武器和攻击饰品逻辑 |
| `ItemAttributeModifierEvent` | 物品动态属性修改 |

伤害事件的执行顺序应视为功能契约，不要随意调整：

```text
LivingAttackEvent
└─ createDamageContext
   ├─ 玩家/非玩家受伤前处理
   └─ 通用受伤前处理

LivingHurtEvent
└─ createDamageContext
   ├─ 抛射物无敌帧
   ├─ 背刺
   ├─ 极限证
   ├─ 冻结、武器、饰品特效
   ├─ 玩家/非玩家受伤处理
   ├─ 通用实体受伤处理
   ├─ 非玩家攻击者伤害处理
   ├─ 自定义属性伤害
   └─ 核心充能

LivingDamageEvent
└─ createDamageContext
   ├─ 玩家/非玩家受伤后处理
   ├─ 通用实体受伤后处理
   ├─ 圣经伤害抵消
   └─ 大胃袋伤害抵消
```

### 2. `startup_scripts/ForgeEvents.js`

该文件位于 `ForgeEvents` 文件夹外，是同一启动阶段的另一个事件入口，主要负责：

- 玩家放置方块、破坏速度和右键实体。
- 实体仇恨变更。
- 药水效果添加、移除和过期。
- 虚空物品转化。
- 睡觉事件。
- 合并后的 `LivingDeathEvent`：宝箱吊坠、大师球、兽性面具。
- 极限闪避事件和写轮眼冷却恢复。

旧盾反监听目前只保留占位和历史注释，实际逻辑位于 `startup_scripts/shield_parry/main.js`，不要在两个位置重复实现。

### 3. 其他事件入口

- `ForgeEvent.js`：注册 `EntityJoinLevelEvent`，负责实体召唤和安全生成位置。
- `handleFireworkDash.js`：注册 `LivingTickEvent`，处理烟花拳套冲撞状态。

## 三、上下文和分发表

### `context.js`

伤害入口首先创建事件上下文，处理器优先读取上下文中的缓存数据：

- `createDamageContext(event)`：缓存受害者、攻击者、伤害来源、伤害类型及玩家/伤害类型标记。
- `createAttackContext(event)`：缓存攻击者、目标、主手和副手物品。
- `buildCurioIndex(player)`：在当前事件内扫描一次 Curios，并按物品 ID 建立索引。
- `getContextCurioStack(...)` / `hasContextCurio(...)`：读取事件内的饰品缓存。
- `isForgeDamageType(...)`：通过字典判断伤害类型分组。

Curios 索引只在当前事件中使用，不跨 tick 缓存，避免玩家更换饰品后读取到旧数据。同一个物品 ID 出现多次时，当前索引保留第一次找到的物品。

### `tables.js`

用于存放不会频繁变化的 ID 映射：

- 药水效果添加、移除、过期处理代码。
- 防化服免疫效果表。
- 虚空炼成输入和输出表。
- 攻击武器和攻击饰品的分发代码。

文件夹内脚本可以使用本目录的常量；根目录的 `ForgeEvents.js` 通过 `global.FORGE_*` 读取表，符合项目的跨目录调用约定。

## 四、功能处理器分类

### 攻击入口

- `handleAttackWeapon.js`：泰拉刃、动力剑、决斗剑。通过物品 ID 查表后使用 `switch` 分发。
- `handleAttackCurios.js`：末影手套、生灵手套、天秤座、点金手套、流浪软糖包。复用攻击事件的 Curios 索引。

### 受伤前

- `onBeforePlayerHurt.js`：玩家专属的伤害前判定。
- `onBeforeNonPlayerHurt.js`：非玩家实体专属的伤害前判定。
- `onBeforeNonEntityHurt.js`：不区分受害者类型的伤害前判定。

### 受伤过程中

- `handleProjectileIFrame.js`：抛射物命中后的无敌帧处理。
- `handleBackstabDamage.js`：背后攻击判定和伤害倍率。
- `handleFreezeEffects.js`：冻结时长、体积和贴图效果。
- `handleWeaponEffects.js`：武器触发的受伤效果。
- `handleCuriosEffects.js`：饰品触发的受伤效果。
- `handleDespairInsigniaDeath.js`：极限证相关伤害逻辑。
- `onPlayerHurt.js` / `onNonPlayerHurt.js` / `onEntityHurt.js`：按受害者类型分发受伤逻辑。
- `customAttributeDamage.js`：自定义伤害属性和伤害类型修正。
- `handleNonPlayerDamage.js`：非玩家攻击者、驯服关系和宠物伤害处理。
- `handleCoreCharging.js`：充能核心、狂怒面具等累计伤害逻辑。

### 伤害结算后

- `onPlayerDamaged.js`：玩家受伤后的处理。
- `onNonPlayerDamaged.js`：非玩家实体受伤后的处理。
- `onEntityDamaged.js`：通用实体受伤后的处理。
- `handleTheBible.js`：纹饰盔甲伤害抵消。
- `handleBigStomach.js`：消耗饱和度抵消伤害。

## 五、后续新增功能流程

### 新增一个伤害效果

1. 判断逻辑属于“受伤前、受伤中还是结算后”。
2. 在 `ForgeEvents/` 新建单一职责处理器，定义一个 `function`。
3. 在 `main.js` 对应事件的正确位置调用处理器。
4. 重复使用的伤害类型放入 `context.js` 的分组表。
5. 重复使用的固定物品/效果 ID 放入 `tables.js`，不要在多个处理器中重复写判断。
6. 需要访问玩家饰品时优先使用 `context`，不要在同一个事件里反复调用 `hasCurios`。

### 新增一个普通 Forge 事件

- 战斗事件：优先放入 `main.js`，只保留一个事件入口。
- 实体加入世界：放入 `ForgeEvent.js`。
- 独立 tick 功能：放入对应的 `handle*.js`，并在文件内注册事件。
- 根目录 `ForgeEvents.js` 只用于已有的通用/历史入口，避免继续扩大成为新的巨型文件。

## 六、编码约定

- 当前版本是 KubeJS 6 / Forge 1.20.1，新增 API 前先确认本地版本支持。
- 常量和全局变量使用 `const`，局部变量使用 `let`。
- 不使用 `?.` 可选链语法。
- `Java.loadClass` 只能写在对应目录的 `CONST.js` 中。
- 关键变量和外部 API 调用使用 `try/catch`，错误通过 `console.log` 输出。
- 不要修改已有注释掉的代码；如果现行注释描述已过时，修改为最新说明。
- 不要在事件前部随意使用 `event.cancel()`，因为它会直接中断后续处理。
- 获取时间使用 `level.getTime()`，不要使用 `level.gameTime`。
- `Math.PI` 在当前 Rhino 环境不可依赖，需要圆周率时使用数值常量。
- 功能涉及物品或饰品时，同时检查 `client_scripts/tooltips.js` 是否需要补充说明。

## 七、验证清单

`startup_scripts` 修改后必须重启游戏，不是只执行 `/reload`：

1. 重启客户端或服务端。
2. 检查 `logs/kubejs/startup.log`。
3. 进入存档后执行 `/kubejs errors`。
4. 实际触发新增或修改的 Forge 事件。
5. 检查客户端与服务端是否都没有异常日志。

本目录的本地静态测试可在 `kubejs/` 根目录执行：

```text
node --test tests/*.test.js
```

测试文件位于 `tests/`，主要覆盖上下文缓存和固定 ID 分发表；它不能替代 Minecraft 实际运行验证。
