// priority: 200
// 傻子村民动态随机 GUI 接取、悬赏委托书定位与 GatewaysJS 传送门单次生成。
const RAINBOW_BOUNTY_CFG = global.RAINBOW_BOUNTY_CONFIG;
const RAINBOW_BOUNTY_STATE_KEY = 'RainbowBountyActive';
const RAINBOW_BOUNTY_CARD_KEY = 'RainbowBounty';
const RAINBOW_BOUNTY_GUI_PREFIX = 'rainbow_bounty_board_';

// 在主入口统一启用当前悬赏配置对应的 GatewaysJS 传送门。
rainbowBountyRegisterGateways();

function rainbowBountyDefinition(id) {
    for (let bounty of RAINBOW_BOUNTY_CFG.bounties) {
        if (bounty.id == id) return bounty;
    }
    return null;
}

function rainbowBountyReadState(player) {
    let data = player.persistentData;
    if (!data.contains(RAINBOW_BOUNTY_STATE_KEY)) return null;
    let tag = data.getCompound(RAINBOW_BOUNTY_STATE_KEY);
    return {
        id: tag.getString('id'),
        token: tag.getString('token'),
        status: tag.getString('status'),
        dimension: tag.getString('dimension'),
        x: tag.getInt('x'),
        y: tag.getInt('y'),
        z: tag.getInt('z')
    };
}

function rainbowBountyWriteState(player, state) {
    let tag = new CompoundTag();
    tag.putString('id', state.id);
    tag.putString('token', state.token);
    tag.putString('status', state.status);
    tag.putString('dimension', state.dimension);
    tag.putInt('x', state.x);
    tag.putInt('y', state.y);
    tag.putInt('z', state.z);
    player.persistentData.put(RAINBOW_BOUNTY_STATE_KEY, tag);
}

function rainbowBountyReadCard(item) {
    let nbt = item.nbt;
    if (nbt == null || !nbt.contains(RAINBOW_BOUNTY_CARD_KEY)) return null;
    let tag = nbt.getCompound(RAINBOW_BOUNTY_CARD_KEY);
    return { owner: tag.getString('owner'), id: tag.getString('id'), token: tag.getString('token') };
}

function rainbowBountyBoardNearby(player) {
    let data = player.persistentData;
    let now = player.level.getTime();
    let elapsed = now - data.getLong('RainbowBountyBoardTime');
    if (elapsed < 0 || elapsed > 1200) return false;
    if (data.getString('RainbowBountyBoardDimension') != rainbowBountyDimension(player.level)) return false;
    let dx = player.x - data.getDouble('RainbowBountyBoardX');
    let dy = player.y - data.getDouble('RainbowBountyBoardY');
    let dz = player.z - data.getDouble('RainbowBountyBoardZ');
    return dx * dx + dy * dy + dz * dz <= 64;
}

// GUI 上限为 5 项；可用悬赏不足时全部展示，超过时无重复随机抽取并同步给客户端。
function rainbowBountyOpenBoard(player) {
    let desired = RAINBOW_BOUNTY_CFG.guiOfferCount;
    if (desired == null || desired < 1) desired = 5;
    let offerCount = Math.max(1, Math.min(5, Math.floor(desired)));
    let data = player.persistentData;
    let previous = [];
    for (let i = 0; i < data.getInt('RainbowBountyOfferCount'); i++) {
        previous.push(data.getString('RainbowBountyOffer' + i));
    }
    let offers = rainbowBountyPickOffers(RAINBOW_BOUNTY_CFG.bounties, offerCount,
        gatewayId => Gateway.exists(gatewayId), Math.random, previous);
    let token = String(UUID.randomUUID());
    data.putString('RainbowBountyBoardToken', token);
    data.putInt('RainbowBountyOfferCount', offers.length);
    for (let i = 0; i < offers.length; i++) data.putString('RainbowBountyOffer' + i, offers[i].id);

    // 每个玩家只复用一个 GUI ID；点击时再次校验本次令牌与可见悬赏 ID。
    let guiId = RAINBOW_BOUNTY_GUI_PREFIX + String(player.getUuid());
    GuiJS.createGui(guiId, gui => {
        gui.title('悬赏委托');
        gui.size(248, 195);
        gui.label(14, 17, '本次可接取 ' + offers.length + ' 项悬赏', 0x404040);
        if (offers.length == 0) gui.label(14, 48, '暂无可用悬赏，请检查传送门配置', 0xaa3333);
        for (let i = 0; i < offers.length; i++) {
            let bounty = offers[i];
            gui.button('accept:' + token + ':' + bounty.id,
                14, 34 + i * 22, 220, 19, bounty.name);
        }
        gui.button('reroll:' + token, 14, 168, 105, 18, '换一批');
        gui.button('abandon:' + token, 129, 168, 105, 18, '放弃当前委托');
    });
    GuiJS.openCustom(player, guiId);
}

