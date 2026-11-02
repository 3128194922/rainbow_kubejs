# 测试客户端性能记录（2026-10-29）

## 环境与场景

- 独立 `test_client`，Minecraft 1.20.1、Forge 47.4.28、Java 17，最大堆 6 GiB；启动器统计 194 个 JAR，游戏主菜单显示 206 个模组。
- `perf_world` 超平坦世界，单人集成服务端，视距和模拟距离均为 12。玩家未注册，基线截图中处于观察者状态，手持机动火炮，附近有史莱姆。并非战斗、多人或常规地形压力测试。
- 测试机 CPU 为 Ryzen 7 7840H、GPU 为 RTX 4060 Laptop。另一款游戏同时运行，不能把本次 FPS 和时延当作排除后台干扰的基准。
- 客户端 Spark 使用 Windows 的内置 Java 采样器，12:36:01–12:38:17；JFR `profile` 12:36:13–12:38:13 与 Spark 同时运行，存在采样开销。服务端 Spark 单独采样 12:39:17–12:41:30。
- 本地原始文件：`test_client/config/spark/profile-2026-10-29_12.38.17.sparkprofile`、`profile-2026-10-29_12.41.30.sparkprofile` 和 `test_client/perf-baseline.jfr`。文件没有上传。

## 初步结果及限制

- JFR `minecraft.ServerTickTime` 的 112 个周期性平均值：均值 5.77 ms，中位数 5.56 ms，最大 10.11 ms。它们是窗口平均而非每 tick 的峰值，也不是 TPS 测量。屏幕显示 TPS 20 是即时显示，不是整段独立统计。
- JFR `jdk.ExecutionSample` 捕获服务端 868 个、渲染线程 1121 个样本；这些是被采到的运行中 Java 栈，不是总墙钟时间或模组独占 CPU。调用栈中各模组可以同时出现，不能相加排名。
- 服务端 868 个样本中，279 个栈含 Rhino，78 个含 Dyeing；其中 76 个涉及 `DyeingMod.cleanupFinishedAnimations`，61 个涉及 `UVSavedData.getEntries`。应关注 Dyeing 数据规模及后台清理，但单凭样本不能证明其独占成本或断定脚本名称。
- 渲染线程 1121 个样本中，296 个含 GeckoLib、186 个含 gbf、149 个含 tkgun（MechanicianCombat）、86 个含 Xaero 世界地图。基线画面持有机动火炮、带玩家动画和地图加载，需在相同场景做单变量对照后才能确定各模组影响；GeckoLib 与 tkgun 的栈可能重叠。
- 本地旧 Spark 解码器对客户端样本的父子时长校验出现大量违例，不采用其统计数字。两个原始 Spark 文件保留待用可信解析方式复核。

## 实测问题与改动

- 首次进世界时，FastJEI 构建提示期间 `client_scripts/tooltips.js` 产生 165 条 `item.item.hasTag` 不存在错误。KubeJS 6 本地源码中 ItemStack 的 `getMod()` 返回所属模组；已在测试客户端及正式实例改用 `item.mod` 检查 `dungeonsdelight`，保留原有排除意图。两项脚本行为测试通过；客户端脚本重载成功，JEI 中查看 Ghast Roll 和 Orange Pudding 后客户端日志未新增该错误。提示文字的所有食物组合尚未逐一验证。
- 首次世界加载时，Dyeing 清理对 1387 条白名单特效先尝试不存在的 `server.getEntity`，产生 1387 条异常，随后仍按白名单跳过。调整判断顺序，使白名单命中直接跳过；非白名单仍走原实体检查。两项行为测试通过；重新进同一存档后仍跳过 1387 条，清理汇总均为 0/0，实体查询异常为 0。非白名单调用的原有 API 问题仍存在，本轮没有更改其行为。
- 退出存档时再次观察到 `collections_of_optimizations` 5.5 调用 Citadel 缺失的 `ServerProxy.setMinecraftServer` 抛出 `NoSuchMethodError`。这是关闭阶段兼容问题，不能据此断定运行时性能。
- 数据包重载报告 9 条配方解析失败，原因包括缺失物品、空物品数组及无效空流体；例如 `farmersrespite:blazing_chili`、`miners_delight:cave_carrot` 和若干 Create 流体配方。它们是功能问题，不作为性能热点或本轮改动引入的问题归因。
- 全部 Node 测试集本次 108/125 通过、17 失败；先前记录为 100/117 通过、17 失败。新增 8 项测试均通过，失败的 17 项与先前记录涉及同一组功能；未逐项重新归因，不能把整个测试集视为通过。完整输出位于 `test_client/perf-evidence/node-suite.txt`。
- `/perf` 原来返回执行错误。测试客户端添加诊断后确认原版 `Component.string` 不存在；改为 `Component.literal` 后，`/perf stats` 和 `/perf reset` 已在游戏内正常输出。短时统计中套装轮询总耗时 17.008 ms / 76 次，适用时间约 38 秒；其他已触发埋点各低于 5 ms。它只覆盖实际触发并已埋点的路径，不能代表全部 KubeJS。
- 修复后 12:57:09–12:59:09 的监控为 120.4 秒、2408 ticks、20.00 TPS；实体数峰值 95、末值 91，玩家 1 人。重置后至 12:59:40 的约 180 秒埋点：套装轮询 66.241 ms / 360 次，弓逻辑 21.283 ms / 1800 次，动力剑 18.170 ms / 720 次，其余单项小于 13 ms。埋点窗口比监控窗口长约 60 秒，不可直接当成两分钟统计；尚未覆盖战斗技能。原始日志保存在 `test_client/perf-evidence/monitor-server.log`。`/perf` 文本修复已同步正式实例。
- `/perf bench 100` 最初在距离项失败：该版本将三坐标 `distanceToSqr` 映射为 `getDistanceSq`。修复并重载后命令完整输出，改动已同步正式实例。该次微基准中全量实体遍历加 UUID 字符串比较约 185.66 µs/次，半径 16 查询约 7.33 µs/次；轮次少且执行内容不同，结果仅作后续检查候选，不能推断宠物系统在实战中的占比。

