import { Router } from "express";
const router = Router();
import isAuth from "../../middleware/authntication.middleware.js";
// import { validation } from "../../middleware/validation.js";
// import * as validators from "./order.validation.js";
import * as orderController from "./order.controller.js";
import express from "express";

//create order
router.post("/", isAuth, orderController.createOrder);

//webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  orderController.orderWebhook
);

export default router;
