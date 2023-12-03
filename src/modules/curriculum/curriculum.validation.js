import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

export const createVideoSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
    title: joi.string(),
    describtion: joi.string(),
    order: joi.string(),
  })
  .unknown(true);

export const createArticleSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
    title: joi.string(),
    quillContent: joi.string(),
    order: joi.string(),
  })
  .unknown(true);
export const editCurriculumSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
    curriculumId: joi.string().custom(isValidObjectId).required(),
    startPosition: joi.string().required(),
    endPosition: joi.string().required(),
  })
  .unknown(true);

export const editVideoSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
    videoId: joi.string().custom(isValidObjectId).required(),
    title: joi.string(),
    describtion: joi.string(),
  })
  .unknown(true);

export const editArticleSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
    articleId: joi.string().custom(isValidObjectId).required(),
    title: joi.string(),
    quillContent: joi.string(),
  })
  .unknown(true);
export const deleteVideoSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
    videoId: joi.string().custom(isValidObjectId).required(),
  })
  .required();

export const deleteArticleSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
    articleId: joi.string().custom(isValidObjectId).required(),
  })
  .required();

export const getVideoSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
    videoId: joi.string().custom(isValidObjectId).required(),
  })
  .required();

export const getArticleSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
    articleId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
export const getCurriculumSchema = joi
  .object({
    courseId: joi.string().custom(isValidObjectId).required(),
    chapterId: joi.string().custom(isValidObjectId).required(),
  })
  .required();
