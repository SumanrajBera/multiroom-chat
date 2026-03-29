import WebSocket, { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 3000 })

console.log("Websocket server is running on port 3000")

wss.rooms = new Map()

wss.on("connection", (ws) => {
    ws.username = "";
    ws.room = "";

    ws.on("message", (data) => {
        data = JSON.parse(data)
        if (data.type === "chat") {
            if (ws.room === "") {
                ws.send("Join a room or something")
                return
            }
            wss.rooms.get(ws.room).forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        username: ws.username,
                        message: data.message
                    }))
                }
            });
        } else if (data.type === "join") {
            ws.username = data.username;
            ws.room = data.room;
            let arr = wss.rooms.get(data.room)
            wss.rooms.set(data.room, [...arr, ws])
            ws.send(`Welcome! You have joined ${ws.room}`)
        } else if (data.type === "create") {
            ws.username = data.username;
            ws.room = data.room;
            wss.rooms.set(data.room, [ws])
            ws.send(`Welcome! You have created and joined ${ws.room}`)
        }
    })

    ws.on("error", (err) => {
        console.log(err)
    })
})