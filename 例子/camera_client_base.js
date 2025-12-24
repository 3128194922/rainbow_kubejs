//priority: 1

const normalVecZ = new Vec3d(0, 0, 1)

function CameraOperation(callback, startTime, endTime){
    this.callback = callback
    this.startTime = startTime
    this.endTime = endTime
    this.param = {}
}

/**
 * 
 * @param {CameraSequence} camSeq 
 */
function CameraOperations(camSeq){
    this.camSeq = camSeq
}

/**
 * 
 * @param {Vec3d} target 
 */
CameraOperations.prototype.getAngleToLookAt = function(target){
    const cameraSequence = this.camSeq
    const cameraPosition = cameraSequence.cameraPosition
    const cameraToTargetVec = target.subtract(cameraPosition)
    const horizontalEyeVec = cameraToTargetVec.multiply(1, 0, 1)
    const horizontalAngle = Math.acos(horizontalEyeVec.normalize().dot(normalVecZ)) * 180 / JavaMath.PI
    const verticalAngle = Math.acos(horizontalEyeVec.normalize().dot(cameraToTargetVec.normalize())) * 180 / JavaMath.PI
    const yawToSet = horizontalAngle * (horizontalEyeVec.x()>=0 ? -1 : 1)
    const pitchToSet = verticalAngle * (cameraToTargetVec.y() >= 0 ? -1 : 1)
    return {yaw: yawToSet, pitch: pitchToSet}
}

CameraOperations.prototype.getAngleTofixOnTarget = function(){
    const cameraSequence = this.camSeq
    const target = cameraSequence.targetEntity ? cameraSequence.targetEntity.eyePosition : cameraSequence.targetPoint
    return this.getAngleToLookAt(target)
}

CameraOperations.prototype.follow = function(){
    const cameraSequence = this.camSeq
    const nowTime = Date.now()
    const updateInterval = 50
    if(!cameraSequence.followingEntity) return;
    cameraSequence.cameraPosition = cameraSequence.cameraPosition.add(cameraSequence.followingEntityLastSecondUpdatedPosition.subtract(cameraSequence.followingEntityStartingPosition))
    if(
        !cameraSequence.followingEntity.eyePosition.equals(cameraSequence.followingEntityLastUpdatedPosition)
        && nowTime - cameraSequence.followingEntityLastUpdatedTime > updateInterval
    ){
        cameraSequence.followingVec = cameraSequence.followingEntity.eyePosition.subtract(cameraSequence.followingEntityLastUpdatedPosition)
        cameraSequence.followingEntityLastSecondUpdatedPosition = cameraSequence.followingEntityLastUpdatedPosition
        cameraSequence.followingEntityLastUpdatedPosition = cameraSequence.followingEntity.eyePosition
        cameraSequence.followingEntityLastUpdatedTime = Date.now()
    }
    if(cameraSequence.followingVec){
        let ticksPassed = (Date.now() - cameraSequence.followingEntityLastUpdatedTime) / updateInterval
        cameraSequence.cameraPosition = cameraSequence.cameraPosition.add(cameraSequence.followingVec.scale(Math.min(ticksPassed, 1)))
        if(ticksPassed >= 1) {
            delete cameraSequence.followingVec            
        }
    }
}

/**
 * 
 * @param {CameraOperation} cameraOperation
 * @param {Vec3d} startingVec
 * @param {Vec3d} center 
 * @param {number_} numberOfRevolution
 * @param {number_} durationInTicks
 */
CameraOperations.prototype.goCircle = function(cameraOperation, center, numberOfRevolution, durationInTicks){
    const cameraSequence = this.camSeq
    const param = cameraOperation.param
    const startTime = cameraOperation.startTime
    function getNewPosition(){
        const timeDelta = (Date.now() - startTime) / 50
        const anglePerTick = 2 * JavaMath.PI * numberOfRevolution / durationInTicks
        const thetaDelta = timeDelta * anglePerTick
        const newPosition = param.startingVec.yRot(thetaDelta).add(center)
        return newPosition    
    }
    if(!param.startingVec) param.startingVec = cameraSequence.cameraPosition.subtract(center)
    cameraSequence.cameraPosition = getNewPosition()
}

/**
 * 
 * @param {CameraOperation} cameraOperation 
 * @param {Vec3d} goal 
 * @param {number_} durationInTicks 
 */
