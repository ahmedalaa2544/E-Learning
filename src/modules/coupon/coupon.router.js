import { Router } from "express";
const router = Router();
import isAuth from "../../middleware/authntication.middleware.js";
import * as couponController from "./coupon.controller.js";
import * as validators from "./coupon.validation.js";
import { validation } from "../../middleware/validation.js";

router.post(
  "/",
  isAuth,
  validation(validators.couponSchema),
  couponController.createCoupon
);

router.delete(
  "/:courseId",
  isAuth,
  validation(validators.delCoupon),
  couponController.delCoupon
);

router.get("/", isAuth, couponController.getCoupons);

export default router;
