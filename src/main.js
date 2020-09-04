const { shell, app, BrowserWindow, Menu, MenuItem } = require('electron');
const ipc = require('electron').ipcMain;
const fs = require('fs');
const path = require("path");
var serv = require("./latid-server");
var win;


//server get-as-text
/*
ipc.on('get-as-text', function (event, arg) {  
  fs.readFile(arg.path,  function(err, data) { 
    if (err) {console.error(err); event.returnValue = {"success" : "no"}};
    let r = data.toString();    
    event.returnValue = r;     
  });
});
*/




//end server logic

function createWindow() {
  // Создаем окно браузера.
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      sandbox: false,

    }
  })

  // и загрузить index.html приложения.
  win.loadFile('src/index.html');
  win.webContents.openDevTools();
  var menu = Menu.buildFromTemplate([
    {
      label: 'Menu',
      submenu: [
        { label: 'Site chooser' ,
        click(){serv.stop() ; win.loadFile('src/index.html');},
        accelerator: 'CmdOrCtrl+R'
      
      },
      { label: 'Open developer tools' ,
      click(){win.webContents.openDevTools();},
      accelerator: 'CmdOrCtrl+T'
    
    },
        { type: 'separator' },
        {
          label: 'Quit', click() {
            app.quit()
          },
          accelerator: 'CmdOrCtrl+Q'
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu);
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

//var servworker = new Worker("server-worker.js");

ipc.on('server', function (event, arg) {
  if (arg.command == "start") {
    console.log(arg);
    serv.configure({ root: arg.root });
    //servworker.postMessage({root: arg.root});
    serv.start();
  }
})

