# 圣遗物元素觉醒实现计划

**目标：** 第五次镶嵌确定元素；同元素圣遗物佩戴 4/5 件时分别获得相同套装属性加成。

**范围：** Forge 1.20.1 / KubeJS 2001.6.5；保持 Curios 槽数量；保留现有未提交改动。

1. 在 `startup_scripts/wooden_sword_inlay/config.js` 记录八元素的属性、单阶段数值和 NBT 键；在 `main.js` 用五条词条稳定计算元素并写入第五次铁砧产物，旧物品读取时补算。
2. 移除 `rainbow:relic` 的单件佩戴限制，并让每件圣遗物的五条词条使用基于 Curios 槽 UUID 的不同修饰符。
3. 扩展 `server_scripts/set_system/SetEffect.js` 的条件匹配以检查 Curios 圣遗物元素，注册八种 4/5 件递进套装；在玩家属性表加入 `minecraft:generic.flying_speed`。
4. 更新 `client_scripts/tooltips.js` 和 README，写行为测试并执行静态验证。需要游戏重启后确认铁砧、Curios 叠加与实际属性。
