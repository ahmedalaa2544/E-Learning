import { Router } from "express";
const router = Router();
import * as notityController from "./notification.controller.js";
import isAuth from "../../middleware/authntication.middleware.js";

app.post("/save-subscription", isAuth, notityController.saveSub);

export default router;
