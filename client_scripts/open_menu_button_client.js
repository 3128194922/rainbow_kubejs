// priority: 500
// ==========================================
// 🖥️ 客户端界面UI按钮脚本
// ==========================================

let $Button = Java.loadClass("net.minecraft.client.gui.components.Button");
let $InventoryScreen = Java.loadClass("net.minecraft.client.gui.screens.inventory.InventoryScreen");

let buttons = []; // 存储按钮实例
let lastScreen = null;
let lastWidth = 0;
let lastHeight = 0;

// 每帧更新UI
ClientEvents.tick((event) => {
    let screen = Client.screen;
    let player = event.player;

    // 仅在玩家背包界面执行
    if (screen instanceof $InventoryScreen) {

        // 检测屏幕变化或尺寸变化（解决全屏切换导致按钮消失的问题）
        if (screen !== lastScreen || screen.width !== lastWidth || screen.height !== lastHeight) {
            buttons = []; 
            lastScreen = screen;
            lastWidth = screen.width;
            lastHeight = screen.height;
        }

        // 如果按钮数组为空，说明需要创建按钮
        if (buttons.length === 0) {
            // ======== 末影箱按钮 (已注释) ========
            /*
            let enderButton = $Button.builder(Text.of("末影箱"), (button) => {
                player.sendData("server", { open_menu: "enderchest" });
            }).bounds(0, 0, 60, 20).build();
            */

            // ======== 帮助按钮 ========
            // 点击发送 "trashcan" 菜单请求 (注：显示文本为"帮助"，但实际功能可能是打开垃圾桶或菜单)
            let helpButton = $Button.builder(Text.of("帮助"), (button) => {
                player.sendData("server", { open_menu: "trashcan" });
            }).bounds(0, 0, 60, 20).build();

            // buttons.push(enderButton);
            buttons.push(helpButton);

            // 添加到界面渲染列表
            buttons.forEach(btn => screen.addRenderableWidget(btn));
        }

        // 每帧更新按钮位置（屏幕左下角自适应）
        let buttonWidth = 60;
        let buttonHeight = 20;
        let padding = 5;
        let startX = 50;
        let startY = screen.height - buttonHeight - 5;

        buttons.forEach((btn, index) => {
            btn.setPosition(startX + index * (buttonWidth + padding), startY);
        });

    } else {
        // 离开背包界面时移除按钮并清空数组
        if (buttons.length > 0) {
            buttons.forEach(btn => {
                try {
                    if (screen) screen.removeWidget(btn);
                } catch (e) {}
            });
            buttons = [];
        }
        lastScreen = null;
    }
});
