import { Router } from "express";
const router = Router();
import { validation } from "../../middleware/validation.js";
import * as validators from "./cart.validation.js";
import * as cartController from "./cart.controller.js";
import isAuth from "../../middleware/authntication.middleware.js";

router.patch(
  "/add/:courseId",
  isAuth,
  validation(validators.courseId),
  cartController.addToCart
);

router.patch(
  "/remove/:courseId",
  isAuth,
  validation(validators.courseId),
  cartController.removeFromCart
);

router.put(
  "/coupon/:name",
  isAuth,
  validation(validators.couponSchema),
  cartController.addCoupon
);

router.get("/", isAuth, cartController.getCart);

export default router;
