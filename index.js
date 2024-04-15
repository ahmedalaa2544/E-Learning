import dotenv from "dotenv";
dotenv.config();
import express from "express";
import appRouter from "./src/app.router.js";
import userModel from "./DB/model/user.model.js";
import { getIo, initIo } from "./src/utils/server.js";
import socketAuth from "./src/middleware/socketAuth.js";

const app = express();
const port = process.env.PORT;

appRouter(app, express);

const httpServer = app.listen(port, () =>
  console.log(`Server listening on port ${port}!`)
);

const io = initIo(httpServer);

io.on("connection", (socket) => {
  socket.on("updateSocketId", async (data) => {
    const { _id } = await socketAuth(data.token, socket.id);
    if (_id) {
      await userModel.updateOne({ _id }, { socketId: socket.id });
      socket.emit("updateSocketId", "Done");
    }
  });
});
