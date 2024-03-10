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
    timeLimit: joi.number(),
    shuffleQuestions: joi.boolean(),
    shuffleAnswers: joi.boolean(),
    showCorrectAnswer: joi.boolean(),
    maxAttempts: joi.number().integer(),
    maxQuestionsInPage: joi.number(),
    lockdown: joi.boolean(),
    numberOfQuestions: joi.number().integer(),
  })
  .unknown(true);
