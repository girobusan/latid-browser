var serv = require( "./latid-server");
const process = require('process');
console.log("Server process")
process.on("message" ,  function(e){
    console.log("I've got" , e);
    serv.stop();
    serv.configure({root: e.root});
    serv.start();

});
