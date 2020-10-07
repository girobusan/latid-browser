const http = require("http");
const querystring = require('querystring');
const fsp = require('fs').promises;
const fs = require('fs');
const path = require("path");
const mime = require('mime-types');
const API  = require("./latid-server-api") ;

var config = {
    api_root: "api",
    root: process.cwd(),
    port: 9999,
    host: "localhost",
}

var server = null;


export function configure(conf) {
    //console.log("Conf" , conf)
    config = Object.assign(config, conf);
}

export function start() {
    server = http.createServer(requestListener);
    API.configure({root: config.root});
    server.listen(config.port, config.host, () => {
        console.info(`Latid server is running on http://${config.host}:${config.port}`);
    });

}

export function stop() {
    if (server) {
        console.info("Closing Latid server...")
        server.close(() => server = null);
    }
}
function concatTypedArrays(a, b) { // a, b TypedArray of same type
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}

function concatBytes(ui8a, byte) {
    var b = new Uint8Array(1);
    b[0] = byte;
    return concatTypedArrays(ui8a, b);
}

const serveFile = function (p, res) {
    let localpath = path.join(config.root, p);
    //if it's a directory, try index.html
    if (fs.existsSync(localpath) && fs.lstatSync(localpath).isDirectory()) {
        localpath = path.join(localpath, "index.html");
    }
    console.log("Get file:", localpath)

    //if not exist, not found
    if (!fs.existsSync(localpath)) {
        res.writeHead(404);
        res.end("Not found:", localpath);
        return;
    }
    //serve
    let mtype = mime.lookup(localpath) || "application/octet-stream";
    fsp.readFile(localpath)
        .then(c => {
            res.setHeader("Content-Type", mtype);
            res.writeHead(200);
            res.end(c);
        })
};



const requestListener = function (req, res) {
    var route = req.url.split("?")[0];
    var parts = route.split(/\\|\//g).filter(e=>e);
    var params = querystring.parse(req.url.split("?")[1]);
    //console.log("Params are" , params);
    if (parts[0] != config.api_root) {
        serveFile(route, res)
    } else if (req.method == "POST") {        
        let data = new Uint8Array();
        req.on('data' , c=> data = concatTypedArrays(data , new Uint8Array(c) ));
        req.on('end' , ()=>{API.invoke(req, res, parts[1] , params , data)});        
    }else{
        API.invoke(req, res, parts[1] , params , "" )
    }
};


