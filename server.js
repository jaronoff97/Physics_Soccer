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
var team1score = 0,
    team2score = 0;
var numUsers = 0;
var players = [];
var canvas_width = 1000,
    canvas_height = 700;
var team1 = true;
var max_speed = 6;
var k = (9 * Math.pow(10, 9));
var ball = {
    xpos: 350,
    ypos: 300,
    dx: 0,
    dy: 0,
    aX: 0,
    aY: 0,
    width: 50,
    height: 50,
    mass: (9.1 * Math.pow(10, -31))
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
    ball.dx += ball.aX;
    ball.xpos += ball.dx;
    ball.dy += ball.aY;
    ball.ypos += ball.dy;
    if(ball.ypos<0 || ball.ypos>canvas_height){
        ball.dy*=-1;
    }
    var netAX = 0,
        netAY = 0;
    for (var i = players.length - 1; i >= 0; i--) {
        var force = forceOnBall(players[i]);
        netAX += (force.x / (ball.mass * 100));
        netAY += ((force.y * 10) / (ball.mass));
    }
    ball.aX = netAX;
    ball.aY = netAY;
    checkGoalIntersections();
}
function checkGoalIntersections() {
    function rectangle_collision(x_1, y_1, width_1, height_1, x_2, y_2, width_2, height_2) {
        return !(x_1 > x_2 + width_2 || x_1 + width_1 < x_2 || y_1 > y_2 + height_2 || y_1 + height_1 < y_2)
    }
    var reset = false;
    if ((rectangle_collision(ball.xpos, ball.ypos, ball.width, ball.height, negativeGoal.xpos, negativeGoal.ypos, negativeGoal.width, negativeGoal.height))) {
        team1score++;
        reset = true;
    }
    if ((rectangle_collision(ball.xpos, ball.ypos, ball.width, ball.height, positiveGoal.xpos, positiveGoal.ypos, positiveGoal.width, positiveGoal.height))) {
        team2score++;
        reset = true;
    }
    if (reset == true) {
        ball.xpos = canvas_width / 2;
        ball.ypos = canvas_height / 2;
        ball.dx = ball.dy = ball.aX = ball.aY = 0;
        for (var i = players.length - 1; i >= 0; i--) {
            players[i].xpos = players[i].charge == "Positive" ? 50 : canvas_width - 50;
            players[i].ypos = players.length * 50 + 50;
        }
        io.emit('score', {
            team1: team1score,
            team2: team2score
        });
    }
}
function forceOnBall(player) {
    var density = (player.charge_vector / player.height);
    var r = Math.sqrt((Math.pow(player.xpos - ball.xpos, 2)) + (Math.pow((player.ypos + (player.height / 2)) - ball.ypos, 2)));
    var subInterval = (Math.pow(10, -3));
    var xIntegral = function(x, l) {
        var total = 0;
        for (var ds = (-l / 2); ds <= (l / 2); ds += (subInterval)) {
            total += (1) / (Math.pow(((Math.pow(x, 2) + Math.pow(ds, 2))), (3 / 2)));
        }
        return (total);
    }
    var yIntegral = function(y, l) {
        var total = 0;
        for (var ds = (-l / 2); ds <= (l / 2); ds += (subInterval)) {
            total += (ds) / (Math.pow(((Math.pow(y, 2) + Math.pow(ds, 2))), (3 / 2)));
        }
        return (total);
    }
    var force = {
        x: (xIntegral(r, player.height) * k * density * player.xpos * player.charge_vector * (ball.xpos > player.xpos ? 1 : -1)),
        y: (yIntegral(r, player.height) * k * density * player.ypos * player.charge_vector * (ball.ypos > player.ypos ? -1 : 1))
    }
    return (force);
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
        height: 75,
        charge_vector: (1.6 * Math.pow(10, -19)),
        id: guid()
    };
    user.charge = team1 ? "Positive" : "Negative";
    team1 = (!team1);
    user.xpos = user.charge == "Positive" ? 50 : canvas_width - 50;
    user.ypos = players.length * 50 + 50;
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
            var boundsx = players[indexOfUser].charge == "Positive" ? canvas_width*4 / 10: canvas_width * 6 / 10;
            var leftSide = boundsx<canvas_width/2 ? true : false;
            if (leftSide && players[indexOfUser].xpos >= boundsx) players[indexOfUser].xpos = boundsx;
            if (!leftSide && players[indexOfUser].xpos <= boundsx) players[indexOfUser].xpos = boundsx;
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
