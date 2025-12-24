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