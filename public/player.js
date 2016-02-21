function Player(options) {
    var xpos = options.xpos;
    var ypos = options.ypos;
    var radius = options.radius;
    var charge = options.charge;
    var dx = dy = 5;
    var player = {};
    player.draw = function(ctx) {
        ctx.beginPath();
        ctx.arc(xpos, ypos, radius, 0, 2 * Math.PI);
        ctx.stroke();
        if(charge=="Positive"){
            ctx.fillStyle="#000000";
            ctx.fillRect(xpos-(radius-(2*radius/5)),ypos-2,(radius*2-(4*radius/5)),4);
            ctx.fillRect(xpos-2,ypos-(radius-(2*radius/5)),4,(radius*2-(4*radius/5)));
        }
        ctx.fillText(userame, xpos-radius, ypos-radius-5);
    }
    player.update = function() {
        ypos = keystate["Up"] ? ypos - dx : ypos;
        ypos = keystate["Down"] ? ypos + dx : ypos;
        xpos = keystate["Left"] ? xpos - dx : xpos;
        xpos = keystate["Right"] ? xpos + dx : xpos;
    }
    return player;
}