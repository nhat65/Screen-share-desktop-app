const io = require('socket.io-client');
const socket = io('ws://26.203.183.51:3000'); //socket connection
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
const { connect } = require('mongoose');
// myVideo.muted = true;
let peers = {}, currentPeer = []; connectedPeers = [];
let userlist = [];
let cUser;
let roomId;
let peer = null;
let Name;
let YourName;
let isSharing = false;
let ROOM_ID;
let screenStream = null;
let streamStatu

// Lắng nghe sự kiện room-id
ipcRenderer.on('room-id', (event, data) => {
  const { roomId, Name, streamStatus } = data;

  ROOM_ID = roomId;
  YourName = Name;
  streamStatu = streamStatus;

  document.getElementById('room__id').innerText = `Room ID: ${ROOM_ID}`;
  console.log("room id: " + roomId);
  console.log(streamStatu.video)
});

peer = new Peer(undefined, {
  port: 3000,
  host: '26.203.183.51',
  path: '/peerjs',
  secure: false
});

let myVideoStream;
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {

  addVideoStream(myVideo, stream, peer.id);
  myVideoStream = stream;

  peer.on('call', call => {
    console.log("answered");
    call.answer(stream);
    const video = document.createElement('video');
    let streamType = call.metadata.type;
    console.log(streamType)

    call.on('stream', userVideoStream => {
      const callerId = call.peer;
      console.log(callerId)

      if (streamType == 'camera') {
        console.log("This is a camera stream");
        addVideoStream(video, userVideoStream, callerId);
      } else if (streamType == 'screen') {
        console.log("This is a screen stream");
        setScreenSharingStream(userVideoStream);
      }
    });

    peers[call.peer] = call;

    call.on('close', () => {
      video.remove()
    })
  });

  socket.on('user-connected', (user) => {

    const videoNum = videoCount()
    if (videoNum == 1) {
      setGroupScreen()
    }
    setTimeout(() => {
      connectToNewUser(user.userId, stream, roomId);
      $('#user-list').append(
        `<li id="${user.userId}" class="flex items-center justify-between"> 
        <span class="text-white">${user.username}</span>
        <div class="Mute__button_list ml-auto text-white">
                <i class="fas fa-microphone"></i>
            </div>
            <div class="Video__button_list px-4 text-white">
                <i class="fas fa-video "></i> 
            </div>
        </li>`
      );
    }, 2000);
  })

}).catch(error => {
  console.error("Error accessing media devices.", error);
});


function streamStatus(){
  if (streamStatu.video == false) {
    videoOnOff()
  }
  if (streamStatu.audio == false) {
    muteUnmute()
  }
}


//Listerning error of peer
peer.on('error', (error) => {
  console.error('Peer error:', error);
});

peer.on('open', async id => {
  console.log("Peer open");
  console.log(id)
  cUser = id;
  socket.emit('test');
  await socket.emit('join-room', ROOM_ID, id, YourName);
})

socket.on('user-disconnected', (userId, u, peerId, username) => {
  const escapedPeerId = CSS.escape(peerId);
  const elements = document.querySelectorAll(`[id='${escapedPeerId}']`);
  elements.forEach(element => element.remove());

  if (peers[userId]) peers[userId].close();
  if (videoCount() == 1) { setOneScreen(peer.id) }
  console.log('user ID fetch Disconnect: ' + userId);
  setTimeout(() => {
    alert(username + ' has left the room!');
  }, 2000);
});


const connectToNewUser = (userId, stream, roomId) => {

  console.log('User-connected-script.js :-' + userId);
  console.log('Stream: ' + stream)
  let call = peer.call(userId, stream, {
    metadata: { type: 'camera' }
  });
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    console.log("Đã nhận được stream từ 150");
    addVideoStream(video, userVideoStream, userId);
  })
  call.on('close', () => {
    video.remove()
  })
  connectedPeers.push(userId);
  peers[userId] = call;
  currentPeer.push(call.peerConnection);
  console.log(currentPeer.length);

  console.log("peer list: " + connectedPeers)
}

function videoCount() {
  const videoGrid = document.getElementById('video-grid');
  const videoCount = videoGrid.querySelectorAll('video').length

  return videoCount;
}