ItemEvents.entityInteracted(event => {
    let level = event.getLevel();
    if (level.isClientSide() || String(event.getHand()) != 'MAIN_HAND') return;
    let target = event.getTarget();
    if (target == null || String(target.getType()) != 'minecraft:villager') return;
    try {
        let profession = ForgeRegistries.VILLAGER_PROFESSIONS.getKey(target.getVillagerData().getProfession());
        if (String(profession) != 'minecraft:nitwit') return;
        let player = event.getPlayer();
        let data = player.persistentData;
        data.putLong('RainbowBountyBoardTime', level.getTime());
        data.putString('RainbowBountyBoardDimension', rainbowBountyDimension(level));
        data.putDouble('RainbowBountyBoardX', target.x);
        data.putDouble('RainbowBountyBoardY', target.y);
        data.putDouble('RainbowBountyBoardZ', target.z);
        rainbowBountyOpenBoard(player);
    } catch (error) {
        console.log('[悬赏] 打开村民界面失败: ' + error);
        return;
    }
    // KubeJS 6 的 cancel() 会抛出 EventExit；放在 try/catch 外，由事件框架正常处理。
    event.cancel();
});

GUIJSEvents.button(event => {
    let guiId = String(event.guiId);
    let player = event.player;
    if (guiId != RAINBOW_BOUNTY_GUI_PREFIX + String(player.getUuid())) return;
    try {
        if (!rainbowBountyBoardNearby(player)) {
            player.tell('§c请靠近傻子村民重新打开悬赏界面。');
            player.closeContainer();
            return;
        }
        let buttonId = String(event.buttonId);
        let data = player.persistentData;
        let token = data.getString('RainbowBountyBoardToken');
        if (token == '') return;
        if (buttonId == 'reroll:' + token) {
            data.putLong('RainbowBountyBoardTime', player.level.getTime());
            rainbowBountyOpenBoard(player);
            return;
        }
        if (buttonId == 'abandon:' + token) {
            data.remove(RAINBOW_BOUNTY_STATE_KEY);
            player.tell('§e当前委托已放弃，旧委托书将失效。');
            return;
        }
        let acceptPrefix = 'accept:' + token + ':';
        if (!buttonId.startsWith(acceptPrefix)) return;
        let bountyId = buttonId.substring(acceptPrefix.length);
        let offered = false;
        for (let i = 0; i < data.getInt('RainbowBountyOfferCount'); i++) {
            if (data.getString('RainbowBountyOffer' + i) == bountyId) offered = true;
        }
        if (!offered) return;
        let bounty = rainbowBountyDefinition(bountyId);
        if (bounty == null || !Gateway.exists(rainbowBountyGatewayId(bounty))) {
            player.tell('§c这项悬赏的传送门尚未注册，请联系管理者。');
            return;
        }
        let current = rainbowBountyReadState(player);
        // 配置删除的旧悬赏不再占用接取名额；新凭证会覆盖失效的旧记录。
        if (current != null && current.status == 'accepted' && rainbowBountyDefinition(current.id) != null) {
            player.tell('§e你已有未触发的悬赏。请先完成手中的委托。');
            return;
        }
        let target = rainbowBountyFindTarget(player.level, player, RAINBOW_BOUNTY_CFG, Math.random);
        if (target == null) {
            player.tell('§c暂时找不到符合群系和地形要求的坐标，请稍后重试。');
            return;
        }
        let contractToken = String(UUID.randomUUID());
        let state = {
            id: bounty.id, token: contractToken, status: 'accepted', dimension: target.dimension,
            x: target.x, y: target.y, z: target.z
        };
        let card = Item.of(RAINBOW_BOUNTY_CFG.contractItem, {
            RainbowBounty: { owner: String(player.getUuid()), id: bounty.id, name: bounty.name, token: contractToken }
        });
        rainbowBountyWriteState(player, state);
        player.give(card);
        player.tell('§a已接取悬赏：§f' + bounty.name + '§a。手持委托书右键查看坐标。');
        player.closeContainer();
    } catch (error) {
        console.log('[悬赏] 接取委托失败: ' + error);
        player.tell('§c接取悬赏失败，请查看服务器日志。');
    }
});

