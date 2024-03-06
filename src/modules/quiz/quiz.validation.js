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

export const UpateOptionSchema = joi
  .object({
    curriculumId: joi.string().custom(isValidObjectId).required(),
    questionId: joi.string().custom(isValidObjectId).required(),
    UpdateId: joi.string().custom(isValidObjectId).required(),
  })
  .unknown(true);

export const updateQuizSchema = joi
  .object({
    curriculumId: joi.string().custom(isValidObjectId).required(),
    title: joi.string(),
    description: joi.string().allow(""),
    sorted: joi.boolean().required(),
    duaration: joi.number().positive(),
  })
  .unknown(true);
