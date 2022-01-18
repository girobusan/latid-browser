const { BrowserWindow } = require('electron');

function showInfo(parentWin){
  console.info("Showing info");
  const modal = new BrowserWindow({
       // parent: parentWin,
       modal: true,
       backgroundColor: '#00A1AB',
       show: false,
       width: 600,
       height: 400,
       useContentSize: true,
       resizable: false,
       minimizable: false,
       maximizable: false,
       alwaysOnTop: true,
       fullscreenable: false,
       skipTaskbar: true,
       autoHideMenuBar: true,

       webPreferences:{
         nodeIntegration: true,
         nodeIntegrationInWorker: true,
         sandbox: false,
         enableRemoteModule: true,
         contextIsolation: false,
       }
       

  });

  modal.setMenuBarVisibility(false);
  modal.loadFile('src/info.html');

  modal.once('ready-to-show', () => {
    modal.show()
  });

}

module.exports = {'showInfo' : showInfo}
