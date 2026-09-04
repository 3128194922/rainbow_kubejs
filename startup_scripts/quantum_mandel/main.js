// priority: 9000
// ==========================================
// 量子密钥 / 曼德尔砖机制复刻
// ==========================================
// 使用 rainbow 命名空间注册替代物品；MysticArtifacts 的源码和 JAR 保持不变。

const QUANTUM_KEY_ID = 'rainbow:quantum_key'
const MANDEL_BRICK_ID = 'rainbow:mandel_brick'
const LEGACY_QUANTUM_KEY_ID = 'mysticartifacts:quantum_key'
const LEGACY_MANDEL_BRICK_ID = 'mysticartifacts:mandel_brick'
const QUANTUM_KEY_CREATION_TIME_TAG = 'CreationTime'
const MANDEL_BRICK_UNLOCKED_TAG = 'Unlocked'
const QUANTUM_KEY_EXPIRATION_TICKS = 1200
const MANDEL_BRICK_REWARD_TABLE_ID = 'mysticartifacts:gameplay/mandel_brick_reward'
const QUANTUM_KEY_UNLOCK_SOUND_ID = 'mysticartifacts:item.quantum_key.unlock'
const MANDEL_BRICK_OPEN_SOUND_ID = 'mysticartifacts:item.mandel.open'
const QUANTUM_KEY_EXPIRED_SOUND_ID = 'minecraft:block.note_block.bass'

// 复刻原物品的基础属性，并沿用 MysticArtifacts 已有的纹理资源。
StartupEvents.registry('item', event => {
    try {
        event.create(QUANTUM_KEY_ID, 'basic')
            .maxStackSize(16)
            .texture('rainbow:item/quantum_key')
            .displayName('量子密钥')
        event.create(MANDEL_BRICK_ID, 'basic')
            .maxStackSize(1)
            .rarity('epic')
            .texture('rainbow:item/mandel_brick')
            .displayName('曼德尔砖')
    } catch (e) {
        console.log('[量子密钥/曼德尔砖] 注册 rainbow 物品失败: ' + e)
    }
})

// 不修改 MysticArtifacts 注册表，只从其创造标签中移除两个旧入口。
/*StartupEvents.modifyCreativeTab('mysticartifacts:mystic_artifacts_tab', event => {
    try {
        event.remove(LEGACY_QUANTUM_KEY_ID)
        event.remove(LEGACY_MANDEL_BRICK_ID)
        event.add([Item.of(QUANTUM_KEY_ID), Item.of(MANDEL_BRICK_ID)])
    } catch (e) {
        console.log('[量子密钥/曼德尔砖] 隐藏旧创造物品失败: ' + e)
    }
})*/

function getQuantumMandelItemId(stack) {
    try {
        if (stack == null) return null
        if (stack.id != null) return String(stack.id)
        if (stack.isEmpty && stack.isEmpty()) return null
        let item = stack.getItem()
        let registryKey = ForgeRegistries.ITEMS.getKey(item)
        return registryKey == null ? null : registryKey.toString()
    } catch (e) {
        console.log('[量子密钥/曼德尔砖] 读取物品 ID 失败: ' + e)
        return null
    }
}

function getQuantumMandelLevel(entity) {
    try {
        if (entity == null) return null
        let level = entity.level
        if (level != null && typeof level.getTime === 'function') return level
        if (typeof entity.level === 'function') return entity.level()
    } catch (e) {
        console.log('[量子密钥/曼德尔砖] 读取实体维度失败: ' + e)
    }
    return null
}

function isQuantumMandelClientLevel(level) {
    try {
        if (level == null) return false
        if (typeof level.isClientSide === 'function') return level.isClientSide()
        return level.isClientSide === true
    } catch (e) {
        console.log('[量子密钥/曼德尔砖] 判断客户端维度失败: ' + e)
        return false
    }
}

function ensureQuantumKeyCreationTime(stack, level) {
    try {
        if (stack == null || level == null) return
        let tag = stack.getOrCreateTag()
        if (!tag.contains(QUANTUM_KEY_CREATION_TIME_TAG)) {
            // KubeJS 项目约定使用 level.getTime() 获取世界时间。
            tag.putLong(QUANTUM_KEY_CREATION_TIME_TAG, level.getTime())
        }
    } catch (e) {
        console.log('[量子密钥] 写入创建时间失败: ' + e)
    }
}

