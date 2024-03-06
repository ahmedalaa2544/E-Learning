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
    description: joi.string().min(60).allow(""),
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

export const createRatingSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    rating: joi.number().integer().min(1).max(5).required(),
  })
  .required();

export const createcommentSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    comment: joi.string().min(3).max(120).required(),
  })
  .required();

export const instructorSchema = joi
  .object({
    instructorId: joi.string().custom(isValidObjectId).required(),
    courseId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
