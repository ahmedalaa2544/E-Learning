import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

export const CategSchema = joi
  .object({
    name: joi.string().required(),
  })
  .required();
export const getCategoryCoursesSchema = joi
  .object({
    categoryId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
