// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io', {
    rememberTransport: false,
    transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling']
})(server);
var port = process.env.PORT || 3000;
server.listen(port, function() {
    console.log('Server listening at port %d', port);
});
// Routing
app.use(express.static(__dirname + '/public'));
// Chatroom
var numUsers = 0;
var players = [];
var canvas_width = 1000,
    canvas_height = 700;
var team1 = true;
var max_speed = 3;
var ball = {
    xpos: 350,
    ypos: 300,
    dx: (Math.random() * max_speed) + 1,
    dy: (Math.random() * max_speed) + 1,
    width: 50,
    height: 50
}
var positiveGoal = {
    xpos: 0,
    ypos: 0,
    width: 10,
    height: canvas_height
};
var negativeGoal = {
    xpos: canvas_width - 10,
    ypos: 0,
    width: 10,
    height: canvas_height
};
var moveBall = function() {
    ball.xpos += ball.dx;
    if (ball.xpos > canvas_width || ball.xpos < 0) {
        ball.dx *= -1;
    }
    ball.ypos += ball.dy;
    if (ball.ypos > canvas_height || ball.ypos < 0) {
        ball.dy *= -1;
    }
    checkGoalIntersections();
}

function checkGoalIntersections() {
    function rectangle_collision(x_1, y_1, width_1, height_1, x_2, y_2, width_2, height_2) {
        return !(x_1 > x_2 + width_2 || x_1 + width_1 < x_2 || y_1 > y_2 + height_2 || y_1 + height_1 < y_2)
    }
    if (rectangle_collision(ball.xpos, ball.ypos, ball.width, ball.height, negativeGoal.xpos, negativeGoal.ypos, negativeGoal.width, negativeGoal.height)) {
        ball.xpos = canvas_width / 2;
        ball.ypos = canvas_height / 2;
        ball.dx = ((Math.random() * max_speed) + 1) * -1;
        ball.dy = ((Math.random() * max_speed) + 1) * -1;
    }
    if (rectangle_collision(ball.xpos, ball.ypos, ball.width, ball.height, positiveGoal.xpos, positiveGoal.ypos, positiveGoal.width, positiveGoal.height)) {
        ball.xpos = canvas_width / 2;
        ball.ypos = canvas_height / 2;
        ball.dx = ((Math.random() * max_speed) + 1);
        ball.dy = ((Math.random() * max_speed) + 1);
    }
}

function findIndexOfUser(id) {
    for (var i = 0; i < players.length; i++) {
        if (players[i].id == id) {
            return (i);
        }
    }
    return (-1);
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
var addUserToTeam = function(username) {
    var user = {
        name: username,
        xpos: 0,
        ypos: 0,
        charge: "",
        dy: max_speed + 2,
        dx: max_speed + 2,
        id: guid()
    };
    if (team1 == true) {
        user.xpos = 100;
        user.ypos = players.length * 50 + 50;
        user.charge = "Positive";
        team1 = false;
    } else {
        user.xpos = 600;
        user.ypos = players.length * 50 + 50;
        user.charge = "Negative";
        team1 = true;
    }
    players.push(user);
    return (user);
}
var emitPositions = function() {
    for (var i = 0; i < players.length; i++) {
        io.emit('move user', {
            id: players[i].id,
            xpos: players[i].xpos,
            ypos: players[i].ypos
        });
    }
}
setInterval(function() {
    io.emit('request position');
    emitPositions();
    moveBall();
    io.emit('move ball', {
        xpos: ball.xpos,
        ypos: ball.ypos
    });
}, 10)
io.on('connection', function(socket) {
    var addedUser = false;
    // when the client emits 'new message', this listens and executes
    socket.on('key_state', function(data) {
        var indexOfUser = findIndexOfUser(socket.client_id);
        if (indexOfUser != -1) {
            players[indexOfUser].ypos = (data.keystate.Up && players[indexOfUser].ypos > 0) ? players[indexOfUser].ypos - players[indexOfUser].dy : players[indexOfUser].ypos;
            players[indexOfUser].ypos = (data.keystate.Down && players[indexOfUser].ypos < canvas_height) ? players[indexOfUser].ypos + players[indexOfUser].dy : players[indexOfUser].ypos;
            players[indexOfUser].xpos = (data.keystate.Left && players[indexOfUser].xpos > 0) ? players[indexOfUser].xpos - players[indexOfUser].dx : players[indexOfUser].xpos;
            players[indexOfUser].xpos = (data.keystate.Right && players[indexOfUser].xpos < canvas_width) ? players[indexOfUser].xpos + players[indexOfUser].dx : players[indexOfUser].xpos;
        }
    });
    // when the client emits 'add user', this listens and executes
    socket.on('add user', function(username) {
        if (addedUser) return;
        // we store the username in the socket session for this client
        socket.username = username;
        var user = addUserToTeam(username);
        console.log(user);
        socket.client_id = user.id;
        socket.team = user.charge == "Positive" ? 1 : 2;
        socket.emit('give position', {
                id: user.id,
                users: players,
                nGoal: negativeGoal,
                pGoal: positiveGoal,
                xpos: ball.xpos,
                ypos: ball.ypos
            })
            ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers
        });
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers,
            user: user
        });
    });
    socket.on('disconnect', function() {
        if (addedUser) {
            --numUsers;
            players.splice(findIndexOfUser(socket.client_id), 1);
            team1 = socket.team == 1 ? true : false;
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers,
                id: socket.client_id
            });
        }
    });
});
