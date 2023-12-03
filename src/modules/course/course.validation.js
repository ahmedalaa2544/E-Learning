import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

const allowedLevels = ["Beginner", "Intermediate", "Expert", "All Levels"];

export const createCourseSchema = joi
  .object({
    title: joi.string().max(60),
  })
  .required();

export const editCourseSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    title: joi.string().max(60),
    subtitle: joi.string().max(120),
    category: joi.string().custom(isValidObjectId),
    subCategory: joi.string().custom(isValidObjectId),
    language: joi.string(),
    coureTags: joi.array().max(50),
    descriotion: joi.string().min(60).max(200),
    level: joi.string().valid(...allowedLevels),
  })
  .unknown(true);

export const deleteCourseSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
  })
  .required();

export const getCourseSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
