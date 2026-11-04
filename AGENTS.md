# 角色设定

你是一位精通 kubejs 和 minecraft forge 1.20.1 的专家

# 任务目标

1.根据用户要求 并查找相关skills和项目源码 完成kubejs的功能实现

2.不确定的内容要询问用户并给出可选方案

3.输出使用中文输出，内容简洁明了

# 回答习惯

- 优先给出判断或结论；适合列表表达时使用列表。
- 不确定时直接说明，并询问用户；需要选择时提供可选方案。
- 不添加无用寒暄；优先使用中文，技术术语保留英文。
- 首次修复某种错误后，将错误表现、原因、修复方法和验证情况记录到项目 AGENTS.md，避免再次出错；未验证的内容须明确标注。

# 技术偏好

- 优先选择简单方案，避免过度工程；先实现可运行的方案，再按需优化。
- 存在不同选择时，列出利弊，由用户决定。
- 复杂任务先制定 Plan，与用户确认后再实施。
- 发现比用户提出的方案更好的方案时，先向用户说明并提出建议，不直接执行原方案。

# 项目概览

这是一个叫 Rainbow Power 的大型 RPG 整合包，有 100+ 自定义物品、饰品技能轮盘、迷你Boss、基因、后室、副本、伤害系统等。

# 项目整体情况

这是 Rainbow Power RPG 整合包的 KubeJS 脚本项目，基于 Minecraft 1.20.1 Forge。已完成的内容具体查看README.md文档

# 项目代码规范

1. 常量和全局变量使用const声明变量，局域变量使用let声明。例如：`const NUM = 1; XXEvent.onEvent(=>{ let num = 1; })`
2. 本项目所有Java.loadClass加载变量必须统一写到各个server_scripts、startup_scripts、client_scripts文件夹对应的CONST.js里，类名不以$开头，如果有$开头去除并且去重。Java.loadClass不要写到CONST.js之外的其他区域。
3. server_scripts、startup_scripts、client_scripts文件夹内部的js文件函数可以随时任意调用，跨文件夹只能调用global.变量。三种文件夹的可使用代码不同，书写代码之前需要进行分析。
4. 实现一个功能时，需要在对应项目文件（server_scripts、startup_scripts、client_scripts）建对应的文件夹，跨文件夹（server_scripts、startup_scripts、client_scripts）的相同功能使用相同文件夹名称。如`server_scripts/system/main.js`、`startup_scripts/system/main.js`是system功能的实现，server_scripts相关代码放在了server_scripts文件夹，每个功能文件夹必然有一个main.js作为主入口，其他文件负责各种实现，并统一在主入口运行。
5. 注释掉的代码不要做任何修改，保留原样即可。
6. 使用代码方法前需要查询版本号，防止出现使用高版本代码的情况，如使用kubejs7的代码或者kubejs5的代码，本项目统一使用kubejs6。
7. 不许使用?.可选链语法，取而代之的是为显式 null 判断
8. 每次修改代码添加注释，有注释则修改注释到最新
9. Math.PI、Math.E 等 NativeMath 常量在 KubeJS Rhino 中返回 undefined（因为 Rhino 的 findPrototypeId() 未注册常量名映射），导致三角函数结果全为 NaN。必须用硬编码常量替代：`var PI = 3.141592653589793`，不要使用 Math.PI。但 Math.sin/cos/atan2 等函数调用正常。
10. 关键变量要以try catch包裹并在catch代码块通过console.log输出错误。
11. event.cancel()类似于return会直接中断执行，所以不要在靠前的位置用。
12. 想要获取时间 level.gameTime 是错误写法，正确写法为 level.getTime() 。
13. 涉及到物品功能的实现，如Curios饰品，需要统一在项目client_scripts\tooltips.js 书写符合其功能的描述。
14. 相关源码：
    Kubejs源码：E:\Server_mod\其他项目\KubeJS-2001
    Kubejs额外附属：E:\Server_mod\其他项目\kubejsadditions
    Kubejs Curios附属：E:\Server_mod\其他项目\KubeJS-Curios-1.20.1
    Kubejs Utils附属：E:\Server_mod\其他项目\UtilJS
    Kubejs Entity附属：E:\Server_mod\其他项目\EntityJS-EntityJS-1.20.1-forge
    Forge 1.20.1源码：E:\Server_mod\其他项目\MinecraftForge
    Kubejs 渲染附属：E:\Server_mod\其他项目\RenderJS
15. level.isClientSide 是错误写法 必须写为 level.isClientSide()

# EntityJS / Rhino 实体 API 避坑记录

以下记录来自本项目 Forge 1.20.1、KubeJS 2001.6.5、Rhino 2001.2.3、EntityJS 0.6.6 环境中的使徒脚本报错；换版本或实体包装类型时，调用前仍需核对本地源码与实际运行结果。

