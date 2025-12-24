StartupEvents.registry("sound_event", (event) => {
    event.create("rainbow:voice.man")
    event.create("rainbow:music.grinder")
})

StartupEvents.registry("item", (event) => {
    event.create("rainbow:grinder", "music_disc")
        .song("rainbow:music.grinder", 107)
        .tag("music_discs")
})