// priority: 100
// ==========================================
// 百鱼手册：收集进度里程碑奖励 + 特殊鱼类额外奖励
// ==========================================
// 旧机制：按图鉴解锁比例提供幸运，已移除。
// 新机制：
//   1. 佩戴手册时，每 5 秒检查 Tide 图鉴解锁数；达到 10%/25%/50%/75%/100% 时
//      发放一次性里程碑奖励（记录在玩家 persistentData，永久只领一次）。
//   2. 每次钓到稀有/极稀有/传说鱼类时，额外发放对应档位奖励（独立于里程碑）。
//
// 数据来源（Tide 2.1.1）：
//   服务端：ForgeData."TidePlayerData".fish_data 列表，每项 data.is_unlocked 为已解锁
//   客户端：TidePlayerData.CLIENT_DATA（结构相同，用于 tooltip 兜底）
//   总数：TideData.FISH.journalEntryCount()
//   稀有度：FishData.get(ItemStack).profile().rarity().getKey()

const FISHING_JOURNAL_ID = "tide:fishing_journal"
const FISH_JOURNAL_CLAIMED_KEY = "fish_journal_milestone"
const FISH_JOURNAL_CHECK_INTERVAL = 100

// 读取玩家 Tide 图鉴数据 NBT（服务端优先读 Forge 持久化数据，客户端走 CLIENT_DATA 兜底）
// ⚠️ KubeJS 6 (1.20.1) 的 entity.persistentData 是 KubeJS 私有数据（KubeJSPersistentData），
//    Tide 写入的是 Forge 的 Entity.getPersistentData()（ForgeData），必须读 entity.nbt。
function getTideJournalTag(entity) {
    try {
        if (entity && entity.nbt) {
            let forgeData = entity.nbt.getCompound("ForgeData")
            if (forgeData != null && forgeData.contains("TidePlayerData")) {
                return forgeData.getCompound("TidePlayerData")
            }
        }
    } catch (e) {
        console.log("getTideJournalTag ForgeData 读取失败: " + e)
    }
    try {
        let TidePlayerDataCls = getTideClass("com.li64.tide.data.player.TidePlayerData")
        if (TidePlayerDataCls) {
            let tag = TidePlayerDataCls.CLIENT_DATA.getAsTag()
            if (tag && tag.contains("fish_data")) return tag
        }
    } catch (e) {
        console.log("getTideJournalTag CLIENT_DATA 读取失败: " + e)
    }
    return null
}

function getTideFishUnlockCount(tag) {
    let unlocked = 0
    try {
        if (!tag || !tag.contains("fish_data")) return 0
        let list = tag.getList("fish_data", 10)
        for (let i = 0; i < list.size(); i++) {
            let entry = list.getCompound(i)
            if (entry.getCompound("data").getBoolean("is_unlocked")) unlocked++
        }
    } catch (e) {
        console.log("getTideFishUnlockCount 解析失败: " + e)
    }
    return unlocked
}

// 返回鱼类图鉴总条目数（Tide 数据加载器），失败时兜底为 1 防除零
function getTideFishTotalCount() {
    try {
        let TideDataCls = getTideClass("com.li64.tide.data.TideData")
        if (TideDataCls && TideDataCls.FISH) {
            let total = TideDataCls.FISH.journalEntryCount()
            if (total > 0) return total
        }
    } catch (e) {
        console.log("getTideFishTotalCount 获取总数失败: " + e)
    }
    return 1
}

// 读取鱼物 ItemStack 的 Tide 稀有度 key（common/uncommon/rare/very_rare/legendary）
function getTideFishRarity(stack) {
    try {
        if (stack == null || stack.isEmpty()) return null
        let FishDataCls = getTideClass("com.li64.tide.data.fishing.FishData")
        if (FishDataCls == null) return null
        let dataOpt = FishDataCls.get(stack)
        if (dataOpt == null || !dataOpt.isPresent()) return null
        let data = dataOpt.get()
        if (data == null) return null
        let profile = data.profile()
        if (profile == null) return null
        let rarity = profile.rarity()
        if (rarity == null) return null
        return rarity.getKey()
    } catch (e) {
        console.log("[百鱼手册] 读取鱼类稀有度失败: " + e)
        return null
    }
}

function isServerLevel(entity) {
    if (entity == null) return false
    let level = entity.level
    return level != null && !level.isClientSide()
}

function giveFishJournalRewards(player, rewards) {
    if (player == null || rewards == null) return
    for (let i = 0; i < rewards.length; i++) {
        let reward = rewards[i]
        if (reward == null || reward.length < 2) continue
        let stack = Item.of(reward[0], reward[1])
        player.give(stack)
    }
}

