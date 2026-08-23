// priority: 0
// ==========================================
// 精英怪 Jade 数据提供者
// ==========================================
// 服务端：把 miniboss 抽到的词条同步给客户端，供 Jade 信息栏显示
// 读取 server_scripts/mini_boss_system/main.js 写入的 persistentData.POWER（词条 key 数组），
// 转换为中文标签后放入 Jade serverData，客户端渲染见 client_scripts/mini_boss_system/Jade.js

// 词条 key → 中文标签，需与 main.js 的 POWER 对象保持一致
const PowerLabel = {
    Dig: "挖掘", Regenerate: "自愈", Reinforce: "援军", Leader: "领袖",
    Stealth: "隐匿", Evolve: "演化",
    Frost: "冰霜", Quake: "岩爆", Blast: "连发", Trapper: "地雷",
    Snare: "诱捕", Clone: "分身", Wind: "狂风", Venom: "剧毒", Haunt: "鬼火",
};

JadeEvents.onCommonRegistration((event) => {
    // 为所有实体注册数据提供者，仅当实体是 miniboss 才写入
    // 无参重载无法被 Rhino 解析，必须显式传 UID 与实体类（$Entitys 定义于 CONST.js）
    event.entityDataProvider('mini_boss_system:words', $Entitys).setCallback((tag, accessor) => {
        let entity = accessor.getEntity();
        if (!entity || !entity.isAlive()) return;
        if (!entity.persistentData.getBoolean("isMiniBoss")) return;

        let powerStr = entity.persistentData.getString("POWER");
        if (!powerStr) return;

        let keys;
        try { keys = JSON.parse(powerStr); } catch (e) { keys = []; }
        if (!keys || keys.length === 0) return;

        let labels = keys.map(k => PowerLabel[k] || k);
        tag.putString("MB_WORDS", labels.join("、"));
    });
});