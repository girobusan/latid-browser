const { BrowserWindow } = require('electron');
var modal;
function showInfo(parentWin){
  console.info("Showing info");
  modal = new BrowserWindow({
       parent: parentWin,
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
       titleBarStyle: "hidden",

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

function hideInfo(){
  if(modal){
   modal.close();
   modal = null;
  }
}



module.exports = {
'showInfo' : showInfo,
'hideInfo' : hideInfo
}
