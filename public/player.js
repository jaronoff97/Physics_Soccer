function Player(options) {
    var player = {};
    var xpos = options.xpos;
    var ypos = options.ypos;
    var radius = options.radius;
    var charge = options.charge;
    player.name = options.name;
    var id = options.id;
    var dx = dy = 5;
    player.draw_paddle = function(ctx) {
        ctx.fillStyle = "#000000"
        ctx.rect(xpos, ypos, 10, radius);
        ctx.stroke();
        if (charge == "Positive") {
            ctx.fillStyle = "#4C4CFF";
        }
        if (charge == "Negative") {
            ctx.fillStyle = "#FF4C4C";
        }
        ctx.fillText(player.name,xpos, ypos-10);
        ctx.fillRect(xpos, ypos, 10, radius);
    }
    player.updatePos = function(data) {
        xpos = data.xpos;
        ypos = data.ypos;
    }
    player.getX = function() {
        return xpos;
    }
    player.getY = function() {
        return ypos;
    }
    player.getId = function() {
        return id;
    }
    player.print = function() {
        return (xpos + " " + ypos + " " + radius + " " + id + " " + name);
    }
    return player;
}