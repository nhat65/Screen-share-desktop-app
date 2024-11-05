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
    mainWindow.loadFile(path.join(__dirname, 'views', 'home.html'));

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

