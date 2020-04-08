#!/usr/bin/env node

let log=(message,type)=>{
	$('<div/>',{class:type}).html(message).appendTo($('#log'));
}

let socket;

let wsConnect=()=>{
	socket = new WebSocket('ws://localhost:8080/');
	log('connecting to socket')

	socket.onopen=()=>{
		log('websocket opened');
		chkCmd();
	}

	socket.onclose=e=>{
		console.log('websocket closed');
		console.log(e);
		chkCmd();
	};

	socket.onerror=(e)=>{
		console.log('error');
		console.log(e);
		chkCmd();
	};

	socket.onmessage = e=>{
		let message=JSON.parse(e.data);
		console.log(message);
		switch(message.type){
		case 'message':
			log(message.data);
		break;
		case 'result':
			log(message.data.command+' '+(message.data.rowCount==null?'':message.data.rowCount));
			message.data.rows.forEach(r=>log(JSON.stringify(r)));
		break;
		case 'error':
			log(message.data,'err');
		break;
		case 'notice':
			log('notice: '+message.data.message,'notice');
		break;
		}
	};
}

let wsDisconnect=()=>{
	if(socket){
		socket.close();
		socket=undefined;
	}
}

$('button').click(
	(e)=>{
		let msg;
		switch(e.target.id){
		case 'ws-stop':
			msg='stop';
		break;
		case 'ws-connect':
			wsConnect()
		break;
		case 'ws-disconnect':
			wsDisconnect()
		break;
		case 'connect':
			msg={type:'connect',data:{connectionString:$('#connect-string').val()}};
		break;
		case 'disconnect':
			msg={type:'disconnect'};
		break;
		case 'run':
			msg={type:'execute',data:$('#sql').val()};
		}
		if (msg){
			if(socket) {
				socket.send(typeof(msg)==='object'?JSON.stringify(msg):msg);
			}
			else{
				log('not connected to socket');
			}
		}
		chkCmd()
	}
);

let chkCmd=()=>{
	let isConnected=(socket!==undefined)&&(socket.readyState==WebSocket.OPEN);
	$('#connected').prop("checked",isConnected);
	$('#ws-stop').prop('disabled',!isConnected);
	$('#ws-connect').prop('disabled',isConnected);
	$('#ws-disconnect').prop('disabled',!isConnected);
	
	$('#connect').prop('disabled',!isConnected);
	$('#disconnect').prop('disabled',!isConnected);
	$('#run').prop('disabled',!isConnected);
}

//handlers
$(window).on('load',chkCmd);
$(window).on('unload',wsDisconnect);
