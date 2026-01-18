// priority: 0
// ==========================================
// 信标光束互动与能量转换
// Beacon Beam Interaction & Energy Conversion
// ==========================================
// 功能：
// 1. 玩家手持红石右键点击信标，触发光束扫描。
// 2. 扫描光束经过的实体，并根据光束颜色给予实体着火效果 (能量注入模拟)。
// 3. 检测光束路径上的刚玉簇 (rainbow:corundum_cluster)，并激活其反方向的靶子方块。
// Features:
// 1. Player right-clicks beacon with Redstone to scan the beam.
// 2. Scans entities in beam path and sets them on fire (energy injection sim) based on color.
// 3. Detects Corundum Clusters in beam path and activates Target Blocks in opposite direction.

const directionMap = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
  up: "down",
  down: "up",
};
/*
const COLORS = {
  白: [1.00, 1.00, 1.00],
  红: [1.00, 0.25, 0.25],
  橙: [1.00, 0.63, 0.25],
  黄: [1.00, 1.00, 0.25],
  绿: [0.25, 1.00, 0.25],
  蓝: [0.25, 1.00, 1.00],
  靛: [0.25, 0.25, 1.00],
  紫: [1.00, 0.25, 1.00],
  黑: [0.06, 0.06, 0.06]
};*/

// 将RGB颜色转换为能量强度
function rgbToPower(r, g, b) {
  const minV = 0.02
  const maxV = 1.00
  const minP = 1
  const maxP = 15

  const brightness = 0.2126*r + 0.7152*g + 0.0722*b

  const power = ((brightness - minV) / (maxV - minV)) * (maxP - minP) + minP
  return Math.round(power)
}



;(() => {
  BlockEvents.rightClicked('minecraft:beacon', (e) => {
      let { hand, item, block, player, level } = e;
      if (level.isClientSide()) return;
      if (hand !== 'main_hand' || item.id !== 'minecraft:redstone') return;

      if (!block.entity.getBeamSections || block.entity.getBeamSections().length === 0) {
          player.tell('§c信标没有激活光束！');
          return;
      }

      console.log(`=== 信标光束实体扫描 ===`);
      console.log(`信标位置: (${block.x}, ${block.y}, ${block.z})`);
      console.log(`玩家: ${player.displayName.string}`);
      console.log(`光束部分数量: ${block.entity.getBeamSections().length}`);

      let totalEntitiesFound = 0;
      let beamSectionCount = 0;

      block.entity.getBeamSections().forEach((beam, index) => {
          if (index === 0) return; // 跳过底层部分

          beamSectionCount++;
          let colorArray = beam.color;
          let red = colorArray ? colorArray[0].toFixed(2) : 1;
          let green = colorArray ? colorArray[1].toFixed(2) : 1;
          let blue = colorArray ? colorArray[2].toFixed(2) : 1;

          let beamPos = block.pos.offset(beam.offset.x, beam.offset.y, beam.offset.z);
/*
          console.log(`\n--- 光束部分 ${beamSectionCount} ---`);
          console.log(`光束颜色: (RGB: ${red}, ${green}, ${blue})`);
          console.log(`光束偏移: (${beam.offset.x}, ${beam.offset.y}, ${beam.offset.z})`);
          console.log(`光束方向: ${beam.dir}`);
*/

          Utils.server.scheduleInTicks(20 * beamSectionCount, () => {
            let startPos = beamPos;
            let endPos = startPos.offset(beam.dir.normal.x * 10, beam.dir.normal.y * 10, beam.dir.normal.z * 10);
            let beamAABB = AABB.ofBlocks(startPos, endPos);

            let entities = level.getEntitiesWithin(beamAABB);
            //console.log(`光束内实体数量: ${entities.length}`);
            entities.forEach((entity) => {
                //console.log(` 类型=${entity.type}, 坐标=(${entity.x.toFixed(2)}, ${entity.y.toFixed(2)}, ${entity.z.toFixed(2)})`);
                entity.setSecondsOnFire(rgbToPower(red,green,blue))
            });
            totalEntitiesFound += entities.length;

            
          // 获取偏移方块及其朝向
          let offsetBlockPos = { x: block.x + beam.offset.x, y: block.y + beam.offset.y, z: block.z + beam.offset.z };
          let offsetBlock = level.getBlock(offsetBlockPos.x, offsetBlockPos.y, offsetBlockPos.z);
          if(!offsetBlock.hasTag("rainbow:corundum_cluster")) return;
          let facing = offsetBlock.properties?.facing;
          //console.log(`偏移方块: (${offsetBlockPos.x}, ${offsetBlockPos.y}, ${offsetBlockPos.z}), facing=${facing}`);

          if (facing && directionMap[facing]) {
              let oppositeDir = directionMap[facing];
              let oppositePos;
              switch(oppositeDir) {
                  case 'north': oppositePos = { x: offsetBlockPos.x, y: offsetBlockPos.y, z: offsetBlockPos.z - 1 }; break;
                  case 'south': oppositePos = { x: offsetBlockPos.x, y: offsetBlockPos.y, z: offsetBlockPos.z + 1 }; break;
                  case 'west':  oppositePos = { x: offsetBlockPos.x - 1, y: offsetBlockPos.y, z: offsetBlockPos.z }; break;
                  case 'east':  oppositePos = { x: offsetBlockPos.x + 1, y: offsetBlockPos.y, z: offsetBlockPos.z }; break;
                  case 'up':    oppositePos = { x: offsetBlockPos.x, y: offsetBlockPos.y + 1, z: offsetBlockPos.z }; break;
                  case 'down':  oppositePos = { x: offsetBlockPos.x, y: offsetBlockPos.y - 1, z: offsetBlockPos.z }; break;
              }
              let oppositeBlock = level.getBlock(oppositePos.x, oppositePos.y, oppositePos.z);
              //console.log(`反方向方块: (${oppositePos.x}, ${oppositePos.y}, ${oppositePos.z}), type=${oppositeBlock.id}`);

              // 如果是目标方块，设置信号强度
              if (oppositeBlock.id === 'minecraft:target') {
                level.setBlockAndUpdate(oppositeBlock.pos,Blocks.TARGET.defaultBlockState().setValue(BlockProperties.POWER,Integer.valueOf(`${rgbToPower(red,green,blue)}`)))
                level.server.scheduleInTicks(60,()=>{
                  level.setBlockAndUpdate(oppositeBlock.pos,Blocks.TARGET.defaultBlockState().setValue(BlockProperties.POWER,Integer.valueOf("0")))
                })
            }      
          }
          })
      });

      console.log(`\n=== 扫描总结 ===`);
      console.log(`扫描光束部分: ${beamSectionCount}`);
      console.log(`发现实体总数: ${totalEntitiesFound}`);

      // 播放激活音效
      block.getPlayersInRadius(32).forEach(p => {
          Utils.server.runCommandSilent(
              `playsound minecraft:block.beacon.activate block ${p.displayName.string} ${block.x} ${block.y} ${block.z} 3 1`
          );
      });

      e.cancel();
  });
})();