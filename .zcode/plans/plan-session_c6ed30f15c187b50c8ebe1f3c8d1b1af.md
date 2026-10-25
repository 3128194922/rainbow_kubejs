# 魂火喷火器兼容 MoreFire 自定义灵魂火 实现方案

## 调研结论（已验证的关键事实）

1. **ClangingHowl 喷火器**（`FlamethrowerItem.onUseTick`，166-209 行）：魂火模式由附魔 `clanginghowl:soul_burner` 触发（蓝色粒子+伤害+1+缓慢）。每 tick 3 次 raycast（±6° 散布、射程 10），命中方块时 `level.setBlockAndUpdate(pos, BaseFireBlock.getState(...))` 放原版火（仅灵魂沙上是 soul_fire，其余为 fire）；实体命中用 `clanginghowl:fire_stream` 伤害源 hurt + `setSecondsOnFire(10+enc*5)`。
2. **MoreFire 模组**：提供 KubeJS 方块类型 `'morefire'`（`MoreFireBlockBuilder`：`.fireDamage()/.canBurn()/.definitionColor()`，注册时自动创建 FireDefinition）；`MoreFireBlock` 的 `canSurvive` 只要求下方上表面结实——**可在任意地面存活**（原版 soul_fire 只能活在灵魂沙）。`MoreFire.ignite(entity, fireId, ticks)` 绑定可用（`handleAttackCurios.js` 已有先例），内部自带 `setSecondsOnFire` + 同步火焰颜色到客户端。
3. **时序兼容已确认**：`MoreFireRuntime` 读源码验证——ignite 后 ClangingHowl 随后的 `setSecondsOnFire` 只覆盖燃烧时长，**不破坏** MoreFire 的 fireId/青色渲染/持续伤害接管（`handleEntityFireDamage` 按 fireDefinition.fireDamage 替代原版 1.0/秒）。因此在 LivingHurtEvent 里 ignite 即可。
4. 本项目尚无自定义火方块；`morefire_compat.js` 的 `configureFire` 模式可直接复用于补充定义。

## 用户已确认的决策

- 实体点燃 → 附着 MoreFire 自定义魂火；方块点燃 → 替换为自定义灵魂火方块（fire 与 soul_fire 都替换）
- 接触/持续燃烧伤害 = 2.0

## 方案总览

注册自定义魂火方块 `rainbow:soul_flame`（MoreFire 类型，青色、2.0 伤害、任意地面可存活），通过两个 Forge 事件把魂火喷火器（带 `soul_burner`）的行为接入：
- **LivingHurtEvent**：`fire_stream` 伤害且攻击者主手持魂火喷火器 → `MoreFire.ignite(受害者, 'rainbow:soul_flame', 160)`
- **NeighborNotifyEvent**：喷火器 raycast 放火走 `setBlock` 无专用事件，该事件是可靠钩子。火方块出现且附近有正在使用魂火喷火器的玩家 → 替换为 `rainbow:soul_flame`

## 文件变更清单

### 新增 `startup_scripts/soul_flamethrower/main.js`（功能主入口）
1. `StartupEvents.registry('block')`：`event.create('rainbow:soul_flame', 'morefire').fireDamage(2.0).canBurn(false).definitionColor(0x4CFFF2).defaultCutout()`（写在此处而非 Registry_block.js，保持功能自包含；`.noItem()` 可用则加，避免创造栏/JEI 污染）
2. `ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingHurtEvent')` 实体附火：
   - 快速过滤：`String(event.source.getType()) == 'clanginghowl.fire_stream'`（项目 context.js 已验证 msgId 格式）
   - attacker 主手 `clanginghowl:flamethrower` 且带 `soul_burner` → `MoreFire.ignite(victim, 'rainbow:soul_flame', 160)`
3. `ForgeEvents.onEvent('net.minecraftforge.event.level.BlockEvent$NeighborNotifyEvent')` 方块替换：
   - 第一行快速过滤：state 是 `minecraft:fire` 或 `minecraft:soul_fire`（高频事件，O(1) 判断前置）
   - 遍历 `event.level.players()`：`isUsingItem()` + 主手魂火喷火器 + 距火位置 ≤12 格
   - 替换前检查 `Block.getBlock('rainbow:soul_flame').defaultBlockState().canSurvive(level, pos)`（ClangingHowl isAir 分支不检查 canSurvive，空中位置跳过替换保留原火）→ `setBlockAndUpdate(pos, 'rainbow:soul_flame')`
4. 附魔检测封装函数（`stack.enchantments` 查 `clanginghowl:soul_burner`，实现时按 ProbeJS/运行日志核对 API）；全部逻辑 try-catch + console.log（规范 10）

### 修改 `server_scripts/morefire_compat.js`
追加 `configureFire('rainbow:soul_flame', ...)`：`.setAutoEntityFireColor(true).setBlockRainExtinguish(false).setBlockWaterExtinguish(true).setEntityRainExtinguish(false).setEntityWaterExtinguish(true).setFireTicks(160)`（对齐 soul_fire 定义）

### 资源文件（新增）
- `assets/rainbow/blockstates/soul_flame.json`：waterlogged=false/true 两变体指向同一模型（MoreFireBlock 有 WATERLOGGED 属性必须枚举）
- `assets/rainbow/models/block/soul_flame.json`：`{"parent": "minecraft:block/soul_fire_floor0"}`（原版魂火模型+动态青色贴图直接复用）+ `"render_type": "minecraft:cutout"`
- `assets/rainbow/lang/zh_cn.json`：追加 `"block.rainbow.soul_flame": "魂火"`

### 新增 `tests/soul_flamethrower.test.cjs`
按项目 node:test + vm 沙箱模式，mock 事件测试：附魔判定、伤害类型过滤、canSurvive 不满足时跳过替换、soul_fire/fire 均替换。

### 修改 `README.md`
灵魂火系统段落补充本功能说明。

## 关键技术点

- 时序：LivingHurtEvent 在 `target.hurt()` 内触发，ClangingHowl 随后 `setSecondsOnFire` 覆盖时长（燃烧更久），fireId/渲染/伤害不受影响（已读 MoreFireRuntime 源码确认）
- FUEL_BURST 爆发模式与 soul_burner 互斥，不在处理范围；无附魔普通喷火不受影响
- MoreFire 火方块无自熄 tick（与原版 soul_fire 一致的无限持续），水可灭、雨不灭（按上述配置）
- 启动方式：方块注册在 startup → 需**重启游戏**生效（非 /reload）

## 验证清单

1. 重启游戏，`logs/kubejs/startup.log` 无报错，`MoreFire KubeJS definition lookup succeeded: rainbow:soul_flame` 出现
2. 游戏内：给喷火器附 soul_burner，持续喷射——普通地面出现青色魂火方块（非原版火）；命中实体后实体燃烧为青色火焰、每秒 2.0 燃烧伤害；灵魂沙上同样替换为自定义魂火
3. 无附魔喷火器行为不变（原版火+普通点燃）
4. `node --test tests/` 全部通过
5. 已知需运行时核对项：NeighborNotifyEvent 的字段包装（pos/state/level）、`enchantments` 读取方式、`noItem()` 可用性——均有备选写法（AABB 扫描替换 / hasEnchantment / 默认 item）