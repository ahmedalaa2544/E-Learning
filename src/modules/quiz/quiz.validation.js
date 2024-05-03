import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.js";

export const basicSchema = joi
  .object({
    curriculumId: joi.string().custom(isValidObjectId).required(),
  })
  .unknown(true);

const answerSchema = joi.string().required();
const questionSchema = joi.object({
  questionId: joi.string().required(), // ID of the question (required)
  answers: joi.array().items(answerSchema).required(), // Array of answers for the question (required)
});
export const submitQuizSchema = joi
  .object({
    curriculumId: joi.string().custom(isValidObjectId).required(),
    quiz: joi.array().items(questionSchema).min(1).required(), // The quiz object should contain an array of questions
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
