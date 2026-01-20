// priority: 0
// ==========================================
// 物品修改
// Item Modifications
// ==========================================
// 修改现有物品的属性、稀有度和添加功能（如背罐飞行能力）
// Modifies properties, rarity, and adds functionality (like backtank flight) to existing items

// 修改物品稀有度和属性
ItemEvents.modification(event => {
   let list = ['gimmethat:gravity_core', 'gimmethat:giants_ring', 'gimmethat:moai_charm']

   // 批量修改稀有度为 epic
   list.forEach(item => {
      event.modify(item, item_ => {
         item_.rarity = "epic"
      })
   })

   // 修改 legendary_monsters:the_great_frost 物品，增加攻击距离
   event.modify("legendary_monsters:the_great_frost", event => {
      event.addAttribute("forge:entity_reach", "62808577-5866-484f-a397-7b9340fd7c0b", "the_great_frost", 1.0, "addition")
   })
})

/*
ItemEvents.modification(event => {
   const backtanks = [
      'create:copper_backtank',
      'create:netherite_backtank'
   ];

   backtanks.forEach(id => {
      event.modify(id, item => {
         item.attachCuriosCapability(
            CuriosJSCapabilityBuilder.create()
               .curioTick((slotContext, stack) => {
                  let player = slotContext.entity();
                  if (!player) return;
                  if (!stack.nbt) stack.nbt = {};
                  stack.nbt.putBoolean("update", !stack.nbt.getBoolean("update"));
               })
               .modifyAttribute(attributeModificationContext => {
                  let { slotContext } = attributeModificationContext;
                  let player = slotContext.entity();
                  if (!player) return;

                  // --- 判断是否穿齐民主套装 ---
                  let armor = ["head", "chest", "legs", "feet"];
                  let fullSet = armor.every(slot =>
                     player.getItemBySlot(slot).id == `gimmethat:democracy_${slot == "head" ? "helmet" :
                        slot == "chest" ? "chestplate" :
                           slot == "legs" ? "leggings" : "boots"
                     }`
                  );
                  if (!fullSet) return; // 没穿齐不加飞行

                  attributeModificationContext.modify(
                     "attributeslib:creative_flight",
                     "2d884127-8af5-4c8b-ad67-35d86bb7f56d",
                     1,
                     'addition'
                  );
               })
         );
      });
   });
});*/