## 怪物场景复测（12:45:54–12:47:54）

- 同一存档中切换为创造模式，场景有自然生成的史莱姆和僵尸，部分怪物日光下燃烧；玩家大体静止，没有持续战斗。与第一轮玩家模式、时间、实体状态均不同，因此不能把差异归因于代码改动。
- `test_client/perf-mobs.jfr` 的 112 个周期性服务端平均 tick 时间：均值 17.36 ms、中位数 16.62 ms、最大 28.39 ms。窗口平均值不是单 tick 峰值；同样存在其他游戏及 Spark 后台采样干扰。
- 2699 个服务端执行样本中 993 个栈含 Rhino、75 个含 Dyeing；1499 个渲染线程样本中 216 个含 GeckoLib、128 个含 gbf、114 个含 tkgun、75 个含 ruokmod。采样率、调用重叠及不同场景均限制跨模组和跨轮比较。
- 怪物燃烧期间 `startup_scripts/han_sword/main.js` 在每次伤害调用了 KubeJS 未暴露的 `DamageSource.getEntity()`，到 12:48 保存证据时已出现 500 次错误。本地 KubeJS `DamageSourceMixin` 将原版 `getEntity` 映射为 `getActual`，`getMsgId` 映射为 `getType`。改为先筛选 `player` 伤害再取攻击者，已同步正式实例；行为测试覆盖火焰、低血量、25% 边界和非汉剑。客户端重启后生成着火僵尸，未再观察到该错误；手持汉剑对 10/60 生命的尸壳使用 2 点玩家伤害命令，以及实际挥剑，均观察到斩杀反馈；实际挥剑画面显示目标从 10/60 变为 0/60。多人仍需验证。

## 技能场景有效复测（18:15:13–18:17:13）

- 在同一测试存档中以单人集成服务端进行 120 秒有效监控。`/perf monitor` 记录 2401 ticks、20.00 TPS、最大 20.00 TPS；区间内实体采样约 103–108，玩家 1 人。期间触发一次 The Bible 技能。该测试是轻量技能触发场景，不代表持续战斗或多人压力。
- 重置后约两分钟的 KubeJS 埋点中，`set_system-playerTick-poll` 为 454 次、72.498 ms；`power_sword-playerTick` 为 907 次、19.356 ms；`bow-playerTick` 为 2269 次、18.785 ms；`big_stomach-playerTick` 为 227 次、13.527 ms；`stealth_system-playerTick` 为 907 次、11.986 ms。单项峰值均不超过 0.364 ms。`skill-bible-entityScan` 14 次合计 0.543 ms，均值 38.82 µs、最大 0.062 ms；本次没有证据支持为这些路径继续做行为性改写。
- 同期保存的服务端 Spark 文件为 `test_client/config/spark/profile-2026-10-29_18.18.28.sparkprofile`，约 208.5 秒；文件保存在本地，没有上传。采样线程约 155.1 秒在等待，`ServerLevel` tick 路径约 41.7 秒，实体 tick 列表路径约 30.1 秒。后两者是包含下层调用的栈时长，不能相加作为独立成本。
- 该 Spark 栈中可见 `DyeingMod.cleanupFinishedAnimations` 约 1.5 秒、`UVSavedData.getEntries` 约 1.2 秒的包含式采样时长，值得在更多染色实体或更长运行下复查；两者互有父子调用，不能相加或直接视为独占 CPU。Rhino/KubeJS 的若干解释器栈各约 1 秒量级，单次实体扫描埋点更直接的实测为 0.543 ms / 14 次，当前场景没有显示出需要重写的 KubeJS 热点。
- 18:11 和 18:13 的 Spark 文件包含窗口失焦造成的游戏暂停，样本时间失真；未用于排名或本轮结论。18:18 文件是单人服务端采样，不用于客户端渲染模组归因。

## 结论与适用范围

当前已完成独立 test_client 的基线、怪物与技能场景采样，以及热点候选审查。KubeJS 变更集中于实测暴露的错误路径和无效调用：Dyeing 白名单优先跳过，避免 1387 次无效实体查询异常；汉剑先筛选玩家伤害，避免怪物持续燃烧时反复调用不存在的 API；物品提示改用有效的模组归属属性。它们保留原有功能意图，并分别在测试存档或行为测试中验证。性能数据未显示需要广泛改写 KubeJS。

需要关注的候选为：Dyeing 动画清理与保存数据读取（服务端，增加染色实体/长时间运行后复查）；GeckoLib、gbf、MechanicianCombat/tkgun、Xaero 世界地图（客户端渲染，当前资料来自有其他游戏同时运行的初始画面样本，只能作为对照候选）；以及实体 tick/AI（当前场景实体数量影响明显，不能归因给单个模组）。模组栈样本有重叠，不构成 CPU 排行榜。多人、长时运行、持续战斗、其他地形及全量功能回归未覆盖。
