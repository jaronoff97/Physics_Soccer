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
    if (id != null) {
        socket.emit('key_state', {
            keystate: keystate,
            id: id
        });
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
    if (id != null) {
        socket.emit('key_state', {
            keystate: keystate,
            id: id
        });
    }
}