import { Router } from "express";
const router = Router();
import * as workshopController from "./workshop.controller.js";
import * as workshopValidation from "./workshop.validation.js";
import { validation } from "../../middleware/validation.js";
import isAuth from "../../middleware/authntication.middleware.js";

import { fileUpload, customValidation } from "../../utils/multer.js";

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

// Get Specific Workshop
router.get(
  "/:workshopId",
  isAuth,
  validation(workshopValidation.workshopIdSchema),
  workshopController.getSpecificWorkshop
);

// Get All Workshops

router.get(
  "/",
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
