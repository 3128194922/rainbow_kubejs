EntityEvents.spawned('ender_pearl', e => e.entity.owner.startRiding(e.entity))

const facingMap = {
	'east': [1, 0, 0],
	'west': [-1, 0, 0],
	'south': [0, 0, 1],
	'north': [0, 0, -1],
	'up': [0, 1, 0],
	'down': [0, -1, 0]
};
function getFacing(motionX, motionY, motionZ) {
	let facing;
	const cutMotionX = cut(motionX);
	const cutMotionZ = cut(motionZ);
	function cut(num) {
		const temp = num.toString();
		return temp.substring(0, temp.indexOf(".") + 2);
	};
	if(motionY == 0) facing = 'down';
	else if(cutMotionX > 0) facing = 'east';
	else if(cutMotionX < 0) facing = 'west';
	else if(cutMotionZ > 0) facing = 'south';
	else if(cutMotionZ < 0) facing = 'north';
	else facing = 'up';
	return facing;
};
EntityEvents.spawned('item', e => {
	const {entity, level} = e;
	if(entity.thrower || entity.item != 'minecraft:ender_pearl') return;

	Utils.server.scheduleInTicks(0, () => {
		const {motionX, motionY, motionZ} = entity;
		const facing = getFacing(motionX, motionY, motionZ);
		const facingData = facingMap[facing];
		const {x, y, z} = entity.block;
		const tracedBlock = level.getBlock(x - facingData[0], y - facingData[1], z - facingData[2]);
		const dispenser = level.createEntity('falling_block');
		const ender_pearl = level.createEntity('ender_pearl');

		if(tracedBlock.id != 'minecraft:dispenser') return;

		dispenser.mergeNbt({
			BlockState: {
				Name: 'minecraft:dispenser',
				Properties: {facing: facing}
			},
			TileEntityData: {Items: tracedBlock.entityData.Items}
		});
		dispenser.copyPosition(entity);
		dispenser.spawn();
	
		ender_pearl.copyPosition(entity);
		ender_pearl.owner = dispenser;
		ender_pearl.setMotion(facingData[0], facingData[1], facingData[2]);
		ender_pearl.spawn();

		entity.discard();
		tracedBlock.setEntityData({Items: ''});
		tracedBlock.set('air');
	})
})