const io = require('socket.io-client');
const socket = io('http://localhost:3000'); //socket connection
socket.on('connect', () => {
  console.log("Connected to socket server.");
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

const { ipcRenderer } = require('electron');
let videoGrid = document.getElementById('video-grid');
const userDropDown = document.getElementById('myDropdown');
const myVideo = document.createElement('video');
myVideo.removeAttribute('controls');
const $ = require('jquery');
const jQuery = require('jquery');
// myVideo.muted = true;
let peers = {}, currentPeer = [];
let userlist = [];
let cUser;
let roomId;
let peer = null;
let Name;
let YourName;
let isSharing = false;
let ROOM_ID;

document.addEventListener('DOMContentLoaded', () => {
  Name = localStorage.getItem('Name');

  if (Name && Name !== 'null') {
    YourName = Name;
    localStorage.removeItem('Name');
  } else {
    let path = window.location.pathname;
    roomId = path.substring(1);
    localStorage.setItem('roomId', roomId);

    window.location.href = `/home`;
    alert('Enter your name to join the room');

  }
});

console.log(navigator.mediaDevices);  // Kiểm tra mediaDevices

// Lắng nghe sự kiện room-id
ipcRenderer.on('room-id', (event, roomId) => {
  ROOM_ID = roomId;
  document.getElementById('room__id').innerText = `Room ID: ${roomId}`;
  console.log("room id: " + roomId);
});

peer = new Peer(undefined, {
  port: 3000,
  host: 'localhost',
  path: '/peerjs',
  secure: false
});

let myVideoStream;
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream);
  myVideoStream = stream;

  peer.on('call', call => {

    console.log("answered");
    console.log(currentPeer.length)
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });

    peers[call.peer] = call;
    call.on('close', () => {
      video.remove()
    })
  });

  socket.on('user-connected', (user) => {
    setTimeout(() => {

      connectToNewUser(user.userId, stream, roomId);
      $('#user-list').append(
        `<li id="${user.userId}" class="flex items-center justify-between"> <span class="text-white">${user.username}</span></li>`
      );
      console.log(user);
    }, 2000);
  })

}).catch(error => {
  console.error("Error accessing media devices.", error);
});

//Listerning error of peer
peer.on('error', (error) => {
  console.error('Peer error:', error);
});

peer.on('open', async id => {
  console.log("Peer open");
  cUser = id;
  socket.emit('test');
  await socket.emit('join-room', ROOM_ID, id, YourName);
})

socket.on('user-disconnected', (userId, u, peerId, username) => {
  $(`#${peerId}`).remove();
  if (peers[userId]) peers[userId].close();
  console.log('user ID fetch Disconnect: ' + userId);
  setTimeout(() => {
    alert(username + ' has left the room!');
  }, 3000);
});


const connectToNewUser = (userId, stream) => {

  console.log('User-connected :-' + userId);
  let call = peer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  })
  call.on('close', () => {
    video.remove()
  })
  peers[userId] = call;
  currentPeer.push(call.peerConnection);
  console.log(currentPeer.length);
}


const addVideoStream = (video, stream) => {
  // Tạo một div để bọc video
  const videoWrapper = document.createElement('div');
  videoWrapper.classList.add('video-wrapper'); // Thêm class để dễ css
  videoWrapper.style.position = 'relative';

  video.srcObject = stream;
  video.controls = false;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });

  if (video === myVideo) {
    video.muted = true;
  }

  // Thêm video vào div
  videoWrapper.appendChild(video);

  // Thêm div vào videoGrid
  videoGrid.append(videoWrapper);
}



const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setMuteButton();
  } else {
    setUnmuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const setUnmuteButton = () => {
  const html = `<i class="fas fa-microphone"></i>
                <span>Mute</span>`;
  document.querySelector('.Mute__button').innerHTML = html;
  console.log("You are Unmuted");
}

const setMuteButton = () => {
  const html = `<i class="fas fa-microphone-slash" style="color:red;"></i>
                <span>Unmute</span>`;
  document.querySelector('.Mute__button').innerHTML = html;
  console.log("Muted");
}


const videoOnOff = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    unsetVideoButton();
    socket.emit('camera-off', { userId: peer.id });
  } else {
    setVideoButton();
    myVideoStream.getVideoTracks()[0].enabled = true;
    socket.emit('camera-on', { userId: peer.id });
  }
}

