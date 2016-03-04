function Player(options) {
    var player = {};
    var xpos = options.xpos;
    var ypos = options.ypos;
    var radius = options.radius;
    var charge = options.charge;
    player.name = options.name;
    var id = options.id;
    var dx = dy = 5;
    player.draw = function(ctx) {
        ctx.beginPath();
        ctx.arc(xpos, ypos, radius, 0, 2 * Math.PI);
        ctx.stroke();
        if (charge == "Positive") {
            ctx.fillStyle = "#4C4CFF";
        }
        if (charge == "Negative") {
            ctx.fillStyle = "#FF4C4C";
            //ctx.fillRect(xpos - (radius - (2 * radius / 5)), ypos - 2, (radius * 2 - (4 * radius / 5)), 4);
        }
        ctx.fillRect(xpos - (radius - (2 * radius / 5)), ypos - 2, (radius * 2 - (4 * radius / 5)), 4);
        ctx.fillRect(xpos - 2, ypos - (radius - (2 * radius / 5)), 4, (radius * 2 - (4 * radius / 5)));
        ctx.fillText(name, xpos - radius, ypos - radius - 5);
    }
    player.draw_paddle = function(ctx) {
        if (charge == "Positive") {
            ctx.fillStyle = "#4C4CFF";
        }
        if (charge == "Negative") {
            ctx.fillStyle = "#FF4C4C";
            //ctx.fillRect(xpos - (radius - (2 * radius / 5)), ypos - 2, (radius * 2 - (4 * radius / 5)), 4);
        }
        ctx.fillRect(xpos, ypos, 5, radius);
    }
    player.rotate_point = function(pointX, pointY, originX, originY, angle) {
        angle = angle * Math.PI / 180.0;
        return {
            x: Math.cos(angle) * (pointX - originX) - Math.sin(angle) * (pointY - originY) + originX,
            y: Math.sin(angle) * (pointX - originX) + Math.cos(angle) * (pointY - originY) + originY
        };
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