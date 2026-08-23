// priority: 0
// ==========================================
// 精英怪 Jade 提示
// ==========================================
// 客户端：在 Jade 信息栏显示 miniboss 的词条
// 数据由 startup_scripts/mini_boss_system/Jade.js 通过 serverData 同步（字段 MB_WORDS）

JadeEvents.onClientRegistration((event) => {

    // 无参重载无法被 Rhino 解析，必须显式传 UID 与实体类（$Entitys 定义于 CONST.js）
    event.entity('mini_boss_system:words', $Entitys).tooltip((tooltip, accessor, pluginConfig) => {
        let { serverData } = accessor;
        if (!serverData || !serverData.contains("MB_WORDS")) return;

        let words = serverData.getString("MB_WORDS");
        if (!words) return;

        tooltip.add(Text.red("词条: " + words));
    });
});