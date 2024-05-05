import { Router } from "express";
const router = Router();
import { validation } from "../../middleware/validation.js";
import * as validators from "./cart.validation.js";
import * as cartController from "./cart.controller.js";
import isAuth from "../../middleware/authntication.middleware.js";

router.patch("/:workId", isAuth, cartController.AddToCart);

router.patch(
  "/remove/:courseId",
  isAuth,
  validation(validators.courseId),
  cartController.removeFromCart
);

router.get("/", isAuth, cartController.getCart);

export default router;
