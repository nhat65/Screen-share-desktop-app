const { writeFile } = require('fs');

let mediaRecorder;
let recordedChunks = [];

// Buttons
const videoElement = document.getElementById('videoChose');

const startBtn = document.getElementById('startBtn');
startBtn.onclick = e => {
  startRecording();
};

const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = e => {
  videoElement.srcObject = null
  stopScreenShare();
  // mediaRecorder.stop();
};

// const videoSelectBtn = document.getElementById('videoSelectBtn');
// videoSelectBtn.onclick = getVideoSources;

const selectMenu = document.getElementById('selectMenu')

async function getVideoSources() {
    const inputSources = await ipcRenderer.invoke('getSources')
  
    inputSources.forEach(source => {
      const element = document.createElement("option")
      element.value = source.id
      element.innerHTML = source.name
      selectMenu.appendChild(element)
    });
  }
  getVideoSources()


  async function startRecording() {
    const screenId = selectMenu.options[selectMenu.selectedIndex].value
    
    // AUDIO WONT WORK ON MACOS
    const IS_MACOS = await ipcRenderer.invoke("getOperatingSystem") === 'darwin'
    console.log(await ipcRenderer.invoke('getOperatingSystem'))
    const audio = !IS_MACOS ? {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    } : false
  
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenId
        }
      }
    };
  
    // Create a Stream
    const stream = await navigator.mediaDevices
      .getUserMedia(constraints);
  
    videoElement.srcObject = stream;
    await videoElement.play();

    window.screenShare(stream);
    // mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    // mediaRecorder.ondataavailable = onDataAvailable;
    // mediaRecorder.onstop = stopRecording;
    // mediaRecorder.start();
  }

// function onDataAvailable(e) {
//     recordedChunks.push(e.data);
// }


// async function stopRecording() {
//     videoElement.srcObject = null

//     const blob = new Blob(recordedChunks, {
//       type: 'video/webm; codecs=vp9'
//     });
  
//     const buffer = Buffer.from(await blob.arrayBuffer());
//     recordedChunks = []

//     const { canceled, filePath } =  await ipcRenderer.invoke('showSaveDialog')
//     if(canceled) return
  
//     if (filePath) {
//       writeFile(filePath, buffer, () => console.log('video saved successfully!'));
//     }
//   }