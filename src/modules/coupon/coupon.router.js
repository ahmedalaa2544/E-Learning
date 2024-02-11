import { Router } from "express";
const router = Router();
import isAuth from "../../middleware/authntication.middleware.js";
import * as couponController from "./coupon.controller.js";
import * as validators from "./coupon.validation.js";
import { validation } from "../../middleware/validation.js";

router.post(
  "/",
  isAuth,
  //   isAuthen(), ask team first
  validation(validators.couponSchema),
  couponController.createCoupon
);

router.delete(
  "/:name",
  isAuth,
  //   isAuthen(), ask team first
  validation(validators.delCoupon),
  couponController.delCoupon
);

export default router;
