// priority: 10000
// ==========================================
// 💎 圣遗物镶嵌系统 (wooden_sword_inlay)
// ==========================================
// 机制：仅 rainbow:relic 可在铁砧中使用 rainbow:miracle 镶嵌，最多 5 次；第五次按五条词条觉醒元素。
// 每次镶嵌从配置随机抽 1 个属性，并在该属性的 [min, max] 内按 step 随机取值（同一属性允许重复叠加）。
//
// 为什么放在 startup_scripts：
//   AnvilUpdateEvent 在客户端和服务端都会触发（客户端需要同步计算铁砧结果槽），而 ForgeEvents 只在
//   startup 脚本类型注册（见 KubeJS BuiltinKubeJSForgePlugin），所以镶嵌规则放在 startup_scripts。
// 随机一致性：
//   随机种子在第一次镶嵌时由服务端生成并写回铁砧左槽圣遗物的 NBT，客户端同步到同一个种子后即可算出同一结果；
//   随机值只由 (种子, 槽位下标) 决定，因此反复放入/取出材料不会重 roll 属性。

// JavaRandom / Component 统一由 startup_scripts/CONST.js 提供。

// 读取镶嵌配置（对象变量定义在 startup_scripts/wooden_sword_inlay/config.js）
function getWoodenSwordInlayConfig() {
    try {
        if (global.WOODEN_SWORD_INLAY_CONFIG == null) {
            console.log('[圣遗物词条] 未找到 global.WOODEN_SWORD_INLAY_CONFIG，请检查 config.js 是否加载');
            return null;
        }
        return global.WOODEN_SWORD_INLAY_CONFIG;
    } catch (e) {
        console.log('[圣遗物词条] 读取配置失败：' + e);
        return null;
    }
}

// 槽位属性键：prefix + 下标 + Attr
function getInlayAttrKey(cfg, index) {
    return cfg.nbt.prefix + index + 'Attr';
}

// 槽位数值键：prefix + 下标 + Val
function getInlayValKey(cfg, index) {
    return cfg.nbt.prefix + index + 'Val';
}

// 读取圣遗物已镶嵌次数（无 NBT 视为 0）
function getInlayCount(tag, cfg) {
    if (tag == null || !tag.contains(cfg.nbt.count)) return 0;
    let count = tag.getInt(cfg.nbt.count);
    if (count < 0) return 0;
    return count;
}

// 五条词条的属性 ID 与万分位数值构成固定哈希；旧满镶嵌圣遗物可按同一规则补算。
// 只信任合法的完整词条数据，避免伪造数量或缺失词条激活套装。
function getRelicAwakeningElement(tag) {
    try {
        let cfg = getWoodenSwordInlayConfig();
        if (cfg == null || tag == null || getInlayCount(tag, cfg) < cfg.maxSockets) return null;
        let hash = 0;
        for (let i = 0; i < cfg.maxSockets; i++) {
            let attrKey = getInlayAttrKey(cfg, i);
            let valKey = getInlayValKey(cfg, i);
            if (!tag.contains(attrKey) || !tag.contains(valKey)) return null;
            let attrId = tag.getString(attrKey);
            let amount = tag.getDouble(valKey);
            if (attrId.length === 0 || !isFinite(amount) || amount <= 0) return null;
            let part = attrId + ':' + Math.round(amount * 10000) + ';';
            for (let j = 0; j < part.length; j++) hash = (hash * 31 + part.charCodeAt(j)) | 0;
        }
        let ids = Object.keys(cfg.elements);
        if (ids.length !== 8) return null;
        let computed = ids[new JavaRandom(hash).nextInt(ids.length)];
        // 已有标记用于快速识别；旧物品没有标记时直接使用词条推导结果。
        if (tag.contains(cfg.nbt.element)) {
            let stored = tag.getString(cfg.nbt.element);
            if (stored === computed) return stored;
        }
        return computed;
    } catch (e) {
        console.log('[圣遗物觉醒] 计算元素失败：' + e);
        return null;
    }
}
global.getRelicAwakeningElement = getRelicAwakeningElement;

// 读取随机种子；服务端在没有种子时生成并写回左槽圣遗物，客户端只读（避免两边随机结果不同）
function getOrCreateInlaySeed(leftStack, tag, cfg, isClient) {
    if (tag != null && tag.contains(cfg.nbt.seed)) return tag.getLong(cfg.nbt.seed);
    if (isClient) return null;
    // 使用 int 范围内的正整数作为种子，便于写入 NBT 后在客户端稳定复现
    let seed = 1 + Math.floor(Math.random() * 2147483646);
    leftStack.getOrCreateTag().putLong(cfg.nbt.seed, seed);
    return seed;
}

// 依据 (随机种子, 槽位下标) 决定圣遗物本次镶嵌的属性与数值；同样入参在客户端与服务端得到同一结果
function rollInlayBonus(cfg, seed, index) {
    let ids = Object.keys(cfg.attributes);
    if (ids.length === 0) return null;

    let rng = new JavaRandom(seed + index * 7919);
    let id = ids[rng.nextInt(ids.length)];
    let def = cfg.attributes[id];
    if (def == null) return null;

    let steps = Math.round((def.max - def.min) / def.step);
    if (steps < 0) steps = 0;
    let amount = def.min + rng.nextInt(steps + 1) * def.step;
    // 归一化到 4 位小数，避免浮点误差导致客户端与服务端 NBT 出现 0.030000000000000002 这类差异
    return { attribute: id, amount: Math.round(amount * 10000) / 10000 };
}

