var powerShotCount = 0;

function keyDown(event) {
    var keyString = String.fromCharCode(event.keyCode);
    switch (keyString) {
        case "W":
            {
                keystate.Up = true;
                break;
            }
        case "A":
            {
                keystate.Left = true;
                break;
            }
        case "S":
            {
                keystate.Down = true;
                break;
            }
        case "D":
            {
                keystate.Right = true;
                break;
            }
        case "K":
            {
                if (powerShotCount < 3) {
                    keystate.Reverse_dir = (!keystate.Reverse_dir);
                    if (keystate.Reverse_dir == false) {
                        powerShotCount++;
                        $("#reversed_direction").empty()
                        $("#reversed_direction").append("<h1>Reversed Paddle Active! You have " + (3 - powerShotCount) + " reverses left</h1>");
                    } else {
                        $("#reversed_direction").empty()
                        $("#reversed_direction").append("<h1>Reversed Paddle Inactive!</h1>");
                    }
                }
                if(powerShotCount>=3){
                    $("#reversed_direction").empty()
                    $("#reversed_direction").append("<h1>You have no reverses left</h1>");
                    keystate.Reverse_dir = true;
                }
                break;
            }
        case "J":
            {
                keystate.Burst = true;
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
                keystate.Up = false;
                break;
            }
        case "A":
            {
                keystate.Left = false;
                break;
            }
        case "S":
            {
                keystate.Down = false;
                break;
            }
        case "D":
            {
                keystate.Right = false;
                break;
            }
        case "J":
            {
                keystate.Burst = false;
                break;
            }
        default:
            {
                break;
            }
    }
}