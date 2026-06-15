// priority: 1000
// Docker 通用型 - 交互处理（绑定玩家 / 潜行右键切换模式）
BlockEvents.rightClicked("rainbow:docker", event => {
    let player = event.player;
    let block = event.block;
    let hand = event.getHand().toString();
    // 只处理主手交互，防止副手重复触发
    if (hand === "OFF_HAND") return;

    let be = block.entity;
    if (!be) return;

    let pdata = be.persistentData;
    if (!pdata) return;

    let edata = be.data;
    if (!edata) {
        edata = {};
        be.data = edata;
    }

    let mode = pdata.mode || 0;
    let boundUuid = edata.uuid || null;

    if (player.isCrouching()) {
        //event.cancel();

        // 未绑定 → 潜行右键绑定当前玩家
        if (!boundUuid) {
            edata.uuid = player.getStringUuid();
            player.tell("§a[Docker] 已绑定到你 §7| §a模式: " + global.DOCKER_MODE_NAMES[mode] + " §7| §a潜行右键切换模式");
            return;
        }

        // 已绑定给当前玩家 → 切换模式并清空物品
        if (boundUuid === player.getStringUuid()) {
            pdata.mode = (mode + 1) % 6;
            // 清空 docker 物品，防止上一模式映射物品残留
            let inv = be.inventory;
            for (let i = 0; i < inv.slots; i++) {
                if (!inv.getStackInSlot(i).isEmpty()) {
                    inv.setStackInSlot(i, ItemStack.EMPTY);
                }
            }
            player.tell("§a[Docker] 切换至模式: " + global.DOCKER_MODE_NAMES[pdata.mode]);
            return;
        }

        // 已绑定给其他玩家
        let owner = player.server.getPlayerList().getPlayer(UUID.fromString(boundUuid));
        let ownerName = owner ? owner.getName().getString() : "离线玩家";
        player.tell("§c[Docker] 已绑定给 §e" + ownerName + "§c，无法切换模式");
        return;
    }

    // mode 0,1（转移型）：不拦截，由 rightClickOpensInventory 自动打开GUI
    if (mode <= 1) return;

    // mode 2+（代理型）：取消默认打开GUI行为，显示当前模式信息
    //event.cancel();
    player.tell("§e[Docker] 当前模式: " + global.DOCKER_MODE_NAMES[mode] + " §7| §a潜行右键切换");
});
