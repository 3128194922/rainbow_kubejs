// priority: 0
// ==========================================
// 菜单按钮服务器端处理
// Menu Button Server Handling
// ==========================================
// 监听来自客户端的 'open_menu' 网络包
// 1. 'trashcan': 打开垃圾桶 (触发对话框)
// Listens for 'open_menu' network packets from client
// 1. 'trashcan': Opens trash can (triggers dialog)

// Open Menu Button - server_scripts

// SimpleMenuProvider / CraftingMenu / ChestMenu / Optional 统一由 server_scripts/CONST.js 提供。

NetworkEvents.dataReceived("server", (event) => {
    const { data, player, level } = event;

    if (data.open_menu == "enderchest") {
        player.openInventoryGUI(player.enderChestInventory, Component.translatable("container.enderchest"));
    }

    // 打开垃圾桶功能 (目前实现为显示对话框)
    if (data.open_menu == "trashcan") {
        level.server.runCommandSilent(`/execute as ${player.getDisplayName().getString()} run dialog show hello_world`)
    }
});
