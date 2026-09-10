# 小宇宙物品 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增一个右键进入个人世界、在个人世界内返回进入前位置的 `rainbow:mini_world` 物品。

**Architecture:** 启动脚本只负责注册物品，服务端脚本负责调用 `MiniWorldApi` 和保存玩家返回点，Tooltip 继续集中维护在现有客户端文件。返回点使用玩家 `persistentData`，维度判断通过个人世界 API 返回的稳定维度 ID完成。

**Tech Stack:** Minecraft 1.20.1 Forge 47.4.20、KubeJS 6、Rhino、miniWorld 1.0.0。

**Spec:** `docs/superpowers/specs/2026-09-07-mini-world-item-design.md`

## Global Constraints

- 所有 `Java.loadClass` 只放在对应脚本目录的 `CONST.js`。
- 不使用可选链语法 `?.`。
- 关键逻辑使用 `try/catch` 并记录错误。
- 修改代码必须添加或更新中文注释。
- 不修改现有注释掉的代码。

### Task 1: 建立失败回归检查

**Files:**
- Test: 临时 `tmp_mini_world_item_test.ps1`，验证后删除。

- [x] **Step 1: 写失败检查**

检查目标文件、API 常量、返回点字段、Tooltip 和 16×16 贴图均存在；运行时应因文件尚未创建而失败。

- [x] **Step 2: 运行并确认失败**

运行 `& .\tmp_mini_world_item_test.ps1`，预期报告缺少小宇宙实现文件。

### Task 2: 注册物品与资源

**Files:**
- Modify: `server_scripts/CONST.js`
- Create: `startup_scripts/rainbow/mini_world/main.js`
- Create: `assets/rainbow/textures/item/mini_world.png`

- [x] **Step 1: 加载 MiniWorldApi**

在 `server_scripts/CONST.js` 添加 `const MiniWorldApi = Java.loadClass('com.miniworld.api.MiniWorldApi')`，并保留中文用途注释。

- [x] **Step 2: 注册 `rainbow:mini_world`**

创建基础物品，名称为“小宇宙”、史诗稀有度、最大堆叠数 1、贴图为 `rainbow:item/mini_world`，注册过程用 `try/catch` 包裹。

- [x] **Step 3: 保存 16×16 素材**

生成透明背景像素风宇宙核心贴图并放入 `assets/rainbow/textures/item/mini_world.png`。

### Task 3: 实现右键进入与返回

**Files:**
- Create: `server_scripts/rainbow/mini_world/main.js`

- [x] **Step 1: 写返回点和维度辅助函数**

实现 `getMiniWorldDimensionId`、`getCurrentDimensionId`、`saveReturnPoint`、`clearReturnPoint`、`returnToSavedPoint`，所有持久化字段使用 `MiniWorldReturn*` 前缀。

- [x] **Step 2: 写服务端右键处理**

`ItemEvents.rightClicked('rainbow:mini_world', event => { ... })` 中，非客户端执行：不在自己的个人世界时保存位置并调用 `MiniWorldApi.enter(player)`；在个人世界时恢复保存的位置，无记录则回退主世界。成功后添加 20 tick 冷却并取消事件。

- [x] **Step 3: 保证失败回滚**

进入 API 返回失败时清除本次新写入的返回点；异常写入 `console.log`，不提前调用 `event.cancel()`。

### Task 4: Tooltip 与验证

**Files:**
- Modify: `client_scripts/tooltips.js`
- Test: 删除临时测试文件。

- [x] **Step 1: 添加 Tooltip**

显示普通右键进入个人小世界，潜行/普通统一使用右键切换，并明确个人世界内右键返回进入前的位置。

- [x] **Step 2: 运行结构回归检查**

确认 API 只在 `server_scripts/CONST.js` 加载、无 `?.`、物品注册和事件文件存在、贴图尺寸为 16×16。

- [x] **Step 3: 运行语法与差异检查**

运行 `node --check` 检查两个新 JS 文件，运行 `git diff --check`，并确认临时测试文件已删除。

- [ ] **Step 4: 游戏内重载**（需在游戏内执行）

重启游戏使 startup 物品注册生效；进入世界后使用 `/give @s rainbow:mini_world`，分别验证主世界进入、个人世界返回原维度原坐标、服务器重启后返回点仍存在。
