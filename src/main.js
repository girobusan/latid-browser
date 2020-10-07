const { shell, app, BrowserWindow, Menu, MenuItem } = require('electron');
const ipc = require('electron').ipcMain;
const fs = require('fs');
const path = require("path");
const child_process = require('child_process');

//const { app } = require('electron');

if (require('electron-squirrel-startup')) return app.quit();


var serv = require("./latid-server");
var win;
var menu;
var pubfunction = function(){
  console.log("Default publish command");
}
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
  });

 

  // и загрузить index.html приложения.
  win.loadFile('src/index.html');
  //win.webContents.openDevTools();
  menu = Menu.buildFromTemplate([
    {
      label: 'Latid browser',
      submenu: [
        { label: 'Site chooser' ,
        click(){win.loadFile('src/index.html');},
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
    },
    {
      label: "Edit",
      submenu: [
          //{ label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
          //{ label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
         // { type: "separator" },
          { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
          { type: 'separator' },
          { label: "Run publish command", accelerator: "CmdOrCtrl+P", id: "publish" , click(){pubfunction()} },

          //{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]}
  ])
  Menu.setApplicationMenu(menu);
  //menu.
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
//setup server thread

ipc.on('server', function (event, arg) {
  if (arg.command == "start") {
    console.log(arg);
    //servt.send({ root: arg.root });
    //servworker.postMessage({root: arg.root});
    serv.stop();
    serv.configure(arg);
    serv.start();
  }
});
ipc.on('publish', function (event, arg) {
  let pm = menu.getMenuItemById("publish");
  
  if (arg.enabled) {
    console.log("Publish enabled");
    pm.enabled = true;
    pubfunction = function(){
      let finfn = ()=> win.webContents.executeJavaScript("window.l4.messages.publish_end()").catch(e=>console.error(e));

      win.webContents.executeJavaScript("window.l4.messages.publish_start()").catch(e=>console.error(e));
      console.log("Prepare to execute" , arg.command , "at" , arg.cwd);
      let args = arg.args ? arg.args : [];
      if(!Array.isArray(args)){
        args = [args];
            }
      let pp = child_process.spawn(arg.command , args, {cwd: arg.cwd}) ;
      pp.on("exit" , finfn);
      pp.on("close" , finfn);
      pp.on("error" , (e)=>console.error("error" , e))
    }
    
  }else{
    console.log("Publish disabled")
    pm.enabled = false;
  }
})

