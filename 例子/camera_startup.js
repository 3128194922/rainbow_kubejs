/**
 * 
 * @param {Internal.ViewportEvent$ComputeCameraAngles} event 
 */
global.cameraFunction = (event) => {
}

ForgeEvents.onEvent("net.minecraftforge.client.event.ViewportEvent$ComputeCameraAngles", event => {
  global.cameraFunction(event)
})
