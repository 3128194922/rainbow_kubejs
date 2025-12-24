ItemEvents.entityInteracted(event => {
    let item = event.getItem();
    let bee = event.getTarget();
    let hand = event.getHand().toString();
    if(hand == "OFF_HAND") return;
    if(bee.getType() != "minecraft:bee") return;
    let Genes = bee.getNbt().get('FruitfulFun').get('Genes')
    let FC = Genes.FC;
    let FT1 = Genes.FT1;
    let FT2 = Genes.FT2;
    let RC = Genes.RC;
    let nbt = bee.persistentData;

    let High = false;

    if(item.id == nbt.getString("like_food"))
        {
            nbt.putString("like_food",Item.of(global.foodlist[Math.floor(randomInRange(0,global.foodlist.length - 1))]).getDisplayName().getString())
            High = true;
        }

    /**
     * 基因对编码规则：
     * 0 0 : 0
     * 0 1 : 1
     * 0 2 : 2
     * 1 0 : 16
     * 1 1 : 17
     * 1 2 : 18
     * 2 0 : 32
     * 2 1 : 33
     * 2 2 : 34
     */
    
    if(Item.of(item).item.foodProperties.isMeat())
        {
            if(FC == 17)
                {

                }
        }
    else
        {
            if(FC == 17)
                {
                    
                }
        }
})