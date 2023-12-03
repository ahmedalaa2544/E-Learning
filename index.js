import dotenv from "dotenv";
dotenv.config();
import express from "express";
import appRouter from "./src/app.router.js";
const app = express();
const port = process.env.PORT;

appRouter(app, express);

app.listen(port, () => console.log(`Server listening on port ${port}!`));
