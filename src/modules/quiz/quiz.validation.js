import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

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
    timeLimit: joi.number().positive(),
    shuffleQuestions: joi.boolean().required(),
    shuffleAnswers: joi.boolean().required(),
    showCorrectAnswer: joi.boolean().required(),
    maxAttempts: joi.number().integer().positive(),
    maxQuestionsInPage: joi.number().integer().positive(),
    lockdown: joi.boolean().required(),
    numberOfQuestions: joi.number().integer().positive(),
  })
  .unknown(true);
