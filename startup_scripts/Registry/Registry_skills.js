// priority: 1000
StartupEvents.registry('item', event => {
    event.create('rainbow:fire_magic', 'basic')
        .rarity("epic")
        .maxStackSize(1)
        .tag("helldivers:magic")
        .tag("curios:belt")
        .displayName("火遁·豪火灭却")
        .attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
                .modifyAttribute(ev => {
                    let stack = ev.stack;
                    if (!stack.nbt) {
                        stack.nbt = {control:"wdsd",count:Integer.valueOf("2"),count_cd:Integer.valueOf("10"),cd:Integer.valueOf("120")}
                        //stack.nbt = {the_end:Integer.valueOf("0"),submenu:{1:"鼓舞",2:"战曲",3:"小奏",4:"终曲"}};
                    }
                })
        )
})