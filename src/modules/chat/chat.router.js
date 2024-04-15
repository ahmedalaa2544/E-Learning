import { Router } from "express";
const router = Router();
import * as chatController from "./chat.controller.js";
import isAuth from "../../middleware/authntication.middleware.js";

router.get("/", isAuth, chatController.Chats);

router.get("/search", isAuth, chatController.search);

router.post("/", isAuth, chatController.sendMsg);

router.get("/:destId", isAuth, chatController.getChat);

export default router;
