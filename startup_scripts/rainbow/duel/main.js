// 决斗细剑：玩家成功触发 Apothic Attributes 闪避时恢复 4 点生命值。
ForgeEvents.onEvent('com.morecallback.event.ApothicDodgeEvent', event => {
    try {
        let target = event.getTarget();
        if (target == null || !(target instanceof Player) || target.level == null || target.level.isClientSide()) return;
        let mainHand = target.getItemInHand("main_hand");
        if (mainHand == null || mainHand.id != "rainbow:duel") return;
        target.heal(4);
    }
    catch (e) {
        console.log('决斗细剑闪避回血处理出错：');
        console.log(e);
    }
});

// 决斗细剑：玩家触发极限闪避时获得力量 I，持续 3 秒。
ForgeEvents.onEvent('cc.sighs.extremeevasion.event.ExtremeEvasionTriggeredEvent', event => {
    try {
        let player = event.getPlayer();
        if (player == null || !(player instanceof Player) || player.level == null || player.level.isClientSide()) return;
        let mainHand = player.getItemInHand("main_hand");
        if (mainHand == null || mainHand.id != "rainbow:duel") return;
        player.potionEffects.add("minecraft:strength", 60, 0, false, false);
    }
    catch (e) {
        console.log('决斗细剑极限闪避力量效果处理出错：');
        console.log(e);
    }
});
