ItemEvents.modification(event => {
   let list = ['uniyesmod:gravity_core', 'uniyesmod:giants_ring', 'uniyesmod:moai_charm']

   list.forEach(item => {
      event.modify(item, item_ => {
         item_.rarity = "epic"
      })
   })

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
                     player.getItemBySlot(slot).id == `uniyesmod:democracy_${slot == "head" ? "helmet" :
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