CameraOperations.prototype.goTo = function(cameraOperation, goal, durationInTicks){
    const cameraSequence = this.camSeq
    const param = cameraOperation.param
    const startTime = cameraOperation.startTime
    function getNewPosition(){
        const timeDelta = (Date.now() - startTime) / 50
        return goal.subtract(param.startPoint).scale(Math.min(1, (timeDelta / durationInTicks))).add(param.startPoint)
    }
    if(!param.startPoint) param.startPoint = cameraSequence.cameraPosition
    cameraSequence.cameraPosition = getNewPosition()
}

/**
 * 
 * @param {Vec3d} target
 * @param {number_} durationInTicks 
 */
CameraOperations.prototype.turnTo = function(cameraOperation, target, durationInTicks){
    const camSeq = this.camSeq
    const param = cameraOperation.param
    const startTime = cameraOperation.startTime
    if(!param.yaw){
        param.yaw = camSeq.yaw
        param.pitch = camSeq.pitch
    }
    const {yaw: targetYaw, pitch: targetPitch} = this.getAngleToLookAt(target)
    const progress = Math.min(1, ((Date.now() - startTime) / 50) / durationInTicks) 
    const deltas = {yaw: targetYaw - param.yaw, pitch: targetPitch - param.pitch}
    Object.keys(deltas).forEach(k => deltas[k] = deltas[k] > 180 ? deltas[k] - 360 : deltas[k])
    return {yaw: (deltas.yaw%360) * progress + param.yaw, pitch: (deltas.pitch%360) * progress + param.pitch}
}

/**
 * 
 * @param {number_} initTime 
 */
function CameraSequence(initTime){
    this.initTime = initTime
    this.finalTime = initTime
    this.sequnce = new Array()
    this.camOps = new CameraOperations(this)
    this.forceToBreak = () => false
    this.forceToBreakOnPause = false
}

/**
 * 
 * @param {Internal.Entity|Vec3d} target 
 */
 CameraSequence.prototype.setTarget = function(target){
    if(!target){
        this.targetPoint = null
        this.targetEntity = null
    }
    else if(target instanceof Vec3d){
        this.targetPoint = target
    }
    else{
        this.targetEntity = target
    }
}

/**
 * 
 * @param {Internal.Entity} target 
 */
 CameraSequence.prototype.setFollowingEntity = function(target){
    this.followingEntity = target
    if(!target) return;
    this.followingEntityStartingPosition = target.eyePosition
    this.followingEntityLastUpdatedPosition = target.eyePosition
    this.followingEntityLastSecondUpdatedPosition = target.eyePosition
    this.followingEntityLastUpdatedTime = Date.now()
}

/**
 * 
 * @param {function} cameraOperationCallback
 * @param {number_} durationInTicks
 */
CameraSequence.prototype.addOperation = function(cameraOperationCallback, durationInTicks){
    this.sequnce.push(new CameraOperation(cameraOperationCallback, this.finalTime + 0, this.finalTime + durationInTicks * 50))
    this.finalTime += durationInTicks * 50
}

/**
 * 
 * @param {Internal.Entity|Vec3d} target 
 */
 CameraSequence.prototype.addCameraSetTarget = function(target){
    const cameraOperationCallback = (cameraOperation) => this.setTarget(target)
    this.addOperation(cameraOperationCallback, 0)
}

/**
 * 
 * @param {Internal.Entity} target 
 */
 CameraSequence.prototype.addCameraSetFollowing = function(target){
    const cameraOperationCallback = (cameraOperation) => this.setFollowingEntity(target)
    this.addOperation(cameraOperationCallback, 0)
}

/**
 * 
 * @param {Vec3d} center 
 * @param {number_} numberOfRevolution 
 * @param {number_} durationInTicks 
 */
CameraSequence.prototype.addCameraGoCircle = function(center, numberOfRevolution, durationInTicks){
    const cameraOperationCallback = (cameraOperation) => {
        this.setFollowingEntity(null)
        this.camOps.goCircle(cameraOperation, center, numberOfRevolution, durationInTicks)
    }
    this.addOperation(cameraOperationCallback, durationInTicks)
}
/**
 * 
 * @param {Internal.Entity_} centerEntity 
 * @param {number_} numberOfRevolution 
 * @param {number_} durationInTicks 
 */
CameraSequence.prototype.addCameraGoCircleAroundEntity = function(centerEntity, numberOfRevolution, durationInTicks){
    const cameraOperationCallback = (cameraOperation) => {
        const param = cameraOperation.param
        if(!param.centerEntity) {
            param.centerEntity = centerEntity
            param.center = centerEntity.eyePosition
            this.setFollowingEntity(centerEntity)
        }
        const center = param.center
        this.camOps.goCircle(cameraOperation, center, numberOfRevolution, durationInTicks)
    }
    this.addOperation(cameraOperationCallback, durationInTicks)
}

