function Ball(options) {
    ball = {};
    ball.xpos = options.xpos;
    ball.ypos = options.ypos;
    ball.radius = options.radius;
    ball.dx = ball.dy = 5;
    ball.draw = function(ctx) {
        ctx.beginPath();
        ctx.arc(ball.xpos, ball.ypos, ball.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#4CFF4C';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#003300';
        ctx.stroke();
    }
    ball.update = function() {
        ball.xpos += ball.dx;
        if (ball.xpos > canvas.width) {
            ball.dx *= -1;
        }
        ball.ypos += ball.dy;
        if (ball.ypos > canvas.height) {
            ball.dy *= -1;
        }
    }
    ball.updatePos = function(data){
        ball.xpos = data.xpos;
        ball.ypos = data.ypos;
    }
    return ball;
}