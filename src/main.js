const { app, BrowserWindow } = require('electron');
const ipc = require('electron').ipcMain;
const fs = require('fs');
const path = require("path");
var win;
console.log("main");

//server funcs
//server write
ipc.on('write', function (event, arg) {
  let where = path.dirname(arg.path);
  if (!fs.existsSync(where)) {
    fs.mkdirSync(where, { recursive: true }, (err) => { console.error(err) });
  }
  fs.writeFile(arg.path, arg.content, () => event.returnValue = { 'success': 'yes' });

});
//server copy
ipc.on('copy', function (event, arg) {
  let where = path.dirname(arg.to);
  if (!fs.existsSync(where)) {
    fs.mkdirSync(where, { recursive: true }, (err) => { console.error(err) });
  }
  fs.copyFile(arg.from, arg.to, () => event.returnValue = { 'success': 'yes' });

});
//server get
ipc.on('get', function (event, arg) {  
    fs.readFile(arg.path,  function(err, data) { 
      if (err) {console.error(err); event.returnValue = {"success" : "no"}};
      let r = data;
      try{
        r = JSON.parse(data);
      }catch{
        //do nothing
      }
      event.returnValue = r;     
    });
});
//server get-as-text
ipc.on('get-as-text', function (event, arg) {  
  fs.readFile(arg.path,  function(err, data) { 
    if (err) {console.error(err); event.returnValue = {"success" : "no"}};
    let r = data.toString();    
    event.returnValue = r;     
  });
});




//end server logic

function createWindow() {
  // Создаем окно браузера.
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // и загрузить index.html приложения.
  win.loadFile('src/index.html');
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Для приложений и строки меню в macOS является обычным делом оставаться
  // активными до тех пор, пока пользователь не выйдет окончательно используя Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', () => {
  // На MacOS обычно пересоздают окно в приложении,
  // после того, как на иконку в доке нажали и других открытых окон нету.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
});