// priority: 900
// 启动阶段只注册委托书物品；随机悬赏 GUI 在服务端每次打开时按可用内容创建。
const RAINBOW_BOUNTY_STARTUP = global.RAINBOW_BOUNTY_CONFIG;

StartupEvents.registry('item', event => {
    event.create(RAINBOW_BOUNTY_STARTUP.contractItem, 'basic')
        .displayName('悬赏委托书')
        .texture('rainbow:item/bounty_contract')
        .maxStackSize(1);
});
