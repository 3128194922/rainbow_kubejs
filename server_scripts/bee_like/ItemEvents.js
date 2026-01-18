// priority: 0
// ==========================================
// 🐝 蜜蜂物品交互事件处理脚本
// ==========================================

ItemEvents.entityInteracted(event => {
    let item = event.getItem();
    let bee = event.getTarget();
    let hand = event.getHand().toString();
    
    // 仅限主手操作
    if(hand == "OFF_HAND") return;
    // 仅限蜜蜂
    if(bee.getType() != "minecraft:bee") return;
    
    // 获取蜜蜂的基因数据 (FruitfulFun 模组)
    let Genes = bee.getNbt().get('FruitfulFun').get('Genes')
    let FC = Genes.FC;
    let FT1 = Genes.FT1;
    let FT2 = Genes.FT2;
    let RC = Genes.RC;
    let nbt = bee.persistentData;

    let High = false;

    // 喂食喜欢的食物，刷新喜欢的食物
    if(item.id == nbt.getString("like_food"))
        {
            nbt.putString("like_food",Item.of(global.foodlist[Math.floor(randomInRange(0,global.foodlist.length - 1))]).getDisplayName().getString())
            High = true;

     /**
     * 基因对编码规则 (FruitfulFun)：
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
    
    if(FC == 17)
        {
            bee.getBlock().popItem(Item.of("minecraft:amethyst_shard",64))
        }

    if(FC == 34)
        {
            bee.getBlock().popItem(Item.of("alexscaves:uranium_shard",64))
        }

    if(FT1 == 17)
        {
            bee.getBlock().popItem(Item.of("alexscaves:pewen_sap",64))
        }

    if(FT1 == 34)
        {
            bee.getBlock().popItem(Item.of("minecraft:diamond",64))
        }

    if(FT2 == 17)
        {
            bee.getBlock().popItem(Item.of("minecraft:lapis_lazuli",64))
        }  

    if(FT2 == 34)
        {
            bee.getBlock().popItem(Item.of("heart_crystals:heart_crystal_shard",64))
        }  
    
    if(RC == 17)
        {
            const items = ["alexscaves:raw_scarlet_neodymium","alexscaves:raw_azure_neodymium"]
            const random = randomBool(0.5);
            bee.getBlock().popItem(Item.of(`${items[random?0:1]}`,64))
        } 
        }
})