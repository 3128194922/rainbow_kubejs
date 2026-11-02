# Client6.0 性能测试初查（2026-10-29）

## 范围

- 实例：Minecraft 1.20.1 / Forge 47.4.28；当前 `mods` 目录有 196 个 JAR，包含 Spark 1.10.53。
- KubeJS：主版本 2001.6.5；Rhino 2001.2.3。
- 日志记录本次启动加载了 105 个 startup、109 个 server、33 个 client 脚本，加载分别耗时 1.492 s、0.765 s、0.102 s，脚本加载阶段没有报错或警告。
- 当前脚本目录有 112 个 server 脚本文件（其中包含备份文件）；日志里的 109 是本次实际加载数。

## 已有动态证据

- 多份轮转日志都记录了 Spark 启动后台 profiler；整个日志目录没有发现 profiler 停止/结果、profile 链接或 `[perf]` 报告记录。因此这些启动记录不能作为可归因的性能样本。
- Spark 在 Windows 11/AMD64 上提示 async-profiler 不受支持，并退回内置 Java 采样器；后续报告应记录这一采样环境。
- 日志里没有 `/perf bench`、`/perf monitor` 或 `/perf stats` 的结果。
- 测试机当前没有运行中的 Minecraft 进程；现有日志里的单人世界已于 2026-10-29 02:00 左右退出。
- 因此目前没有可报告的 TPS/MSPT 基线，也没有可靠的 Mod 性能排名。

## 优先观察项（静态候选，尚未认定为瓶颈）

1. `server_scripts/curios_skill_system/Skillwheel.js`：每 100 tick 遍历已加载维度和实体，检查个人维度中的延迟返回标记。它已从每 20 tick 降频到每 100 tick；是否仍显著取决于加载实体数量。
2. `server_scripts/set_system/SetEffect.js`：每个玩家每 10 tick 检查装备快照、每 20 tick 维护已激活效果。需在多人/饰品较多的场景看 `/perf stats` 聚合耗时。
3. `server_scripts/PlayerEvents.js`：有每玩家 tick 监听，但业务路径已大幅早退；当前计时区段的工作很少，不应仅凭事件频率就改写。

以上是需要验证的脚本，不是已经测出的热点。先看 Spark 调用栈和 `/perf stats`，再决定是否优化；每次只改有证据的路径，并对照功能行为。

## 现有 KubeJS 计时覆盖

脚本里已经有 `global.perfTime` 埋点，不需要为首轮测试再改代码：套装检查、贪咀护符、异星陨石、弓蓄力、座位清理、面具、动力剑、潜行状态，以及 Skillwheel 的骨哨、竖琴、圣经、冲刺烟花、冰灯、雷电瓶、导弹和皇家变种技能实体扫描均有计时。`/perf stats` 只会显示本轮实际触发的路径；安静场景与战斗技能场景需要分别采样，避免把未触发的技能误看作零成本。

## 本轮测量改动与验证

- 在 `server_scripts/curios_skill_system/Skillwheel.js` 给骨哨每 100 tick 的全维度实体扫描加了 `global.perfTime('Skillwheel-whistle-serverTick-scan', ...)`。计时放在 100 tick 早退条件之后；传送业务、触发条件和频率均未变。
- `tests/whistle_return.test.cjs` 新增计时边界断言，并把失败返回后的重试时刻校正到扫描边界：2120 tick 不扫描，2200 tick 扫描。
- 通过：Node 语法检查、骨哨行为测试、个人维度契约检查。
- 完整 Node 测试集：100/117 通过，17 失败，涉及异星陨石（4）、血月（1）、战斗重平衡（1）、寄生月（2）、木剑镶嵌（9）；骨哨测试通过。异星陨石隔离测试输出 `everyTicks is not defined`。这些结果需单独归因，不能视为本次改动造成或已修复。
- 上述验证是脚本/契约层证据；Minecraft 客户端尚未进入世界，仍缺 Spark、TPS 和 `/perf stats` 实测。

## 需要关注的 Mod 兼容错误

退出世界时，`collections_of_optimizations` 5.5 的 `ClientLevelRelease.onServerStopped` 调用了当前 Citadel（2.6.1）不存在的 `ServerProxy.setMinecraftServer`，导致服务端线程抛出 `NoSuchMethodError`。这是已观察到的关闭阶段兼容错误，不是性能热点证据；测试期间需记录它，并避免把它误判为 TPS 问题。

## 重新启动检查（2026-10-29 02:48 后）

PCL 已启动，但桌面控制工具没有返回可操作的启动器窗口；`.minecraft/logs/latest.log` 仍停留在 02:01，未出现新的 Minecraft 加载或采样记录。当前存在一个无窗口、从 10 月 27 日起运行的 `java` 进程，但无法确认它属于该实例，因此不把它当成本次测试进程或数据来源。

## 下一轮基线要求

在同一存档、同一地点和相近实体密度下，分别记录安静场景与战斗/技能密集场景。每个场景开始时运行 `/perf reset`，随后同时运行 `/perf monitor 120` 和 `/sparkc profiler start --timeout 120`，在 120 秒内保持该场景；结束后运行 `/perf stats` 并保存 Spark 给出的 profile 链接。Spark 的 Forge/Fabric 客户端命令前缀是 `/sparkc`，profile 会自动上传并返回查看链接（见 [Spark 命令用法](https://spark.lucko.me/docs/Command-Usage) 和 [profile 查看说明](https://spark.lucko.me/docs/Using-the-viewer)）。

正式改动后用相同地点、相近实体密度和相同流程复测，比较 TPS、profile 栈占比和已埋点总耗时。不要把启动脚本加载耗时当成运行时 TPS 证据。
