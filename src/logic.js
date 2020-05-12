const fs = require('fs');
const path = require("path");
const { dialog } = require('electron').remote;
const electron = require("electron")
const ipc = electron.ipcRenderer;
const recursive = require("recursive-readdir");


window.localFS = {
  "type": "latid-browser"
};

window.old_fetch = fetch;

fetch = function(){
  console.log("MY FETCH!" , arguments);
  return old_fetch.apply(null , arguments);
};


//first steps, hiding excess symbols
(function () {

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



  var readFileTextPromise = function (fp) {
    //console.log("READ TEXT FILE" , fp);
    return new Promise(function (ok, notOk) {
      fs.readFile(fp, function (err, data) {
        if (err) {
          notOk(err)
        } else {
          try {
            let r = data.toString();
            ok(r);
          } catch{
            ok(data)
          }
          //ok(JSON.parse(data))
        }
      })
    })
  }
  //storage
  /*
 //storage
    let store = window.localStorage;
    //chek
    window.storeCheck = function (v) {
      if (!store.getItem(v)) {
        store.setItem(v, v);
      }
    }


  */
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
  var createServer = function (root) {
    console.log("Setting up local FS");
    console.log("Local FS server at", root);

    //process.chdir(root);
    window.localFS.root = root; //DEPRECATED --> window.localFS.server.root
    var makepath = function (p) {
      return path.join(root, p);
    }

    return new function () {
      this.root = root;
      var my = this;
      //refreshSrcList 
      this.refreshSrcList = function () {
        console.log("Refresh Src List is not implemented");
      }

      //copy
      this.copy = function (f, t) {
        return new Promise(function (res, rej) {
          res(ipc.send("copy", { from: makepath(f), to: makepath(t) }));
        })
      }
      //get
      this.get = function (p) {
        return new Promise(function (res, rej) {
          let result = ipc.sendSync("get", { path: makepath(p) });
          console.log("Event returned", p, result);
          res(result);
        })
      }
      //getAsText
      this.getAsText = function (p) {
        return readFileTextPromise(makepath(p));
      }

      this.getAsTextSync = function (p) {
        return fs.readFileSync(makepath(p)).toString();
      }

      //list
      this.list = function (p) {
        //return Promise =>[{details:{path=.....}, ... }]
        let sp = makepath(p);
        let spl = sp.length;
        return new Promise(
          function (res, rej) {
            recursive(sp, function (err, files) {
              if (err) {
                rej(err);
              }
              let rf = files.map(e => e.substring(spl)).filter(a => !a.startsWith("_")).map(w => ({ "path": w }));
              res({ details: rf });

            })
          }
        )
      }
      //init
      this.init = function () {
        return new Promise(
          function (res, rej) {
            res(my)
          }
        )
      }
      //write
      this.write = function (c, p) {
        return new Promise(function (res, rej) {
          res(ipc.sendSync("write", { path: makepath(p), content: c }));
        })
      }
      //writeOutput
      //-->return this.write(cnt , Util.gluePath(l4.settings.output.dir , pth));
    }//server fn ends
    //h
  }//it was make server

  var loadSite = function (locp) {
    console.log("Loading site", locp);
    //EXPERIMENTUM
    //history.pushState(locp , null , locp)
    //check dir
    if (fs.existsSync(locp) && fs.existsSync(path.join(locp, "_config/settings.json"))) {
      //get site info
      try {
        var settings = JSON.parse(fs.readFileSync(path.join(locp, "_config/settings.json")));
        console.log(settings);
        var title = settings.site.title;
        console.log("Site is", title, "at", locp)
      } catch (err) {
        console.error("can not load settings from", path.join(locp, "_config/settings.json"));
        console.error(err);
        return false
      }
      //check storage
      store.check(title, locp);
      //create server
      window.localFS.server = createServer(locp);
      let preload = document.createElement("div");
      preload.id = "preload";
      document.body.appendChild(preload);
      addScript(path.join(window.localFS.root, "_system/scripts/l4.js"));
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
    })
  })
}());

