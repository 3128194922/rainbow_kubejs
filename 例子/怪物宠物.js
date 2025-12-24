// Enslavement Elixir
// Right click on a mob with this item to kill it and summon a pet in its place


let summonable_pets = {
        capuchin_monkey: {//
            id: 'alexsmobs:capuchin_monkey',
            tier: 2,
            class_specialty: 'none',
            item1: {
                id: 'alexsmobs:ancient_dart',
                nbt: '{HasDart:1b}'
            },
            command:{
                Command: 1
            }
        },
        tarantula_hawk: {//
            id: 'alexsmobs:tarantula_hawk',
            tier: 3,
            class_specialty: 'none',
            command: {
                Command: 1
            }
        },
        komodo_dragon: {//
            id: 'alexsmobs:komodo_dragon',
            tier: 3,
            class_specialty: 'none',
            item: {
                id: 'minecraft:saddle',
                nbt: '{Saddle:1b}'
            },
            command: {
                KomodoCommand: 1
            }
        },
        kangaroo: {//
            id: 'alexsmobs:kangaroo',
            tier: 3,
            class_specialty: 'mercenary',
            item1: {
                id: 'fantasy_weapons:weapon_sharp_curved_sword',
                nbt: '{Items: [{Count:1,id:"fantasy_weapons:weapon_sharp_curved_sword",Slot:0b}]}'
            },
            item2: {
                id: 'immersive_armors:steampunk_helmet',
                nbt: '{Items: [{Count:1,id:"immersive_armors:steampunk_helmet",Slot:1b}]}'
            },
            item3: {
                id: 'immersive_armors:wooden_chestplate',
                nbt: '{Items: [{Count:1,id:"immersive_armors:wooden_chestplate",Slot:2b}]}'
            },
            command: {
                Command: 1
            }
        },
        gorilla: {//
            id: 'alexsmobs:gorilla',
            tier: 3,
            class_specialty: 'none',
            command: {
                Command: 1
            }
        },
        crocodile: {//
            id: 'alexsmobs:crocodile',
            tier: 4,
            class_specialty: 'none',
            command: {
                Command: 1
            }
        },
        grizzly_bear: {//
            id: 'alexsmobs:grizzly_bear',
            tier: 4,
            class_specialty: 'none',
            command: {
                BearCommand: 1
            }
        },
        caiman: {//
            id: 'alexsmobs:caiman',
            tier: 4,
            class_specialty: 'none',
            command: {
                CaimanCommand: 1
            }

        },
}


ItemEvents.entityInteracted('kubejs:enslavement_elixir', event => {
    if (event.player.cooldowns.isOnCooldown('kubejs:enslavement_elixir')) return
    if (event.target.tags.contains('boss')) return
    if (!event.target.monster) return
    if (!event.target.maxHealth > 100) return
    event.target.kill()
    let player = event.player
    let username = player.username
    
    // Choose a random entity from the summonable_pets object
    let rand_pet = Object.values(summonable_pets)[Math.floor(Math.random() * Object.values(summonable_pets).length)]
    let pet_id = rand_pet.id
    let pet = event.level.createEntity(pet_id)
    pet.mergeNbt({
        Owner: username,
        tags: ['tamed_beast', `Owner:${username}`],
    })
    // detect if the pet has items
    if (rand_pet.item1) {
        pet.mergeNbt(
            //`${petData[itemKey].nbt}`
            `${rand_pet.item1.nbt}`
        )
    } else if (rand_pet.item2) {
        pet.mergeNbt(
            `${rand_pet.item2.nbt}`
        )
    } else if (rand_pet.item3) {
        pet.mergeNbt(
            `${rand_pet.item3.nbt}`
        )
    }
    pet.x = event.target.x
    pet.y = event.target.y
    pet.z = event.target.z
            
    Utils.server.runCommandSilent(`/particle bosses_of_mass_destruction:soul_flame ${pet.x} ${pet.y} ${pet.z} 0 0 0 0.2 300`)
    event.level.spawnLightning(pet.x, pet.y, pet.z, true)
    pet.spawn()
    event.player.cooldowns.addCooldown('kubejs:enslavement_elixir', 6000)
})