const addVideoStream = (video, stream, userId) => {
  console.log('add video')
  // Tạo một div để bọc video
  const videoWrapper = document.createElement('div');
  videoWrapper.classList.add('video-wrapper');
  videoWrapper.style.position = 'relative';

  // Tạo ID ngẫu nhiên gồm 4 ký tự
  const randomId = Math.random().toString(36).substring(2, 6); // 4 ký tự ngẫu nhiên
  videoWrapper.id = userId; // Gán ID cho videoWrapper

  if (videoCount() == 1) {
    setGroupScreen();
  } else {
    videoWrapper.style.width = '1130px';
  }

  video.srcObject = stream;
  video.controls = false;
  video.classList.add('user-video');

  video.addEventListener('loadedmetadata', () => {
    video.play();

    // Thêm video vào div
    videoWrapper.appendChild(video);

    // Thêm div vào videoGrid
    videoGrid.append(videoWrapper);
  });

  if (video === myVideo) {
    video.muted = true;
  }
  
};
//--User-mic----------------------------------------------------------------------------

const userMicOn = () => {
  const html = `<i class="fas fa-microphone"></i>`;
  // document.querySelector('.Mute__button_list').innerHTML = html;
  const escapedId = CSS.escape(peer.id);

  const userList = document.getElementById('user-list')
  const userIcon = userList.querySelector(`#${escapedId}`);
  userIcon.querySelector('.Mute__button_list').innerHTML = html;
}

const userMicOff = () => {
  const html = `<i class="fas fa-microphone-slash" style="color:red;"></i>`;
  // document.querySelector('.Mute__button_list').innerHTML = html;

  const escapedId = CSS.escape(peer.id);

  const userList = document.getElementById('user-list')
  const userIcon = userList.querySelector(`#${escapedId}`);
  userIcon.querySelector('.Mute__button_list').innerHTML = html;
}


const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setMuteButton();
    userMicOff()
    socket.emit('mic-off', { userId: peer.id });
  } else {
    userMicOn()
    setUnmuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
    socket.emit('mic-on', { userId: peer.id });
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

socket.on('user-mic-off', (data) => {
  const escapedId = CSS.escape(data.userId);

  const userList = document.getElementById('user-list')
  const userIcon = userList.querySelector(`#${escapedId}`);

  if (userIcon) {  // Kiểm tra userIcon có tồn tại không
    const html = `<i class="fas fa-microphone-slash" style="color:red;"></i>`;
    const videoButton = userIcon.querySelector('.Mute__button_list');  // Lấy thẻ Video__button

    if (videoButton) {  // Kiểm tra xem phần tử có tồn tại
      videoButton.innerHTML = html;  // Cập nhật nội dung
    } else {
      console.error('Không tìm thấy phần tử .Mute__button');
    }
  } else {
    console.error(`Không tìm thấy phần tử với id: ${data.userId}`);
  }

})

socket.on('user-mic-on', (data) => {
  const escapedId = CSS.escape(data.userId);

  const userList = document.getElementById('user-list')
  const userIcon = userList.querySelector(`#${escapedId}`);

  if (userIcon) {  // Kiểm tra userIcon có tồn tại không
    const html = `<i class="fas fa-microphone"></i>`;
    const videoButton = userIcon.querySelector('.Mute__button_list');  // Lấy thẻ Video__button

    if (videoButton) {  // Kiểm tra xem phần tử có tồn tại
      videoButton.innerHTML = html;  // Cập nhật nội dung
    } else {
      console.error('Không tìm thấy phần tử .Mute__button');
    }
  } else {
    console.error(`Không tìm thấy phần tử với id: ${data.userId}`);
  }

})


//----------------------------------------------------------------------------------

const videoOnOff = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    unsetVideoButton();
    userVideoOff(peer.id);
    setScreenOff(peer.id);
    socket.emit('camera-off', { userId: peer.id });
  } else {
    setVideoButton();
    userVideoOn(peer.id)
    myVideoStream.getVideoTracks()[0].enabled = true;
    socket.emit('camera-on', { userId: peer.id });
  }
}

