import { Router } from "express";
const router = Router();
import * as workshopController from "./workshop.controller.js";
import * as workshopValidation from "./workshop.validation.js";
import { validation } from "../../middleware/validation.js";
import isAuth from "../../middleware/authntication.middleware.js";
/*
import { fileUpload, filterObject } from "../../utils/multer.js";

// Create Workshop
router.post(
  "/",
  // isAuth,
  validation(workshopValidation.createWorkshopSchema),
  workshopController.createWorkshop
);

// Update Workshop
router.patch(
  "/:workshopId",
  // isAuth,
  fileUpload(filterObject.image).single("promotionImage"),
  validation(workshopValidation.updateWorkshopSchema),
  workshopController.updateWorkshop
);

// Get Specific Workshop
router.get(
  "/:workshopId",
  // isAuth,
  validation(workshopValidation.getWorkshopSchema),
  workshopController.getWorkshop
);

// Get All Workshops
router.get(
  "/",
  //  isAuth,
  workshopController.getAllWorkshops
);

// Delete Workshop
router.delete(
  "/:workshopId",
  // isAuth,
  validation(workshopValidation.deleteWorkshopSchema),
  workshopController.deleteWorkshop
);
*/
export default router;
