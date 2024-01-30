import { Router } from "express";
const router = Router();
import * as categoryController from "./categ.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./categ.validation.js";
import isAuth from "../../middleware/authntication.middleware.js";

router.post(
  "/",
  isAuth,
  validation(validators.CategSchema),
  categoryController.createCateg
);

router.get("/", categoryController.getCateg);

export default router;