const unsetVideoButton = () => {
  const html = `<i class="fas fa-video-slash" style="color:red;"></i>
                <span>Start Video</span>`;
  document.querySelector('.Video__button').innerHTML = html;

  // Chuyển màn hình video sang màu xám
  const videoElement = document.querySelector('video');
  videoElement.style.filter = 'grayscale(100%)'; // Chuyển màu video thành màu xám
  videoElement.style.backgroundColor = 'gray'; // Đặt nền video là màu xám
  videoElement.style.border = 'black';

  // Thêm icon ở giữa màn hình màu xám
  const overlay = document.createElement('div');
  overlay.classList.add('camera-off-overlay');
  overlay.innerHTML = `<i class="fas fa-video-slash" style="font-size: 48px; color: red;"></i>`;
  overlay.style.position = 'absolute';
  overlay.style.top = '50%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.color = 'red';

  // Đảm bảo container của video có position: relative để căn giữa icon
  videoElement.parentElement.style.position = 'relative';

  // Thêm overlay vào video
  videoElement.parentElement.appendChild(overlay);


  console.log("Cammera Mode OFF");
}

const setVideoButton = () => {
  const html = `<i class="fas fa-video"></i>
                <span>Stop Video</span>`;
  document.querySelector('.Video__button').innerHTML = html;

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

socket.on('camera-off', (data) => {
  socket.broadcast.emit('user-camera-off', data);
});

socket.on('camera-on', (data) => {
  socket.broadcast.emit('user-camera-on', data);
});

socket.on('user-camera-off', (data) => {
  const videoElement = document.getElementById(`video-${data.userId}`);
  if (videoElement) {
    const overlay = document.createElement('div');
    overlay.classList.add('camera-off-overlay');
    overlay.innerHTML = `<i class="fas fa-video-slash" style="font-size: 48px; color: red;"></i>`;
    overlay.style.position = 'absolute';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.color = 'red';

    videoElement.parentElement.style.position = 'relative';
    videoElement.parentElement.appendChild(overlay);
  }
});

socket.on('user-camera-on', (data) => {
  const videoElement = document.getElementById(`video-${data.userId}`);
  if (videoElement) {
    const overlay = videoElement.parentElement.querySelector('.camera-off-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
});



const disconnectNow = () => {
  ipcRenderer.send('navigate-to-home');
}

const share = () => {
  var share = document.createElement('input'),
    text = ROOM_ID;

  console.log(text);
  document.body.appendChild(share);
  share.value = text;
  share.select();
  document.execCommand('copy');
  document.body.removeChild(share);
  alert('Copied');
}
//msg sen from user
let text = $('input');

$('html').keydown((e) => {
  if (e.which == 13 && text.val().length !== 0) {
    console.log(text.val());
    socket.emit('message', text.val(), YourName);
    text.val('')
  }
});

socket.on('createMessage', (msg, user) => {
  $('#chat-list').append(`<li class= "message"><small>~${user}</small><br>${msg}</li>`);
  scrollToBottom();
});

const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

//screenShare
// 

window.screenShare = function (stream) {
  // Thiết lập luồng chia sẻ màn hình từ stream được truyền vào
  setScreenSharingStream(stream);

  isSharing = true;
  socket.emit('is-sharing', isSharing);

  let videoTrack = stream.getVideoTracks()[0];

  // Khi người dùng dừng chia sẻ màn hình
  videoTrack.onended = function () {
    stopScreenShare();
  };

  // Thay thế track video của tất cả peer hiện tại
  for (let i = 0; i < currentPeer.length; i++) {
    let sender = currentPeer[i].getSenders().find(s => s.track.kind === videoTrack.kind);

    if (sender) {
      sender.replaceTrack(videoTrack);
    }
  }
};


function setScreenSharingStream(stream) {
  let screenShare = document.getElementById('screen-share');
  let mainVideos = document.querySelector(".main__videos");
  let video = document.getElementById('video-share');
  let videoCam = document.querySelectorAll('#video-grid video');

  videoCam.forEach(video1 => {
    video1.style.setProperty('max-width', '100%', 'important');
    video1.style.setProperty('height', 'auto', 'important');
    video1.style.setProperty('object-fit', 'cover', 'important');
    video1.classList.add("p-1");
  });

  videoGrid.className = "";
  videoGrid.classList.add("m-3", "w-1/6", "gap-4", "flex-grow", "h-auto");
  mainVideos.style.display = "flex";
  screenShare.hidden = false;
  isSharing = true;

  video.srcObject = stream;
  video.controls = false;
  video.muted = true;
  video.play();
}



function stopScreenShare() {
  //hidden screen share
  let screenShare = document.getElementById('screen-share');
  screenShare.hidden = true;

  //style grid video
  let mainVideos = document.querySelector(".main__videos");
  mainVideos.style.display = "grid";

  //change to old style video cam
  let videoCam = document.querySelectorAll('#video-grid video');
  videoCam.forEach(video => {
    video.style = "";
  });

  //style video grid
  videoGrid.className = "";
  videoGrid.classList.add("grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "gap-3", "flex-grow");

  isSharing = false;
  socket.emit('is-sharing', isSharing);
  let videoTrack = myVideoStream.getVideoTracks()[0];
  for (let x = 0; x < currentPeer.length; x++) {
    let sender = currentPeer[x].getSenders().find(function (s) {
      return s.track.kind == videoTrack.kind;
    })
    sender.replaceTrack(videoTrack);
  }
}

//raised hand
const raisedHand = () => {
  const sysbol = "&#9995;";
  socket.emit('message', sysbol, YourName);
  unChangeHandLogo();
}

const unChangeHandLogo = () => {
  const html = `<i class="far fa-hand-paper" style="color:red;"></i>
                <span>Raised</span>`;
  document.querySelector('.raisedHand').innerHTML = html;
  console.log("change")
  changeHandLogo();
}

const changeHandLogo = () => {
  setInterval(function () {
    const html = `<i class="far fa-hand-paper" style="color:"white"></i>
                <span>Hand</span>`;
    document.querySelector('.raisedHand').innerHTML = html;
  }, 3000);
}


socket.on('remove-User', (userId) => {
  if (cUser == userId) {
    disconnectNow();
  }
});

const getUsers = () => {
  socket.emit('seruI',);

}

const listOfUser = () => {
  while (userDropDown.firstChild) {
    userDropDown.removeChild(userDropDown.lastChild);
  }
  for (var i = 0; i < userlist.length; i++) {
    var x = document.createElement("a");
    var t = document.createTextNode(`VideoSector ${i + 1}`);
    x.appendChild(t);
    userDropDown.append(x);
  }
  const anchors = document.querySelectorAll('a');
  for (let i = 0; i < anchors.length; i++) {
    anchors[i].addEventListener('click', () => {
      console.log(`Link is clicked ${i}`);
      anchoreUser(userlist[i]);
    });
  }
}

const anchoreUser = (userR) => {
  socket.emit('removeUser', cUser, userR);
}


socket.on('all_users_inRoom', (userI) => {
  console.log(userI);
  userlist.splice(0, userlist.length);
  userlist.push.apply(userlist, userI);
  console.log(userlist);
  listOfUser();
  document.getElementById("myDropdown").classList.toggle("show");
});

window.toggleChat = function () {
  const chatWindow = document.querySelector('.main__right_chat');
  const participantWindow = document.querySelector('.main__right_participants');
  const videoSection = document.querySelector('.main__left');



  // Kiểm tra thuộc tính hidden của chatWindow
  if (chatWindow.hidden) {
    chatWindow.hidden = false;
    participantWindow.hidden = true;

    videoSection.style.flex = '0.8';
    chatWindow.style.flex = '0.2';

  } else {
    participantWindow.hidden = true;
    chatWindow.hidden = true;

    videoSection.style.flex = '1';

  }
}

const toggleParticipants = () => {
  const chatWindow = document.querySelector('.main__right_chat');
  const participantWindow = document.querySelector('.main__right_participants');
  const videoSection = document.querySelector('.main__left');

  // Adjust the width of video section
  if (participantWindow.hidden) {
    participantWindow.hidden = false;
    chatWindow.hidden = true;

    videoSection.style.flex = '0.8';
    participantWindow.style.flex = '0.2';

  } else {
    participantWindow.hidden = true;
    chatWindow.hidden = true;

    videoSection.style.flex = '1';

  }
}

window.screenShare1 = function () {
  document.getElementById('modalOverlay').classList.add('active');
}

document.getElementById('closeModal').addEventListener('click', function() {
  document.getElementById('modalOverlay').classList.remove('active');
});

socket.on('ONLINE_LIST', userList => {
  userList.forEach(user => {
    $('#user-list').append(
      `<li id="${user.userId}" class="flex items-center justify-between"> <span class = "text-white">${user.username}</span></li>`
    );
  });
})

socket.on('USER_SHARING', (data) => {
  if (data = true) {
    let screenShare = document.getElementById('screen-share');
    let mainVideos = document.querySelector(".main__videos");
    const videoCam = document.querySelectorAll('#video-grid video');
    let video = document.getElementById('video-share');

    videoCam.forEach(video1 => {
      video1.style.setProperty('max-width', '100%', 'important');
      video1.style.setProperty('height', 'auto', 'important');
      video1.style.setProperty('object-fit', 'cover', 'important');
      video1.classList.add("p-1");
    });

    videoGrid.className = "";
    videoGrid.classList.add("m-3", "w-1/6", "gap-4", "flex-grow", "h-auto");
    mainVideos.style.display = "flex";
    screenShare.hidden = false;

  }
})

socket.on('USER_STOP_SHARING', data => {
  if (data == false) {
    //hidden screen share
    let screenShare = document.getElementById('screen-share');
    screenShare.hidden = true;

    //style grid video
    let mainVideos = document.querySelector(".main__videos");
    mainVideos.style.display = "grid";

    //change to old style video cam
    let videoCam = document.querySelectorAll('#video-grid video');
    videoCam.forEach(video => {
      video.style = "";
    });

    //style video grid
    videoGrid.className = "";
    videoGrid.classList.add("grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "gap-3", "flex-grow");
  }
})