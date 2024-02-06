import { Router } from "express";
const router = Router();
import * as roomController from "./room.controller.js";
import * as roomValidation from "./room.validation.js";
import { validation } from "../../middleware/validation.js";
import isAuth from "../../middleware/authntication.middleware.js";

// Create Room (room)
router.post(
  "/create",
  isAuth,
  validation(roomValidation.createRoomSchema),
  roomController.createRoom
);

// Join Room
router.post(
  "/join",
  isAuth,
  validation(roomValidation.joinRoomSchema),
  roomController.joinRoom
);

// Get Specific Room
router.get(
  "/:roomId",
  isAuth,
  validation(roomValidation.getSpecificRoomSchema),
  roomController.getSpecificRoom
);

router.get("/getAllRooms", isAuth, roomController.getAllRooms);

// Delete Room
router.delete(
  "/:roomId",
  isAuth,
  validation(roomValidation.deleteRoomSchema),
  roomController.deleteRoom
);

export default router;
