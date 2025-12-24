let $Button = Java.loadClass("net.minecraft.client.gui.components.Button");
let $InventoryScreen = Java.loadClass("net.minecraft.client.gui.screens.inventory.InventoryScreen");

let buttons = []; // 存储按钮

ClientEvents.tick((event) => {
    let screen = Client.screen;
    let player = event.player;

    if (screen instanceof $InventoryScreen) {

        // 如果按钮数组为空，说明需要创建按钮
        if (buttons.length === 0) {
            // ======== 末影箱按钮 ========
            /*let enderButton = $Button.builder(Text.of("末影箱"), (button) => {
                player.sendData("server", { open_menu: "enderchest" });
            }).bounds(0, 0, 60, 20).build();*/

            // ======== 帮助按钮 ========
            let helpButton = $Button.builder(Text.of("帮助"), (button) => {
                player.sendData("server", { open_menu: "trashcan" });
            }).bounds(0, 0, 60, 20).build();

            buttons.push(helpButton);

            // 添加到界面
            buttons.forEach(btn => screen.addRenderableWidget(btn));
        }

        // 每帧更新按钮位置（相对界面左上角）
        let baseX = screen.guiLeft;
        let baseY = screen.guiTop + screen.getYSize();

        buttons[0].setPosition(baseX, baseY);    // 帮助按钮

    } else {
        // 离开背包界面时移除按钮并清空数组
        if (buttons.length > 0) {
            buttons.forEach(btn => {
                if (screen) screen.removeWidget(btn);
            });
            buttons = [];
        }
    }
});
