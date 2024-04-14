import dotenv from "dotenv";
dotenv.config();
import express from "express";
import appRouter from "./src/app.router.js";
import connectDB from "./DB/connection.js";
import socketInit from "./src/utils/socketInit.js";

const app = express();
const port = process.env.PORT;
connectDB();

appRouter(app, express);

const server = app.listen(port, () =>
  console.log(`Server listening on port ${port}!`)
);
socketInit(server);
