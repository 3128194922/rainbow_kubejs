// 量子密钥只维护玩家背包，改由 PlayerEvents.tick 驱动，避免普通生物 tick 进入 Rhino。
PlayerEvents.tick(event => {
    if (typeof global.handleQuantumKeyPlayerTick !== 'function') return
    global.perfTime('quantum-key-playerTick', () => global.handleQuantumKeyPlayerTick(event))
})
