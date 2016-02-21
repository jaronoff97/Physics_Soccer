var socket = io();
canvas = $("#canvas")[0];
canvas.width = 700;
canvas.height = 700;
var initialX = 100,
    initalY = 100,
    userame;
ctx = canvas.getContext('2d');
var player1 = null;
var keystate = {
    "Up": false,
    "Down": false,
    "Left": false,
    "Right": false
};
var players = [];

function keyDown(event) {
    var keyString = String.fromCharCode(event.keyCode);
    switch (keyString) {
        case "W":
            {
                keystate["Up"] = true;
                break;
            }
        case "A":
            {
                keystate["Left"] = true;
                break;
            }
        case "S":
            {
                keystate["Down"] = true;
                break;
            }
        case "D":
            {
                keystate["Right"] = true;
                break;
            }
        default:
            {
                break;
            }
    }
}

function keyUp(event) {
    var keyString = String.fromCharCode(event.keyCode);
    switch (keyString) {
        case "W":
            {
                keystate["Up"] = false;
                break;
            }
        case "A":
            {
                keystate["Left"] = false;
                break;
            }
        case "S":
            {
                keystate["Down"] = false;
                break;
            }
        case "D":
            {
                keystate["Right"] = false;
                break;
            }
        default:
            {
                break;
            }
    }
}

function main() {
    // create, initiate and append game canvas
    userame = window.prompt("Enter a username", "Username");
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
    socket.emit('add user', userame);
    player1 = Player({
        xpos: initialX,
        ypos: initalY,
        radius: 25,
        charge: "Positive"
    });
}

function update() {
    player1.update();
}

function draw() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    player1.draw(ctx);
    ctx.restore();
}
socket.on('login', function(data) {
    $("#amount_of_users").empty();
    $("#amount_of_users").append("<h2> There are " + data.numUsers + " users connected</h2>");
});
socket.on('user joined', function(data) {
    $("#amount_of_users").empty();
    $("#amount_of_users").append("<h2> There are " + data.numUsers + " users connected</h2>");
    /*$("#amount_of_users").append("<ul>");
    for(var i=0;i<data.numUsers;i++){
        $("#amount_of_users").append("<li>"+data.users[i]+"</li>");
        console.log(users[i]);
    }
    $("#amount_of_users").append("</ul>");*/
});
main();