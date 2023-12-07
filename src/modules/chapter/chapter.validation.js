import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

export const createChapterSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    title: joi.string().required(),
    learningObjective: joi.string(),
  })
  .required();

export const editChapterSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
    title: joi.string(),
    learningObjective: joi.string(),
    startPosition: joi.string(),
    endPosition: joi.string(),
    change_order: joi.boolean(),
  })
  .required();

export const deleteChaptersSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
  })
  .required();

export const getChapterSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
export const getChaptersSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
