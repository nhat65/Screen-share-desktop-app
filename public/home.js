const videoElement = document.getElementById('userVideo');
const toggleMute = document.getElementById('toggleMic');
const toggleVideo = document.getElementById('toggleVideo');
const { getUser } = require('../controllers/userController')

let Name;
let roomId;
let stream;
let isMicOn = true;
let isVideoOn = true;
let streamStatus = { video: isVideoOn, audio: isMicOn };

const { ipcRenderer } = require('electron');

async function createRoom() {
    try {
        const user = await getUser();
        console.log(user._doc.name)
        Name = user._doc.name;
        roomId = generateRandomCode();

        if (roomId && Name) {
            ipcRenderer.send('navigate-to-room', { roomId, Name, streamStatus });  // Gửi yêu cầu đến main process
        } else {
            alert('Please enter a Room ID and Name!');
        }
    } catch (error) {
        console.log('Create room error: ' + error)
    }

}

async function joinRoom() {
    try {
        const user = await getUser();
        console.log(user._doc.name)
        Name = user._doc.name;
        roomId = document.getElementById('input-roomId').value;

        if (roomId && Name) {
            ipcRenderer.send('navigate-to-room', roomId, Name);  // Gửi yêu cầu đến main process
        } else {
            alert('Please enter a Room ID and Name!');
        }
    } catch (error) {
        console.log('Join room error: ' + error)
    }
}


function generateRandomCode() {
    const characters = 'abcdefghijklmnopqrstuvwxyz';

    // Hàm lấy một ký tự ngẫu nhiên từ chuỗi characters
    function getRandomChar() {
        return characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Tạo từng đoạn mã và ghép lại với dấu '-'
    const part1 = Array.from({ length: 3 }, getRandomChar).join('');
    const part2 = Array.from({ length: 4 }, getRandomChar).join('');
    const part3 = Array.from({ length: 3 }, getRandomChar).join('');

    return `${part1}-${part2}-${part3}`;
}

// Hàm lấy user media (webcam + microphone)
async function getUserMedia() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        // Gán stream vào thẻ video để hiển thị hình ảnh từ webcam
        videoElement.srcObject = stream;
        videoElement.muted = true;

        console.log('User media acquired successfully!');
    } catch (error) {
        console.error('Error accessing user media:', error);
    }
}

// Gọi hàm để bắt đầu lấy stream khi trang tải
getUserMedia();

// Xử lý bật/tắt microphone


toggleMute.addEventListener('click', () => {
    isMicOn = !isMicOn;
    stream.getAudioTracks()[0].enabled = isMicOn;

    if (isMicOn) {
        const html = `
      <i class="fas fa-microphone"></i>
      <span>Mute</span>
  `;
        toggleMute.innerHTML = html;
    } else {
        const html = `
      <i class="fas fa-microphone-slash"></i>
      <span>Unmute</span>
  `;
        toggleMute.innerHTML = html;
    }

    // toggleMute.querySelector('span').textContent = isMuted ? 'Unmute' : 'Mute';
    console.log('Microphone:', isMicOn ? 'On' : 'Off');
    streamStatus = { video: isVideoOn, audio: isMicOn };
});

// Xử lý bật/tắt camera


const videoOnOff = () => {
    const enabled = stream.getVideoTracks()[0].enabled;
    if (enabled) {
        isVideoOn = false;
        stream.getVideoTracks()[0].enabled = false;
        unsetVideoButton();
    } else {
        isVideoOn = true;
        setVideoButton();
        stream.getVideoTracks()[0].enabled = true;
    }
    streamStatus = { video: isVideoOn, audio: isMicOn };
}


const unsetVideoButton = () => {
    const html = `<i class="fas fa-video-slash"></i>
                  <span>On</span>`;
    toggleVideo.innerHTML = html;

    // Chuyển màn hình video sang màu xám
    const videoElement = document.querySelector('video');
    videoElement.style.filter = 'grayscale(100%)'; // Chuyển màu video thành màu xám
    videoElement.style.backgroundColor = 'gray'; // Đặt nền video là màu xám
    videoElement.style.border = 'black';

    // Thêm icon ở giữa màn hình màu xám
    const overlay = document.createElement('div');
    overlay.classList.add('camera-off-overlay');
    overlay.innerHTML = `<i class="fas fa-video-slash" style="font-size: 48px;"></i>`;
    overlay.style.position = 'absolute';
    overlay.style.top = '40%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.color = 'white';

    // Đảm bảo container của video có position: relative để căn giữa icon
    videoElement.parentElement.style.position = 'relative';

    // Thêm overlay vào video
    videoElement.parentElement.appendChild(overlay);


    console.log("Cammera Mode OFF");
}

const setVideoButton = () => {
    const html = `<i class="fas fa-video"></i>
                  <span>Off</span>`;
    toggleVideo.innerHTML = html;

    // Xóa màu xám và icon khi camera bật
    const videoElement = document.querySelector('video');
    videoElement.style.filter = 'none';
    videoElement.style.backgroundColor = 'transparent';

    const overlay = document.querySelector('.camera-off-overlay');
    if (overlay) {
        overlay.remove();
    }

    console.log("Cammera Mode ON");
}

toggleVideo.addEventListener('click', videoOnOff);


const logout = () => {
    ipcRenderer.send('logout');
}