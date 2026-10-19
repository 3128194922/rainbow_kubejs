// priority: 400
// 悬赏传送门 ID、随机 GUI 选项、坐标筛选与权限判定：独立于事件，便于离线验证。
const RAINBOW_BOUNTY_PI = 3.141592653589793;

// gateway 对象在本系统注册，字符串则引用已经存在的复杂传送门。
function rainbowBountyGatewayId(bounty) {
    if (bounty == null || bounty.gateway == null) return null;
    if (typeof bounty.gateway == 'string') return bounty.gateway;
    return bounty.gateway.id;
}

// 从可用悬赏中无放回抽取；有其他选项时，“换一批”不会重复上一批的完整组合。
function rainbowBountyPickOffers(bounties, count, isAvailable, random, previous) {
    let pool = [];
    let seen = {};
    for (let bounty of bounties) {
        let id = rainbowBountyGatewayId(bounty);
        if (bounty == null || bounty.id == null || seen[bounty.id]) continue;
        seen[bounty.id] = true;
        if (id != null && isAvailable(id)) pool.push(bounty);
    }
    let offers = [];
    while (offers.length < count && pool.length > 0) {
        let index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
        offers.push(pool.splice(index, 1)[0]);
    }
    if (previous != null && previous.length == offers.length && offers.length > 0) {
        let same = true;
        for (let offer of offers) {
            if (previous.indexOf(offer.id) < 0) same = false;
        }
        if (same) {
            let alternatives = [];
            for (let bounty of pool) {
                if (previous.indexOf(bounty.id) < 0) alternatives.push(bounty);
            }
            if (alternatives.length > 0) {
                let index = Math.min(alternatives.length - 1, Math.floor(random() * alternatives.length));
                offers[offers.length - 1] = alternatives[index];
            }
        }
    }
    return offers;
}

function rainbowBountyDimension(level) {
    let dimension = level.dimension;
    if (dimension != null && typeof dimension.location == 'function') return String(dimension.location());
    return String(dimension);
}

function rainbowBountyBiomeAllowed(level, x, y, z, blacklist) {
    let holder = level.getBiome(new BlockPos(x, y, z));
    let key = holder.unwrapKey().orElse(null);
    if (key == null) return false;
    let biomeId = String(key.location());
    for (let entry of blacklist) {
        if (entry.charAt(0) == '#') {
            let tag = TagKey.create(Registries.BIOME, new ResourceLocation(entry.substring(1)));
            if (holder.is(tag)) return false;
        } else if (entry == biomeId) {
            return false;
        }
    }
    return true;
}

function rainbowBountyCanStand(level, x, y, z) {
    if (y <= level.getMinBuildHeight() + 1 || y >= level.getMaxBuildHeight() - 3) return false;
    // 传送门周围留出 3x3 的实心地面与三格高的空气，避免水面、树冠和悬空点。
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            let floor = level.getBlockState(new BlockPos(x + dx, y - 1, z + dz));
            if (floor.isAir() || !floor.getFluidState().isEmpty() || !floor.blocksMotion()) return false;
            for (let dy = 0; dy <= 2; dy++) {
                let pos = new BlockPos(x + dx, y + dy, z + dz);
                let space = level.getBlockState(pos);
                if (!space.getFluidState().isEmpty() || !space.getCollisionShape(level, pos).isEmpty()) return false;
            }
        }
    }
    return true;
}

function rainbowBountySurface(level, x, z, blacklist) {
    let surface = level.getHeightmapPos(HeightmapTypes.MOTION_BLOCKING_NO_LEAVES, new BlockPos(x, 0, z));
    let y = surface.getY();
    if (!rainbowBountyBiomeAllowed(level, x, y, z, blacklist)) return null;
    if (!rainbowBountyCanStand(level, x, y, z)) return null;
    return { x: x, y: y, z: z };
}

function rainbowBountyFindTarget(level, player, config, random) {
    for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
        let distance = config.minDistance + random() * (config.maxDistance - config.minDistance);
        let angle = random() * 2 * RAINBOW_BOUNTY_PI;
        let x = Math.round(player.x + Math.cos(angle) * distance);
        let z = Math.round(player.z + Math.sin(angle) * distance);
        let top = level.getHeightmapPos(HeightmapTypes.MOTION_BLOCKING_NO_LEAVES, new BlockPos(x, 0, z));
        if (!rainbowBountyBiomeAllowed(level, x, top.getY(), z, config.biomeBlacklist)) continue;
        let surface = rainbowBountyFindSpawn(level, { x: x, y: top.getY(), z: z }, config.biomeBlacklist, 3);
        if (surface != null) {
            surface.dimension = rainbowBountyDimension(level);
            return surface;
        }
    }
    return null;
}

function rainbowBountyFindSpawn(level, target, blacklist, radius) {
    for (let distance = 0; distance <= radius; distance++) {
        for (let dx = -distance; dx <= distance; dx++) {
            for (let dz = -distance; dz <= distance; dz++) {
                if (distance > 0 && Math.abs(dx) != distance && Math.abs(dz) != distance) continue;
                let surface = rainbowBountySurface(level, target.x + dx, target.z + dz, blacklist);
                if (surface != null && Math.abs(surface.y - target.y) <= 4) return surface;
            }
        }
    }
    return null;
}

function rainbowBountyCanTrigger(player, state, card, radius) {
    if (state == null || card == null || state.status != 'accepted') return false;
    if (card.owner != player.uuid || card.id != state.id || card.token != state.token) return false;
    if (state.dimension != player.dimension) return false;
    let dx = player.x - state.x;
    let dy = player.y - state.y;
    let dz = player.z - state.z;
    return dx * dx + dy * dy + dz * dz <= radius * radius;
}