const userVideoOn = (Id) => {
  const html = `<i class="fas fa-video"></i>`;
  const escapedId = CSS.escape(Id);

  const userList = document.getElementById('user-list')
  const userIcon = userList.querySelector(`#${escapedId}`);
  userIcon.querySelector('.Video__button_list').innerHTML = html;
}

const userVideoOff = (Id) => {
  const html = `<i class="fas fa-video-slash" style="color:red;"></i>`;
  const escapedId = CSS.escape(Id);

  const userList = document.getElementById('user-list')
  const userIcon = userList.querySelector(`#${escapedId}`);
  userIcon.querySelector('.Video__button_list').innerHTML = html;
}

const unsetVideoButton = () => {
  const html = `<i class="fas fa-video-slash" style="color:red;"></i>
                <span>Start Video</span>`;
  document.querySelector('.Video__button').innerHTML = html;

  // Chuyển màn hình video sang màu xám
  // const escapedId = CSS.escape(peer.id);
  // const videoElement = document.querySelector(`#${escapedId} video`);
  const videoElement = document.querySelector('video');

  videoElement.style.filter = 'grayscale(100%)'; // Chuyển màu video thành màu xám
  videoElement.style.backgroundColor = 'gray'; // Đặt nền video là màu xám
  videoElement.style.border = 'black';

  console.log("Cammera Mode OFF");
}

const setVideoButton = () => {
  const html = `<i class="fas fa-video"></i>
                <span>Stop Video</span>`;
  document.querySelector('.Video__button').innerHTML = html;

  // Xóa màu xám và icon khi camera bật
  const escapedId = CSS.escape(peer.id);
  const videoElement = document.querySelector(`#${escapedId} video`);

  // const videoElement = document.querySelector('video');
  videoElement.style.filter = 'none';
  videoElement.style.backgroundColor = 'transparent';

  const overlay = document.querySelector('.camera-off-overlay');
  if (overlay) {
    overlay.remove();
  }

  console.log("Cammera Mode ON");
}

function setScreenOff(Id){
  const escapedId = CSS.escape(Id);
  const videoElement = document.querySelector(`#${escapedId} video`);

  // Thêm icon ở giữa màn hình màu xám
  const overlay = document.createElement('div');
  overlay.classList.add('camera-off-overlay');
  overlay.innerHTML = `<i class="fas fa-video-slash transform -scale-x-100" style="font-size: 48px; color: red;"></i>`;
  overlay.style.position = 'absolute';
  overlay.style.top = '50%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.color = 'red';

  // Đảm bảo container của video có position: relative để căn giữa icon
  videoElement.parentElement.style.position = 'relative';

  // Thêm overlay vào video
  videoElement.parentElement.appendChild(overlay);
}

socket.on('user-camera-off', (data) => {
  console.log('User turn off camera' + data.userId)
  // const escapedId = CSS.escape(data.userId);
  // const video = document.querySelector(`#${escapedId} video`);

  // if (video) {
    // const overlay = document.createElement('div');
    // overlay.classList.add('camera-off-overlay');
    // overlay.innerHTML = `<i class="fas fa-video-slash transform -scale-x-100" style="font-size: 48px; color: red;"></i>`;
    // overlay.style.position = 'absolute';
    // overlay.style.top = '50%';
    // overlay.style.left = '50%';
    // overlay.style.transform = 'translate(-50%, -50%)';
    // overlay.style.color = 'red';

    // video.parentElement.style.position = 'relative';
    // video.parentElement.appendChild(overlay);
    setScreenOff(data.userId)

    userVideoOff(data.userId)

    // const userList = document.getElementById('user-list')
    // const userIcon = userList.querySelector(`#${escapedId}`);

    // if (userIcon) {  // Kiểm tra userIcon có tồn tại không
    //   const html = `<i class="fas fa-video-slash" style="color:red;"></i>`;
    //   const videoButton = userIcon.querySelector('.Video__button_list');  // Lấy thẻ Video__button

    //   if (videoButton) {  // Kiểm tra xem phần tử có tồn tại
    //     videoButton.innerHTML = html;  // Cập nhật nội dung
    //   } else {
    //     console.error('Không tìm thấy phần tử .Video__button');
    //   }
    // } else {
    //   console.error(`Không tìm thấy phần tử với id: ${data.userId}`);
    // }
  // }
});

