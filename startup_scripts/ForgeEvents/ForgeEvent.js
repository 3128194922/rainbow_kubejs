// priority: 0

/**
 * 为指定实体寻找安全生成位置（考虑实体碰撞箱）
 * @param {Internal.Level} level
 * @param {Internal.Entity} entity - 已创建但未生成的实体
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} minDist
 * @param {number} maxDist
 * @returns {{x: number, y: number, z: number} | null}
 */
function findSafeSpawnPos(level, entity, x, y, z, minDist, maxDist) {
  let bb = entity.getBoundingBox();
  let width = bb.getXsize();
  let height = bb.getYsize();
  let depth = bb.getZsize();

  let py = Math.floor(y);
  let minY = Number(level.minBuildHeight) || -64;
  let maxY = Number(level.maxBuildHeight) || 320;

  for (let r = minDist; r <= maxDist; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;

        let bx = Math.floor(x) + dx;
        let by = py;
        let bz = Math.floor(z) + dz;

        // 实体脚底中心
        let cx = bx + 0.5;
        let cz = bz + 0.5;

        let xMin = Math.floor(cx - width / 2);
        let xMax = Math.ceil(cx + width / 2) - 1;
        let zMin = Math.floor(cz - depth / 2);
        let zMax = Math.ceil(cz + depth / 2) - 1;
        let yMin = by;
        let yMax = by + Math.ceil(height) - 1;

        if (yMin <= minY || yMax >= maxY) continue;

        let canSpawn = true;

        // 检查身体占据方块：无碰撞形状且无流体
        checkBody:
        for (let ix = xMin; ix <= xMax && canSpawn; ix++) {
          for (let iz = zMin; iz <= zMax && canSpawn; iz++) {
            for (let iy = yMin; iy <= yMax; iy++) {
              let blockPos = new BlockPos(ix, iy, iz);
              let state = level.getBlock(ix, iy, iz).blockState;
              // 正确用法：传入 level 和 blockPos
              let shape = state.getCollisionShape(level, blockPos);
              if (!shape.isEmpty() || !state.getFluidState().isEmpty()) {
                canSpawn = false;
                break checkBody;
              }
            }
          }
        }

        // 检查脚下支撑方块
        if (canSpawn) {
          let iy = by - 1;
          checkFloor:
          for (let ix = xMin; ix <= xMax; ix++) {
            for (let iz = zMin; iz <= zMax; iz++) {
              let blockPos = new BlockPos(ix, iy, iz);
              let state = level.getBlock(ix, iy, iz).blockState;
              let shape = state.getCollisionShape(level, blockPos);
              if (shape.isEmpty() || !state.getFluidState().isEmpty() || !state.blocksMotion()) {
                canSpawn = false;
                break checkFloor;
              }
            }
          }
        }

        if (canSpawn) {
          return { x: cx, y: by, z: cz };
        }
      }
    }
  }
  return null;
}
// 玩家召唤生物前
ForgeEvents.onEvent("net.minecraftforge.event.entity.EntityJoinLevelEvent", event => {
    try{
        
    let level = event.getLevel();
    
    if(level.isClientSide()) return;
    
    let WHITE_ENTITY = ["dungeonnowloading:sealed_chaos"]
    
    let entity = event.getEntity();
    
    if(WHITE_ENTITY.indexOf(entity.getType()) == -1) return;
    
    if(!entity.owner || !entity.owner.isPlayer()) return;
    
    let player = entity.owner;
    
    let count = player.getAttributeValue("rainbow:generic.extra_summoning")

    for(let i=0;i<count;i++)
    {
        let xyz = findSafeSpawnPos(level,entity,entity.x,entity.y,entity.z,1,10);
        let extra_entity = level.createEntity(entity.getType());
        let random = Math.random();
        player.tell(random)

        extra_entity.setPosition(xyz.x + count - i + random,xyz.y,xyz.z+count - i + random)
        extra_entity.spawn();
    }
    }catch(e)
    {
        console.log(e)
    }
})