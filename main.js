const { app, BrowserWindow, ipcMain, dialog, desktopCapturer } = require('electron'); // Thêm ipcMain
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1800,
    height: 1600,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true
    }
  });

  // Load home.html từ thư mục views
  mainWindow.loadFile(path.join(__dirname, 'views', 'login.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Điều hướng đến Room
ipcMain.on('navigate-to-room', (event, data) => {
  const roomId = data;
  console.log("Room id: " + roomId);
  mainWindow.loadFile(path.join(__dirname, 'views', 'room.html')).then(() => {
    // Gửi roomId đến renderer sau khi tải xong room.html
    mainWindow.webContents.send('room-id', roomId);

  }).catch((err) => {
    console.error("Error loading room.html:", err);
  });
});

//điều hướng đến Home
ipcMain.on('navigate-to-home', () => {
  mainWindow.loadFile(path.join(__dirname, 'views', 'home.html'));
});

// điều hướng đến register
ipcMain.on('navigate-to-register', () => {
  mainWindow.loadFile(path.join(__dirname, 'views', 'register.html'));
});

const User = require('./models/schema')

ipcMain.on('login-form-submit', async (event, { email, password }) => {
  try {
    // Tìm người dùng theo email
    console.log(email)
    const user = await User.findOne({ email })
    console.log(user)
    if (!user) {
      return event.sender.send('login-response', { success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    // So sánh mật khẩu
    if (user.password !== password) {
      return event.sender.send('login-response', { success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    // Đăng nhập thành công
    console.log('đăng nhập thành công')

    // Tải trang home
    mainWindow.loadFile(path.join(__dirname, 'views', 'home.html'));
  } catch (error) {
    console.error('Login error:', error);
  }
});

ipcMain.on('register-form-submit', async (event, { name, email, password, re_password }) => {
  if (password !== re_password) {
    return event.sender.send('login-response', { success: false, message: 'Mật khẩu không khớp!' });
  }
  try {
    const newUser = new User({ name, email, password });
    await newUser.save();
    
    mainWindow.loadFile(path.join(__dirname, 'views', 'login.html'));
  } catch (error) {
    console.error('Login error:', error);
  }

});



ipcMain.handle('getSources', async () => {
  return await desktopCapturer.getSources({ types: ['window', 'screen'] })
})

ipcMain.handle('showSaveDialog', async () => {
  return await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
  });
})

ipcMain.handle('getOperatingSystem', () => {
  return process.platform
})