socket.on('user-camera-on', (data) => {
  const escapedId = CSS.escape(data.userId);
  const video = document.querySelector(`#${escapedId} video`);

  // const userList = document.getElementById('user-list')
  // const userIcon = userList.querySelector(`#${escapedId}`);

  // if (userIcon) {  // Kiểm tra userIcon có tồn tại không
  //   const html = `<i class="fas fa-video"></i>`;
  //   const videoButton = userIcon.querySelector('.Video__button_list');  // Lấy thẻ Video__button

  //   if (videoButton) {  // Kiểm tra xem phần tử có tồn tại
  //     videoButton.innerHTML = html;  // Cập nhật nội dung
  //   } else {
  //     console.error('Không tìm thấy phần tử .Video__button');
  //   }
  // } else {
  //   console.error(`Không tìm thấy phần tử với id: ${data.userId}`);
  // }

  userVideoOn(data.userId)

  if (video) {
    const overlay = video.parentElement.querySelector('.camera-off-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
});

//-----------------------------------------------------------------------------------------

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

window.screenShare = function (stream) {
  screenStream = stream
  // Thiết lập luồng chia sẻ màn hình từ stream được truyền vào
  setScreenSharingStream(screenStream);

  isSharing = true;

  screenStream.isScreen = true;

  if (screenStream) {
    connectedPeers.forEach((peerId) => {
      const call = peer.call(peerId, screenStream, {
        metadata: { type: 'screen' }
      });
      console.log('share screen')
      console.log(screenStream.isScreen)
    })
  }
};

function stopScreenSharing(screenStream) {
  // Dừng tất cả track của screenStream
  screenStream.getTracks().forEach(track => track.stop());

  // Xóa screenStream khỏi peer connections
  for (let peerId in peers) {
    const call = peers[peerId];
    call.peerConnection.getSenders().forEach(sender => {
      if (sender.track && sender.track.kind === 'video' && sender.track === screenStream.getVideoTracks()[0]) {
        call.peerConnection.removeTrack(sender);
      }
    });
  }
}



function setScreenSharingStream(stream) {
  let screenShare = document.getElementById('screen-share');
  let mainVideos = document.querySelector(".main__videos");
  let video = document.getElementById('video-share');
  let videoCam = document.querySelectorAll('#video-grid video');
  const userVideos = document.querySelectorAll('.video-wrapper');
  userVideos.forEach(video => {
    video.style.removeProperty('width');
  });


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
    video.classList.remove('p-1');
  });

  //style video grid
  const count = videoCount();
  if (count > 1) {
    videoGrid.className = "";
    videoGrid.classList.add("grid", "grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3", "gap-3", "flex-grow");
  } else {
    videoGrid.className = "";
    const userVideos = document.querySelectorAll('.video-wrapper');
    userVideos.forEach(video => {
      video.style.setProperty('width', '1130px');
    });

  }

  if (screenStream) {
    screenStream.getTracks().forEach(track => track.stop());
    screenStream = null;
  }

  isSharing = false;
  socket.emit('is-sharing', isSharing);
}

function setGroupScreen() {
  const videoGrid = document.getElementById('video-grid');
  videoGrid.classList.add('grid', 'grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'gap-3', 'flex-grow', 'px-3');

  const userVideos = document.querySelectorAll('.video-wrapper');
  userVideos.forEach(video => {
    video.style.removeProperty('width');
  });

}


function setOneScreen(id) {
  const videoGrid = document.getElementById('video-grid');
  videoGrid.className = "";

  const videoWrapper = document.getElementById(id)
  videoWrapper.style.width = '1130px';
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

document.getElementById('closeModal').addEventListener('click', function () {
  document.getElementById('modalOverlay').classList.remove('active');
});

socket.on('ONLINE_LIST', userList => {
  userList.forEach(user => {
    $('#user-list').append(
      `<li id="${user.userId}" class="flex items-center justify-between"> 
        <span class="text-white">${user.username}</span>
        <div class="Mute__button_list ml-auto text-white">
                <i class="fas fa-microphone "></i>
            </div>
            <div class="Video__button_list px-4 text-white">
                <i class="fas fa-video "></i> 
            </div>
        </li>`
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