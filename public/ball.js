function Ball(options) {
    ball = {};
    ball.xpos = options.xpos;
    ball.ypos = options.ypos;
    ball.radius = options.radius;
    ball.dx = ball.dy = 0;
    ball.draw = function(ctx) {
        drawLine(ctx);
        ctx.beginPath();
        ctx.arc(ball.xpos, ball.ypos, ball.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#4CFF4C';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#003300';
        ctx.stroke();
    }
    function drawLine(ctx){
        ctx.beginPath();
        ctx.moveTo(ball.xpos,ball.ypos);
        ctx.lineTo(ball.xpos+(ball.dx*20), ball.ypos+(ball.dy*20));
        ctx.stroke();
    }
    ball.updatePos = function(data){
        ball.xpos = data.xpos;
        ball.ypos = data.ypos;
        ball.dx = data.dx;
        ball.dy = data.dy;
    }
    return ball;
}