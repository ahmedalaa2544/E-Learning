import { Router } from "express";
const router = Router();
import * as chatController from "./chat.controller.js";
import isAuth from "../../middleware/authntication.middleware.js";
import { customValidation, fileUpload } from "../../utils/multer.js";

router.get("/", isAuth, chatController.Chats);

router.post(
  "/:chatId/messages",
  isAuth,
  fileUpload(
    customValidation.image
      .concat(customValidation.video)
      .concat(customValidation.voice)
      .concat(customValidation.file)
  ).single("media"),
  chatController.sendMsg
);

router.get("/:chatId", isAuth, chatController.getChat);

router.get("/:chatId/messages", isAuth, chatController.allMessages);

router.post(
  "/",
  isAuth,
  fileUpload(customValidation.image).single("image"),
  chatController.createGroup
);

export default router;
