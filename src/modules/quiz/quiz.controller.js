import { asyncHandler } from "../../utils/asyncHandling.js";
import Course from "../../../DB/model/course.model.js";
import Chapter from "../../../DB/model/chapter.model.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Quiz from "../../../DB/model/quiz.model.js";
import Question from "../../../DB/model/question.model.js";
import Option from "../../../DB/model/option.model.js";

import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import upload, {
  deleteDirectory,
  deleteBlob,
  generateSASUrl,
} from "../../utils/azureServices.js";

/**
 * Creates a new quiz question for a specific curriculum, handling file uploads for question images.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON response indicating the success or failure of the operation.
 *                    If successful, returns the created question in the response.
 */
export const createQuestion = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { curriculumId } = req.params;
  const { type, text, multiple, sorted } = req.body;

  // Fetch existing questions for the quiz
  const questions = await Question.find({ quiz: req.quiz });

  // Calculate the order of the new question
  const order = questions.length + 1;
  // Generate a unique questionId using MongoDB ObjectId
  const questionId = new mongoose.Types.ObjectId();
  let imageBlobName, imageUrl;

  // Check if a file is attached for question image
  if (req.file) {
    // Extract the extension for the cover image.
    const blobImageExtension = req.file?.originalname.split(".").pop();

    // Define the path for the cover image in the user's course directory.
    imageBlobName = `Users\\${req.userId}\\Courses\\${req.course}\\${
      req.chapter
    }\\Quiz\\${curriculumId}\\question\\${questionId}\\${
      req.file.originalname
    }_${uuidv4()}.${blobImageExtension}`;

    // Upload the cover image and obtain its URL.
    imageUrl = await upload(
      req.file?.path,
      imageBlobName,
      "image",
      blobImageExtension
    );
  }

  // Create a new question document in the database
  const question = await Question.create({
    _id: questionId,
    curriculum: curriculumId,
    quiz: req.quiz,
    order,
    type,
    imageBlobName,
    imageUrl,
    text,
    multiple,
    sorted,
  });

  // Return appropriate response based on the success of question creation
  return question
    ? res.status(200).json({ message: "Done", question: question._doc })
    : res.json({ message: "Something went wrong" });
});
/**
 * Handles the creation of a new option for a specific question, including the option's text and image.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON response indicating the success or failure of the operation.
 *                    If successful, returns the created option in the response.
 */
export const createOption = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { curriculumId, questionId } = req.params;
  const { text, correctAnswer } = req.body;

  // Fetch existing options for the question
  const options = await Option.find({ question: questionId });

  // Calculate the order of the new option
  const order = options.length + 1;

  // Generate a unique optionId using MongoDB ObjectId
  const optionId = new mongoose.Types.ObjectId();

  let imageBlobName, imageUrl;

  // Check if a file is attached for option image
  if (req.file) {
    // Extract the extension for the option image.
    const blobImageExtension = req.file?.originalname.split(".").pop();

    // Define the path for the option image in the user's course directory.
    imageBlobName = `Users\\${req.userId}\\Courses\\${req.course}\\${
      req.chapter
    }\\Quiz\\${curriculumId}\\options\\${optionId}\\${
      req.file.originalname
    }_${uuidv4()}.${blobImageExtension}`;

    // Upload the option image and obtain its URL.
    imageUrl = await upload(
      req.file?.path,
      imageBlobName,
      "image",
      blobImageExtension
    );
  }

  // Create a new option document in the database
  const option = await Option.create({
    _id: optionId,
    question: questionId,
    order,
    text,
    imageUrl,
    imageBlobName,
    correctAnswer,
  });

  // Return appropriate response based on the success of option creation
  return option
    ? res.status(200).json({ message: "Done", option: option._doc })
    : res.json({ message: "Something went wrong" });
});
export const getQuiz = asyncHandler(async (req, res, next) => {
  console.log("reach quiz");
  // Extract parameters from the request
  const { curriculumId } = req.params;
  console.log(req.quiz);
  let questions = await Question.find({ quiz: req.quiz });

  questions = await Promise.all(
    questions.map(async (question) => {
      const options = await Option.find({ question: question._id });
      return {
        ...question._doc,
        optionsNumber: options.length,
        options: options,
      };
    })
  );
  const quiz = {
    ...req.quiz._doc,
    questionsNumber: questions.length,
    questions,
  };
  return quiz
    ? res.status(200).json({ message: "Done", quiz })
    : res.json({ message: "Something went wrong" });
});
