var serv = require( "./latid-server");
onmessage = function(e){

    serv.configure({root: e.root});
    serv.start();

}