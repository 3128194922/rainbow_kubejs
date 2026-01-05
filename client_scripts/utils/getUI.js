// priority: 0
// ==========================================
// UI 调试工具
// UI Debug Utilities
// ==========================================
// 用于获取当前界面的类名，调试用 (需手动调用)
// Used to get the class name of the current screen for debugging (needs manual call)

function getScreen()
{
    ClientEvents.tick(event => {
        let mc = Java.loadClass("net.minecraft.client.Minecraft").getInstance();
        let screen = mc.screen;
    
        if (screen != null) {
            // 获取类名字符串
            let screenName = screen.getClass().getName();
            console.log("当前界面:", screenName);
        }
    });
}

//getScreen();