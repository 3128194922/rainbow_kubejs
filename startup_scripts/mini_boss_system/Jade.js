// priority: 0
// ==========================================
// 精英怪 Jade 数据提供者
// ==========================================
// 服务端：把 miniboss 抽到的词条同步给客户端，供 Jade 信息栏显示
// 读取 server_scripts/mini_boss_system/main.js 写入的 persistentData.POWER（词条 key 数组）
// 与 POWER_LEVELS（词条等级），整理为结构化词条数据放入 Jade serverData：
//   MB_WORDS_JSON: [{k:词条key, n:中文标签, l:当前等级, m:最大等级}]（JSON 字符串，客户端分行着色渲染）
//   MB_WORDS: 纯文本词条串（旧版客户端回退）
// 标签表/等级范围表优先读 server_scripts 热重载的 global.MB_POWER_LABELS_JSON /
// global.MB_POWER_RANGES_JSON（main.js 加载时写入，随 /reload 更新），新增词条无需重启游戏

// 词条 key → 中文标签，需与 main.js 的 POWER 对象保持一致（global 热重载失败时的回退）
const PowerLabel = {
    Dig: "挖掘", Regenerate: "自愈", Reinforce: "援军", Leader: "领袖",
    Stealth: "隐匿", Evolve: "演化",
    Parasite: "寄生", Adapt: "适应", Explode: "自爆", Disarm: "缴械", HeavyArmor: "重装",
    Dispel: "驱散", Shadow: "暗影", Assassin: "刺客", Rigidity: "刚性", Fury: "狂怒",
    Drain: "吸血",
    Frost: "冰霜", Quake: "岩爆", Blast: "连发", Trapper: "地雷",
    Snare: "诱捕", Clone: "分身", Wind: "狂风", Venom: "剧毒", Haunt: "鬼火",
};

// 词条 key → [最小等级, 最大等级]，需与 main.js 的 POWER_LEVEL_RANGE 保持一致（回退用）
const PowerRange = {
    Dig: [1, 2], Regenerate: [1, 5], Reinforce: [1, 3], Leader: [1, 1], Stealth: [1, 1],
    Evolve: [1, 1], Parasite: [1, 3], Adapt: [1, 3], Explode: [1, 5], Disarm: [1, 5],
    HeavyArmor: [1, 5], Dispel: [1, 5], Shadow: [1, 1], Assassin: [1, 5], Rigidity: [1, 1],
    Fury: [1, 1], Drain: [1, 1],
};

// 等级罗马数字（词条等级系统，最高 5 级）
const PowerLevelRoman = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };

/**
 * 读取共享的 JSON 全局表（server_scripts 热重载写入），解析失败回退本地静态表
 * @param {string} name - global 变量名
 * @param {Object} fallback - 回退对象
 * @returns {Object} 解析后的表
 */
function readSharedJson(name, fallback) {
    try {
        let json = global[name];
        if (json) {
            let parsed = JSON.parse(json);
            if (parsed && typeof parsed == 'object') return parsed;
        }
    } catch (e) {}
    return fallback;
}

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

        // 标签与等级范围表：优先热重载共享表，回退本地
        let labelMap = readSharedJson('MB_POWER_LABELS_JSON', PowerLabel);
        let rangeMap = readSharedJson('MB_POWER_RANGES_JSON', PowerRange);

        // 整理结构化词条数据：{k:词条key, n:中文标签, l:当前等级, m:最大等级}
        let words = [];
        keys.forEach(k => {
            let lvl = levels[k] || 1;
            let range = rangeMap[k];
            // 未列出范围的词条（如 DTM 特性）最大等级按当前等级算
            let max = range ? range[1] : lvl;
            // 旧存档可能仍保存适应III；显示等级按新上限归一，实际判定也受3级上限约束。
            if (range && lvl > max) lvl = max;
            words.push({ k: k, n: labelMap[k] || k, l: lvl, m: max });
        });
        // 等级高的词条排前面
        words.sort((a, b) => b.l - a.l);

        try { tag.putString("MB_WORDS_JSON", JSON.stringify(words)); } catch (e) {}
        // 纯文本回退（等级>1 追加罗马数字）
        tag.putString("MB_WORDS", words.map(w => w.n + (w.l > 1 && PowerLevelRoman[w.l] ? PowerLevelRoman[w.l] : "")).join("、"));
    });
});
