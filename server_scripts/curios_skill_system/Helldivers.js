// priority: 0
// ==========================================
// 🖱️ 饰品技能UI交互脚本
// ==========================================

// 技能注册表
let MagicRegistry = {};
let MagicSoundRegistry = {};

/**
 * 注册技能音效
 * @param {string} itemId 饰品ID
 * @param {string} soundId 音效ID
 */
function registerMagicSound(itemId, soundId) {
    MagicSoundRegistry[itemId] = soundId;
}

/**
 * 注册技能处理函数
 * @param {string} itemId 饰品ID
 * @param {function} handler 处理函数 (event, player) => void
 */
function registerMagic(itemId, handler) {
    MagicRegistry[itemId] = handler;
}

/**
 * 解析网络包里的物品ID，兼容字符串与对象两种格式
 * @param {string|object} packetItem
 * @returns {string|null}
 */
function resolvePacketItemId(packetItem) {
    if (!packetItem) return null;
    if (typeof packetItem === "string") return packetItem;
    if (packetItem.id != null) return String(packetItem.id);
    return String(packetItem);
}

/**
 * 安全数值转换，失败时返回默认值
 * @param {any} value
 * @param {number} fallback
 * @returns {number}
 */
function toNumber(value, fallback) {
    if (value == null) return fallback;
    let num = Number(value);
    return Number.isNaN(num) ? fallback : num;
}

/**
 * 发射一枚Scorcher火焰投射物（参数对齐DungeonNowLoading）
 * @param {Internal.Player} player
 * @param {object|null} spellData
 */
function shootScorcherFlame(caster, spellData) {
    if (!FlameProjectileEntity) return;
    let level = caster.level;
    if (level.isClientSide()) return;
    let eyePosition = caster.getEyePosition(1.0);
    let viewVector = caster.getViewVector(1.0);
    let rightVector = new Vec3(-viewVector.z(), 0, viewVector.x()).normalize();
    let rightOffset = 0.175;
    let verticalOffset = -0.25;
    let spawnPosition = eyePosition.add(viewVector.scale(0.6)).add(rightVector.scale(rightOffset)).add(0, verticalOffset, 0);
    let targetPosition = eyePosition.add(viewVector.scale(30)).add(0, -verticalOffset, 0);
    let correctedDirection = targetPosition.subtract(spawnPosition).normalize();
    let spread = toNumber(spellData && spellData.spread, 0.5);
    let spreadVector = new Vec3(
        (level.getRandom().nextDouble() - 0.5) * spread,
        (level.getRandom().nextDouble() - 0.5) * spread,
        (level.getRandom().nextDouble() - 0.5) * spread
    );
    correctedDirection = correctedDirection.add(spreadVector).normalize();
    let flame = new FlameProjectileEntity(DNLEntityTypes.FLAME_PROJECTILE.get(), level);
    flame.setOwner(caster);
    flame.setPos(spawnPosition.x(), spawnPosition.y(), spawnPosition.z());
    let damage = toNumber(spellData && spellData.damage, 4.0);
    let speed = toNumber(spellData && (spellData.bulletSpeed != null ? spellData.bulletSpeed : spellData.speed), 0.4);
    flame.setDamage(damage);
    if (spellData && spellData.soul) {
        flame.setSoul(true);
    }
    flame.setDeltaMovement(correctedDirection.scale(speed));
    level.addFreshEntity(flame);
}

/**
 * 通用持续施法调度器：按tick重复执行回调
 * @param {Internal.Player} player
 * @param {number} durationTicks
 * @param {(player: Internal.Player, elapsed: number) => void} onTick
 */
function runContinuousCast(player, durationTicks, onTick) {
    let elapsed = 0;
    player.level.server.scheduleInTicks(1, e => {
        if (!player || !player.isAlive()) {
            e.repeating = false;
            return;
        }
        onTick(player, elapsed);
        elapsed++;
        e.repeating = elapsed < durationTicks;
    });
}

registerMagic("rainbow:fire_magic", (event, player) => {
    let spellData = event.data && event.data.spell ? event.data.spell : null;
    runContinuousCast(player, 40, () => {
        shootScorcherFlame(player, spellData);
        /*let ownerUuid = player.getUuid().toString();
        let area = player.boundingBox.inflate(5);
        player.level.getEntitiesWithin(area).forEach(entity => {
            if (!entity || !entity.isAlive()) return;
            if (entity.type != "player_mobs:player_mob") return;
            if (entity.persistentData.OwnerName != ownerUuid) return;
            shootScorcherFlame(entity, spellData);
        });*/
    });
});

// ==========================================
// 主入口逻辑
// ==========================================

NetworkEvents.dataReceived('helldivers', event => {
    let player = event.player;
    let packetItem = event.data.item;
    //console.log(player)//{item:"rainbow:fire_magic",player:"Ilker_Uniye",spell:{cd:120,count:2,count_cd:10,runtime_count:0,runtime_full_cd_end:51293L,runtime_next_use:0L}} [net.minecraft.nbt.CompoundTag]

    if (!packetItem) return;

    // 获取物品ID
    let itemId = resolvePacketItemId(packetItem);
    if (!itemId) return;

    // 播放音效
    let soundId = MagicSoundRegistry[itemId] || "rainbow:voice.skillwheel";
    player.level.playSound(null, player.getX(), player.getY(), player.getZ(), soundId, "voice", 1, 1)

    let handler = MagicRegistry[itemId];
    if (!handler) return;
    try {
        handler(event, player);
    } catch (error) {
        console.error(`Error executing Magic for ${itemId}: ${error}`);
        player.tell(Text.red(`技能执行出错: ${error}`));
    }
});
