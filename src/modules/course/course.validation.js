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
    subtitle: joi.string().max(120).allow(""),
    category: joi.string().allow(""),
    subCategory: joi.string().allow(""),
    language: joi.string().allow(""),
    coureTags: joi.array().max(50).allow(""),
    descriotion: joi.string().min(60).max(200).allow(""),
    level: joi
      .string()
      .valid(...allowedLevels)
      .allow(""),
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

export const getCoursesWithCategSchema = joi
  .object({
    categoryId: joi.string().custom(isValidObjectId).required(),
  })
  .required();

export const getCoursesWithCategAndSubCategSchema = joi
  .object({
    categoryId: joi.string().custom(isValidObjectId).required(),
    subCategoryId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
