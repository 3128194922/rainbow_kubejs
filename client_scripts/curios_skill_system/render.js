// priority: 500
// ==========================================
// 属性与饰品 HUD 渲染
// Attribute & Curios HUD Rendering
// ==========================================
// 渲染玩家属性（如韧性、伤害）进度条和已装备饰品的图标
// Renders player attribute (e.g. resilience, damage) bars and equipped curios icons

const $Minecraft = Java.loadClass("net.minecraft.client.Minecraft").getInstance();

// resilience & damage
let resilience = 0;
let curios = false;
let damage_num = 0;
let curios2 = false;

// curios
let curios_id = [];

// 用于记录上一次的饰品数量，用于清理多余图标
let lastCuriosCount = 0;

// 接收进度条数据
NetworkEvents.dataReceived("resilience_gui", event => { 
    resilience = event.data.resilience;
    curios = event.data.curios;
    damage_num = event.data.damage_num;
    curios2 = event.data.curios2;
});

// 接收饰品数据
NetworkEvents.dataReceived("cooldowns_gui", event => { 
    curios_id = event.data.curios_id || [];
});

// 统一绘制
ClientEvents.tick(event => {
    let player = event.player;
    if (!player) return;

    let window = $Minecraft.getWindow();
    let width = window.getGuiScaledWidth();
    let height = window.getGuiScaledHeight();

    // 判断玩家是否正在打开 GUI
    let guiOpen = $Minecraft.screen != null;

    // paint 对象
    let paints = {};

    // 调试：尝试读取 persistentData
    // console.log("Client Resilience: " + player.persistentData.getInt("resilience"));

    // ========= 绘制进度条 =========
    let guiOpen1 = guiOpen || !curios;
    let guiOpen2 = guiOpen || !curios2;

    let width_x = width/2 + 10;
    let width_y = height/2 + 10;

    // resilience → 贴图阶段 (0,20,40,60,80,100)
    let safeResilience = Math.max(0, Math.min(100, resilience));
    let stage = Math.floor(safeResilience / 20) * 20;

    // damage → 贴图阶段 (0,20,40,60,80,100)
    let safeDamage = Math.max(0, Math.min(100, damage_num));
    let damageStage = Math.floor(safeDamage / 20) * 20;

    paints["resilience_gui"] = {
        type: 'rectangle',
        x: width_x,
        y: width_y,
        w: 56,
        h: 16,
        color: '#FFFFFF',
        visible: !guiOpen1,
        draw: 'always',
        alignX: "left",
        alignY: "top",
        texture: `rainbow:textures/gui/adrenaline_meter${stage}.png`
    };

    paints["damage_gui"] = {
        type: 'rectangle',
        x: width_x - 76,
        y: width_y,
        w: 56,
        h: 16,
        color: '#FFFFFF',
        visible: !guiOpen2,
        draw: 'always',
        alignX: "left",
        alignY: "top",
        texture: `rainbow:textures/gui/damage_meter${damageStage}.png`
    };

    // ========= 清理卸下的饰品图标 =========
    if (lastCuriosCount > curios_id.length) {
        for (let i = curios_id.length; i < lastCuriosCount; i++) {
            paints[`icon_${i}`] = { remove: true };
        }
    }

    // ========= 绘制饰品图标 =========
    let baseX = 10;
    let baseY = height - 10;

    for (let i = 0; i < curios_id.length; i++) {
        paints[`icon_${i}`] = {
            type: 'item',
            x: baseX + i * 20,
            y: baseY,
            scale: 1,
            item: curios_id[i],
            visible: !guiOpen,
            draw: 'always',
            alignX: "left",
            alignY: "top"
        };
    }

    // ========= 一次性绘制 =========
    player.paint(paints);

    // 更新上一次饰品数量
    lastCuriosCount = curios_id.length;
});