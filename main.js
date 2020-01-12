const http = require('http');
const WebSocket = require('ws');
const url = require('url');
var cbor = require('cbor');

const server = http.createServer();
const wss1 = new WebSocket.Server({noServer: true});

wss1.on('connection', function connection(ws) {
    ws.send(cbor.encode({
        a: "10.8.46.2",
        r: true,
        k: "Preferences/Alvyn Wang",
        v: 60,
        n: true
    }));
});

server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = url.parse(request.url).pathname;

    if (pathname === '/networktables/ws') {
        wss1.handleUpgrade(request, socket, head, function done(ws) {
            wss1.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

server.listen(8080);