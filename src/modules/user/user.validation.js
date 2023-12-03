import { isValidObjectId } from "../../middleware/validation.js";
import joi from "joi";

export const updateSchema = joi
  .object({
    fullName: joi.string().empty(""),
    gender: joi.string().valid("male", "female").empty(""),
    phone: joi.string().empty(""),
    age: joi.number().integer().positive().min(4).max(100).empty(""),
  })
  .required();

export const wishlistSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
