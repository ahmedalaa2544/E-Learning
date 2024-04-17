import { Router } from "express";
const router = Router();
import * as chatController from "./chat.controller.js";
import isAuth from "../../middleware/authntication.middleware.js";
import { customValidation, fileUpload } from "../../utils/multer.js";

router.get("/", isAuth, chatController.Chats);

router.post(
  "/",
  isAuth,
  fileUpload(
    customValidation.image
      .concat(customValidation.video)
      .concat(customValidation.voice)
      .concat(customValidation.file)
  ).fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "voice", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  chatController.sendMsg
);

router.get("/:destId", isAuth, chatController.getChat);

export default router;
