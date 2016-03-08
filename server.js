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
var max_speed = 7;
var k = (9 * Math.pow(10, 9));
var ball = {
    xpos: 350,
    ypos: 300,
    dx: 0,
    dy: 0,
    aX: 0,
    aY: 0,
    width: 10,
    height: 10,
    mass: 9.1 * Math.pow(10, -31)
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
    if (ball.ypos < 0 || ball.ypos > canvas_height) {
        ball.dy *= -1;
    }
    var aX = 0,
        aY = 0;
    for (var i = players.length - 1; i >= 0; i--) {
        var force = forceOnBall(players[i]);
        aX += (force.x / (ball.mass));
        aY += ((force.y / ball.mass));
    }
    ball.aX = aX;
    ball.aY = aY;
    checkGoalIntersections();
}

function reset() {
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

function checkGoalIntersections() {
    function rectangle_collision(x_1, y_1, width_1, height_1, x_2, y_2, width_2, height_2) {
        return !(x_1 > x_2 + width_2 || x_1 + width_1 < x_2 || y_1 > y_2 + height_2 || y_1 + height_1 < y_2)
    }
    if ((rectangle_collision(ball.xpos, ball.ypos, ball.width, ball.height, negativeGoal.xpos, negativeGoal.ypos, negativeGoal.width, negativeGoal.height)) || ball.xpos > canvas_width) {
        team1score++;
        reset();
    }
    if ((rectangle_collision(ball.xpos, ball.ypos, ball.width, ball.height, positiveGoal.xpos, positiveGoal.ypos, positiveGoal.width, positiveGoal.height)) || ball.xpos < 0) { //
        team2score++;
        reset();
    }
}

function forceOnBall(player) {
    var density = (player.charge_vector / player.height);
    var r = Math.sqrt((Math.pow(player.xpos - ball.xpos, 2)) + (Math.pow((player.ypos + (player.height / 2)) - ball.ypos, 2)));
    var subInterval = (Math.pow(10, -3));
    var newbx = ball.xpos - player.xpos;
    var newrodtop = player.height / 2;
    var newrodbottom = -player.height / 2;
    var newby = -ball.ypos + (player.ypos + newrodtop);

    function xIntegral() {
        var total = 0;
        for (var s = (-(player.height) / 2); s <= ((player.height) / 2); s += (subInterval)) {
            total += 1 / Math.pow(((newby - s) * (newby - s) + (newbx) * (newbx)), (3 / 2));
        }
        return (-total);
    }

    function yIntegral() {
        var total = 0;
        for (var s = (-(player.height) / 2); s <= ((player.height) / 2); s += (subInterval)) {
            total += (newby - s) / Math.pow((newby - s) * (newby - s) + (newbx) * (newbx), (3 / 2));
        }
        return (total);
    }
    var force = {
        x: (xIntegral() * k * density * player.xpos * player.charge_vector / 100 * (ball.xpos > player.xpos ? -1 : 1) * (player.reverse_dir ? -1 / 10 : 1)),
        y: (yIntegral() * k * density * player.ypos * player.charge_vector / 10000 * (ball.ypos > player.ypos ? -1 : 1) * (player.reverse_dir ? -1 / 10 : 1))
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
        dy: 0,
        dx: 0,
        ax: 0,
        ay: 0,
        upperBound: canvas_width,
        lowerBound: 0,
        height: 75,
        charge_vector: (1.6 * Math.pow(10, -19)),
        reverse_dir: false,
        id: guid()
    };
    user.charge = team1 ? "Positive" : "Negative";
    user.upperBound = team1 ? canvas_width * 4 / 10 : canvas_width;
    user.lowerBound = team1 ? 0 : canvas_width * 6 / 10;
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
}, 5);
setInterval(function() {
    moveBall();
    io.emit('move ball', {
        xpos: ball.xpos,
        ypos: ball.ypos,
        dx: ball.dx,
        dy: ball.dy
    });
}, 5);
io.on('connection', function(socket) {
    var addedUser = false;
    // when the client emits 'new message', this listens and executes
    socket.on('key_state', function(data) {
        var indexOfUser = findIndexOfUser(socket.client_id);
        if (indexOfUser != -1) {
            if (data.keystate.Reverse_dir == true) {
                players[indexOfUser].reverse_dir = false;
            } else {
                players[indexOfUser].reverse_dir = true;
            }
            players[indexOfUser].ay = (data.keystate.Up && players[indexOfUser].ay > -max_speed) ? players[indexOfUser].ay - 1 : players[indexOfUser].ay;
            players[indexOfUser].ay = (data.keystate.Down && players[indexOfUser].ay < max_speed) ? players[indexOfUser].ay + 1 : players[indexOfUser].ay;
            players[indexOfUser].ax = (data.keystate.Left && players[indexOfUser].ax > -max_speed) ? players[indexOfUser].ax - .5 : players[indexOfUser].ax;
            players[indexOfUser].ax = (data.keystate.Right && players[indexOfUser].ax < max_speed) ? players[indexOfUser].ax + .5 : players[indexOfUser].ax;
            //players[indexOfUser].dy = (players[indexOfUser].dy >= -max_speed && players[indexOfUser].dy <= max_speed) ? players[indexOfUser].dy + players[indexOfUser].ay : players[indexOfUser].dy;
            //players[indexOfUser].dx = (players[indexOfUser].dx >= -max_speed && players[indexOfUser].dx <= max_speed) ? players[indexOfUser].dx + players[indexOfUser].ax : players[indexOfUser].ax;
            players[indexOfUser].xpos += players[indexOfUser].ax;
            players[indexOfUser].ypos += players[indexOfUser].ay;
            if (!(players[indexOfUser].xpos > players[indexOfUser].lowerBound && players[indexOfUser].xpos < players[indexOfUser].upperBound)) {
                players[indexOfUser].xpos = players[indexOfUser].xpos;
                players[indexOfUser].ax = 0;
            }
            if (!(players[indexOfUser].ypos > 0 && players[indexOfUser].ypos < canvas_height)) {
                players[indexOfUser].ypos = players[indexOfUser].ypos;
                players[indexOfUser].ay = 0;
            }
        }
    });
    // when the client emits 'add user', this listens and executes
    socket.on('add user', function(username) {
        if (addedUser) return;
        // we store the username in the socket session for this client
        team1score = team2score = 0;
        reset();
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