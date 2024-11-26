const { ipcRenderer } = require('electron');


async function getUser() {
  try {
    // Gọi hàm trong main process để lấy user
    const user = await ipcRenderer.invoke('get-user');
    return user ? user : null;
  } catch (error) {
    console.log('Get user error: ' + error);
  }
}

module.exports = { getUser };
