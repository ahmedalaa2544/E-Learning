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
  validation(roomValidation.roomIdSchema),
  roomController.joinRoom
);

// Get All Online Rooms
router.get("/online", isAuth, roomController.getOnlineRooms);

// Get Specific Room
router.get(
  "/:roomId",
  isAuth,
  validation(roomValidation.roomIdSchema),
  roomController.getSpecificRoom
);
// Get absence list of Specific Room
router.get(
  "/absence/:roomId",
  isAuth,
  validation(roomValidation.roomIdSchema),
  roomController.getRoomAbsenceList
);

// Delete Room
router.delete(
  "/:roomId",
  isAuth,
  validation(roomValidation.roomIdSchema),
  roomController.deleteRoom
);

// Record Room
router.post(
  "/record/:roomId",
  isAuth,
  validation(roomValidation.roomIdSchema), 
  roomController.recordRoom
);

// Record Room
router.put(
  "/stopRecord/:recordId",
  // isAuth,
  // validation(roomValidation.roomIdSchema),
  roomController.stopRecord
);
 
export default router;
