// priority: 500
global.MobMaskAttributeConfig = {
    "minecraft:bat": [
        {
            attribute: "attributeslib:creative_flight",
            UUID: "aba249fe-82bd-45f4-ab00-8452d027e00f",
            ID: "mask_bat",
            NUMBER: 1,
            OPERATION: "addition"
        },
        {
            attribute: "uniyesmod:size_scale",
            UUID: "34782055-835a-4deb-8151-d38f06b05b65",
            ID: "mask_bat",
            NUMBER: -0.5,
            OPERATION: "multiply_total"
        },
    ],
    "minecraft:iron_golem": [
        {
            attribute: "minecraft:generic.max_health",
            UUID: "2464f901-1c27-4cdc-8234-800b4b37826d",
            ID: "mask_iron_golem_health",
            NUMBER: 80,
            OPERATION: "addition"
        },
        {
            attribute: "minecraft:generic.attack_damage",
            UUID: "c3c2f4b4-fc7c-4d1f-b8e5-14fcbf6f33c2",
            ID: "mask_iron_golem_attack",
            NUMBER: 10,
            OPERATION: "addition"
        }
    ]
};

ItemEvents.rightClicked('rainbow:phantom_body',event => {
    let player = event.getPlayer();
    let server = event.getServer();
    let item = event.getPlayer().getItemBySlot("head");
    if(!item) return;
    let nbt = item.getNbt().getString("id");
    if(!nbt) return;

    switch(nbt)
    {
        case "minecraft:iron_golem":

        player.tell("触发")

        break;
    }
})
