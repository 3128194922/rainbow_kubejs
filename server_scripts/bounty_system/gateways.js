// priority: 400
// 内嵌 gateway 对象注册新门；gateway 字符串只引用现有复杂传送门。
function rainbowBountyAddGateReward(builder, reward) {
    if (reward.json != null) builder.addRewardJson(reward.json);
    else if (reward.nbt != null) builder.addReward(reward.item, reward.count, reward.nbt);
    else builder.addReward(reward.item, reward.count);
}

function rainbowBountyConfigureGateway(bounty) {
    let gate = bounty.gateway;
    if (gate == null || gate.id == null || gate.waves == null || gate.waves.length == 0) {
        throw new Error('内嵌传送门必须填写 id 和至少一波 waves');
    }
    let builder = Gateway.customBuilder(gate.id).name(gate.name != null ? gate.name : bounty.name);

    // 外观与 Boss 条；未配置的字段交由 GatewaysJS 使用自身默认值。
    if (gate.size != null) builder.size(gate.size);
    if (gate.color != null) builder.color(gate.color);
    if (gate.tooltipText != null) builder.tooltipText(gate.tooltipText);
    if (gate.entityTexture != null) builder.entityTexture(gate.entityTexture);
    if (gate.bossBarTexture != null) builder.bossBarTexture(gate.bossBarTexture);
    if (gate.bossEvent != null) builder.bossEvent(gate.bossEvent.mode, gate.bossEvent.fog === true);
    if (gate.finalizeSpawn != null) builder.finalizeSpawn(gate.finalizeSpawn);
    if (gate.hidePearl === true) builder.hidePearlInCreativeTab();

    // 常用战斗规则均可在该悬赏的 rules 中独立覆盖。
    let rules = gate.rules;
    if (rules != null) {
        if (rules.spawnRange != null) builder.spawnRange(rules.spawnRange);
        if (rules.leashRange != null) builder.leashRange(rules.leashRange);
        if (rules.allowDiscarding != null) builder.allowDiscarding(rules.allowDiscarding);
        if (rules.allowDimChange != null) builder.allowDimChange(rules.allowDimChange);
        if (rules.playerDamageOnly != null) builder.playerDamageOnly(rules.playerDamageOnly);
        if (rules.removeMobsOnFailure != null) builder.removeMobsOnFailure(rules.removeMobsOnFailure);
        if (rules.failOnOutOfBounds != null) builder.failOnOutOfBounds(rules.failOnOutOfBounds);
        if (rules.spacing != null) builder.spacing(rules.spacing);
        if (rules.followRangeBoost != null) builder.followRangeBoost(rules.followRangeBoost);
        if (rules.defaultDropChance != null) builder.defaultDropChance(rules.defaultDropChance);
    }

    for (let wave of gate.waves) {
        if (wave.mobs == null || wave.mobs.length == 0) throw new Error('每波至少需要一个 mobs 实体');
        builder.addWave(waveBuilder => {
            for (let mob of wave.mobs) {
                if (mob.json != null) {
                    waveBuilder.addEntityJson(mob.json);
                } else {
                    let entity = waveBuilder.addEntity(mob.type, mob.count);
                    if (mob.nbt != null || mob.finalizeSpawn != null) {
                        entity.modify(modifier => {
                            if (mob.nbt != null) modifier.setNbt(mob.nbt);
                            if (mob.finalizeSpawn != null) modifier.finalizeSpawn(mob.finalizeSpawn);
                        });
                    }
                }
            }
            if (wave.maxTime != null) waveBuilder.maxTime(wave.maxTime);
            if (wave.setupTime != null) waveBuilder.setupTime(wave.setupTime);
            if (wave.modifiersJson != null) {
                for (let modifierJson of wave.modifiersJson) waveBuilder.addModifierJson(modifierJson);
            }
            if (wave.rewards != null) {
                for (let reward of wave.rewards) rainbowBountyAddGateReward(waveBuilder, reward);
            }
        });
    }
    if (gate.rewards != null) {
        for (let reward of gate.rewards) rainbowBountyAddGateReward(builder, reward);
    }
    if (gate.failures != null) {
        for (let failure of gate.failures) {
            if (failure.json != null) builder.addFailureJson(failure.json);
            else if (failure.type == 'explosion') builder.addExplosionFailure(failure.strength, failure.fire === true, failure.blockDamage === true);
            else if (failure.type == 'summon') builder.addSummonFailure(failure.entity, failure.count);
            else if (failure.type == 'effect') {
                let effect = ForgeRegistries.MOB_EFFECTS.getValue(new ResourceLocation(failure.effect));
                if (effect == null) throw new Error('未知状态效果: ' + failure.effect);
                builder.addMobEffectFailure(effect, failure.duration, failure.amplifier != null ? failure.amplifier : 0);
            } else throw new Error('未知失败惩罚: ' + failure.type);
        }
    }
    builder.register();
}

// 在主入口注册服务端事件；外部传送门不重建，避免覆盖其复杂配置。
function rainbowBountyRegisterGateways() {
    ServerEvents.recipes(event => {
        for (let bounty of global.RAINBOW_BOUNTY_CONFIG.bounties) {
            if (typeof bounty.gateway == 'string') continue;
            try {
                rainbowBountyConfigureGateway(bounty);
            } catch (error) {
                console.log('[悬赏] 注册传送门 ' + rainbowBountyGatewayId(bounty) + ' 失败: ' + error);
            }
        }
    });
}
