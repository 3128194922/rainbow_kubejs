// 盾反主入口：统一处理击退、粒子/音效反馈，以及原有饰品联动。

// 将攻击者推离玩家，5 点伤害默认换算为 1 格水平击退速度。
function applyShieldParryKnockback(player, attacker, blockedDamage) {
    try {
        if (!player || !attacker || !attacker.isAlive()) return;

        let dx = attacker.getX() - player.getX();
        let dz = attacker.getZ() - player.getZ();
        let distance = Math.sqrt(dx * dx + dz * dz);

        // 两个实体重叠时使用玩家视线，避免除以 0 导致击退方向失效。
        if (distance < 0.0001) {
            let view = player.getViewVector(1.0);
            dx = view.x();
            dz = view.z();
            distance = Math.sqrt(dx * dx + dz * dz);
        }
        if (distance < 0.0001) return;

        let speed = calculateShieldParryKnockbackSpeed(blockedDamage);
        if (!(speed > 0)) return;

        let motion = attacker.getDeltaMovement();
        let vertical = motion.y();
        if (vertical < 0.35) vertical = 0.35;

        attacker.setDeltaMovement(new Vec3(
            dx / distance * speed,
            vertical,
            dz / distance * speed
        ));
        attacker.hurtMarked = true;
    } catch (e) {
        console.log("应用盾反击退出现问题：");
        console.log(e);
    }
}

// 盾反成功反馈：玩家侧闪光/附魔粒子，攻击者侧受击/横扫粒子与击退音效。
function playShieldParryFeedback(player, attacker) {
    try {
        let server = player.server;
        let px = player.getX();
        let py = player.getY();
        let pz = player.getZ();

        // 盾牌格挡音与暴击音叠加，保留模组自带铁砧音作为低频底。
        server.runCommandSilent(`/playsound minecraft:item.shield.block players @a ${px} ${py} ${pz} 0.9 0.9`);
        server.runCommandSilent(`/playsound minecraft:entity.player.attack.crit players @a ${px} ${py + 1.0} ${pz} 0.8 1.15`);

        // 中心闪光、附魔命中与云雾冲击，形成即时的盾面爆发感。
        server.runCommandSilent(`particle minecraft:flash ${px} ${py + 1.1} ${pz} 0 0 0 0 1`);
        server.runCommandSilent(`particle minecraft:enchanted_hit ${px} ${py + 1.0} ${pz} 0.65 0.7 0.65 0.15 24`);
        server.runCommandSilent(`particle minecraft:cloud ${px} ${py + 0.8} ${pz} 1.15 0.1 1.15 0.2 20`);

        if (attacker && attacker.isAlive()) {
            let ax = attacker.getX();
            let ay = attacker.getY() + attacker.getBbHeight() * 0.5;
            let az = attacker.getZ();
            server.runCommandSilent(`/particle minecraft:damage_indicator ${ax} ${ay} ${az} 0.35 0.5 0.35 0.1 12`);
            server.runCommandSilent(`/particle minecraft:sweep_attack ${ax} ${ay} ${az} 1.0 0 0 0 0`);
            server.runCommandSilent(`/playsound minecraft:entity.player.attack.knockback players @a ${ax} ${ay} ${az} 0.75 0.85`);
        }

        // 保留现有的橙色悬浮字幕，但只发送一次，避免重复显示。
        global.sendParticleTextInFront(player, "盾反！", 0xFFAA00);
    } catch (e) {
        console.log("播放盾反反馈出现问题：");
        console.log(e);
    }
}

// shiledattack 在发布 ShieldParriedEvent 前已经应用默认击退，这里覆盖为本项目的伤害比例。
ForgeEvents.onEvent('com.shiledattack.event.ShieldParriedEvent', event => {
    try {
        let player = event.player;
        if (!player || !player.isAlive()) return;
        if (player.level.isClientSide()) return;

        let attacker = event.attacker;
        let blockedDamage = event.blockedDamage;

        applyShieldParryKnockback(player, attacker, blockedDamage);
        playShieldParryFeedback(player, attacker);

        if (hasCurios(player, "rainbow:sharingan")) {
            // 写轮眼：盾反时恢复主副手 + Curios 饰品总冷却时长的 25%。
            sharinganRestoreCooldowns(player, 0.25);
        }

        if (hasCurios(player, "rainbow:reload_core")) {
            // 装填核心：盾反时两把霰弹枪的当前剩余冷却减少 33%，自身被动冷却 1 秒。
            if (!player.cooldowns.isOnCooldown("rainbow:reload_core")) {
                let cutA = restoreCooldownByRemaining(player, Item.of('netherexp:shotgun_fist'), 0.33);
                let cutB = restoreCooldownByRemaining(player, Item.of('netherexp:pump_charge_shotgun'), 0.33);
                if (cutA || cutB) {
                    player.cooldowns.addCooldown("rainbow:reload_core", SecoundToTick(1));
                }
            }
        }
    } catch (e) {
        console.log("盾反处理出现问题：");
        console.log(e);
    }
});
