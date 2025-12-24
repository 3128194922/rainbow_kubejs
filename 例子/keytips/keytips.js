// ==============================
// 🎨 UI 按键提示系统（Painter API）
// ==============================

// 常量：Minecraft 实例只初始化一次
const Minecraft = Java.loadClass("net.minecraft.client.Minecraft").getInstance();
const window = Minecraft.getWindow();
const width = window.getGuiScaledWidth();
const height = window.getGuiScaledHeight();

// 常量：提示注册表（每个界面都可配置显示位置）
const HintRegistry = {
  "net.minecraft.client.gui.screens.inventory.InventoryScreen": {
    x: width/2,
    y: height/4,
    alignX: "left",
    alignY: "center",
    hints: [
      { key: `${global.getKeyMappingById("key.jei.showUses").key}`, text: "查询物品使用配方" },
      { key: `${global.getKeyMappingById("key.jei.showRecipe").key}`, text: "查询物品合成配方" },
      { key: `${global.getKeyMappingById("key.jei.bookmark").key}`, text: "添加/取消物品书签" },
    ],
  },
};

// 状态变量：记录上一次打开的界面名称
let lastScreen = null;

// ==============================
// 🎮 每帧检测界面变化
// ==============================
ClientEvents.tick(event => {
  let player = Client.player;
  if (!player) return;

  let screen = Minecraft.screen;
  let screenName = screen ? screen.getClass().getName() : null;

  // 当界面变化（包括关闭）时刷新绘制
  if (screenName !== lastScreen) {
    lastScreen = screenName;

    // 清除所有旧的绘制内容
    player.paint({ '*': { remove: true } });

    // 如果界面已关闭或没有注册提示，直接返回
    if (!screenName || !HintRegistry[screenName]) return;

    let entry = HintRegistry[screenName];
    let x = entry.x ?? 10;
    let y = entry.y ?? 30;
    let alignX = entry.alignX ?? "left";
    let alignY = entry.alignY ?? "top";
    let hints = entry.hints ?? [];

    // 绘制提示文本
    let paintData = {};
    hints.forEach((hint, i) => {
      paintData[`hint_${i}`] = {
        type: "text",
        text: `§e[${hint.key}] §f${hint.text}`,
        scale: 1.2,
        x: x,
        y: y + i * 16,
        alignX: alignX,
        alignY: alignY,
        draw: "always",
        shadow: true,
        color: "#FFFFFF",
      };
    });

    player.paint(paintData);
  }
});
