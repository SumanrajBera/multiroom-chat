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
            if (!wss.rooms.has(data.room)) {
                ws.send(JSON.stringify({
                    type: "joinRoom",
                    message: "Such room doesn't exist"
                }))
                return;
            }
            ws.room = data.room;
            let setOfClients = wss.rooms.get(data.room)
            setOfClients.add(ws)
            console.log(setOfClients)
            ws.send(JSON.stringify({
                type: "joinRoom",
                message: `Welcome! You have joined ${ws.room}`
            }))
        } else if (data.type === "create") {
            if (wss.rooms.has(data.room)) {
                ws.send(JSON.stringify({
                    type: "createRoom",
                    message: "Room already exist!"
                }))
                return
            }
            ws.room = data.room;
            wss.rooms.set(data.room, new Set([ws]))
            ws.send(JSON.stringify({
                type: "createRoom",
                message: `Welcome! You have created and joined ${ws.room}`
            }))
        } else if (data.type === "setUsername") {
            ws.username = data.username;
        }
    })

    ws.on("error", (err) => {
        console.log(err)
    })
})