// 铁砧经验等级消耗：第 (index + 1) 次镶嵌 = base + perSocket * index，并做上限与最小值保护
function getInlayCost(cfg, index) {
    let cost = cfg.cost.base + cfg.cost.perSocket * index;
    if (cost > cfg.cost.maxCost) cost = cfg.cost.maxCost;
    if (cost < 1) cost = 1;
    return cost;
}

// 保留原版铁砧改名：事件已产出结果时原版改名逻辑会被跳过，这里补上同样的行为
function applyInlayHoverName(event, left, output) {
    let newName = event.getName();
    if (newName == null) return;
    if (String(newName).trim().length === 0) {
        if (left.hasCustomHoverName()) output.resetHoverName();
        return;
    }
    if (newName !== left.getHoverName().getString()) {
        output.setHoverName(Component.literal(newName));
    }
}

// 铁砧镶嵌：仅左槽圣遗物 + 右槽奇迹物质 -> 产出多一条词条，并消耗 1 个奇迹物质
function handleInlayAnvilEvent(event) {
    let cfg = getWoodenSwordInlayConfig();
    if (cfg == null) return;

    let left = event.getLeft();
    let right = event.getRight();
    if (left == null || right == null) return;
    if (left.isEmpty() || right.isEmpty()) return;
    if (left.id !== cfg.relicId) return;
    if (right.id !== cfg.materialId) return;
    // 一次只镶嵌一把：整堆物品共用同一个 NBT，直接交回原版处理
    if (left.getCount() > 1) return;

    let player = event.getPlayer();
    let isClient = false;
    try {
        isClient = (player != null && player.level != null && player.level.isClientSide());
    } catch (e) {
        console.log('[圣遗物词条] 判定客户端/服务端失败：' + e);
    }

    let tag = left.getNbt();
    let count = getInlayCount(tag, cfg);
    // 已满 5 次：不产出结果，交回原版（仍可正常改名等操作）
    if (count >= cfg.maxSockets) return;

    let seed = getOrCreateInlaySeed(left, tag, cfg, isClient);
    // 客户端尚未同步到种子（极端情况）：本次不产出，等服务端把带种子的结果同步过来
    if (seed == null) return;

    let bonus = rollInlayBonus(cfg, seed, count);
    if (bonus == null) return;

    let output = left.copy();
    let outTag = output.getOrCreateTag();
    outTag.putInt(cfg.nbt.count, count + 1);
    outTag.putLong(cfg.nbt.seed, seed);
    outTag.putString(getInlayAttrKey(cfg, count), bonus.attribute);
    outTag.putDouble(getInlayValKey(cfg, count), bonus.amount);
    // 第五次镶嵌将可复现的元素写入产物，客户端与服务端预览一致。
    if (count + 1 === cfg.maxSockets) {
        let element = getRelicAwakeningElement(outTag);
        if (element != null) outTag.putString(cfg.nbt.element, element);
    }

    applyInlayHoverName(event, left, output);

    event.setOutput(output);
    event.setCost(getInlayCost(cfg, count));
    // 每次镶嵌消耗 1 个 miracle，消耗数量由原版铁砧 onTake 结算
    event.setMaterialCost(1);
}

// 把圣遗物 NBT 中的词条交给 KubeJS Curios 属性回调；仅在饰品装备时应用
function applyRelicInlayAttributes(event) {
    try {
        let cfg = getWoodenSwordInlayConfig();
        if (cfg == null) return;

        let stack = event.stack;
        if (stack == null || stack.isEmpty() || stack.id !== cfg.relicId) return;

        let tag = stack.getNbt();
        let count = getInlayCount(tag, cfg);
        if (count <= 0 || tag == null) return;
        if (count > cfg.maxSockets) count = cfg.maxSockets;

        for (let i = 0; i < count; i++) {
            let attrKey = getInlayAttrKey(cfg, i);
            if (!tag.contains(attrKey)) continue;

            let attrId = tag.getString(attrKey);
            let amount = tag.getDouble(getInlayValKey(cfg, i));
            if (amount <= 0) continue;

            try {
                // Curios 提供每个佩戴槽位的 UUID；再加入词条下标，避免多件圣遗物的相同词条互相覆盖。
                let slotUuid = event.uuid;
                if (slotUuid == null) throw new Error('Curios 未提供饰品槽位 UUID');
                let modifierUuid = UUID.nameUUIDFromBytes(JavaString.valueOf(slotUuid.toString() + ':relic_inlay_' + i).getBytes());
                event.modify(attrId, modifierUuid, 'relic_inlay_' + i, amount, 'addition');
            } catch (e) {
                console.log('[圣遗物词条] 第 ' + (i + 1) + ' 条属性应用失败(' + attrId + ')：' + e);
            }
        }
    } catch (e) {
        console.log('[圣遗物词条] Curios 属性回调失败：' + e);
    }
}

// 铁砧产出：客户端预览圣遗物结果槽，服务端产出真实物品
ForgeEvents.onEvent('net.minecraftforge.event.AnvilUpdateEvent', event => {
    try {
        handleInlayAnvilEvent(event);
    } catch (e) {
        console.log('[圣遗物词条] 铁砧镶嵌事件出错：' + e);
    }
});
