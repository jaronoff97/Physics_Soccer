// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
server.listen(port, function() {
    console.log('Server listening at port %d', port);
});
// Routing
app.use(express.static(__dirname + '/public'));
// Chatroom
var numUsers = 0;
var players = [];
var team1 = true;
function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}
var addUserToTeam = function(username) {
    var user = {
        "name": username,
        "xpos": 0,
        "ypos": 0,
        "charge": "",
        "id": guidGenerator()
    };
    if (team1==true) {
        user["xpos"] = 100;
        user["ypos"] = players.length * 50 + 50;
        user["charge"] = "Positive";
        players.push(user);
        team1=false;
    } else {
        user["xpos"] = 600;
        user["ypos"] = players.length * 50 + 50;
        user["charge"] = "Negative";
        players.push(user);
        team1=true;
    }
    return (user);
}
function findIndexOfUser(id){
    for (var i = 0; i < players.length; i++) {
        if(players[i]["id"]==id){
            return(i);
        }
    }
    return(-1);
}
io.on('connection', function(socket) {
    var addedUser = false;
    // when the client emits 'new message', this listens and executes
    socket.on('new message', function(data) {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });
    /*socket.on('move', function(data){
        var idOfUser = findIndexOfUser(data.id);
        players[idOfUser]["xpos"]=data.xpos;
        players[idOfUser]["ypos"]=data.ypos;
        socket.broadcast.emit('move user',{
            id:idOfUser,
            xpos: players[idOfUser]["xpos"],
            ypos:players[idOfUser]["ypos"]
        });
    });*/
    // when the client emits 'add user', this listens and executes
    socket.on('add user', function(username) {
        if (addedUser) return;
        // we store the username in the socket session for this client
        socket.username = username;
        var user = addUserToTeam(username);
        socket.emit('give position', {
            xpos: user["xpos"],
            ypos: user["ypos"],
            charge: user["charge"],
            id: user["id"],
            users: players.slice(0,players.length-1)
        })
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers,
            user: user
        });
    });
    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
        if (addedUser) {
            --numUsers;
            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});