// priority: 0
// ==========================================
// 界面按键提示系统 (RenderJS Version)
// UI Key Tips System (RenderJS Version)
// ==========================================
// 根据当前打开的界面，在屏幕左侧显示相关的快捷键提示
// Displays relevant shortcut key hints on the left side of the screen based on the currently open GUI

// 🎨 UI 按键提示系统 (RenderJS Version)
// UI Key Tips System (RenderJS Version)
// ==============================
const $Minecraft = Java.loadClass("net.minecraft.client.Minecraft");

// 提示注册表 / Hint Registry
let HintRegistry = {
  "net.minecraft.client.gui.screens.inventory.InventoryScreen": [
    "key.jei.showUses",
    "key.jei.showRecipe",
    "key.jei.bookmark"
  ]
};

// 获取按键显示名称的辅助函数 / Helper to get key display name
function getKeyDisplayName(keyId) {
    let options = $Minecraft.getInstance().options;
    for (let keyMapping of options.keyMappings) {
        if (keyMapping.name === keyId) {
            return keyMapping.getTranslatedKeyMessage().getString();
        }
    }
    return keyId; // Fallback
}

RenderJSEvents.AddGuiRender(event => {
    event.addRender(context => {
        let screen = Client.screen;
        if (!screen) return;

        let screenName = screen.getClass().getName();
        let hints = HintRegistry[screenName];

        if (hints) {
            let gfx = context.guiGraphics;
            let font = Client.font;
            let height = context.window.getGuiScaledHeight();
            
            // 起始位置：屏幕左侧中部 / Start position: Middle left of the screen
            let startY = height / 2 - (hints.length * 12) / 2;
            let startX = 5;

            hints.forEach(keyId => {
                let keyName = getKeyDisplayName(keyId);
                // 简单的显示格式：[按键] ID / Simple format: [Key] ID
                // 你可以根据需要自定义显示的文本 / You can customize the text as needed
                // 去掉 "key." 前缀让显示更干净 / Remove "key." prefix for cleaner display
                let cleanId = keyId.replace("key.", "");
                let text = `[${keyName}] ${cleanId}`;
                
                gfx["drawString(net.minecraft.client.gui.Font,java.lang.String,float,float,int,boolean)"](font, text, startX, startY, 0xFFFFFF, true);
                startY += 12; // 行高 / Line height
            });
        }
    });
});