ItemEvents.firstRightClicked(RAINBOW_BOUNTY_CFG.contractItem, event => {
    let level = event.getLevel();
    if (level.isClientSide() || String(event.getHand()) != 'MAIN_HAND') return;
    let player = event.getPlayer();
    let item = event.getItem();
    try {
        let card = rainbowBountyReadCard(item);
        let state = rainbowBountyReadState(player);
        if (card == null || state == null || state.status != 'accepted' ||
            card.owner != String(player.getUuid()) || card.id != state.id || card.token != state.token) {
            player.tell('§c这张委托书不属于你当前接取的悬赏，或已被使用。');
            return;
        }
        let bounty = rainbowBountyDefinition(state.id);
        if (bounty == null) {
            player.tell('§c悬赏配置已失效，请联系管理者。');
            return;
        }
        let playerPos = {
            uuid: String(player.getUuid()), dimension: rainbowBountyDimension(level),
            x: player.x, y: player.y, z: player.z
        };
        if (!rainbowBountyCanTrigger(playerPos, state, card, RAINBOW_BOUNTY_CFG.triggerRadius)) {
            let dx = player.x - state.x;
            let dy = player.y - state.y;
            let dz = player.z - state.z;
            let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            player.tell('§e' + bounty.name + ' §f目标：' + state.dimension +
                ' §bX ' + state.x + ' Y ' + state.y + ' Z ' + state.z +
                '§f；当前距离约 ' + distance.toFixed(1) + ' 格。');
            return;
        }
        if (!Gateway.exists(rainbowBountyGatewayId(bounty))) {
            player.tell('§c对应传送门未注册，委托书没有消耗。');
            return;
        }
        let spawn = rainbowBountyFindSpawn(level, state, RAINBOW_BOUNTY_CFG.biomeBlacklist,
            RAINBOW_BOUNTY_CFG.spawnSearchRadius);
        if (spawn == null) {
            player.tell('§c目标附近暂时没有安全传送门位置，请清理场地后重试。');
            return;
        }
        let gate = Gateway.builder(rainbowBountyGatewayId(bounty))
            .pos(spawn.x + 0.5, spawn.y, spawn.z + 0.5)
            .summoner(player)
            .spawn(level);
        if (gate == null) {
            player.tell('§c传送门生成失败，委托书没有消耗。');
            return;
        }
        // 成功后先写已触发状态，再消耗凭证，阻止重复右键刷门。
        state.status = 'spawned';
        rainbowBountyWriteState(player, state);
        item.shrink(1);
        player.tell('§a悬赏传送门已在 X ' + spawn.x + ' Y ' + spawn.y + ' Z ' + spawn.z + ' 生成。');
    } catch (error) {
        console.log('[悬赏] 委托书触发失败: ' + error);
        player.tell('§c悬赏触发失败，请查看服务器日志。');
    }
});
