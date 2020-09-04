const fsp = require('fs').promises;
const fs = require('fs');
const path = require("path");
var walk = require('walk');
const querystring = require('querystring');
//function (res, point , params , method)
/**
 * @param {String} command Command name
 * @param {Object|String} body Responce body
 * @param {Boolean} success sucessful or not
 */

var config = {
    //api_root: "api",
    root: process.cwd(),
    //port: 9999,
    //host: "localhost",
}

function makeJSONresponce(command, body, success) {
    return JSON.stringify({
        command: command,
        status: success === false ? "failure" : "success",
        details: body
    })
}

const APIHandlers = {
    //PING
    areyouthere: function (params, callb) {
        callb("Latid server");
    },
    //COPY
    copy: function (params, callb) {
        //params.from -> params.to
        let fr = path.join(config.root, params.from);
        let t = path.join(config.root, params.to);
        //check if from exists and is file
        if (fs.existsSync(fr) && fs.lstatSync(fr).isFile()) {
            //make dirs for copying
            let pathparts = path.parse(t);
            fsp.mkdir(path.join(pathparts.root, pathparts.dir), { recursive: true })
                //copy
                .then(
                    fsp.copyFile(fr, t)
                )
                //send responce
                .then(callb("copied"))
                .catch(err => callb(false, "Error: " + err))
        } else {
            callb(false, "Source file doesn't exist or is not a file");
        }
    },
    //WRITE (assuming POST) - params.
    write: function(params, callb , data){
        //console.log("POST data:" , data , "length:" , data.length);
        
        let where = path.join(config.root , Object.keys(params)[0]);
        //console.log("Write to:" , where); 
        //create dirs
        let wparsed = path.parse(where);
        fs.mkdirSync(path.join(wparsed.root , wparsed.dir) , {recursive:true} )

        fsp.writeFile(where, data, 'binary')
        .then(callb("Written"))
        .catch(err=>callb(false, "Write error: " + err))

    },
    //LIST
    list: function (params, callb) {
        let dir = path.join(config.root, Object.keys(params)[0] || "");

        function path2local(p) {
            let cut = p.substring(dir.length);
            return cut.startsWith("/") ? cut : "/" + cut;
        }

        let rez = [];
        let walker = walk.walk(dir);
        walker.on("file", (r, f, n) => { rez.push(path.join(r, f.name)); n() });
        walker.on("end", () => callb(rez.map((p) => { return { path: path2local(p) } })))
    }
}
/**
 * 
 * @param {Object} conf 
 */
function configure(conf) {
    Object.assign(config, conf);

}

/**
 * 
 * @param {Object} request  HTTP request
 * @param {Object} responce  HTTP responce
 * @param {String} point  API entry point
 * @param {Object} params  Query parameters 
 * @param {Buffer} data POST data
 */

function invoke(request, responce, point, params, data) {

    function callb(result, note) {
        if (result) {
            responce.writeHead(200);
            responce.end(makeJSONresponce(point, result, true))
        } else {
            responce.writeHead(520); //error
            responce.end(makeJSONresponce(point, note || "Can not do it (reason unknown)", false))
        }
    }

    if (APIHandlers[point]) {
        APIHandlers[point](params, callb, data || "");
    } else {
        console.error("Call to unimplemented API:", point)
        responce.writeHead(501); //error
        responce.end(makeJSONresponce(point, "Not implemented: " + point, false))
    }
}

module.exports = {
    configure: configure,
    invoke: invoke    
}