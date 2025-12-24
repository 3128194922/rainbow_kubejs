// startup_scripts

const { $Player } = require("packages/net/minecraft/world/entity/player/$Player");

const OMMMMO = 0;

StartupEvents.registry("block", event => {
    event.create("pedestal")
    .blockEntity(info => {
        info.inventory(1, 1);
        info.attachCapability(
            CapabilityBuilder.ITEM.blockEntity()
              .extractItem((blockEntity, slot, amount, simulate) => blockEntity.inventory.extractItem(slot, amount, simulate))
              .insertItem((blockEntity, slot, stack, simulate) => blockEntity.inventory.insertItem(slot, stack, simulate))
              .getSlotLimit((blockEntity, slot) => blockEntity.inventory.getSlotLimit(slot))
              .getSlots((blockEntity) => blockEntity.inventory.slots)
              .getStackInSlot((blockEntity, slot) => blockEntity.inventory.getStackInSlot(slot))
              .isItemValid((blockEntity, slot, stack) => blockEntity.inventory.isItemValid(slot, stack))
              .availableOn((blockEntity, direction) => direction != Direction.UP)
          );
        info.serverTick(OMMMMO, 0, be => {
            be.load(be.block.entityData);
            const level = be.level;
            if (!level) return;
            const players = be.level.getPlayers();
            if (!players || players.length === 0) return;
            const player = players[0];
            if (!player) return;

            player.sendData("pedestal", {
                entityData: be.block.entityData,
                pos: {
                    x: be.block.pos.x,
                    y: be.block.pos.y,
                    z: be.block.pos.z
                }
            });
        });
    })
    .rightClick(e => {
        /**
         * 
         * @param {*} block 
         * @param {*} item 
         * @param {*} isNew 
         * @param {$Player} player 
         */
        const updateItems = (block, item, isNew) => {
            const items = block.getEntityData().attachments[0].items || [];
            if (isNew) {
                items.push(item);
            } else {
                Object.assign(items[0], item);
            }
            const newAttachment = {
                id: item.id,
                Count: item.Count
            };
            if (item.tag) {
                newAttachment.tag = item.tag;
            }
            block.mergeEntityData({
                attachments: [{ items: [newAttachment] }]
            });
        };

        let { id, nbt, count, setCount } = e.player.getHeldItem("main_hand");
        if (id === "minecraft:air") return;
        const bitem = { id: id, Count: count };
        if (nbt) {
            bitem.tag = nbt;
        }
        const items = e.block.getEntityData().attachments[0].items || [];
        updateItems(e.block, { Count: bitem.Count, Slot: 0, id: bitem.id, tag: bitem.tag }, items.length === 0);
    });    
});
