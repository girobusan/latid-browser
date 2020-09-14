var serv = require( "./latid-server");

process.on('message', (msg) => {
    console.log('Message from parent:', msg);
    serv.configure(msg);
    serv.start();
  });