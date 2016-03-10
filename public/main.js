var socket = io();
canvas = $("#canvas")[0];
canvas.width = 1000;
canvas.height = 700;
var username;
ctx = canvas.getContext('2d');
var ball = null;
var keystate = {
    Up: false,
    Down: false,
    Left: false,
    Right: false,
    Reverse_dir: true,
    Burst: false
};
var powerShotCount=0;
var positiveGoal = null;
var negativeGoal = null;
var players = [];
var powerShotCount = 0;

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
    $(document).keydown(keyDown); //add keylisteners
    $(document).keyup(keyUp);
    draw();
}

function init() {
    socket.emit('add user', username);
    socket.on('give position', function(data) {
        for (var i = 0; i < data.users.length; i++) {
            var tempPlayer = Player({
                xpos: data.users[i].xpos,
                ypos: data.users[i].ypos,
                radius: data.users[i].height,
                charge: data.users[i].charge,
                id: data.users[i].id,
                name: data.users[i].name
            });
            negativeGoal = data.nGoal;
            positiveGoal = data.pGoal;
            players.push(tempPlayer);
            draw();
        }
        ball = Ball({
            xpos: data.xpos,
            ypos: data.ypos,
            radius: 10
        });
    });
    if (ball == null) {
        ball = Ball({
            xpos: 300,
            ypos: 300,
            radius: 10
        });
    }
}

function makeGoal(ctx) {
    ctx.fillStyle = "#FF4C4C";
    if (negativeGoal != null) ctx.fillRect(negativeGoal.xpos, negativeGoal.ypos, negativeGoal.width, negativeGoal.height);
    ctx.fillStyle = "#4C4CFF";
    if (positiveGoal != null) ctx.fillRect(positiveGoal.xpos, positiveGoal.ypos, positiveGoal.width, positiveGoal.height);
}

function drawBounds(ctx, x) {
    for (var i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(x, i);
        ctx.lineTo(x, i - 10);
        ctx.stroke();
    }
}

function drawCenter(ctx) {
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
}

function draw() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    makeGoal(ctx);
    drawBounds(ctx, (canvas.width * 4 / 10) + 10);
    drawBounds(ctx, (canvas.width * 6 / 10) - 10);
    drawCenter(ctx);
    if (ball != null) ball.draw(ctx);
    for (var i = players.length - 1; i >= 0; i--) {
        players[i].draw_paddle(ctx);
    }
    ctx.restore();
}
socket.on('request position', function() {
    socket.emit('key_state', {
        keystate: keystate,
    });
});
socket.on('move user', function(data) {
    var indexOfUser = findIndexOfUser(data.id);
    if (indexOfUser != -1) {
        players[indexOfUser].updatePos(data);
    }
    draw();
});
socket.on('move ball', function(data) {
    ball.updatePos(data);
    draw();
});

function addPlayerToWindow() {
    $("#user_names").empty()
    for (var i = players.length - 1; i >= 0; i--) {
        $("#user_names").append("<li>" + players[i].name + "</li>");
    }
}
socket.on('login', function(data) {
    $("#amount_of_users").empty();
    $("#amount_of_users").append("<h2> There are " + data.numUsers + " users connected</h2>");
    addPlayerToWindow();
});
socket.on('user joined', function(data) {
    $("#amount_of_users").empty();
    $("#amount_of_users").append("<h2> There are " + data.numUsers + " users connected</h2>");
    var tempPlayer = Player({
        xpos: data.user.xpos,
        ypos: data.user.ypos,
        radius: data.user.height,
        charge: data.user.charge,
        id: data.user.id,
        name: data.user.name
    });
    players.push(tempPlayer);
    draw();
    addPlayerToWindow();
});
socket.on('score', function(data) {
    $("#scoreboard").empty();
    if(data.team1%6==0 || data.team2%6==0){
        powerShotCount=0;
        $("#reversed_direction").empty()
        $("#reversed_direction").append("<h1>You now have three more reverses!</h1>");
    }
    $("#scoreboard").append("<h2> Blue: " + data.team1 + "\t Red: " + data.team2 + "</h2>");
});
socket.on('user left', function(data) {
    players.splice(findIndexOfUser(data.id), 1);
    $("#amount_of_users").empty();
    $("#amount_of_users").append("<h2> There are " + data.numUsers + " users connected</h2>");
    addPlayerToWindow();
});
window.beforeunload = function() {
    socket.emit("disconnect", {});
}
main();