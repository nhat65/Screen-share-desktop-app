const { app, BrowserWindow, ipcMain, dialog, desktopCapturer } = require('electron'); 
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
let store
(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store();

  // Các mã khác của bạn sử dụng store
  console.log(store);
})();

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

    const user = await User.findOne({ email })
    console.log(user)

    if (!user) {
      return event.sender.send('login-response', { success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    if (user.password !== password) {
      return event.sender.send('login-response', { success: false, message: 'Email hoặc mật khẩu không đúng!' });
    }

    console.log('đăng nhập thành công')
    store.set('userSession', { userId: user._id });

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
//<--------------------------------------------Session management--------------------------------------------------------------------------->
ipcMain.handle('get-user-session', async () => {
  const session = store.get('userSession');
  return session ? session : { success: false, message: 'No session found' };
});


ipcMain.handle('delete-user-session', async () => {
  store.delete('userSession');
  return { success: true, message: 'Session deleted successfully' };
});

//<----------------------------------------------------------------------------------------------------------------------->

ipcMain.handle('get-user', async () => {
  try {
    const session = store.get('userSession');
    const userId = session.userId;

    // Tìm người dùng trong cơ sở dữ liệu theo userId
    const user = await User.findById(userId);
    return user ? user : null;
  } catch (error) {
    console.error('Get user error:', error);
    throw error; // Gửi lỗi cho renderer nếu cần
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

ipcMain.on('logout', () => {
  mainWindow.loadFile(path.join(__dirname, 'views', 'login.html'));
});
