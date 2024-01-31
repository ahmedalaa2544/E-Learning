import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

export const subCategSchema = joi
  .object({
    name: joi.string().required(),
  })
  .required();
export const getSubCategoryCoursesSchema = joi
  .object({
    categoryId: joi.string().custom(isValidObjectId).required(),
    subCategoryId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
