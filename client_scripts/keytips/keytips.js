// ==============================
// 🎨 UI 按键提示系统 (RenderJS Version)
// UI Key Tips System (RenderJS Version)
// ==============================

const $Minecraft = Java.loadClass("net.minecraft.client.Minecraft");

// 提示注册表 / Hint Registry
const HintRegistry = {
  "net.minecraft.client.gui.screens.inventory.InventoryScreen": [
    "key.jei.showUses",
    "key.jei.showRecipe",
    "key.jei.bookmark"
  ]
};

// 获取按键显示名称的辅助函数 / Helper to get key display name
function getKeyDisplayName(keyId) {
    const options = $Minecraft.getInstance().options;
    for (const keyMapping of options.keyMappings) {
        if (keyMapping.name === keyId) {
            return keyMapping.getTranslatedKeyMessage().getString();
        }
    }
    return keyId; // Fallback
}

RenderJSEvents.AddGuiRender(event => {
    event.addRender(context => {
        const screen = Client.screen;
        if (!screen) return;

        const screenName = screen.getClass().getName();
        const hints = HintRegistry[screenName];

        if (hints) {
            const gfx = context.guiGraphics;
            const font = Client.font;
            const height = context.window.getGuiScaledHeight();
            
            // 起始位置：屏幕左侧中部 / Start position: Middle left of the screen
            let startY = height / 2 - (hints.length * 12) / 2;
            const startX = 5;

            hints.forEach(keyId => {
                const keyName = getKeyDisplayName(keyId);
                // 简单的显示格式：[按键] ID / Simple format: [Key] ID
                // 你可以根据需要自定义显示的文本 / You can customize the text as needed
                // 去掉 "key." 前缀让显示更干净 / Remove "key." prefix for cleaner display
                const cleanId = keyId.replace("key.", "");
                const text = `[${keyName}] ${cleanId}`;
                
                gfx.drawString(font, text, startX, startY, 0xFFFFFF, true);
                startY += 12; // 行高 / Line height
            });
        }
    });
});