function isQuantumKeyExpired(stack, currentTime, expirationTicks) {
    try {
        if (stack == null || !stack.hasTag()) return false
        let tag = stack.getTag()
        if (tag == null || !tag.contains(QUANTUM_KEY_CREATION_TIME_TAG)) return false
        let creationTime = tag.getLong(QUANTUM_KEY_CREATION_TIME_TAG)
        // 与 MysticArtifacts 原实现一致：超过 1200 tick 才失效，恰好 1200 tick 仍有效。
        return currentTime - creationTime > expirationTicks
    } catch (e) {
        console.log('[量子密钥] 判断过期状态失败: ' + e)
        return false
    }
}

function isMandelBrickUnlocked(stack) {
    try {
        if (stack == null) return false
        let tag = stack.getTag()
        return tag != null && tag.getBoolean(MANDEL_BRICK_UNLOCKED_TAG)
    } catch (e) {
        console.log('[曼德尔砖] 读取解锁状态失败: ' + e)
        return false
    }
}

function setMandelBrickUnlocked(stack, unlocked) {
    try {
        if (stack == null) return
        stack.getOrCreateTag().putBoolean(MANDEL_BRICK_UNLOCKED_TAG, unlocked)
    } catch (e) {
        console.log('[曼德尔砖] 写入解锁状态失败: ' + e)
    }
}

function isQuantumMandelSecondaryClick(action) {
    try {
        return action === ClickAction.SECONDARY || String(action) === 'SECONDARY'
    } catch (e) {
        console.log('[曼德尔砖] 判断次级点击失败: ' + e)
        return false
    }
}

function playQuantumMandelSound(player, soundId, volume, pitch) {
    try {
        let level = getQuantumMandelLevel(player)
        if (level == null) return
        let sound = ForgeRegistries.SOUND_EVENTS.getValue(new ResourceLocation(soundId))
        if (sound != null) player.playSound(sound, volume, pitch)
    } catch (e) {
        console.log('[量子密钥/曼德尔砖] 播放音效失败(' + soundId + '): ' + e)
    }
}

function handleQuantumKeyStackedOnOther(event) {
    try {
        let carriedItem = event.getCarriedItem()
        let stackedOnItem = event.getStackedOnItem()
        if (getQuantumMandelItemId(carriedItem) !== MANDEL_BRICK_ID) return
        if (getQuantumMandelItemId(stackedOnItem) !== QUANTUM_KEY_ID) return
        if (!isQuantumMandelSecondaryClick(event.getClickAction())) return

        let player = event.getPlayer()
        let level = getQuantumMandelLevel(player)
        if (player == null || level == null) return

        // ItemStackedOnOtherEvent 只有取消状态，没有 InteractionResult 结果值。
        event.setCanceled(true)

        if (isMandelBrickUnlocked(carriedItem)) return

        let expired = isQuantumKeyExpired(
            stackedOnItem,
            level.getTime(),
            QUANTUM_KEY_EXPIRATION_TICKS
        )
        if (expired) {
            playQuantumMandelSound(player, QUANTUM_KEY_EXPIRED_SOUND_ID, 1.0, 0.5)
            return
        }

        playQuantumMandelSound(player, QUANTUM_KEY_UNLOCK_SOUND_ID, 1.0, 1.0)
        stackedOnItem.shrink(1)
        setMandelBrickUnlocked(carriedItem, true)

        if (!isQuantumMandelClientLevel(level)) {
            let menu = player.inventoryMenu
            if (menu == null) menu = player.containerMenu
            if (menu != null && typeof menu.broadcastChanges === 'function') menu.broadcastChanges()
        }
    } catch (e) {
        console.log('[曼德尔砖] 背包解锁事件失败: ' + e)
    }
}

function giveMandelBrickReward(player, level) {
    try {
        let server = player.getServer()
        if (server == null) return false
        let lootTable = server.getLootData().getLootTable(new ResourceLocation(MANDEL_BRICK_REWARD_TABLE_ID))
        if (lootTable == null) return false

        let params = new LootParams.Builder(level)
            .withParameter(LootContextParams.THIS_ENTITY, player)
            .withParameter(LootContextParams.ORIGIN, player.position())
            .create(LootContextParamSets.GIFT)
        let loot = lootTable.getRandomItems(params)
        let inventory = player.getInventory()
        for (let i = 0; i < loot.size(); i++) {
            let reward = loot.get(i)
            if (!inventory.add(reward)) player.drop(reward, false)
        }
        return true
    } catch (e) {
        console.log('[曼德尔砖] 发放战利品失败: ' + e)
        return false
    }
}

