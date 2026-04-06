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
            if (ws.username === "") {
                ws.send(JSON.stringify({
                    type: "chat",
                    status: "error",
                    message: "Please set a username"
                }))
                return
            }

            if (ws.room === "") {
                ws.send(JSON.stringify({
                    type: "chat",
                    status: "error",
                    message: "Join a room or something"
                }))
                return
            }
            wss.rooms.get(ws.room).forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    let obj = {
                        type: "chat",
                        status: "success",
                        username: ws.username,
                        message: data.message
                    }
                    if (client === ws) obj.username = "Me"
                    client.send(JSON.stringify(obj))
                }
            });
        } else if (data.type === "join") {
            if (!wss.rooms.has(data.room)) {
                ws.send(JSON.stringify({
                    type: "joinRoom",
                    status: "error",
                    message: "Such room doesn't exist"
                }))
                return;
            }
            ws.room = data.room;
            let setOfClients = wss.rooms.get(data.room)
            setOfClients.add(ws)
            ws.send(JSON.stringify({
                type: "joinRoom",
                status: "success",
                message: `Welcome! You have joined ${ws.room}`
            }))

            wss.rooms.get(ws.room).forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "joinRoom",
                        status: "success",
                        message: `${ws.username} has joined`
                    }))
                }
            })
        } else if (data.type === "create") {
            if (wss.rooms.has(data.room)) {
                ws.send(JSON.stringify({
                    type: "createRoom",
                    status: "error",
                    message: "Room already exist!"
                }))
                return
            }
            ws.room = data.room;
            wss.rooms.set(data.room, new Set([ws]))
            ws.send(JSON.stringify({
                type: "createRoom",
                status: "success",
                message: `Welcome! You have created and joined ${ws.room}`
            }))
        } else if (data.type === "setUsername") {
            ws.username = data.username;
            ws.send(JSON.stringify({
                type: "setUsername",
                status: "success",
                message: `Username is set to ${ws.username}`
            }))
        }
    })

    ws.on("error", (err) => {
        console.log(err)
    })

    ws.on("close", () => {
        if (!ws.room) return
        const setOfClients = wss.rooms.get(ws.room)
        if (!setOfClients) return
        setOfClients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "terminate",
                    status: "success",
                    message: `${ws.username || "Someone"} has exited`
                }))
            }
        })
        setOfClients.delete(ws)
    })
})