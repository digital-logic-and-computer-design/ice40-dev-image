/// ********** Programmer states and state change functions ********** ///
// Create an enum for the phases of programming:  IDLE, ERASING, PROGRAMMING, FAILED, SUCCESS
const ProgrammingPhases = {
  IDLE: 'IDLE', // Valid to (try to) program
  ERASING: 'ERASING', // Busy in connection/erase phase
  PROGRAMMING: 'PROGRAMMING', // Busy in programming phase
  FAILED: 'FAILED', // Failed to program
  SUCCESS: 'SUCCESS', // Programming succeeded
  DISCONNECTED: 'DISCONNECTED', // Programming failed and need to disconnect device in UI side to restore behavior
  NODEVICE: 'NODEVICE' // No device found (device was selected, but cable is probably unplugged)
}

let programmingPhase = ProgrammingPhases.IDLE
let progress = 0
let lastImage = null

function changePhase(newPhase, progressUpdate = null) {
  if (progressUpdate !== null) {
    progress = progressUpdate
    // Else, if changing phases and going to programming or erasing, set progress to 0
  } else if (programmingPhase != newPhase) {
    switch (newPhase) {
      case ProgrammingPhases.ERASING:
      case ProgrammingPhases.PROGRAMMING:
        progress = 0
        break

      case ProgrammingPhases.FAILED:
      case ProgrammingPhases.DISCONNECTED:
      case ProgrammingPhases.NODEVICE:
        lastImage = null
      // Fall through to default

      default: // Other phases are "done"
        progress = 100
        break
    }
  }
  programmingPhase = newPhase
  postMessage({ type: 'status', phase: programmingPhase, progress: progress })
}

/// ********** Setup/startup/initialization and programmer init ********** ///
let openFPGA = null
async function setup() {
  openFPGA = await import('/yowasp/bundle.js')
}
setup()
changePhase(ProgrammingPhases.IDLE)

// Get the image data for a given image name from the server
async function getImage(name) {
  let imageDataFetch = await fetch('./images/' + name)
  let imageData = await imageDataFetch.json()
  return imageData
}

function stdout(data) {
  postMessage({ type: 'stdout', data: data })
}

function stderr(data) {
  postMessage({ type: 'stderr', data: data })
}

// Stdout posting and parsing for phase detection
function stdoutFunction(data) {
  // convert bytes to ascii string
  const str = new TextDecoder().decode(data)
  // Parse str for "Erasing"
  if (str.includes('Erasing')) {
    changePhase(ProgrammingPhases.ERASING)
  } else if (str.includes('Writing')) {
    changePhase(ProgrammingPhases.PROGRAMMING)
  } else if (str.includes('CDONE')) {
    changePhase(ProgrammingPhases.SUCCESS)
    changePhase(ProgrammingPhases.IDLE)
  }
  // regex for percentage like XXX.XX%
  const percentage = str.match(/\d+\.\d+%/)
  if (percentage) {
    // convert the percentage to a number and post progress
    changePhase(programmingPhase, parseFloat(percentage[0]))
  }
  stdout(str)
}

// Stderr posting and parsing for failure detection
function stderrFunction(data) {
  const str = new TextDecoder().decode(data)
  // parse for "fail"
  if (str.toLowerCase().includes('unable to open')) {
    changePhase(ProgrammingPhases.NODEVICE)
    changePhase(ProgrammingPhases.FAILED)
    changePhase(ProgrammingPhases.IDLE)
  }
  if (str.toLowerCase().includes('fail')) {
    changePhase(ProgrammingPhases.FAILED)
    changePhase(ProgrammingPhases.IDLE)
  }
  if (str.toLowerCase().includes('mpsse')) {
    changePhase(ProgrammingPhases.FAILED)
    changePhase(ProgrammingPhases.DISCONNECTED)
    throw 'ERROR: Failed to program'
  }
  stderr(str)
}

// ********** Helper functions for binary conversions and checking ********** //
// https://stackoverflow.com/questions/40031688/javascript-arraybuffer-to-hex
function buf2hex(buffer) {
  // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
function base64ToArrayBuffer(base64) {
  var binaryString = atob(base64)
  var bytes = new Uint8Array(binaryString.length)
  for (var i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

// DUPLICATE FUNCTION!  KEEP DEFAULTS IN SYNC (deviceworker.js and devicemanager.js)
async function getImageMetadata(name) {
  // Check for presence of ./images/name.json file
  let imageMetaDataFetch = await fetch('./metadata/' + name + '.json')
  let defaults = {
    overrideAllArgs: false,
    additionalArguments: null,
    uartBaudRate: 1000000,
    uart: false
  }
  if (imageMetaDataFetch.ok) {
    let imageMetaData = await imageMetaDataFetch.json()
    // Merge the metadata with the defaults
    imageMetaData = { ...defaults, ...imageMetaData }
    return imageMetaData
  } else {
    stdout('No metadata found. Using default settings.\n')
    return defaults
  }
}

// Upload the image to the FPGA
async function upload(filename) {
  changePhase(ProgrammingPhases.ERASING)
  // Get the image
  let imageData = await getImage(filename)
  let metaData = await getImageMetadata(filename)

  // Save the image and metadata for later
  lastImage = imageData
  lastImage.metaData = metaData

  // Compute the data's sha1 checksum
  // Convert the data to an array buffer
  let data = new TextEncoder().encode(imageData.data)
  let checksum = await crypto.subtle.digest('SHA-1', data)
  // Convert the checksum to a hex string
  // let checksumHex = Array.from(new Uint8Array(checksum))
  let checksumHex = buf2hex(checksum)
  if (checksumHex !== imageData.dataHash) {
    stderr('Checksum mismatch.  Aborting programming.')
    changePhase(ProgrammingPhases.FAILED)
    return
  }
  let binaryData = base64ToArrayBuffer(imageData.data)
  // Convert data to uint8 array from ascii / hex
  var filesData = { 'data.fs': binaryData }

  let moduleArgs = ['-b', 'ice40_generic', '-v', '-c', 'ft232', '-f', 'data.fs']
  if (metaData.overrideAllArgs) {
    moduleArgs = []
    stdout('Standard Arguments Overridden\n')
  }
  if (metaData.additionalArguments) {
    moduleArgs = moduleArgs.concat(metaData.additionalArguments)
    stdout('Additional arguments: ' + metaData.additionalArguments + '\n')
  }

  try {
    await openFPGA.runOpenFPGALoader(moduleArgs, filesData, {
      stdout: stdoutFunction,
      stderr: stderrFunction
    })
  } catch (error) {
    changePhase(ProgrammingPhases.FAILED)
    stderr('ERROR running openFPGALoader: ' + error)
  }
}

// Incoming message processing
onmessage = (e) => {
  if (e.data.command === 'upload') {
    upload(e.data.filename)
  }
}
