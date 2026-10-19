# 使徒动画设计方案

## 目标

为现有使徒模型新增待机、移动、召唤弹幕三种 GeckoLib 动画，在游戏中由 EntityJS 自动切换循环动画，并在召唤招式开始时播放一次性动作。

## 当前模型与版本依据

- 目标环境为 Minecraft 1.20.1、Forge 47.4.20、KubeJS 2001.6.5、EntityJS 0.6.6、Rhino 2001.2.3。
- 可编辑模型为 `model_sources/apostle/apostle.bbmodel`，Bedrock 格式，当前包含 `head`、`body`、`right_arm`、`left_arm`、`right_leg`、`left_leg` 六个骨骼，没有动画。
- 运行几何体为 `assets/rainbow/geo/entity/apostle.geo.json`，也是六个骨骼；面具、尖帽和光环当前都在 `head` 骨骼下。
- 本地 EntityJS 0.6.6 源码提供 living entity builder 的 `animationResource`、`addAnimationController`、`addTriggerableAnimationController`；动画触发接口由 GeckoLib/EntityJS 提供。实现必须以该本地版本源码为准。

## 动画方案

1. **待机 `animation.apostle.idle`**：3.2 秒循环。身体轻微呼吸起伏，头部小幅俯仰，手臂有很轻的垂摆，整体保持庄严、克制。
2. **移动 `animation.apostle.move`**：1.2 秒循环。左右腿以约 ±16° 错相摆动，手臂以约 ±7° 反向摆动，身体轻微上下起伏；动作幅度控制在长袍和靴子不明显穿插的范围。
3. **召唤弹幕 `animation.apostle.summon_danmaku`**：1.5 秒单次。约 0–0.3 秒双臂前抬，0.3–0.7 秒向两侧展开，0.7–1.1 秒维持召唤姿态，1.1–1.5 秒收势。仅在对应召唤招式开始时触发一次，不随单颗弹幕重复触发。

## 模型骨骼

- 在 `head` 下新增 `halo` 子骨骼，将现有光环立方体移动到该子骨骼并保持原位置/外观不变，使光环可在待机时缓慢旋转、召唤时短暂转动并轻微扩张。
- 不新增全身 `root`、肘部或膝部骨骼；以当前六个身体骨骼完成三种动画，控制模型结构变更范围。
- 所有动画骨骼名称必须与导出的几何体一致。

## 资源与播放接入

- 保留并更新可编辑源 `model_sources/apostle/apostle.bbmodel`。
- 更新 `assets/rainbow/geo/entity/apostle.geo.json` 以包含 `halo` 骨骼。
- 新增 `assets/rainbow/animations/entity/apostle.animation.json`，使用 Bedrock/GeckoLib 动画 JSON 格式 `1.8.0`，动画 ID 分别为 `animation.apostle.idle`、`animation.apostle.move`、`animation.apostle.summon_danmaku`。
- 在 `startup_scripts/apostle/main.js` 为使徒配置动画资源及控制器：待机/移动依据 EntityJS animation event 的 `isMoving()` 在一个控制器中循环切换；召唤动作使用可触发的单次动画控制器。
- 在 `server_scripts/apostle/main.js` 的对应召唤招式开始点触发一次召唤动画；不改伤害、索敌、走位、招式权重、弹幕速度或弹幕数值。

## 验收

- Blockbench 截图或预览能区分待机、移动和召唤的动作节奏；检查帽子、面具和光环没有因骨骼拆分发生偏移。
- 检查动画 JSON 中所有骨骼 ID 都存在于导出 geo，循环标记/动画时长正确。
- 检查 EntityJS 注册的动画资源路径、控制器名称和触发 ID 与资源一致。
- 静态检查和 Blockbench 预览不等于游戏运行验证；仍需在游戏中确认动画加载、移动/待机切换、召唤触发同步和实体追踪客户端显示。
