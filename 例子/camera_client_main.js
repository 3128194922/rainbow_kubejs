EntityEvents.spawned("blaze", event => {
    if(Client.player.age <= 100) return; //prevent manipulating camera of players who have just joined the world for 5 sec or less.
    const camSeq = new CameraSequence(Date.now())
    camSeq.forceToBreakOnPause = true //defaultly false; player can pause the game (press ESC) to stop the camera manipulation
    //you can also define the predicate by setting camSeq.forceToBreak = () => {...}
    const {entity} = event
    const coords = [[2, 2], [2, -2], [-2, -2], [-2, 2], [2, 2]]
    camSeq.addCameraSetTarget(Client.player.eyePosition)
    camSeq.addCameraGoTo(entity.eyePosition.add(2, 1.5, 2), 20)
    camSeq.addCameraTurnTo(entity, 20)
    const cameraSpeed = 0.5 //blocks per tick
    Array(4).fill("").forEach((_, i) => {
        camSeq.addCameraTurnTo(entity, 80)
        camSeq.addCameraSetTarget(entity)//make the camera focus on the entity in the following sequence
        camSeq.addDynamicOperation(camOp => {
            const goal = entity.eyePosition.add(new Vec3d(coords[i + 1][0], 1.5, coords[i + 1][1]))
            const distanceToMove = camSeq.cameraPosition.distanceTo(goal)
            const durationInTicks = distanceToMove / cameraSpeed
            camOp.durationInTicks = durationInTicks
            camOp.callback = (cameraOperation) => {
                camSeq.camOps.goTo(cameraOperation, goal, durationInTicks)
            }
        })
    })
    camSeq.addCameraGoCircleAroundEntity(entity, -1, 20)//the camera will also start to follow the entity in the following "turn to" operation. Go to, go circle operations will reset the following entity to null.
    camSeq.addCameraSetFollowing(null)//to prevent an erratic movement when the camera stop following an entity
    camSeq.addCameraTurnTo(Client.player, 20)
    camSeq.addCameraGoToRelativeTo(Client.player, new Vec3d(0, 0, 0), 20)
    camSeq.execute()
})