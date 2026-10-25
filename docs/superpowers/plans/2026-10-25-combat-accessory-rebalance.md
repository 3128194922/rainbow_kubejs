# Combat Accessory Rebalance Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 实施用户已确认的 12 项饰品、伤害流派、队伍和寄生月调整。

**Architecture:** 所有玩法修改仅在本 KubeJS 项目实现；新增伤害使用独立类型及有限派生关系，复用现有事件主入口。ParticleJS 和 MoreCallback 源码只用于核实边界，不修改其项目。

**Tech Stack:** Java 17 / Forge 1.20.1 / KubeJS 2001.6.5 / Rhino 2001.2.3 / Node 事件替身测试 / aseprite-mcp。

**Spec:** ../specs/2026-10-25-combat-accessory-rebalance-design.md

## Global Constraints

- 圣主之血半径 5 格，火抗最低 0；适应记录类型、每级 25%、最高 III；DOT 按总等级 ×50%；寄生月概率 25%。
- 其他未指定数值沿用规格建议值。用户已确认礼物盒为烛心套餐、神圣十字架新增、迷你月球改名并替换主动。
- 保留全部原有脏改动、被注释代码；不提交、不重置、不移动原树。源码修改前记录相关外部模组 git 状态。
- Java.loadClass 仅写 CONST.js；局部 let；无可选链、Math.PI；跨脚本域 global；所有新增饰品说明写 tooltips.js。

## Review Focus

- 同时佩戴三个派生饰品时伤害链有限，分解段不重复吃攻击方倍率。
- 护盾/债务/同队禁 PvP 时转移不丢预算，不重复分摊。
- 普通 magic 攻击即使目标中毒也不吃 DOT 增幅；中毒按无攻击者且命中原版药水伤害刻识别。
- 重载/重启同一夜不重抽寄生月，不停止他人开启的陨石雨。
- RuOK 源码与实际安装包不同，文本豁免必须逐个核对实际入口。

## Tasks

### 1. 共用伤害与 DOT
- [x] 添加 tests/combat_rebalance.test.cjs，验证 20→8/8/4、派生矩阵、无敌帧恢复、5 层 DOT→3.5、单 DOT 不反应、普通 magic 不增幅。
- [x] startup_scripts/combat_rebalance/main.js 提供独立命中、有限派生、AOE 和无击退上下文；server_scripts/combat_rebalance/main.js 注册伤害 JSON/tag。
- [x] 修改 ForgeEvents 主入口接入分解与派生，移除旧近战吐根；用 KubeJS DOT 伤害源和药水刻识别替换旧相乘规则。
- [ ] 运行针对性 Node 测试与 KubeJS 脚本检查。

### 2. 饰品与隐匿
- [x] 测试寻友人数修饰符、适应 I/II/III 及首次命中、潜行静止和脱索。
- [x] 新增 holy_blood/holy_cross 注册和光环，修改 player_doll、wooden_dummy、shiny_stone、gravity_core；统一 invisible 索敌处理；接入烛心套餐与烟雾弹。
- [x] 同步 Jade、等级范围、吸血规则、tooltip/lang。

### 3. 分摊与队伍
- [x] 测试最终 20→本人15、队友合计5，无队友20，死亡 Clone 正确保留 capability 与记分板。
- [x] 将庇护从 onPlayerHurt 移到最终伤害阶段，所有同非白队存活队友参与；区分偿债和转移，债务接受算成功。
- [x] startup_scripts/team_persistence/main.js 修复 Clone capability 生命周期并同步，未修改 MineTeam。
- [ ] 运行 Node 行为验证及相关脚本检查。

### 4. 异星陨石与寄生月
- [ ] 测试主动每秒脉冲、到期/卸下终止、远程被动冷却、满月同夜单次抽签及陨石雨所有权。
- [x] server_scripts/alien_meteor/main.js 实现被动波与持续 AOE；Skillwheel 保留 ID 改为开启持续技能。
- [x] blood_moon 同夜持久选择及独立寄生月注册，启用 ClangingHowl 原生命令陨石雨。
- [ ] 运行现有血月脚本检查与新增测试。

### 5. 素材、文本和最终核对
- [x] 通过本机 aseprite-mcp stdio MCP 工具创建/绘制/导出 holy_blood、holy_cross 和寄生月，保留 .aseprite 源文件并查看 PNG。
- [x] 将伤害数字及共用文字提示切换为 ParticleJS `.pipeline('custom')`，由 ParticleJS 自有客户端管线处理；武士刀切割贴图仍走原版粒子管线。
- [ ] 构建所需模组，备份旧实例 JAR 到任务备份目录后安装新 JAR；记录哈希，避免重复 mod ID。
- [ ] 更新规格状态和执行记录；运行 Node 相关测试、JS 语法、diff 检查并修复重要问题。

## Execution ledger

- 2026-10-25：用户已回复关键选项并提供 MCP 路径，继续原实现任务。使用当前脏树原位小范围编辑以保留古圣头骨等既有集成，不创建干净 worktree 丢失现场依赖；不提交。
- 2026-10-25：用户明确所有改动只在 KubeJS；DOT 改用 KubeJS 伤害源与原版中毒 tick 条件判断，不向 MoreCallback 或 ParticleJS 写入变更。
