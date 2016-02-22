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
var team1 = [];
var team2 = [];
var addUserToTeam = function(username) {
    var user = {
        "name": username,
        "xpos": 0,
        "ypos": 0,
        "charge": ""
    };
    if (team1.length == team2.length) {
        user["xpos"] = 100;
        user["ypos"] = team1.length * 50 + 50;
        user["charge"] = "Positive";
        team1.push(user);
    } else if (team1.length > team2.length) {
        user["xpos"] = 600;
        user["ypos"] = team2.length * 50 + 50;
        user["charge"] = "Positive";
        team2.push(user);
    }
    return (user);
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
    // when the client emits 'add user', this listens and executes
    socket.on('add user', function(username) {
        if (addedUser) return;
        // we store the username in the socket session for this client
        socket.username = username;
        var user = addUserToTeam(username);
        socket.emit('give position', {
            xpos: user["xpos"],
            ypos: user["ypos"],
            charge: user["charge"]
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