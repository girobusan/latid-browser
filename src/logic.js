const fs = require('fs');
const path = require("path");
const { dialog } = require('electron').remote;
const electron = require("electron")
const ipc = electron.ipcRenderer;
const recursive = require("recursive-readdir");
var serv = require( "./latid-server");








//first steps, hiding excess symbols
(function () {
  ipc.send('publish' , {"status": false});
  //const browser_el = document.getElementById("browser");
  //console.log("browser" , browser_el)
  //browser_el.contentWindow.addEventListener("hashchange" , (e)=>console.log("HASH CHANGED" , e));

  //sevice functions
  var addScript = function (p) {
    let s = document.createElement("script");
    let old = document.getElementById("latid_site_script");
    if (old) {
      old.remove();
    }
    s.setAttribute("src", p);
    s.setAttribute("id", "latid_site_script")
    document.body.appendChild(s);
  }



  //sites storage
  var store = new function () {
    var s = window.localStorage;
    this.check = function (title, pth) {
      console.log("Checking sites history")
      let k = title + "@" + pth
      if (!s.getItem(k)) {
        s.setItem(k, JSON.stringify({ "title": title, "path": pth, "key": k }));
      }
    }
    this.remove = function (k) {
      s.removeItem(k)
    }

    this.items = function () {
      let r = [];
      for (let i = 0; i < s.length; i++) {
        //console.log("key" , s)
        let k = s.key(i);
        r.push(JSON.parse(s.getItem(k)));
      }
      return r;
    }

  }
  //switch to site



  //my fav function


  var loadSite = function (locp) {
    
    console.log("Loading site", locp);
    //EXPERIMENTUM
    //history.pushState(locp , null , locp)
    //check dir
    if (fs.existsSync(locp) && fs.existsSync(path.join(locp, "_config/settings.json"))) {
      //get site info
      try {
        var settings = JSON.parse(fs.readFileSync(path.join(locp, "_config/settings.json")));
        //console.log(settings);
        var title = settings.site.title;
        if(settings.publish && settings.publish.command){
          ipc.send('publish' , {"enabled": true , "command" : settings.publish.command , "cwd": locp , "args" : settings.publish.args });

        }
        console.info("Site is", title, "at", locp)
      } catch (err) {
        console.error("Can not load settings from", path.join(locp, "_config/settings.json"));
        console.error(err);
        return false
      }
      //check storage
      store.check(title , locp)
      ipc.send('server' , {"command":"start" , "root" : locp});
      console.log("go to!~");
      setTimeout( function(){
        console.info("show page...");
        ipc.send("browse" , {"url" : "http://localhost:9999" });
        //browser_el.src = "http://localhost:9999" ; 
        //browser_el.contentWindow.addEventListener("hashchange" , (e)=>console.log("HASH CHANGED" , e));
        //browser_el.contentWindow.addEventListener("click" , e=>console.log("Iframe" , eval))

        //browser_el.
        //browser_el.style.display="block" 
      }, 500);
      //let preload = document.createElement("div");
      //let prbar = document.createElement("div");
      //prbar.id = "progressbar";
      //preload.id = "preload";
      //preload.appendChild(prbar);
      //document.body.appendChild(preload);
      //addScript(path.join(locp ,  "/_system/scripts/l4.js"));
      return true;
    } else {
      console.error("Required files do not exist")
      return false
    }
  }

  window.addEventListener("DOMContentLoaded", function () {
    let saved_items_table = document.getElementById("saved_sites");
    //show already saved sites
    store.items().forEach(function (e) {
      //console.log(e);
      //row
      let row = document.createElement("div");
      row.classList.add("site");
      //run button
      let rb = document.createElement("div");
      rb.setAttribute("class", "run");
      rb.innerHTML = `<div class='part label'>${e.title}</div><div class='part path'>${e.path}</div>`;
      rb.addEventListener("click", function (evt) {
        if (!loadSite(e.path)) {
          console.error("Can not load site");
        };
      })
      row.appendChild(rb);
      //minus button
      let minus = document.createElement("div");
      minus.setAttribute("class", "store remove");
      minus.innerHTML = "×";
      minus.addEventListener("click", function (e) {
        store.remove(e.key);
        row.remove();
      });
      row.appendChild(minus);
      saved_items_table.appendChild(row);
    });
    ///-storage
    let b = document.getElementById("main_button");
    b.addEventListener("click", function () {
      let p = dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then(function (r) {
        //init server
        if (r.filePaths.length == 0) {
          return;
        }
        loadSite(r.filePaths[0]);
      }
      );
    });
    //status bar logic
    let tb = document.getElementById("toolbox");
    ipc.on('status' , function(e,a){
          tb.innerHTML = a.text || "?";

    });
  })
}());

