var app = require('http').createServer()  
var io = require('socket.io').listen(app, {origins: '*:*'});
  
// get port
var port = process.env.PORT || 80;
app.listen(port);  

var addr = app.address();
console.log('app listening on http://' + addr.address + ':' + addr.port);    

// assuming io is the Socket.IO server object
io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file
io.set('log level', 1);                    // reduce logging

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  //io.set("polling duration", 10); 
  //io.set("close timeout", 10);   
  io.set('log', false);
});

var game_channel = require('./GameChannel')(io.of("/game"));
var game_channel = require('./LobbyChannel')(io.of("/lobby"));