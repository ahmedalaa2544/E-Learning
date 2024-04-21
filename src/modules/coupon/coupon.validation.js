import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

export const couponSchema = joi
  .object({
    discount: joi.number().min(1).max(100).required(),
    courseId: joi.string().custom(isValidObjectId).required(),
    expireAt: joi.date().greater(Date.now()).required(),
  })
  .required();

export const delCoupon = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
