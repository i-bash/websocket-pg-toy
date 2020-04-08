#!/usr/bin/env node

/**
sudo npm install -g pg websocket
 */


const http = require('http');
const WebSocketServer = require('websocket').server;
const DevApp=require('./dev-app');
const {config} =require('./config');
 
let server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

//listen ws port 
server.listen(config.wsPort, function() {
    console.log((new Date()) + ' Server is listening on port '+config.wsPort);
});

//ws server
wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: true
});

//process ws request
wsServer.on('connect', function(wsConnection) {

    console.log((new Date()) + ' Accepted client connection from ' + wsConnection.remoteAddress);
	//create instance of devApp
	let devApp=new DevApp(wsConnection);
	
    //function to send ws message to client
    wsConnection.sendMessage=(type,data)=>{
		let msg=JSON.stringify({type:type,data:data});
		console.log((new Date()) + ' Sending message to client: '+msg);
		wsConnection.send(msg);
	}
	
	//handle ws message from dev app
    wsConnection.on('message', function(message) {
        if (message.type !== 'utf8') {
			console.log((new Date()) + ' Unknown message type '+message.type);
			return;
		}
		console.log((new Date()) + ' Received Message: ' + message.utf8Data);
		if(message.utf8Data==='stop'){
			server.close()
			console.log((new Date()) + ' Stopped listener, exiting');
			process.exit()
		}
		else{
			try{
				appMessage=JSON.parse(message.utf8Data);
			}
			catch(e){
				console.log((new Date()) + ' Error parsing json message:');
				console.log(e);
				return;
			}
			devApp.doAction(appMessage);
		}
    });
    
    //handle ws close
    wsConnection.on('close', function(reasonCode, description) {
		devApp.doAction({type:'disconnect'});
        console.log((new Date()) + ' Client ' + wsConnection.remoteAddress + ' disconnected.');
    });
});
