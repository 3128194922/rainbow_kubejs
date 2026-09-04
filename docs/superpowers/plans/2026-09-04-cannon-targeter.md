# CBC 炮击标定器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 KubeJS 6 / Forge 1.20.1 中新增可绑定 CBC 炮台、投掷目标实体并驱动炮台瞄准开火的 `rainbow:cannon_targeter`。

**Architecture:** 启动脚本只负责注册物品和独立目标实体；服务端功能目录负责 NBT 绑定、目标实体运动、目标落点判定、CBC 角度换算和直接开火；客户端 tooltip 只读物品 NBT。普通炮台使用公开 `setYaw`/`setPitch`，固定炮台使用公开剪切板接口写入 ±45° 调节值。

**Tech Stack:** Minecraft 1.20.1、Forge 47.4.20、KubeJS 2001.6.5、Rhino、EntityJS、Create Big Cannons v6。

**Spec:** `docs/superpowers/specs/2026-09-04-cannon-target-design.md`

## Global Constraints

- 不注册 `rainbow:kuchiyose_scroll` 物品，现有同名实体保持不变。
- 所有 Java 类加载只能放在对应 `CONST.js`；本功能复用已有服务端 `BlockPos`、`CompoundTag`、`Direction`、`BlockStateProperties`、`ResourceKey`、`ResourceLocation`、`Registries`、`UUID`。
- 使用 KubeJS 6 API；不使用 `?.`；不使用 `Math.PI`；时间使用 `level.getTime()`。
- 关键变量和 Java 调用使用 `try/catch`，异常通过 `console.log` 输出。
- 不修改注释掉的代码；每次修改位置补充或更新注释。

### Task 1: Add failing pure-behavior tests

**Files:**
- Create: `tests/cannon_target.test.js`
- Test target: `server_scripts/cannon_target/main.js`

**Interfaces:**
- The script will expose `global.cannonTargetMath` with `physicalAngles`, `verticalMountAngles`, `fixedMountAdjustments`, and `wrapDegrees` for deterministic tests.

- [x] **Step 1: Write tests for horizontal/vertical angles and CBC conversion.**
- [x] **Step 2: Run `node --test tests/cannon_target.test.js`; it failed because the new script/API did not exist.**
- [x] **Step 3: Keep the failing assertions focused on behavior, not implementation details.**

### Task 2: Register the item and target entity

**Files:**
- Modify: `startup_scripts/Registry/Registry_item.js`
- Modify: `startup_scripts/Registry/Registry_entity.js`

**Interfaces:**
- Produces item ID `rainbow:cannon_targeter` and entity ID `rainbow:cannon_target_marker`.
- The marker calls `global.cannonTargetMarkerTick(entity)` on the server side.

- [x] **Step 1: Add the non-stackable item using `rainbow:item/beacon_ball` as its existing texture.**
- [x] **Step 2: Add the independent nonliving marker entity with 0.25×0.25 size, 32-block tracking, 1-tick update interval, and a 200-tick server lifecycle callback.**
- [x] **Step 3: Verify the source contains no item registration for `rainbow:kuchiyose_scroll`.**

### Task 3: Implement binding, throwing, aiming, and firing

**Files:**
- Create: `server_scripts/cannon_target/main.js`

**Interfaces:**
- `global.cannonTargetMath` provides pure angle conversion functions.
- `global.cannonTargetMarkerTick(marker)` advances the marker and resolves it once.
- Sneak block interaction stores `cannonTargetDimension`, `cannonTargetX`, `cannonTargetY`, `cannonTargetZ`, and `cannonTargetMount`.

- [x] **Step 1: Implement NBT binding validation and stored-dimension lookup with the existing server CONST classes.**
- [x] **Step 2: Implement marker spawning from the player eye position with look-angle velocity and owner UUID data.**
- [x] **Step 3: Implement collision/ground/TTL resolution while ignoring the owner entity.**
- [x] **Step 4: Implement physical yaw/pitch calculation using the hard-coded Rhino-safe PI value.**
- [x] **Step 5: Implement normal `cannon_mount` conversion, fixed `fixed_cannon_mount` ±45° clipping, block update, immediate contraption rotation sync, and `tryFiringShot()`.**
- [x] **Step 6: Focused test passed; full suite ran and reported two pre-existing unrelated failures.**

### Task 4: Add the client tooltip

**Files:**
- Modify: `client_scripts/tooltips.js`

- [x] **Step 1: Add a tooltip for binding, throwing, supported CBC bases, and the current bound coordinate/dimension when NBT exists.**
- [x] **Step 2: Verify no server-only class or API is added to the client tooltip.**

### Task 5: Final verification

**Files:**
- Verify: all changed files above

- [x] **Step 1: Run `node --test tests/cannon_target.test.js`.**
- [x] **Step 2: Run `node --test tests/*.test.js`; two existing unrelated tests fail in the dirty baseline.**
- [x] **Step 3: Run syntax-oriented checks for forbidden `?.`, `Math.PI`, misplaced `Java.loadClass`, and the forbidden item ID.**
- [x] **Step 4: Inspect `git diff` and `git status` to confirm unrelated dirty changes remain untouched.**
