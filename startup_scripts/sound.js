// priority: 0
// ==========================================
// 声音与唱片注册
// Sound & Music Disc Registration
// ==========================================
// 注册自定义声音事件和唱片物品
// Registers custom sound events and music disc items

// 注册声音事件
StartupEvents.registry("sound_event", (event) => {
    // 创建一个名为 "rainbow:voice.man" 的声音事件
    event.create("rainbow:voice.man")
    // 创建一个名为 "rainbow:music.gauntlet" 的声音事件
    event.create("rainbow:music.gauntlet")
})

// 注册物品
StartupEvents.registry("item", (event) => {
    // 创建一个名为 "rainbow:gauntlet" 的唱片物品
    event.create("rainbow:gauntlet", "music_disc")
        // 设置唱片对应的音乐为 "rainbow:music.gauntlet"，时长为 181 秒
        .song("rainbow:music.gauntlet", 181)
        // 添加 "music_discs" 标签
        .tag("music_discs")
})