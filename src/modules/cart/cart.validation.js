import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

export const courseId = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
