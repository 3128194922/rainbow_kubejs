// priority: 0
// ==========================================
// 精英怪 Jade 提示
// ==========================================
// 客户端：在 Jade 信息栏分行显示 miniboss 的词条
// 数据由 startup_scripts/mini_boss_system/Jade.js 通过 serverData 同步：
//   MB_WORDS_JSON: [{k:词条key, n:中文标签, l:当前等级, m:最大等级}]（JSON 字符串）
//   MB_WORDS: 纯文本词条串（JSON 解析失败时回退）
// 显示样式：金色标题行 + 每个词条一行（符号+标签），颜色随等级提升
// （aqua 低级 → yellow 过半 → red 满级），等级 > 1 追加金色罗马数字

// 词条 key → 显示符号（BMP 字符，缺失字形经 unifont 回退渲染）
const MBSymbol = {
    Dig: "⛏", Regenerate: "❤", Reinforce: "⚑", Leader: "♛", Stealth: "✦", Evolve: "❖",
    Parasite: "☣", Adapt: "✜", Explode: "✸", Disarm: "⚒", HeavyArmor: "⛨", Dispel: "✖",
    Shadow: "☾", Assassin: "⚔", Rigidity: "■", Fury: "⚡", Drain: "☤",
};

// 等级罗马数字
const MBRoman = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V" };

JadeEvents.onClientRegistration((event) => {
    // 无参重载无法被 Rhino 解析，必须显式传 UID 与实体类（Entitys 定义于 CONST.js）
    event.entity('mini_boss_system:words', Entitys).tooltip((tooltip, accessor, pluginConfig) => {
        let { serverData } = accessor;
        if (!serverData) return;

        // 优先解析结构化词条数据，逐行着色渲染
        if (serverData.contains("MB_WORDS_JSON")) {
            let list = null;
            try { list = JSON.parse(serverData.getString("MB_WORDS_JSON")); } catch (e) { list = null; }
            if (list && list.length > 0) {
                // 标题行
                tooltip.add(Text.gold("✦ 迷你Boss ✦").bold());
                list.forEach(w => {
                    let lvl = w.l || 1;
                    let max = w.m || 1;
                    let text = (MBSymbol[w.k] || "✦") + " " + w.n;
                    // 颜色随等级提升：固定/低级 aqua，等级过半 yellow，满级 red
                    let line;
                    if (max > 1 && lvl >= max) {
                        line = Text.red(text);
                    } else if (max > 1 && lvl * 2 >= max) {
                        line = Text.yellow(text);
                    } else {
                        line = Text.aqua(text);
                    }
                    // 等级 > 1 追加金色罗马数字
                    if (lvl > 1 && MBRoman[lvl]) {
                        line = line.append(Text.gold(" " + MBRoman[lvl]));
                    }
                    tooltip.add(line);
                });
                return;
            }
        }

        // 旧版回退：纯文本词条串
        if (serverData.contains("MB_WORDS")) {
            let words = serverData.getString("MB_WORDS");
            if (words) {
                tooltip.add(Text.gold("✦ 迷你Boss ✦").bold());
                tooltip.add(Text.aqua(words));
            }
        }
    });
});
