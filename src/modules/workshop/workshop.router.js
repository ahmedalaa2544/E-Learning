import { Router } from "express";
import isAuth from "../../middleware/authntication.middleware.js";
import { validation } from "../../middleware/validation.js";
import * as workshopController from "./workshop.controller.js";
import * as workshopValidation from "./workshop.validation.js";
const router = Router();

import { customValidation, fileUpload } from "../../utils/multer.js";

// Create Workshop
router.post(
  "/",
  isAuth,
  validation(workshopValidation.createWorkshopSchema),
  workshopController.createWorkshop
);

// Upload promotionImage & promotionVideo
router.put(
  "/:workshopId",
  isAuth,
  fileUpload(customValidation.image.concat(customValidation.video)).fields([
    { name: "promotionImage", maxCount: 1 },
    { name: "promotionVideo", maxCount: 1 },
  ]),
  validation(workshopValidation.workshopIdSchema),
  workshopController.uploadImageOrVideo
);

// Update Workshop static data
router.patch(
  "/:workshopId",
  isAuth,
  fileUpload(customValidation.image.concat(customValidation.video)).fields([
    { name: "promotionImage", maxCount: 1 },
    { name: "promotionVideo", maxCount: 1 },
  ]),
  validation(workshopValidation.updateWorkshopSchema),
  workshopController.updateWorkshop
);

// Get All Rooms of Workshop
router.get(
  "/:workshopId/allRooms",
  isAuth,
  validation(workshopValidation.getWorkshopRoomsSchema),
  workshopController.getWorkshopRooms
);

// Get Specific Workshop
router.get(
  "/:workshopId",
  isAuth,
  validation(workshopValidation.getSpecificWorkshopSchema),
  workshopController.getSpecificWorkshop
);

// Get All Workshops
router.get(
  "/",
  (req, res, next) => {
    if (!req.headers.token) {
      workshopController.getAllWorkshops(req, res, next);
    } else {
      next();
    }
  },
  isAuth,
  validation(workshopValidation.getAllWorkshopsSchema),
  workshopController.getAllWorkshops
);

// Delete Workshop
router.delete(
  "/:workshopId",
  isAuth,
  validation(workshopValidation.workshopIdSchema),
  workshopController.deleteWorkshop
);

// Publish Workshop
router.patch(
  "/publish/:workshopId",
  isAuth,
  validation(workshopValidation.workshopIdSchema),
  workshopController.publishWorkshop
);

export default router;
