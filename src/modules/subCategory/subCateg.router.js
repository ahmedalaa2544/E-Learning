import { Router } from "express";
const router = Router();
import * as subCategoryController from "./subCateg.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./subCateg.validation.js";
import isAuth from "../../middleware/authntication.middleware.js";

router.post(
  "/:categoryId",
  isAuth,
  validation(validators.subCategSchema),
  subCategoryController.createSubCateg
);

router.get("/:categoryId", subCategoryController.getSubCateg);

export default router;
