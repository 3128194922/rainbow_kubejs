# 使徒动画实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为使徒添加待机、移动、召唤弹幕三段 GeckoLib 动画，并接入 EntityJS 自动切换与服务端触发。

**Architecture:** GPT-6 Astra 子智能体通过 Blockbench MCP 编辑使徒 Bedrock 模型、拆出可动光环骨骼并导出动画/几何资源；主智能体负责 EntityJS 控制器与 KubeJS 招式触发。动画只改变客户端表现，不修改目标、招式时序或伤害逻辑。

**Tech Stack:** Minecraft 1.20.1、Forge 47.4.20、KubeJS 2001.6.5、EntityJS 0.6.6、Rhino 2001.2.3、Blockbench、GeckoLib Bedrock 动画 JSON。

**Spec:** `docs/superpowers/specs/2026-09-28-apostle-animation-design.md`

## Global Constraints

- KubeJS 使用 6 版 API 与 Rhino 2001.2.3 语法；实体动画 builder 以 EntityJS 0.6.6 本地源码为准。
- 动画名为 `animation.apostle.idle`、`animation.apostle.move`、`animation.apostle.summon_danmaku`。
- 资源路径为 `assets/rainbow/animations/entity/apostle.animation.json` 与 `assets/rainbow/geo/entity/apostle.geo.json`。
- 保留 `model_sources/apostle/apostle.bbmodel` 可编辑源；光环单独成为 `head` 的子骨骼，外观和静止坐标不变。
- 待机 3.2 秒循环；移动 1.2 秒循环；召唤动作 1.5 秒单次，仅在召唤招式开始时触发一次。
- 本次只改模型和动画播放连接；不改使徒的目标、间距、招式、弹幕伤害或数值。
- 按 `AGENTS.md` 的 KubeJS 规则修改脚本并用中文注释说明新增控制器和触发点。

## Review Focus

- 待机/移动切换时躯干、腿、手臂和光环关键帧是否平滑闭合，循环首尾不能跳帧。
- 单次召唤动画是否只在招式开始触发一次，不因每颗弹幕重复触发。
- `halo` 重新分骨骼后是否保持原模型坐标、贴图 UV 和可见性。
- 资源中的动画骨骼名是否全部存在于导出的 Geo 模型。
- 服务端触发后，追踪实体的客户端是否收到召唤动画；该项需游戏运行确认，静态检查不能证明。

---

### Task 1: Blockbench 模型骨骼与动画资源

**Files:**
- Modify: `model_sources/apostle/apostle.bbmodel`
- Modify: `assets/rainbow/geo/entity/apostle.geo.json`
- Create: `assets/rainbow/animations/entity/apostle.animation.json`

**Owner:** GPT-6 Astra 子智能体，使用 Blockbench MCP。

**Consumes:** 已批准的设计 `docs/superpowers/specs/2026-09-28-apostle-animation-design.md`；当前使徒 Bedrock 模型和贴图。

**Produces:** 包含 `halo` 骨骼的 Bedrock Geo 与 `.bbmodel`；格式为 `1.8.0`、含三段规定动画的 GeckoLib 动画 JSON。

- [ ] 在 Blockbench MCP 中打开现有 `model_sources/apostle/apostle.bbmodel`，保存检查点；若 MCP 无法直接打开文件，先用 MCP 提供的项目/导入能力恢复现有 Geo 与贴图，禁止覆盖原模型或重建成丢失 UV 的空白模型。
- [ ] 将现有光环方块归入 `head/halo`，验证父子骨骼 pivot 变更前后光环静止世界坐标一致；不改变其它几何和贴图。
- [ ] 创建 3.2 秒循环 `animation.apostle.idle`：身体/头部/手臂轻微呼吸和摆动，光环缓慢旋转。
- [ ] 创建 1.2 秒循环 `animation.apostle.move`：左右腿以约 ±16° 错相摆动、手臂约 ±7° 反摆、身体轻微上下起伏。
- [ ] 创建 1.5 秒单次 `animation.apostle.summon_danmaku`：前抬双臂、向两侧展开、保持召唤姿势、收势；召唤时光环短暂旋转并轻微扩张。
- [ ] 导出运行 Geo 到 `assets/rainbow/geo/entity/apostle.geo.json`，导出动画到 `assets/rainbow/animations/entity/apostle.animation.json`，保存更新后的 `.bbmodel`。
- [ ] 通过 Blockbench 预览确认姿势、循环首尾与 halo 拆分没有明显穿模/位移；向主智能体报告资源骨骼名、动画 ID 和 MCP 写入结果。

### Task 2: EntityJS 动画控制器与召唤触发

**Files:**
- Modify: `startup_scripts/apostle/main.js`
- Modify: `server_scripts/apostle/main.js`

**Owner:** 主智能体。

**Consumes:** Task 1 导出的 Geo 骨骼名与动画 ID。

**Produces:** `rainbow:apostle` 自动循环 idle/move，并可由服务端触发 `summon_danmaku` 一次。

- [ ] 根据 EntityJS 0.6.6 `BaseLivingEntityBuilder` 本地源码，在使徒注册链中显式配置 `animationResource` 指向 `rainbow:animations/entity/apostle.animation.json`。
- [ ] 添加 locomotion animation controller，使用 animation event `isMoving()` 设置 `animation.apostle.idle` 或 `animation.apostle.move` 循环；调用 `thenLoop()` 后必须按 EntityJS 谓词接口返回布尔值 `true`，异常时记录一次错误日志。
- [ ] 添加可触发单次动画控制器，注册名 `apostle_summon_controller`，trigger ID 与动画名严格对应 `summon_danmaku`。
- [ ] 在 `apostleBeginCast` 的召唤招式入口处调用实体触发 API 一次；确保调用位置不处于每 tick 或每颗弹幕生成回调中，并用 `try/catch` 输出触发异常。
- [ ] 更新对应中文注释，检查没有重复声明变量、没有改变战斗状态机其他行为。
- [ ] 对模型、动画与脚本资源做静态核对：JSON 可解析、路径/ID/骨骼一致、EntityJS 控制器名与触发 ID 一致；将游戏内播放与客户端同步列为未验证项，除非实际运行确认。
