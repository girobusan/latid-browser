const { shell, app, BrowserWindow, Menu, BrowserView, MenuItem, dialog } = require('electron');
const ipc = require('electron').ipcMain;
const { showInfo , hideInfo} = require('./info.js');
//const fs = require('fs');
const path = require("path");
const child_process = require('child_process');
var browser; //browser view

// console.log("Dialog in main" , dialog)

//const { app } = require('electron');

if (require('electron-squirrel-startup')) return app.quit();


var serv = require("./latid-server");
const { isPrimitive } = require('util');
var win;
var menu;
var pubfunction = function () {
  console.log("Default publish command");
}
//end server logic

function createWindow() {
  // Создаем окно браузера.
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#00A1AB',
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      sandbox: false,
      enableRemoteModule: true,
      contextIsolation: false,
        }
    
  });


  // и загрузить index.html приложения.
  win.loadFile('src/index.html');
  //build menu
  menu = Menu.buildFromTemplate([
    {
      label: 'Browser',
      submenu: [
        {
          label: 'Site chooser',
          click() { if (browser) { 
          win.removeBrowserView(browser) ; 
          browser = null;
          serv.stop();
          // browser.destroy() ; 
          }; 
          win.webContents.send('status' , {text: ""});
          win.webContents.send('title' , {text: ""});
          },
          accelerator: 'CmdOrCtrl+R'

        },
        {
          label: 'Open developer tools',
          click() { browser ? browser.webContents.openDevTools() : win.webContents.openDevTools(); },
          accelerator: 'CmdOrCtrl+T'

        },
        {
          label: 'App developer tools (window)',
          click() { win.webContents.openDevTools({mode: "detach"}); },
          accelerator: 'CmdOrCtrl+D'

        },
        {
          label: 'About',
          click() {showInfo(win)},
          // accelerator: 'CmdOrCtrl+D'

        },
        { type: 'separator' },
        {
          label: 'Quit', click() {
            serv.stop();
            app.quit()
          },
          accelerator: 'CmdOrCtrl+Q'
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { type: 'separator' },
        { label: "Run publish command", accelerator: "CmdOrCtrl+P", id: "publish", click() { pubfunction() } },        
      ]
    }
  ])
  Menu.setApplicationMenu(menu);
  //menu.
}
//starting!
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
})

ipc.on('hide_info' , function(msg){
    hideInfo();
})

ipc.on('select_site_dir' , function(msg){
  
       let r = dialog.showOpenDialogSync({
        properties: ['openDirectory']
      });
       // console.log(msg);
      msg.returnValue = r ? r[0] : "";
})
;

ipc.on('show_dialog' , function(msg,arg){
   console.log("Show dialog...");
   dialog.showMessageBox(win, 
     {
        message: arg.text || "No text specified",
        type: arg.type || "info",
        title: arg.title || "info",
        detail: arg.detail || "",

         
     })
})

ipc.on('publish', function (event, arg) {
  let pm = menu.getMenuItemById("publish");

  if (arg.enabled) {
    console.log("Publish enabled");
    pm.enabled = true;
    pubfunction = function () {
      let finfn = () => browser.webContents.executeJavaScript("window.l4.messages.publish_end()").catch(e => console.error(e));
      browser.webContents.executeJavaScript("window.l4.messages.publish_start()").catch(e => console.error(e));
      console.log("Prepare to execute", arg.command, "at", arg.cwd);
      let args = arg.args ? arg.args : [];
      if (!Array.isArray(args)) {
        args = [args];
      }
      args = args.join(" ");
      child_process.exec(arg.command +" "+ args, { cwd: arg.cwd } ,
        (error,stdout,stderr)=>{
          if(error){
             console.error("Publish error" , error);
             return;

          }
          finfn();
          console.info(stdout,stderr);
        }
      );
    }

  } else {
    console.log("Publish disabled")
    pm.enabled = false;
  }
});



ipc.on("browse-stop", function (e, a) {
  console.log("hide browser")
  if (browser) {
    browser.setBounds({x: 0 , y: 0 , "width" : 10 , "height" : 10});
  }
})


ipc.on('browse', function (e, a) {
  let winb = win.getBounds();  
  if (!browser) {
    browser = new BrowserView({
      x: 0,
      y: 24,
      height: 600,
      width: 800,
      frame: false,
      transparent: false,
      backgroundColor: '#ffffff',
      titleBarStyle: 'hidden',
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        sandbox: false,
        enableRemoteModule: true

      }
    });

    browser.setAutoResize({
      "horizontal": true,
      "vertical": true,
      "y": false,

    });

    browser.webContents.on("did-navigate-in-page" , function(e , u){    
      let uri = u.substring(u.lastIndexOf('#')+2);
      win.webContents.send('status' , {text: uri , class: 'page_uri'});      
    });

    browser.webContents.on("page-title-updated" , function(e , t){         
      win.webContents.send('title' , {text: t });      
    });

    browser.webContents.on("destroy" , function(){    
      win.webContents.send('status' , {text: null });
      win.webContents.send('title' , {text: null });
    });


    //attach to window
    win.setBrowserView(browser);   
    //browser.show();
    browser.setBounds({ x: 0, y: 32, width: winb.width, height: winb.height - 32 });
    win.on("resize", function () {
      if (!browser) {
        return;
      }
      
      let nb = win.getBounds();
      browser.setBounds({ x: 0, y: 32, width: nb.width, height: nb.height - 32 });
      
    })
  }
  browser.setBackgroundColor("#ffffff");
  browser.webContents.loadURL(a.url);
  

  
});

