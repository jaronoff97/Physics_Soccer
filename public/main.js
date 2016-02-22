var socket = io();
canvas = $("#canvas")[0];
canvas.width = 700;
canvas.height = 700;
var initialX = 100,
    initalY = 100,
    username;
ctx = canvas.getContext('2d');
var player1 = null,
    ball = null;
var keystate = {
    "Up": false,
    "Down": false,
    "Left": false,
    "Right": false
};
var players = [];

function findIndexOfUser(id) {
    for (var i = 0; i < players.length; i++) {
        if (players[i].getId() == id) {
            return (i);
        }
    }
    return (-1);
}

function main() {
    // create, initiate and append game canvas
    username = window.prompt("Enter a username", "Username");
    init(); // initiate game objects
    $(document).keydown(keyDown);
    $(document).keyup(keyUp);
    var loop = function() {
        update();
        draw();
        window.requestAnimationFrame(loop, canvas);
    };
    window.requestAnimationFrame(loop, canvas);
}

function init() {
    socket.emit('add user', username);
    socket.on('give position', function(data) {
        player1 = Player({
            xpos: data.xpos,
            ypos: data.ypos,
            radius: 25,
            charge: data.charge,
            id: data.id,
            name: username
        });
        for (var i = 0; i < data.users.length; i++) {
            var tempPlayer = Player({
                xpos: data.users[i]["xpos"],
                ypos: data.users[i]["ypos"],
                radius: 25,
                charge: data.users[i]["charge"],
                id: data.users[i]["id"],
                name: data.users[i]["name"]
            });
            players.push(tempPlayer);
        }
    });
    socket.on('give ball position', function(data) {
        ball = Ball({
            xpos: data.xpos,
            ypos: data.ypos,
            radius: 20
        });
    });
    if(ball==null){
        ball = Ball({
            xpos: 300,
            ypos: 300,
            radius: 20
        });
    }
}

function update() {
    socket.on('move user', function(data) {
        var indexOfUser = findIndexOfUser(data.id);
        if (indexOfUser != -1) {
            players[indexOfUser].updatePos(data);
        }
    });
    socket.on('move ball', function(data){
       ball.updatePos(data);
    });
    if (player1 != null) {
        player1.update();
        socket.emit('move', {
            id: player1.getId(),
            xpos: player1.getX(),
            ypos: player1.getY()
        });
    }
}

function draw() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (ball != null) ball.draw(ctx);
    for (var i = players.length - 1; i >= 0; i--) {
        players[i].draw(ctx);
    }
    if (player1 != null) player1.draw(ctx);
    ctx.restore();
}
socket.on('login', function(data) {
    $("#amount_of_users").empty();
    $("#amount_of_users").append("<h2> There are " + data.numUsers + " users connected</h2>");
});
socket.on('user joined', function(data) {
    $("#amount_of_users").empty();
    $("#amount_of_users").append("<h2> There are " + data.numUsers + " users connected</h2>");
    var tempPlayer = Player({
        xpos: data.user["xpos"],
        ypos: data.user["ypos"],
        radius: 25,
        charge: data.user["charge"],
        id: data.user["id"],
        name: data.user["name"]
    });
    players.push(tempPlayer);
});
main();