function handleMandelBrickRightClick(event) {
    try {
        let player = event.getEntity()
        let level = getQuantumMandelLevel(player)
        if (player == null || level == null) return
        let stack = player.getItemInHand(event.getHand())
        if (getQuantumMandelItemId(stack) !== MANDEL_BRICK_ID) return
        if (!isMandelBrickUnlocked(stack)) return

        event.setCancellationResult(InteractionResult.SUCCESS)
        event.setCanceled(true)

        if (!isQuantumMandelClientLevel(level)) {
            if (giveMandelBrickReward(player, level)) {
                stack.shrink(1)
            }
        }
        playQuantumMandelSound(player, MANDEL_BRICK_OPEN_SOUND_ID, 1.0, 1.0)
    } catch (e) {
        console.log('[曼德尔砖] 开启事件失败: ' + e)
    }
}

function ensureQuantumKeyList(list, level) {
    try {
        if (list == null) return
        for (let i = 0; i < list.size(); i++) {
            let stack = list.get(i)
            if (getQuantumMandelItemId(stack) === QUANTUM_KEY_ID) ensureQuantumKeyCreationTime(stack, level)
        }
    } catch (e) {
        console.log('[量子密钥] 扫描玩家物品栏失败: ' + e)
    }
}

function handleQuantumKeyLivingTick(event) {
    try {
        let player = event.getEntity()
        if (player == null || player.getInventory == null) return
        let level = getQuantumMandelLevel(player)
        if (level == null || isQuantumMandelClientLevel(level)) return
        let inventory = player.getInventory()
        ensureQuantumKeyList(inventory.items, level)
        ensureQuantumKeyList(inventory.armor, level)
        ensureQuantumKeyList(inventory.offhand, level)
    } catch (e) {
        console.log('[量子密钥] 玩家 tick 初始化失败: ' + e)
    }
}

function handleQuantumKeyEntityJoin(event) {
    try {
        let entity = event.getEntity()
        if (entity == null || typeof entity.getItem !== 'function') return
        let level = getQuantumMandelLevel(entity)
        if (level == null || isQuantumMandelClientLevel(level)) return
        let stack = entity.getItem()
        if (getQuantumMandelItemId(stack) === QUANTUM_KEY_ID) ensureQuantumKeyCreationTime(stack, level)
    } catch (e) {
        console.log('[量子密钥] 物品实体初始化失败: ' + e)
    }
}

function handleQuantumKeyCrafted(event) {
    try {
        let player = event.getEntity()
        let level = getQuantumMandelLevel(player)
        let stack = event.getCrafting()
        if (level != null && getQuantumMandelItemId(stack) === QUANTUM_KEY_ID && !isQuantumMandelClientLevel(level)) {
            ensureQuantumKeyCreationTime(stack, level)
        }
    } catch (e) {
        console.log('[量子密钥] 合成初始化失败: ' + e)
    }
}

function handleQuantumKeyToss(event) {
    try {
        let itemEntity = event.getEntity()
        let level = getQuantumMandelLevel(itemEntity)
        let stack = itemEntity.getItem()
        if (level != null && getQuantumMandelItemId(stack) === QUANTUM_KEY_ID && !isQuantumMandelClientLevel(level)) {
            ensureQuantumKeyCreationTime(stack, level)
        }
    } catch (e) {
        console.log('[量子密钥] 丢弃初始化失败: ' + e)
    }
}

// 背包中的次级点击：曼德尔砖放在鼠标上，右键点击量子密钥。
ForgeEvents.onEvent('net.minecraftforge.event.ItemStackedOnOtherEvent', event => {
    handleQuantumKeyStackedOnOther(event)
})

// 空手/空中右键已解锁曼德尔砖时，拦截物品 use 并按原战利品表发奖。
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent$RightClickItem', event => {
    handleMandelBrickRightClick(event)
})

// 对着方块右键时不会触发 RightClickItem，补充监听 RightClickBlock 以覆盖该交互路径。
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent$RightClickBlock', event => {
    handleMandelBrickRightClick(event)
})

// 玩家 tick、合成、丢弃和物品实体生成时初始化创建时间，复刻原物品的 60 秒生命周期。
ForgeEvents.onEvent('net.minecraftforge.event.entity.living.LivingEvent$LivingTickEvent', event => {
    handleQuantumKeyLivingTick(event)
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.EntityJoinLevelEvent', event => {
    handleQuantumKeyEntityJoin(event)
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerEvent$ItemCraftedEvent', event => {
    handleQuantumKeyCrafted(event)
})

ForgeEvents.onEvent('net.minecraftforge.event.entity.item.ItemTossEvent', event => {
    handleQuantumKeyToss(event)
})
