import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

export const subCategSchema = joi
  .object({
    name: joi.string().required(),
    categoryId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
