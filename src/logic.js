const fs = require('fs');
const path = require("path");
const { dialog } = require('electron').remote;
const electron = require("electron")
const ipc = electron.ipcRenderer;

//first steps, hiding excess symbols
(function () {
  //disable publish menu 
  ipc.send('publish', { "status": false });

  //init sites storage
  var store = new function () {
    var s = window.localStorage;
    this.check = function (title, pth) {
      //console.log("Checking sites history")
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
  //this one loads site from local path 
  var loadSite = function (locp) {

    console.log("Loading site", locp);

    if (fs.existsSync(locp) && fs.existsSync(path.join(locp, "_config/settings.json"))) {
      //get site info
      try {
        var settings = JSON.parse(fs.readFileSync(path.join(locp, "_config/settings.json")));
        //console.log(settings);
        var title = settings.site.title;
        if (settings.publish && settings.publish.command) {
          ipc.send('publish', { "enabled": true, "command": settings.publish.command, "cwd": locp, "args": settings.publish.args });

        }
        console.info("Site is", title, "at", locp)
      } catch (err) {
        console.error("Can not load settings from", path.join(locp, "_config/settings.json"));
        console.error(err);
        return false
      }
      //check storage (save if new site)
      store.check(title, locp);
      ipc.send('server', { "command": "start", "root": locp });
      console.log("go to!~");
      setTimeout(function () {
        console.info("show page...");
        ipc.send("browse", { "url": "http://localhost:9999" });

      }, 500);
      return true;
    } else {
      console.error("Required files do not exist")
      return false
    }
  }

  window.addEventListener("DOMContentLoaded", function () {
    //show saved sites
    let saved_items_table = document.getElementById("saved_sites");
    store.items().forEach(function (e) {
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
    ///button for load site from FS
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
    let tb = document.getElementById("adress");
    ipc.on('status', function (e, a) {
      //console.log("Status to" , a)
      tb.innerHTML = a.text || "Site chooser";
    });
    ipc.on('title', function (e, a) {
      //console.log("Title to" , a)
      window.document.title = a.text || "Latid";
    });
  })
}());