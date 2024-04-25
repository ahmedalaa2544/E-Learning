import { Router } from "express";
const router = Router();
import * as notityController from "./notification.controller.js";
import isAuth from "../../middleware/authntication.middleware.js";

router.post("/save-subscription", isAuth, notityController.saveSub);

router.get("/:notificationId?", isAuth, notityController.readNotify);

export default router;
