# 小宇宙物品设计

## 目标

新增 `rainbow:mini_world` 物品。玩家右键时进入自己的 `miniWorld` 个人维度；在自己的个人维度内右键时，返回进入前保存的维度、坐标和朝向。

## 约束

- 目标环境为 Minecraft 1.20.1 Forge、KubeJS 6。
- 通过 `com.miniworld.api.MiniWorldApi` 调用个人世界，不解析命令。
- Java 类只在 `server_scripts/CONST.js` 中加载。
- 返回点保存到玩家 `persistentData`，不保存到物品 NBT，避免物品转移导致返回点错乱。
- 物品不消耗，成功传送后冷却 1 秒。
- 没有返回点时，从个人世界回退到主世界出生点。
- 贴图为透明背景的 16×16 像素风宇宙核心图标。

## 交互流程

1. 服务端收到 `rainbow:mini_world` 右键事件。
2. 比较当前维度与 `MiniWorldApi.getDimensionId(server, playerUuid)`。
3. 当前不在自己的个人维度：先保存当前维度、位置、Yaw/Pitch，再调用 `MiniWorldApi.enter(player)`。
4. 当前在自己的个人维度：读取返回点并调用 `player.teleportTo(dimension, x, y, z, yaw, pitch)`；无记录时调用 `MiniWorldApi.returnToOverworld(player)`。
5. 成功后添加冷却并取消本次物品交互；失败时保留日志，不取消事件。

## 文件

- `server_scripts/CONST.js`：加载 `MiniWorldApi`。
- `startup_scripts/rainbow/mini_world/main.js`：注册物品。
- `server_scripts/rainbow/mini_world/main.js`：实现服务端右键和返回点。
- `client_scripts/tooltips.js`：添加物品功能说明。
- `assets/rainbow/textures/item/mini_world.png`：16×16 贴图。
