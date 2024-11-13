const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
	cors: {
	  origin: "*",  // Hoặc giới hạn bằng tên miền cụ thể.
	  methods: "*"
	}
  });
const { v4: uuidV4 } = require('uuid');
const userS = [], userI = [];
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
const path = require('path');

const userList = [];

 
app.use('/peerjs', peerServer);



app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*"); // Allow requests from any origin
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	next();
  });


app.get('/', (req, res) =>{
	res.redirect(`/${uuidV4()}`); 
 })

 app.get('/home', (req, res) =>{
	res.render('home');  //send uuid to client address bar 
 })

 // load file khi chạy trên web
//  app.get('/home', (req, res) => {
//     res.sendFile(path.join(__dirname, 'views', 'home.html'));  // Gửi file home.html từ thư mục views
// });

 app.get('/test', (req, res) =>{
	res.render('test');  //send uuid to client address bar 
 })

app.get('/:room', (req, res) =>{
	let addRoomId = req.params.room;
    console.log(addRoomId);
	res.render('room',{roomId: `${addRoomId}` }); //get id from address bar and send to ejs
})

io.on('connect', socket =>{

	console.log('New user connected:', socket.id);

	socket.on('test', () => {
		console.log("Testtttt");
	});
	
	socket.on('join-room',(roomId, userId, username) =>{
		let user = {userId, username};
		userList.push(user);

		socket.emit('ONLINE_LIST', userList);
	
		userS.push(socket.id);
		userI.push(userId);

		socket.on('is-sharing', (isSharing, stream) => {
			console.log(isSharing);
			if(isSharing ==true){
				socket.broadcast.to(roomId).emit('USER_SHARING',isSharing);
			}else{
				socket.broadcast.to(roomId).emit('USER_STOP_SHARING',isSharing);
			}
		})

		//console.log("room Id:- " + roomId,"userId:- "+ userId);    //userId mean new user 
		
		//join Room
		socket.userId = user.userId;
		console.log("room Id:- " + roomId,"userId:- "+ userId);    //userId mean new user 
		socket.join(roomId);                                      //join this new user to room
		socket.broadcast.to(roomId).emit('user-connected', user); //for that we use this and emit to cliet	
		
		//Remove User
	    socket.on('removeUser', (sUser, rUser)=>{
	    	var i = userS.indexOf(rUser);
	    	if(sUser == userI[0]){
	    	  console.log("SuperUser Removed"+rUser);
	    	  socket.broadcast.to(roomId).emit('remove-User', rUser);
	    	}
	    });

	    //grid
	    socket.on('obect',(sUser, object) =>{
	    	if(sUser == userI[0]){
	    		socket.broadcast.to(roomId).emit('grid_obj', object);
	    	}
	    });

		//code to massage in roomId
		socket.on('message', (message,yourName) =>{
			io.to(roomId).emit('createMessage',message,yourName);
			
		})

	    socket.on('disconnect', () =>{
			const index = userList.findIndex(e => e.userId === socket.userId);
			userList.splice(index, 1);

	    	
	    	var i = userS.indexOf(socket.id);
	    	userS.splice(i, 1);
            socket.broadcast.to(roomId).emit('user-disconnected', userI[i], userI, socket.userId, user.username);
          
           
            userI.splice(i, 1);
	    });
	    socket.on('seruI', () =>{
	    	socket.emit('all_users_inRoom', userI);
			//console.log(userS);
		    console.log(userI);
	    });  
	})
	
})

server.listen(process.env.PORT || 3000, () =>{
	console.log("Serving port 3000")
});