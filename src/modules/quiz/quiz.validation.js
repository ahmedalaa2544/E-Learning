import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

const allowedLevels = ["Beginner", "Intermediate", "Expert", "All Levels"];

export const createQuestionSchema = joi
  .object({
    curriculumId: joi.string().custom(isValidObjectId).required(),
  })
  .unknown(true);
export const createOptionSchema = joi
  .object({
    curriculumId: joi.string().custom(isValidObjectId).required(),
    questionId: joi.string().custom(isValidObjectId).required(),
  })
  .unknown(true);