/**
 * 
 * @param {Vec3d} goal 
 * @param {number_} durationInTicks 
 */
CameraSequence.prototype.addCameraGoTo = function(goal, durationInTicks){
    const cameraOperationCallback = (cameraOperation) => {
        this.setFollowingEntity(null)
        this.camOps.goTo(cameraOperation, goal, durationInTicks)
    }
    this.addOperation(cameraOperationCallback, durationInTicks)
}

/**
 * 
 * @param {Internal.Entity_} entity
 * @param {Vec3d} goal 
 * @param {number_} durationInTicks 
 */
 CameraSequence.prototype.addCameraGoToRelativeTo = function(entity ,goal, durationInTicks){
    const cameraOperationCallback = (cameraOperation) => {
        this.setFollowingEntity(null)
        this.camOps.goTo(cameraOperation, entity.eyePosition.add(goal), durationInTicks)
    }
    this.addOperation(cameraOperationCallback, durationInTicks)
}

/**
 * 
 * @param {Vec3d|Internal.Entity_} target
 * @param {number_} durationInTicks 
 */
CameraSequence.prototype.addCameraTurnTo = function(target, durationInTicks){
    const cameraOperationCallback = (cameraOperation) => {
        this.setTarget(null)
        const target_ = target instanceof Vec3d ? target : target.eyePosition
        const {yaw, pitch} = this.camOps.turnTo(cameraOperation, target_, durationInTicks)
        this.yaw = yaw
        this.pitch = pitch
    }
    this.addOperation(cameraOperationCallback, durationInTicks)
}

/**
 * 
 * @param {Function} callback cameraOperation => void
 */
CameraSequence.prototype.addDynamicOperation = function(callback){
    const wrapper = (placeHolder) => {
        const cameraOperation = new CameraOperation(() => {}, 0, 0)
        callback(cameraOperation)
        const durationInTicks = cameraOperation.durationInTicks
        this.sequnce.forEach((camOp, i) => {
            if(i == 0) return;
            camOp.startTime += durationInTicks * 50
            camOp.endTime += durationInTicks * 50
        })
        cameraOperation.endTime = this.sequnce[1].startTime
        cameraOperation.startTime = cameraOperation.endTime - durationInTicks * 50
        this.sequnce.splice(1, 0, cameraOperation)
        this.finalTime += durationInTicks * 50    
    }
    this.addOperation(wrapper, 0)
}

CameraSequence.prototype._follow = function(){
    this.camOps.follow()
}

CameraSequence.prototype._fixOnTarget = function(){
    const event = this.event
    const targetPoint = this.targetEntity? this.targetEntity.eyePosition : this.targetPoint
    if(!targetPoint) return;
    const {yaw, pitch} = this.camOps.getAngleTofixOnTarget()
    this.yaw = yaw
    this.pitch = pitch
    this.pitchBeforeUpdate = this.pitch
    this.yaw = this.yaw
    return
}

CameraSequence.prototype._execute = function(){
    const event = this.event
    const nowTime = Date.now()
    const cameraOperation = this.sequnce[0]
    if(cameraOperation.startTime < nowTime){
        cameraOperation.callback(cameraOperation)
        this._follow()
        this._fixOnTarget()
        event.camera.setPosition(this.cameraPosition)
        event.setPitch(this.pitch)
        event.setYaw(this.yaw)
    }
    if(cameraOperation.endTime < nowTime || !cameraOperation.endTime){
        let expired = this.sequnce.shift()
        delete expired.CameraOperation
        delete expired.param    
    }
    if(this.forceToBreak()){
        Array(this.sequnce.length).fill(0).forEach(_ => {
            let expired = this.sequnce.shift()
            delete expired.CameraOperation
            delete expired.param    
        })
    }
    if(!this.sequnce.length){
        delete this.camOps
        delete this.sequnce
        Client.options.setCameraType(this.perspective)
        global.cameraFunction = event => {}
    }
}

CameraSequence.prototype.execute = function(){
    /**
     * 
     * @param {Internal.ViewportEvent$ComputeCameraAngles_} event  
     */
    global.cameraFunction = (event) => {
        if(!this.cameraPosition) {
            this.cameraPosition = event.camera.position;
            this.yaw = event.yaw
            this.pitch = event.pitch
            this.yawBeforeUpdate = this.yaw
            this.pitchBeforeUpdate = this.pitch
            this.perspective = Client.options.cameraType
            Client.options.setCameraType("third_person_back")
            if(this.forceToBreakOnPause){
                this.forceToBreak = () => Client.paused
            }
        }
        this.event = event
        this._execute()
    }
}