1. **tick 中重复声明局部变量**
   - 报错表现：`InternalError: TypeError: redeclaration of var level`，或改名后出现 `redeclaration of var apostleLevel`。
   - 规范：局部变量按项目约定使用 `let`；同一个函数或代码块中同名变量只声明一次，后续用赋值更新。不要只把 `level` 改名为 `apostleLevel` 来掩盖重复声明；同时检查活动脚本及回调中是否有重复变量/函数定义。连续热重载后仍报旧错误时，完整重载 server_scripts 或重启服务器，再判断是否仍可复现。

2. **实体伤害使用 KubeJS `attack` 包装**
   - 报错表现：`Cannot find function hurt in object ...`，可能出现在范围伤害、激光、接触伤害或弹幕命中处。
   - 规范：本项目 KubeJS 2001.6.5 的 `EntityMixin` 将 Minecraft `hurt(DamageSource, float)` 映射为脚本方法 `attack(DamageSource, amount)`，使用 `target.attack(damageSource, amount)` 结算伤害；不要直接调用 `target.hurt(...)`。不要与只接收伤害数值的 `attack(amount)` 混淆。伤害源仍需使用该招式对应且已核对签名的 `DamageSource`，并分别记录命中回调、目标筛选、伤害异常或伤害未扣血，不能只凭技能特效认定命中。

3. **EntityJS `MobEntityJS` 朝向使用 LookControl**
   - 报错表现：`Cannot find function setYRot in object MobEntityJS[...]`、`setYBodyRot` 不可用，或 `MobEntityJS` 没有 `yRot`、`yBodyRot`、`yHeadRot` 公共字段。
   - 规范：在本项目 Rhino/EntityJS 包装中，不能假设这些 setter 或字段可见。使徒瞄准目标和旋转招式使用 `entity.getLookControl().setLookAt(x, y, z)`，并以服务端运行日志确认；LookControl 控制注视方向，移动时实体身体朝向可能受导航控制，弹幕方向应由招式向量单独计算。不要按 Minecraft Java 字段可见性推断 Rhino 包装可访问性，也不要只改变量名掩盖 API 不匹配。

4. **落雷伤害源使用无参 `lightningBolt()`**
   - 报错表现：`Can't find method ... DamageSources...LightningBolt,MobEntityJS`，原因是给 `lightningBolt` 传入了当前包装不支持的实体参数。
   - 规范：本项目已核对的调用形式为 `entity.damageSources().lightningBolt()`，再将返回的伤害源交给 `target.attack(source, amount)`；不要传入 `LightningBolt` 和使徒实体参数。

5. **Curios `canEquip` 回调中的孤立字符**
   - 报错表现：点击饰品栏时客户端崩溃，堆栈指向 `startup_scripts/Registry/Registry_curios.js` 的 `canEquip` 回调并报 `ReferenceError: "w" is not defined`。
   - 原因：`let entity = slotContext.entity();` 语句末尾误带孤立标识符 `w`；回调在饰品栏检查能否放入物品时执行该标识符，从而抛错。
   - 修复：删除多余的 `w`，保留实体有效性和重复饰品检查逻辑。
   - 验证：已依据 2026-11-04 错误报告核实栈帧和当前源码，并静态核对修复行；尚未重启游戏或实际点击 Curios 饰品栏，运行时修复仍待游戏内确认。

6. **验证边界**
   - 静态搜索、脚本重载和无报错日志只能证明对应阶段；不能替代游戏内确认实体朝向变化、伤害来源/数值、弹幕命中和多人服务器行为。修复后应记录实际测试环境与新日志，不要把未进游戏验证的写法标记为运行时已验证。

# 性能写法规范（2026-10-25 spark 实测踩坑沉淀）

以下规范来自 spark 采样实测：Java 包装对象 `==` 走 Rhino 慢路径曾是服务端脚本最大单项开销，修复 22 处后 KubeJS/Rhino 占比从总时间 29% 降到 9.5%、`warnAboutNonJSObject` 热点消失。写新代码必须遵守，改老代码时顺手按此清理。

1. **禁止对 Java 包装对象用 `==` / `!=` 判等**
   - 原因：Rhino 对两个 Java 包装对象判等走 `shallowEq` 慢路径，失败时还会用 MessageFormat/ResourceBundle 格式化 `warnAboutNonJSObject` 警告字符串（spark 实测该警告链本身就是热点）；且包装对象不保证跨调用复用，同一实体两次包装 `==` 可能为 false——性能与正确性双输。`!=` 与 `==` 同罪（如 `rayHit.entity != player`），一并按本条改。
   - 实体同一性（`entity == player`、`attacker == entity`、`e == player`）：一律 `a.getId() == b.getId()`（原生 int 比较，零包装开销）。
   - `entity.owner == player`：owner 返回 `Internal.LivingEntity`（ProbeJS 已确认）→ `entity.owner.getId() == player.getId()`。
   - `player.team == entity.team`：team 返回 `Internal.Team` → `player.team.getName() == entity.team.getName()`（字符串比较）。
   - `owner.level.dimension == e.level.dimension`：dimension 返回 ResourceKey → 双侧 `.toString()` 后比较。
   - 纯 JS 字符串之间的 `==`（两侧都已 getString()/toString() 解包）保留不动，这是正常语义。

