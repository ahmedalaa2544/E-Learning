import { Router } from "express";
const router = Router();
import * as categoryController from "./categ.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./categ.validation.js";
import isAuth from "../../middleware/authntication.middleware.js";
import subCategoryRouter from "../subCategory/subCateg.router.js";

router.use("/:categoryId/subCategory", subCategoryRouter);

router.post(
  "/",
  isAuth,
  validation(validators.CategSchema),
  categoryController.createCateg
);

router.get("/", categoryController.getCateg);

/**
 * Route to retrieve courses associated with a specific category.
 */
router.get(
  "/:categoryId",
  validation(validators.getCategoryCoursesSchema),
  categoryController.getCategoryCourses
);

export default router;
