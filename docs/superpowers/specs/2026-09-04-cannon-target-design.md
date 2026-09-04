# CBC 炮击标定器设计

## 目标

新增 `rainbow:cannon_targeter` 物品：玩家潜行右键 Create Big Cannons 的炮台底座时绑定底座；普通右键投出独立目标实体，目标实体落地或命中后驱动绑定火炮瞄准并开火。

现有 `rainbow:kuchiyose_scroll` 仅作为实体保留，不注册同名物品，也不复用其实体逻辑。

## 运行环境与兼容范围

- Minecraft 1.20.1、Forge 47.4.20、KubeJS 2001.6.5（KubeJS 6）。
- 支持 `createbigcannons:cannon_mount` 与 `createbigcannons:fixed_cannon_mount`。
- 仅服务端执行绑定、实体投掷、瞄准和开火；客户端只负责 tooltip。

## 数据与流程

1. 物品注册为不可堆叠基础物品，复用现有 `rainbow:item/beacon_ball` 纹理。
2. 潜行右键两个 CBC 底座时，将维度、X/Y/Z 与底座类型写入物品 NBT，并取消底座默认交互。
3. 普通右键时，若物品已绑定底座，则生成独立的 `rainbow:cannon_target_marker` 非生物实体；实体沿玩家视线移动，并保存绑定物品的目标信息。
4. 目标实体首次碰撞方块、碰撞实体或达到寿命时，以自身位置作为目标点：
   - 普通垂直炮台按 CBC 的内部 yaw/pitch 基准换算并调用 `setYaw`、`setPitch`；
   - 固定炮台按其 ±45° 调节槽换算并通过 `readFromClipboard` 写入；
   - 标记方块更新后调用 `getContraption().tryFiringShot()`。
5. 炮台未组装、绑定维度不存在、区块未加载或实体失效时提示玩家并安全结束，不消耗物品。

## 文件边界

- `startup_scripts/Registry/Registry_item.js`：注册新物品，不注册 `rainbow:kuchiyose_scroll` 物品。
- `startup_scripts/Registry/Registry_entity.js`：注册目标实体，保留现有通灵卷轴实体。
- `server_scripts/cannon_target/main.js`：绑定、投掷、实体生命周期、角度计算与开火。
- `client_scripts/tooltips.js`：显示使用方式和当前绑定坐标。
- `tests/cannon_target.test.js`：测试纯角度换算、绑定数据校验和边界行为。

## 错误处理与验证

- 关键 Java/KubeJS 调用使用 `try/catch`，异常通过 `console.log` 输出。
- 遵守项目 Rhino 约束：不使用可选链，不使用 `Math.PI`，时间使用 `level.getTime()`。
- 先运行静态测试观察失败，再实现最小逻辑并运行全部相关测试；最后检查启动脚本语法、注册 ID 和工作区差异。
