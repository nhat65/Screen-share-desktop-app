const videoElement = document.getElementById('userVideo');
const toggleMute = document.getElementById('toggleMic');
const toggleVideo = document.getElementById('toggleVideo');

let Name;
let roomId;
let stream;
// Sử dụng cú pháp mới của jQuery cho việc xử lý sự kiện click
// const { ipcRenderer } = require('electron'); // Đảm bảo đã cài Electron



function createRoom() {
    // Name = document.getElementById('name').value.trim();
    Name = "Nhat";
    roomId = generateRandomCode();
    if (roomId && Name) {
        localStorage.setItem('Name', Name);
        ipcRenderer.send('navigate-to-room', roomId);  // Gửi yêu cầu đến main process
    } else {
        alert('Please enter a Room ID and Name!');
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

        console.log('User media acquired successfully!');
    } catch (error) {
        console.error('Error accessing user media:', error);
    }
}

// Gọi hàm để bắt đầu lấy stream khi trang tải
getUserMedia();

// Xử lý bật/tắt microphone
let isMuted = false;
toggleMute.addEventListener('click', () => {
    isMuted = !isMuted;
    stream.getAudioTracks()[0].enabled = !isMuted;

    if (isMuted) {
        const html = `
    <i class="fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
        toggleMute.innerHTML = html;
    } else {
        const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
        toggleMute.innerHTML = html;
    }

    // toggleMute.querySelector('span').textContent = isMuted ? 'Unmute' : 'Mute';
    console.log('Microphone:', isMuted ? 'Muted' : 'Unmuted');
});

// Xử lý bật/tắt camera
let isVideoOn = true;


const videoOnOff = () => {
    const enabled = stream.getVideoTracks()[0].enabled;
    if (enabled) {
        stream.getVideoTracks()[0].enabled = false;
        unsetVideoButton();
    } else {
        setVideoButton();
        stream.getVideoTracks()[0].enabled = true;
    }
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