// priority: 0

const Minecraft = Java.loadClass('net.minecraft.client.Minecraft')
const GLFW = Java.loadClass('org.lwjgl.glfw.GLFW')

const targetCode = 'wwssaaddbaba'

let inputBuffer = ''
let lastKeys = {
  W: false,
  S: false,
  A: false,
  D: false,
  B: false
}

function resetKeys() {
  lastKeys.W = false
  lastKeys.S = false
  lastKeys.A = false
  lastKeys.D = false
  lastKeys.B = false
}

function resetInput() {
  inputBuffer = ''
}

function handleKeyInput(key,player) {
  const expected = targetCode.charAt(inputBuffer.length)

  if (key == expected) {
    inputBuffer += key
    console.log('[KubeJS] 当前输入: ' + inputBuffer)

    if (inputBuffer == targetCode) {
      console.log('[KubeJS] 成功输入秘籍: ' + targetCode)

    player.sendData('pause_menu_code', {
        code: targetCode
    })

      resetInput()
    }
  } else {
    inputBuffer = key == targetCode.charAt(0) ? key : ''
    console.log('[KubeJS] 输入重置，当前输入: ' + inputBuffer)
  }
}

ClientEvents.tick(event => {
  let mc = Minecraft.getInstance()
  let player = event.player;

  if (mc.screen == null) {
    resetKeys()
    resetInput()
    return
  }

  let screen = mc.screen.getClass().getName()

  if (screen != 'net.minecraft.client.gui.screens.inventory.InventoryScreen') {
    resetKeys()
    resetInput()
    return
  }

  let keyW = mc.isKeyDown(GLFW.GLFW_KEY_W)
  let keyS = mc.isKeyDown(GLFW.GLFW_KEY_S)
  let keyA = mc.isKeyDown(GLFW.GLFW_KEY_A)
  let keyD = mc.isKeyDown(GLFW.GLFW_KEY_D)
  let keyB = mc.isKeyDown(GLFW.GLFW_KEY_B)

  if (keyW && !lastKeys.W) {
    console.log('[KubeJS] 按下: W')
    handleKeyInput('w',player)
  }

  if (keyS && !lastKeys.S) {
    console.log('[KubeJS] 按下: S')
    handleKeyInput('s',player)
  }

  if (keyA && !lastKeys.A) {
    console.log('[KubeJS] 按下: A')
    handleKeyInput('a',player)
  }

  if (keyD && !lastKeys.D) {
    console.log('[KubeJS] 按下: D')
    handleKeyInput('d',player)
  }

  if (keyB && !lastKeys.B) {
    console.log('[KubeJS] 按下: B')
    handleKeyInput('b',player)
  }

  lastKeys.W = keyW
  lastKeys.S = keyS
  lastKeys.A = keyA
  lastKeys.D = keyD
  lastKeys.B = keyB
})