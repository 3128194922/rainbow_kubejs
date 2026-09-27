# 使徒实体设计方案

## 目标

在 Rainbow Power 的 KubeJS 6 / Forge 1.20.1 环境中新增 `rainbow:apostle` 使徒实体。实体以村民为原型，使用提供的参考图配色与形状；由 EntityJS 注册和渲染，AI 与攻击逻辑由服务端 KubeJS 驱动。

## 版本与参考依据

- 实例：Minecraft 1.20.1、Forge 47.4.20、KubeJS 2001.6.5、EntityJS 0.6.6。
- EntityJS 实体既有注册位于 `startup_scripts/Registry/Registry_entity.js`；项目资源使用 `rainbow:geo/entity/...` 与 `rainbow:textures/...`。
- Youkai-Homecoming 的 `RemiliaSpell` 以周期扇形散射为主；`KisinSpell` 使用定点/延迟后朝目标发射的弹幕。只移植可读的出招节奏，不依赖 Youkai 模组本身或其弹幕专用实体、客户端网络系统。

## 资源与脚本边界

- `startup_scripts/Registry/apostle/main.js`：注册 `rainbow:apostle` 与一个便于测试/召唤的刷怪蛋；引用模型、贴图和服务端跨目录回调。
- `server_scripts/apostle/main.js`：仅在服务端 tick 执行目标选择、距离控制、弹幕轮换，并通过本地函数封装各项行为；供 startup 脚本调用的入口放到 `global`。
- `startup_scripts/CONST.js` 与 `server_scripts/CONST.js`：只在需要时集中增加 Java 类加载，不在功能文件直接调用 `Java.loadClass`。
- `assets/rainbow/geo/entity/apostle.geo.json` 与 `assets/rainbow/textures/entity/apostle.png`：Blockbench 产出的 EntityJS/GeckoLib 可用几何体和贴图；同时保留可编辑的 Blockbench 工程文件。
- 如果弹体需要独立 EntityJS 类型，则其注册与伤害/命中回调和使徒注册放在同一 startup 功能入口；AI 发射逻辑仍在 `server_scripts/apostle/main.js`。

## 行为

- 使徒为敌对实体，寻敌范围 32 格，候选目标为玩家与 `Monster` 类敌对怪物，始终使用最近的有效目标。
- 目标距离小于 12 格时后撤；大于 20 格时接近；在 12–20 格之间横向移动以维持间距。失去目标时停止战斗移动。
- 每 20 tick 轮换一次攻击：扇形散射与延迟瞄准弹。延迟招式先在目标附近生成短暂预警弹，再在预定延迟结束时按目标当时位置瞄准发射。所有弹体仅由服务端生成，命中敌方目标造成 2 点伤害，命中方块或经过 60 tick 后移除。
- 目标选择和弹体伤害需排除使徒自身、已死亡实体与同类使徒，避免自伤/同类误伤；没有有效目标时不发射。

## 实现约束

遵守根目录 `AGENTS.md`：KubeJS 6 Rhino 语法；跨脚本目录只通过 `global`；新增脚本按功能目录组织且以 `main.js` 为入口；新增或变更代码附中文注释；关键入口捕获异常并 `console.log`；明确判断 `level.isClientSide()`；不修改现存注释。模型应匹配 EntityJS 实际读取的格式，不能将普通 Java Blockbench 模型误当作 GeckoLib 几何体。

## 验收范围

静态检查 EntityJS 注册路径、资源引用、目录命名和脚本语法；检查弹幕只服务端生成并具有明确生命周期和伤害归属。最终仍需游戏内重启后 `/summon rainbow:apostle` 与真实战斗确认模型显示、寻敌、间距和命中效果；静态检查不替代运行时验证。
