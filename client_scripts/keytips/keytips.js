// ==============================
// 🎨 UI 按键提示系统（Painter API）
// ==============================

// 常量：Minecraft 实例只初始化一次
const Minecraft = Java.loadClass("net.minecraft.client.Minecraft").getInstance();

// 提示注册表
const HintRegistry = {
  "net.minecraft.client.gui.screens.inventory.InventoryScreen": [
    "key.jei.showUses",
    "key.jei.showRecipe",
    "key.jei.bookmark"
  ]
}

// ==============================
// 🎮 每帧检测界面变化
// ==============================
ClientEvents.tick(event => {
  let screen = Minecraft.screen;
  let screenName = screen ? screen.getClass().getName() : null;

    // 如果界面无提示配置 → 结束
    if (!screenName || !HintRegistry[screenName]) return;
    HintRegistry[screenName].forEach(element => {
      SKP$PromptUtils.show(`${screenName}`, `${element}`);
    });
});
