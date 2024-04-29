import { Router } from "express";
const router = Router();
import isAuth from "../../middleware/authntication.middleware.js";
// import { validation } from "../../middleware/validation.js";
// import * as validators from "./payment.validation.js";
import * as paymentController from "./payment.controller.js";
import express from "express";

//create account
router.post(
  "/account",
  // isAuth,
  paymentController.createAccount
);
router.post(
  "/accountLink",
  // isAuth,
  paymentController.accountLink
);
router.get(
  "/accessDashboard",
  // isAuth,
  paymentController.accessDashboard
);
//create order
router.get("/", paymentController.createOrder);

//webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.orderWebhook
);

export default router;