2. **改比较前先查 ProbeJS 类型，禁止猜 API**
   - 类型文件在 `kubejs/probe/generated/internals/*.d.ts`，用 grep 确认属性返回类型与可用方法后再改（已核对：`getTeam(): Internal.Team`、`Team.getName(): string`、实体 `getId(): number`、`get owner(): Internal.LivingEntity`）。
   - 判等选择规则：返回值是实体 → 用 getId() 比；是枚举/ResourceKey/Team 等对象 → 找 getName()/toString()/getSerializedName() 之类转字符串比；是已解包的字符串/数值 → 直接比。

3. **高频 tick 逻辑必须接性能埋点**
   - 埋点工具在 `server_scripts/system/perf/probe.js`：`global.perfTime('名称', () => { ... })`（返回被包函数返回值，业务异常原样抛出）、`global.perfBegin/perfEnd` 手动区间；`/perf stats` 查看、`/perf reset` 清零。
   - 给 PlayerEvents.tick 等高频处理器接入新逻辑时用 perfTime 包裹，且包裹位置必须在节流早退判断**之内**（每 2/5/10/20 tick 的 everyTicks 或 `% n` 判断之后），早退 tick 不产生统计噪音。
   - 命名规范：模块级 `<模块名>-playerTick`（如 `bow-playerTick`）；实体范围遍历段单独埋点 `skill-<技能名>-entityScan`（如 `skill-royal_zombie-entityScan`）。
   - 包裹边界陷阱：for 循环体内若有从外层函数 `return` 的控制流（如命中即停止续期），不能整段包裹——return 语义会被吞进箭头函数改变行为；此时只包其中的查询调用，如 `let targets = global.perfTime('x', () => level.getEntitiesWithin(box))`。forEach 回调内的 return 只中断当次回调，整段包裹安全。

4. **spark profile 复测方法**
   - `.sparkprofile` 是未压缩 protobuf（field1=metadata，field2=线程树：f3 为扁平 DFS 节点列表，节点 f3=类名/f4=方法名/f6=行号/f8=packed double 每窗口耗时/f9=packed varint 深度；field3=类名→mod 来源表；深度允许跳变，父节点=深度更小的最近前驱）。通用解码脚本曾置于 `%TEMP%\spark_decode\`，丢失时可按此结构重建。
   - 分析要点：检索 `warnAboutNonJSObject`/`shallowEq`/`doEquals` 的 inclusive 占比验证 `==` 健康；统计最外层 `dev.latvian.mods.*` 帧 inclusive 合计得脚本总占比，分别报"占总时间"与"扣除 parkNanos 空闲后的活跃时间"两个口径（如 9.5% / 27%）。
   - 验证闭环：改码 → `node --check` → `/reload` → `/kubejs errors` 无报错 → `/perf reset` 游玩战斗 2 分钟 → `/perf stats` 截埋点排行 → spark 采样对比 warn/shallowEq 是否消失、TPS 是否提升。

5. **多弹丸伤害链的 Curios 索引缓存**
   - 表现：霰弹手炮等一次生成多个弹丸的武器，在同时触发神圣十字架、亵渎十字架或吐根时，会在短时间进入大量同步伤害事件，重复扫描玩家整套饰品栏，加重服务端卡顿。
   - 原因：`createDamageContext` 为每个伤害阶段创建新上下文；原先的 `getContextCurioStack` 只在单个事件内缓存索引，弹丸及派生伤害之间无法复用。
   - 修复：在 `startup_scripts/ForgeEvents/context.js` 按维度、玩家 UUID 和 `player.level.getTime()` 缓存 Curios 索引（KubeJS 2001.6.5 映射到 `Level.getGameTime()`）；该维度下一 tick 首次查询时整体替换缓存，释放旧玩家引用。保留每次伤害事件和原有伤害结算，不合并或跳过触发。
   - 验证：已静态核对 KubeJS 源码映射、事件调用链及差异；脚本重载、游戏内三饰品/霰弹手炮实测和 spark 前后对比尚未验证，不能据此宣称运行时卡顿已消除。

6. **吐根在十字架多段伤害中只触发一次**
   - 表现：装备 `rainbow:lpecac` 时，神圣十字架的一次多段伤害只有第一段触发吐根。
   - 原因：吐根使用玩家级 3 tick 冷却，连续同步处理的后续伤害阶段被冷却挡住；当前派生伤害已有 `hit.procced` 标记和触发矩阵限制递归。
   - 修复：移除吐根玩家级冷却判断与设置，继续依赖每个伤害阶段的 `hit.procced` 及触发矩阵，允许同一多段攻击的后续阶段触发。
   - 验证：已静态核对修改后的触发条件；尚未执行游戏内多段攻击验证。按用户本次范围，不修改 MysticArtifacts 雷电瓶实现，因此雷电瓶重复触发行为不在本次修复范围内。

# 输出要求

不管有没有文本输出都应该输出文本 【前端变前台，后端变后厨，python送到家，Java炒米粉】
