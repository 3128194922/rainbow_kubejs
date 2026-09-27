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
    Parasite: "寄生", Adapt: "适应", Explode: "自爆", Disarm: "缴械", HeavyArmor: "重装",
    Dispel: "驱散", Shadow: "暗影", Assassin: "刺客", Rigidity: "刚性", Fury: "狂怒",
    Drain: "吸血",
    Frost: "冰霜", Quake: "岩爆", Blast: "连发", Trapper: "地雷",
    Snare: "诱捕", Clone: "分身", Wind: "狂风", Venom: "剧毒", Haunt: "鬼火",
};

// 等级罗马数字（词条等级系统，最高 5 级：自愈）
const PowerLevelRoman = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };

JadeEvents.onCommonRegistration((event) => {
    // 为所有实体注册数据提供者，仅当实体是 miniboss 才写入
    // 无参重载无法被 Rhino 解析，必须显式传 UID 与实体类（Entitys 定义于 CONST.js）
    event.entityDataProvider('mini_boss_system:words', Entitys).setCallback((tag, accessor) => {
        let entity = accessor.getEntity();
        if (!entity || !entity.isAlive()) return;
        if (!entity.persistentData.getBoolean("isMiniBoss")) return;

        let powerStr = entity.persistentData.getString("POWER");
        if (!powerStr) return;

        let keys;
        try { keys = JSON.parse(powerStr); } catch (e) { keys = []; }
        if (!keys || keys.length === 0) return;

        // 词条等级（main.js 抽取时写入 POWER_LEVELS），旧存档可能没有该字段
        let levels = {};
        let levelStr = entity.persistentData.getString("POWER_LEVELS");
        if (levelStr) {
            try { levels = JSON.parse(levelStr); } catch (e) { levels = {}; }
        }

        let labels = keys.map(k => {
            // 标签表优先读取 server_scripts 热重载的 global.MB_POWER_LABELS_JSON
            // （main.js 加载时写入，新增词条标签只需 /reload），
            // server 脚本尚未加载时回退本地静态 PowerLabel
            let labelMap = PowerLabel;
            try {
                let sharedJson = global.MB_POWER_LABELS_JSON;
                if (sharedJson) {
                    let parsed = JSON.parse(sharedJson);
                    if (parsed && typeof parsed == 'object') labelMap = parsed;
                }
            } catch (e) { labelMap = PowerLabel; }
            let label = labelMap[k] || k;
            let lvl = levels[k] || 1;
            // 等级 > 1 时追加罗马数字（如 挖掘II），固定 1 级词条不显示
            if (lvl > 1 && PowerLevelRoman[lvl]) {
                return label + PowerLevelRoman[lvl];
            }
            return label;
        });
        tag.putString("MB_WORDS", labels.join("、"));
    });
});