function formatFishJournalRewardList(rewards) {
    let parts = []
    for (let i = 0; i < rewards.length; i++) {
        let reward = rewards[i]
        let stack = Item.of(reward[0], reward[1])
        parts.push(reward[1] + "×" + stack.getHoverName().getString())
    }
    return parts.join("、")
}

function playFishJournalRewardSound(player) {
    if (player == null || player.level == null) return
    player.level.playSound(null, player.x, player.y, player.z,
        "minecraft:entity.player.levelup", "players", 0.7, 1.3)
}

// 检查并发放里程碑奖励；claimed 记录已领取到的里程碑数量，保证只发一次。
function checkFishJournalMilestones(player, stack) {
    if (!isServerLevel(player)) return

    let tag = getTideJournalTag(player)
    if (tag == null) return
    let unlocked = getTideFishUnlockCount(tag)
    let total = getTideFishTotalCount()
    if (total <= 0) return

    // 把当前进度写入手册 NBT，供 tooltip 显示（会随饰品同步到客户端）
    if (stack != null) {
        let stackTag = stack.getOrCreateTag()
        stackTag.putInt("journal_unlocked", unlocked)
        stackTag.putInt("journal_total", total)
        stackTag.putInt("journal_percent", Math.floor(unlocked * 100 / total))
    }

    let reached = global.getFishJournalMilestoneCount(unlocked, total)
    let claimed = player.persistentData.getInt(FISH_JOURNAL_CLAIMED_KEY)
    if (reached <= claimed) return

    for (let i = claimed; i < reached; i++) {
        let milestone = global.FISH_JOURNAL_MILESTONES[i]
        if (milestone == null) continue
        giveFishJournalRewards(player, milestone.rewards)
        player.tell(Text.gold("[百鱼手册] " + milestone.name + "：图鉴达到 "
            + milestone.percent + "%（" + unlocked + "/" + total + "）"))
        player.tell(Text.gray("  获得：" + formatFishJournalRewardList(milestone.rewards)))
        playFishJournalRewardSound(player)
        console.log("[百鱼手册] " + player.name.string + " 领取 " + milestone.percent
            + "% 里程碑奖励，当前解锁 " + unlocked + "/" + total)
    }

    player.persistentData.putInt(FISH_JOURNAL_CLAIMED_KEY, reached)
}

ItemEvents.modification(event => {
    event.modify(FISHING_JOURNAL_ID, item => {
        item.attachCuriosCapability(
            CuriosJSCapabilityBuilder.create().canUnequip(canUnequipNotOnCooldown)
                .canEquip((slotContext, stack) => {
                    let entity = slotContext.entity()
                    if (!entity) return false
                    if (hasCurios(entity, FISHING_JOURNAL_ID)) return false
                    return true
                })
                .curioTick((slotContext, stack) => {
                    let entity = slotContext.entity()
                    if (entity == null) return
                    if (!everyTicks(entity, FISH_JOURNAL_CHECK_INTERVAL)) return
                    checkFishJournalMilestones(entity, stack)
                })
        )
    })
})

// 特殊鱼类额外奖励：Tide 在收竿时会对钓获物触发 Forge ItemFishedEvent，
// getDrops() 中包含本次钓到的鱼物品，可直接读取 FishData 稀有度。
ForgeEvents.onEvent("net.minecraftforge.event.entity.player.ItemFishedEvent", event => {
    try {
        let player = event.getEntity()
        if (!isServerLevel(player)) return
        let drops = event.getDrops()
        if (drops == null || drops.isEmpty()) return

        for (let i = 0; i < drops.size(); i++) {
            let stack = drops.get(i)
            if (stack == null || stack.isEmpty()) continue
            let tier = global.getFishJournalSpecialTier(getTideFishRarity(stack))
            if (tier == null) continue
            let reward = global.FISH_JOURNAL_SPECIAL_REWARDS[tier]
            if (reward == null) continue

            giveFishJournalRewards(player, reward.rewards)
            player.tell(Text.aqua("[百鱼手册] 钓获" + reward.name + "鱼类 "
                + stack.getHoverName().getString() + "，额外获得："
                + formatFishJournalRewardList(reward.rewards)))
            playFishJournalRewardSound(player)
            console.log("[百鱼手册] " + player.name.string + " 钓获 " + stack.id
                + "（" + tier + "），发放特殊鱼类奖励")
        }
    } catch (e) {
        console.log("[百鱼手册] 特殊鱼类奖励处理失败: " + e)
    }
})
