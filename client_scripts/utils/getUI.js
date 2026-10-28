// priority: 0
// ==========================================
// UI 调试工具
// UI Debug Utilities
// ==========================================
// 用于获取当前界面的类名，调试用 (需手动调用)
// Used to get the class name of the current screen for debugging (needs manual call)

// 性能开关：默认关闭。开启后每帧输出当前界面类名（约每秒 20 行日志），
// 仅调试时手动置为 true，用完务必改回 false
const GETUI_DEBUG_ENABLED = false;

function getScreen()
{
    if (!GETUI_DEBUG_ENABLED) return;
    ClientEvents.tick(event => {
        let mc = Minecraft.getInstance();
        let screen = mc.screen;
    
        if (screen != null) {
            // 获取类名字符串
            let screenName = screen.getClass().getName();
            console.log("当前界面:", screenName);
        }
    });
}

//getScreen();
