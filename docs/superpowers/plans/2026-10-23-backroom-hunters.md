# BackroomRoguelike 追猎者兼容实现计划

> 执行方式：在当前工作区内按 executing-plans 顺序执行；保留已有迁移改动，不提交 Git。

**目标：** 在本 KubeJS 中适配参考目录的追猎者规则，使用正式维度 `backroomroguelike:backroom`。

**设计依据：** 用户要求与 `E:/MC_UNSpro/开发环境/kubejs backroom/server_scripts/backroom/mutant.js`；本模组 `BackroomRunData.Run.enteredAt()` 为本局身份及计时依据。

**架构：** 服务端脚本读取模组本局记录，不修改 Java 模组或旧后室迁移文件。状态保存在维度 persistentData，实体保存所有者和本局身份。每秒收集一次已加载实体；未加载实体仍占用名额，重新加载时校验标记并清理失效实体。

**环境：** Forge 1.20.1，KubeJS 2001.6.5-build.26，Rhino 2001.2.3-build.10，Mutant More 2.0.0，BackroomRoguelike 1.0.0。

## 约束与实现选择

- 默认按玩家本局真实时间计时，与模组 20 分钟倒计时一致；提供 `clock: 'dimension'` 保留旧版共享 tick 时钟。此默认值是实现建议，已向用户提出选项。
- 每 5 分钟检查生成，每人最多 1 只 `mutantmore:mutant_wither_skeleton`，32～40 格外生成。
- 每个 5 分钟周期前 3 分钟为袭击期，分别每 20 / 600 tick 请求寻路，速度 1.2；保留原生战斗 AI。
- 使用真实碰撞箱、完整脚底支撑和已加载区块检查；搜索有次数上限，不强制加载区块。
- 仅管理带本功能持久标记的实体；没有有效本局、离线、离开维度、死亡或过期时清理。
- 未加载的实体保留占位；死亡后一 tick 确认未复活再释放名额，避免可取消死亡事件导致重复生成。
- 新生成实体走 Forge `onFinalizeSpawn(EVENT)` 初始化，保留原生双刀；离线只释放实体名额，保留当前本局的生成周期。
- 类加载集中到 `server_scripts/CONST.js`，使用 tryLoadClass 容忍模组缺失。
- 不添加物品功能，无需 tooltip；不恢复已删除的旧维度、入口、战利品和规则脚本。

## 任务

- [x] 编写并运行失败测试：首个生成周期、独立本局、袭击/平静寻路频率、无有效本局、碰撞/未加载区块、重载/卸载名额、死亡复活与清理隔离。
- [x] 添加服务端可选类、`server_scripts/backroom_hunters/main.js`，运行行为测试及语法检查。
- [x] 更新 README 的后室说明，记录配置与手动验证路径。
- [x] 审阅本次 diff，运行 `git diff --check`，明确 stub 验证与游戏验证的边界。

## 验证记录

- 17 项 Node 替身测试通过；初始化与重连周期两项回归均先观察到失败，再修复通过。
- Node 语法检查、已安装 Rhino 2001.2.3-build.10 的 `Context.compileString` 编译检查通过。
- 只读审查指出出生初始化和离线周期重置问题，已补上原生出生钩子并保留离线有效本局的周期状态。
- 本次只涉及追猎者脚本、服务端类加载、行为测试、本计划及 README 后室章节；其余现存迁移改动保留。

## 游戏验证

重载后检查 `/kubejs errors` 与 `logs/kubejs/server.log`。用正式模组入口开局，分别确认 5 分钟生成、两种追踪频率、两玩家错开开局、实体体积安全、重载及区块卸载不重复、死亡/撤离/超时/重连的清理和原生攻击。当前没有游戏运行结果。
