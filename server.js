import express from "express"
import dotenv from "dotenv"
import userRouter from "./routes/userRoutes.js";
import chatRouter from "./routes/chatRoutes.js"
import messageRouter from "./routes/messageRoutes.js"
import cors from "cors"
import mongoDB from "./config/config.js";
import { Server } from "socket.io"
import { createServer } from "http"

dotenv.config()

const app = express();
const httpServer = createServer(app)

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173"
    },
    pingTimeout: 60000
})

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors())
app.use("/api/users/", userRouter)
app.use("/api/chats/", chatRouter)
app.use("/api/messages", messageRouter)


io.on("connection", (socket) => {
    console.log("Connected to socketio")

    socket.on("set up", (user) => {
        socket.join(user._id)
        console.log("Setup complete for:", user.name, user._id)
        socket.emit("connected") // *** ADDED - confirms to frontend ***
    })

    socket.on("new message", (newMessage) => {
        const chat = newMessage.chat;
        if (!chat.users) return

        chat.users.forEach(userId => {  // rename to userId - it's already an id string
            if (userId === newMessage.sender._id) {  // compare string to string
                return
            }
            socket.in(userId).emit("message received", newMessage)  // use userId directly
        })
    })
})

mongoDB()
    .then(() => {
        httpServer.listen(3000, () => {
            console.log("running");
        });
    })
    .catch((e) => {
        console.error(`Error Connecting to Database ${e}`)
    })