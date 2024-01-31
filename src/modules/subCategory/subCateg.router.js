import { Router } from "express";
const router = Router({ mergeParams: true });
import * as subCategoryController from "./subCateg.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./subCateg.validation.js";
import isAuth from "../../middleware/authntication.middleware.js";

router.post(
  "/",
  isAuth,
  validation(validators.subCategSchema),
  subCategoryController.createSubCateg
);

router.get("/", subCategoryController.getSubCateg);

/**
 * Route to retrieve courses associated with a specific subCategory.
 */
router.get(
  "/:subCategoryId",
  validation(validators.getSubCategoryCoursesSchema),
  subCategoryController.getSubCategoryCourses
);

export default router;
