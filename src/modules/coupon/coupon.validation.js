import joi from "joi";

export const couponSchema = joi
  .object({
    discount: joi.number().min(1).max(100).required(),
    expireAt: joi.date().greater(Date.now()).required(),
  })
  .required();

export const delCoupon = joi
  .object({
    name: joi.string().length(5).required(),
  })
  .required();
