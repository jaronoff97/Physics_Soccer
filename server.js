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
var ballX = 350,
    ballY = 300,
    ballDx = 1,
    ballDy = 1;
var canvas_width = 700,
    canvas_height = 700;
var team1 = true;

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
var addUserToTeam = function(username) {
    var user = {
        "name": username,
        "xpos": 0,
        "ypos": 0,
        "charge": "",
        "dy": 5,
        "dx": 5,
        "id": guid()
    };
    if (team1 == true) {
        user["xpos"] = 100;
        user["ypos"] = players.length * 50 + 50;
        user["charge"] = "Positive";
        players.push(user);
        team1 = false;
    } else {
        user["xpos"] = 600;
        user["ypos"] = players.length * 50 + 50;
        user["charge"] = "Negative";
        players.push(user);
        team1 = true;
    }
    return (user);
}

function findIndexOfUser(id) {
    for (var i = 0; i < players.length; i++) {
        if (players[i]["id"] == id) {
            return (i);
        }
    }
    return (-1);
}
io.on('connection', function(socket) {
    var addedUser = false;
    // when the client emits 'new message', this listens and executes
    socket.on('key_state', function(data) {
        var indexOfUser = findIndexOfUser(socket.client_id);
        if (indexOfUser != -1) {
            players[indexOfUser]["ypos"] = data.keystate["Up"] ? players[indexOfUser]["ypos"] - players[indexOfUser]["dy"] : players[indexOfUser]["ypos"];
            players[indexOfUser]["ypos"] = data.keystate["Down"] ? players[indexOfUser]["ypos"] + players[indexOfUser]["dy"] : players[indexOfUser]["ypos"];
            players[indexOfUser]["xpos"] = data.keystate["Left"] ? players[indexOfUser]["xpos"] - players[indexOfUser]["dx"] : players[indexOfUser]["xpos"];
            players[indexOfUser]["xpos"] = data.keystate["Right"] ? players[indexOfUser]["xpos"] + players[indexOfUser]["dx"] : players[indexOfUser]["xpos"];
            // we tell the client to execute 'new message'
            emitPositions();
        }
    });
    // when the client emits 'add user', this listens and executes
    socket.on('add user', function(username) {
        if (addedUser) return;
        // we store the username in the socket session for this client
        socket.username = username;
        var user = addUserToTeam(username);
        console.log(user);
        var idToGive = user["id"];
        socket.client_id = idToGive;
        socket.team = user.charge == "Positive" ? 1 : 2;
        socket.emit('give position', {
            id: idToGive,
            users: players
        })
        socket.emit('give ball position', {
                xpos: ballX,
                ypos: ballY
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
    var emitPositions = function(){
        for (var i = 0; i < players.length; i++) {
            socket.emit('move user', {
                id: players[i]["id"],
                xpos: players[i]["xpos"],
                ypos: players[i]["ypos"]
            });
            socket.broadcast.emit('move user', {
                id: players[i]["id"],
                xpos: players[i]["xpos"],
                ypos: players[i]["ypos"]
            });
        }
    }
    var moveBall = function(){
        ballX += ballDx;
        if (ballX > canvas_width || ballX < 0) {
            ballDx *= -1;
        }
        ballY += ballDy;
        if (ballY > canvas_height || ballY < 0) {
            ballDy *= -1;
        }
        socket.emit('move ball', {
            xpos: ballX,
            ypos: ballY
        });
    }
    setInterval(moveBall, 10);
    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
        if (addedUser) {
            --numUsers;
            players.splice(findIndexOfUser(socket.client_id), 1);
            team1 = socket.team==1 ? true: false;
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers,
                id: socket.client_id
            });
        }
    });
});