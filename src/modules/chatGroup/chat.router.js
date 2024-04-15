import { Router } from "express";
const router = Router();
import * as chatController from "./chat.controller.js";
import isAuth from "../../middleware/authntication.middleware.js";

router.get("/", isAuth, chatController.Chats);

router.post("/send", isAuth, chatController.sendMsg);

router.post("/", isAuth, chatController.createChat);

router.get("/:destId", isAuth, chatController.getChat);

export default router;
