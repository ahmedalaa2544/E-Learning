import { asyncHandler } from "../../utils/asyncHandling.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Quiz from "../../../DB/model/quiz.model.js";
import Question from "../../../DB/model/question.model.js";
import Option from "../../../DB/model/option.model.js";
import Answer from "../../../DB/model/answer.model.js";
import QuizPerformance from "../../../DB/model/quizPerformance.js";
import { mergeSort, shuffleArray, findMax } from "../../utils/dataSructures.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import upload, {
  deleteDirectory,
  deleteBlob,
  generateSASUrl,
} from "../../utils/azureServices.js";
import userModel from "../../../DB/model/user.model.js";
import notificationModel from "../../../DB/model/notification.model.js";
import courseModel from "../../../DB/model/course.model.js";
import { getIo } from "../../utils/server.js";
import webpush from "web-push";

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
  const { type, text, multiple, points, required } = req.body;

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
    imageBlobName = `Users\\${req.userId}\\Courses\\${
      req.course._id
    }\\Chapters\\${req.chapter._id.toString()}\\Quiz\\${curriculumId}\\question\\${questionId}\\${
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
    course: req.course,
    chapter: req.chapter,
    curriculum: curriculumId,
    quiz: req.quiz,
    order,
    type,
    imageBlobName,
    imageUrl,
    text,
    multiple,
    points,
    required,
  });

  // Return appropriate response based on the success of question creation
  return question
    ? res.status(200).json({
        message: "Done",
        question: {
          ...question._doc,
          imageBlobName: undefined,
        },
      })
    : res.status(500).json({ message: "Something went wrong" });
});
/**
 * Handles the creation of a new option for a specific question, including the option's text and image.
 * Validates correctAnswer based on the question's configuration.
 * Ensures that at least one option is marked as the correct answer for single-choice questions.
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

  // Retrieve the associated question from the database
  const question = await Question.findById(questionId);

  // Check if the question exists; if not, send a 404 error response
  if (!question) {
    return next(new Error("Question not found"), { cause: 404 });
  }

  // Fetch existing options for the question
  const options = await Option.find({ question: questionId });

  // Validate correctAnswer based on the question's configuration
  if (!question.multiple && correctAnswer) {
    // Ensure that one option is marked as the correct answer for single-choice questions
    if (options.some((option) => option.correctAnswer)) {
      return res.status(404).json({
        message:
          "Please ensure that one option is marked as the correct answer",
      });
    }
  }

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
    imageBlobName = `Users\\${req.userId}\\Courses\\${
      req.course._id
    }\\Chapters\\${
      req.chapter._id
    }\\Quiz\\${curriculumId}\\question\\${questionId}\\options\\${optionId}\\${
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
    course: req.course,
    chapter: req.chapter,
    curriculum: curriculumId,
    question: questionId,
    order,
    text,
    imageUrl,
    imageBlobName,
    correctAnswer,
  });

  // Return appropriate response based on the success of option creation
  return option
    ? res.status(200).json({
        message: "Done",
        option: {
          ...option._doc,
          imageBlobName: undefined,
        },
      })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Edits the details of a quiz associated with a specific curriculum.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON response indicating the success or failure of the quiz editing process.
 */
export const editQuiz = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { curriculumId } = req.params;
  const {
    title,
    description,
    timeLimit,
    shuffleQuestions,
    shuffleAnswers,
    maxAttempts,
    maxQuestionsInPage,
    lockdown,
    numberOfQuestions,
    allowedToReturn,
  } = req.body;

  // Retrieve the curriculum associated with the provided curriculumId
  const curriculum = await Curriculum.findById(curriculumId);

  // Update the title of the curriculum
  await Curriculum.findByIdAndUpdate(curriculumId, { title: title });

  // Update the details of the quiz associated with the curriculum
  const quiz = await Quiz.findByIdAndUpdate(curriculum.quiz, {
    description,
    timeLimit,
    shuffleQuestions,
    shuffleAnswers,
    maxAttempts,
    maxQuestionsInPage,
    lockdown,
    numberOfQuestions,
    allowedToReturn,
  });

  // Send a response indicating the success or failure of the quiz editing process
  return quiz
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Edits the details of a question within a curriculum, including reordering if specified.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON response indicating the success or failure of the question editing process.
 */
export const editQuestion = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { curriculumId, questionId } = req.params;
  const { type, text, multiple, points, required, startPosition, endPosition } =
    req.body;
  const changeOrder = req.query.change_order;

  // Find the existing question based on questionId
  const question = await Question.findById(questionId);
  // Check if the question exists; if not, send a 404 error response
  if (!question) {
    return next(new Error("Question not found"), { cause: 404 });
  }
  // Check if the request involves deleting the image.
  if (req.query.delete === "image") {
    //delete it from azure storage
    await deleteBlob(question.imageBlobName);
    // Update the Question document in the database to remove question-related details.
    await Question.findByIdAndUpdate(questionId, {
      imageUrl: "",
      imageBlobName: "",
    });
  }

  /**
   * Update the order of questions within a curriculum based on changes in question sequence.
   * This function assumes that the necessary parameters (curriculumId, startPosition, endPosition, changeOrder) are available in the surrounding scope.
   */
  // If changeOrder flag is provided, update the order of questions accordingly
  if (changeOrder) {
    // This block handles reordering questions when moving a question down in the sequence
    if (startPosition < endPosition) {
      // If the new position is after the original position, shift items up
      await Question.updateMany(
        {
          curriculum: curriculumId,
          order: {
            $gt: startPosition,
            $lte: endPosition,
          },
        },
        { $inc: { order: -1 } }
      );
    }
    // This block handles reordering questions when moving a question up in the sequence
    else if (startPosition > endPosition) {
      // If the new position is before the original position, shift items down
      await Question.updateMany(
        {
          curriculum: curriculumId,
          order: {
            $gte: endPosition,
            $lt: startPosition,
          },
        },
        { $inc: { order: 1 } }
      );
    }

    // Update the order of the edited question
    const editedQuestionOrder = await Question.findByIdAndUpdate(questionId, {
      order: endPosition,
    });

    // Send a response based on the success or failure of the order update
    return editedQuestionOrder
      ? res.status(200).json({ message: "Done" })
      : res.status(500).json({
          message: "Something went wrong during question order update.",
        });
  }

  // If changeOrder flag is not provided, update fields of the Question
  let imageBlobName, imageUrl;

  // Check if a file is attached for question image
  if (req.file) {
    // Extract the extension for the question image.
    const blobImageExtension = req.file?.originalname.split(".").pop();

    // Define the path for the question image in the user's course directory.
    imageBlobName = `Users\\${req.userId}\\Courses\\${
      req.course._id
    }\\Chapters\\${
      req.chapter._id
    }\\Quiz\\${curriculumId}\\question\\${questionId}\\${
      req.file.originalname
    }_${uuidv4()}.${blobImageExtension}`;

    // Upload the question image and obtain its URL.
    imageUrl = await upload(
      req.file?.path,
      imageBlobName,
      "image",
      blobImageExtension
    );
  }

  // Update fields of the Question
  const editedQuestion = await Question.findByIdAndUpdate(questionId, {
    type,
    imageBlobName,
    imageUrl,
    text,
    multiple,
    points,
    required,
  });

  // Send a response based on the success or failure of the Question edit
  return editedQuestion
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({
        message: "Something went wrong during question details update.",
      });
});

/**
 * Edits the details of a Option within a question, including reordering if specified.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON response indicating the success or failure of the question editing process.
 */
export const editOption = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { curriculumId, questionId, optionId } = req.params;
  const { text, correctAnswer, startPosition, endPosition } = req.body;
  const changeOrder = req.query.change_order;
  // Find the existing option based on optionId
  const option = await Option.findById(optionId);

  // Check if the option exists; if not, send a 404 error response
  if (!option) {
    return next(new Error("option not found"), { cause: 404 });
  }
  // Check if the request involves deleting the image.
  if (req.query.delete === "image") {
    //delete it from azure storage
    await deleteBlob(option.imageBlobName);
    // Update the option document in the database to remove option-related details.
    await Option.findByIdAndUpdate(optionId, {
      imageUrl: "",
      imageBlobName: "",
    });
  }

  /**
   * Update the order of options within a curriculum based on changes in option sequence.
   * This function assumes that the necessary parameters (curriculumId, startPosition, endPosition, changeOrder) are available in the surrounding scope.
   */
  // If changeOrder flag is provided, update the order of options accordingly
  if (changeOrder) {
    // This block handles reordering options when moving a option down in the sequence
    if (startPosition < endPosition) {
      // If the new position is after the original position, shift items up
      await Option.updateMany(
        {
          question: questionId,
          order: {
            $gt: startPosition,
            $lte: endPosition,
          },
        },
        { $inc: { order: -1 } }
      );
    }
    // This block handles reordering options when moving a option up in the sequence
    else if (startPosition > endPosition) {
      // If the new position is before the original position, shift items down
      await Option.updateMany(
        {
          question: questionId,
          order: {
            $gte: endPosition,
            $lt: startPosition,
          },
        },
        { $inc: { order: 1 } }
      );
    }

    // Update the order of the edited option
    const editedOptionOrder = await Option.findByIdAndUpdate(optionId, {
      order: endPosition,
    });

    // Send a response based on the success or failure of the order update
    return editedOptionOrder
      ? res.status(200).json({ message: "Done" })
      : res.status(500).json({
          message: "Something went wrong during option order update.",
        });
  }

  let imageBlobName, imageUrl;

  // Check if a file is attached for option image
  if (req.file) {
    // Extract the extension for the option image.
    const blobImageExtension = req.file?.originalname.split(".").pop();

    // Define the path for the option image in the user's course directory.
    imageBlobName = `Users\\${req.userId}\\Courses\\${
      req.course._id
    }\\Chapters\\${
      req.chapter._id
    }\\Quiz\\${curriculumId}\\question\\${questionId}\\options\\${optionId}\\${
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

  // Update fields of the Option
  const editedOption = await Option.findByIdAndUpdate(optionId, {
    imageBlobName,
    imageUrl,
    text,
    correctAnswer,
  });

  // Send a response based on the success or failure of the Option edit
  return editedOption
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({
        message: "Something went wrong during Option details update.",
      });
});
/**
 * Deletes a quiz, including its associated questions, options, and curriculum, based on the provided curriculumId.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON response indicating the success or failure of the quiz deletion process.
 */
export const deleteQuiz = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { curriculumId } = req.params;
  //delete directory in azure
  const quizDirectoryblob = `Users\\${
    req.userId
  }\\Courses\\${req.course._id.toString()}\\Chapters\\${req.chapter._id.toString()}\\Quiz\\${curriculumId}`;
  await deleteDirectory(quizDirectoryblob);
  // Delete all options associated with the curriculum
  await Option.deleteMany({ curriculum: curriculumId });

  // Delete all questions associated with the curriculum
  await Question.deleteMany({ curriculum: curriculumId });

  // Delete the curriculum document
  await Curriculum.deleteOne({ _id: curriculumId });

  // Delete the quiz document
  const quiz = await Quiz.deleteOne({ curriculum: curriculumId });

  // Send a response indicating the success or failure of the quiz deletion process
  return quiz
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Handles the deletion of a specific question, updating the order of subsequent questions and deleting associated options.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON response indicating the success or failure of the operation.
 */
export const deleteQuestion = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { curriculumId, questionId } = req.params;
  //delete directory in azure
  const questionDirectoryblob = `Users\\${
    req.userId
  }\\Courses\\${req.course._id.toString()}\\Chapters\\${req.chapter._id.toString()}\\Quiz\\${curriculumId}\\question\\${questionId}`;
  await deleteDirectory(questionDirectoryblob);
  // Find the question to be deleted
  const question = await Question.findById(questionId);

  // Update the order of subsequent questions associated with the same curriculum
  await Question.updateMany(
    {
      curriculum: curriculumId,
      order: {
        $gt: question.order,
      },
    },
    { $inc: { order: -1 } }
  );

  // Delete all options associated with the question
  await Option.deleteMany({ question: questionId });

  // Delete the specified question
  const deletedQuestion = await Question.deleteOne({ _id: questionId });

  // Send a response indicating the success or failure of the question deletion process
  return deletedQuestion
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Handles the deletion of a specific option associated with a question, updating the order of subsequent options.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON response indicating the success or failure of the operation.
 */
export const deleteOption = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { curriculumId, questionId, optionId } = req.params;
  //delete directory in azure
  const questionDirectoryblob = `Users\\${
    req.userId
  }\\Courses\\${req.course._id.toString()}\\Chapters\\${req.chapter._id.toString()}\\Quiz\\${curriculumId}\\options\\${optionId}`;
  await deleteDirectory(questionDirectoryblob);
  // Find the option to be deleted
  const option = await Option.findById(optionId);

  // Update the order of subsequent options associated with the same question
  await Option.updateMany(
    {
      question: questionId,
      order: {
        $gt: option.order,
      },
    },
    { $inc: { order: -1 } }
  );

  // Delete the specified option
  const deletedOption = await Option.deleteOne({ _id: optionId });

  // Send a response indicating the success or failure of the option deletion process
  return deletedOption
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Retrieves the details of a quiz, including its questions and options, based on the provided curriculumId.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - Returns a JSON response containing the quiz details, including questions and options.
 */
export const getQuiz = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { curriculumId } = req.params;
  let quiz = await Quiz.findById(req.quiz);
  // Retrieve questions associated with the quiz
  let questions = await Question.find({ quiz: req.quiz }).sort({ order: 1 });
  // Retrieve options for each question and enhance the data
  questions = await Promise.all(
    questions.map(async (question) => {
      const { accountSasTokenUrl: questionImageUrl } = await generateSASUrl(
        question.imageBlobName,
        "r",
        "60"
      );
      let options = await Option.find({ question: question._id }).sort({
        order: 1,
      });
      options = await Promise.all(
        options.map(async (option) => {
          const { accountSasTokenUrl: optionImageUrl } = await generateSASUrl(
            option.imageBlobName,
            "r",
            "60"
          );
          return {
            ...option._doc,
            course: undefined,
            chapter: undefined,
            curriculum: undefined,
            question: undefined,
            imageBlobName: undefined,
            imageUrl: optionImageUrl,
          };
        })
      );
      // Enhance question data with additional information
      return {
        ...question._doc,
        course: undefined,
        chapter: undefined,
        curriculum: undefined,
        quiz: undefined,
        imageBlobName: undefined,
        imageUrl: questionImageUrl,
        optionsNumber: options.length,
        options,
      };
    })
  );

  // Construct the quiz object with enhanced question data
  quiz = {
    ...quiz._doc,
    course: req.curriculum.course,
    chapter: req.curriculum.chapter,
    title: req.curriculum.title,
    questionsNumber: questions.length,
    questions,
    // questions: mergeSort(questions, "order"),
  };

  // Return the quiz details in the response
  return quiz
    ? res.status(200).json({ message: "Done", quiz })
    : res.status(500).json({ message: "Something went wrong" });
});
/**
 * Handles the retrieval of a quiz for a student, including verification of attempt limits,
 * shuffling questions if required, and fetching related options. It also ensures that the quiz
 * conforms to the specified constraints like maximum attempts and question requirements.
 *
 * @param {Object} req - The request object from Express, containing necessary data like quiz ID and user ID.
 * @param {Object} res - The response object from Express, used for sending back the quiz data or an error.
 * @param {Function} next - The next middleware function in the Express stack, used for error handling.
 */
export const retrieveQuizForStudent = asyncHandler(async (req, res, next) => {
  // Extract curriculumId from the request parameters to identify the relevant quiz
  const { curriculumId } = req.params;

  // Log the curriculumId for debugging purposes

  // Retrieve the quiz document based on the ID provided in the request
  let quiz = await Quiz.findById(req.quiz);
  const maxAttempts = quiz.maxAttempts;

  // Count how many times the student has already attempted this quiz
  const studentNumberOfAttempts = await QuizPerformance.countDocuments({
    curriculum: curriculumId,
    student: req.userId,
  });

  // Check if the student has exceeded the maximum number of allowed attempts
  if (maxAttempts <= studentNumberOfAttempts && !maxAttempts === 0) {
    return next(new Error("You have exhausted all your attempts"), {
      cause: 403,
    });
  }

  // Initialize variable to track the total points possible in the quiz
  let fullMark = 0;

  // Determine the number of questions to include in the quiz
  const numberOfQuestions =
    quiz.numberOfQuestions === 0 ? Infinity : quiz.numberOfQuestions;
  const isShuffledQuestions = quiz.shuffleQuestions;
  let questions = [];

  // Fetch required and unrequired questions based on their necessity flag
  let requiredQuestions = await Question.find({
    quiz: req.quiz,
    required: true,
  }).sort({ order: 1 });
  let unRequiredQuestions = await Question.find({
    quiz: req.quiz,
    required: false,
  }).sort({ order: 1 });

  // Optionally shuffle the questions if specified by the quiz settings
  requiredQuestions = isShuffledQuestions
    ? shuffleArray(requiredQuestions)
    : requiredQuestions;
  unRequiredQuestions = isShuffledQuestions
    ? shuffleArray(unRequiredQuestions)
    : unRequiredQuestions;

  // Determine the mix of required and unrequired questions based on the total needed
  const sliceLimit = numberOfQuestions - requiredQuestions.length;
  if (sliceLimit <= 0) {
    questions = requiredQuestions.slice(0, numberOfQuestions);
  } else {
    unRequiredQuestions = unRequiredQuestions.slice(0, sliceLimit);
    questions = [...new Set([...requiredQuestions, ...unRequiredQuestions])];
  }

  // Optionally shuffle the final list of questions
  questions = isShuffledQuestions ? shuffleArray(questions) : questions;

  // Calculate the full mark possible by summing up points from all questions
  questions.map((question) => {
    fullMark += question.points;
  });

  // Enhance questions by adding images and shuffling options if needed
  questions = await Promise.all(
    questions.map(async (question) => {
      // Generate secure access URL for question images
      const { accountSasTokenUrl: questionImageUrl } = await generateSASUrl(
        question.imageBlobName,
        "r",
        "60"
      );
      // Fetch options for each question
      let options = await Option.find({ question: question._id }).sort({
        order: 1,
      });

      // Shuffle options if the quiz settings specify it
      if (quiz.shuffleAnswers) {
        options = shuffleArray(options);
      }

      // Enhance each option by generating image URLs and excluding unnecessary fields
      options = await Promise.all(
        options.map(async (option) => {
          const { accountSasTokenUrl: optionImageUrl } = await generateSASUrl(
            option.imageBlobName,
            "r",
            "60"
          );
          return {
            ...option._doc,
            course: undefined,
            chapter: undefined,
            curriculum: undefined,
            question: undefined,
            imageBlobName: undefined,
            imageUrl: optionImageUrl,
            correctAnswer: undefined,
            order: undefined,
          };
        })
      );

      // Return enhanced question data
      return {
        ...question._doc,
        course: undefined,
        chapter: undefined,
        curriculum: undefined,
        quiz: undefined,
        imageBlobName: undefined,
        imageUrl: questionImageUrl,
        optionsNumber: options.length,
        options,
        order: undefined,
      };
    })
  );

  // Reconstruct the quiz object to include the enhanced questions and additional quiz data
  quiz = {
    ...quiz._doc,
    fullMark,
    course: req.curriculum.course,
    chapter: req.curriculum.chapter,
    title: req.curriculum.title,
    questionsNumber: questions.length,
    questions,
  };

  // Send the complete quiz data to the student, or an error if something went wrong
  return quiz
    ? res.status(200).json({ message: "Done", quiz })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Submits a completed quiz, evaluates the answers, calculates the score, and updates the user's quiz performance.
 *
 * @param {Object} req - Express.js request object containing request parameters and body.
 * @param {Object} res - Express.js response object used for sending responses to the client.
 * @param {Function} next - Middleware function to handle errors or move to the next middleware.
 */
export const submitQuiz = asyncHandler(async (req, res, next) => {
  // Extract curriculumId from the request parameters and quiz data from the request body
  const { curriculumId } = req.params;
  const { quiz } = req.body;

  // Retrieve quiz document from the database to check submission rules and attempt limits
  const quizDoc = await Quiz.findById(req.quiz);
  const allowedToReturn = quizDoc.allowedToReturn;
  const maxAttempts = quizDoc.maxAttempts;

  // Count how many times the student has already attempted this quiz
  const studentNumberOfAttempts = await QuizPerformance.countDocuments({
    curriculum: curriculumId,
    student: req.userId,
  });

  // Check if the student has exceeded the maximum number of allowed attempts
  if (maxAttempts <= studentNumberOfAttempts && !maxAttempts === 0) {
    return next(new Error("You have exhausted all your attempts"), {
      cause: 403,
    });
  }

  // Determine the attempt number for this submission
  const numberOfAttempt = studentNumberOfAttempts + 1;
  let studentTotalPoints = 0;
  let quizFullMark = 0;
  const questionsPerformance = [];

  // Iterate over each question in the submitted quiz to evaluate answers
  await Promise.all(
    quiz.map(async (question) => {
      const questionId = question.questionId;
      const questionDoc = await Question.findById(questionId);
      const questionPoints = questionDoc.points;
      // Update total points possible for the quiz
      quizFullMark += questionPoints;
      const multiple = questionDoc.multiple;

      if (multiple) {
        // Handle multiple choice questions
        const studentAnswers = question.answers;
        const correctAnswers = await Option.find({
          question: questionId,
          correctAnswer: true,
        });
        let isUserSolutionCorrect =
          correctAnswers.length === studentAnswers.length;

        // Verify each submitted answer against the correct answers
        await Promise.all(
          studentAnswers.map(async (answer) => {
            const isUserAnswerCorrect = correctAnswers.some(
              (item) => answer === item._id.toString()
            );
            if (!isUserAnswerCorrect) isUserSolutionCorrect = false;

            // Record each answer in the database
            await Answer.create({
              course: req.course,
              chapter: req.chapter,
              curriculum: curriculumId,
              question: questionId,
              answer: answer,
              student: req.userId,
              isCorrect: isUserAnswerCorrect,
              multiple,
              numberOfAttempt,
            });
          })
        );
        // Update points if the solution is correct
        if (isUserSolutionCorrect) {
          studentTotalPoints += questionPoints;
        }
        questionsPerformance.push({
          question: questionDoc._id,
          isUserSolutionCorrect,
        });
      } else {
        // Handle single choice questions
        const studentAnswer = question.answers[0];
        const correctAnswerDoc = await Option.findOne({
          question: questionId,
          correctAnswer: true,
        }).select("_id");
        const correctAnswer = correctAnswerDoc._id.toString();
        let isUserSolutionCorrect = correctAnswer === studentAnswer;

        // Update points if the solution is correct
        if (isUserSolutionCorrect) {
          studentTotalPoints += questionPoints;
        }
        // Record the answer in the database
        await Answer.create({
          course: req.course,
          chapter: req.chapter,
          curriculum: curriculumId,
          question: questionId,
          answer: studentAnswer,
          student: req.userId,
          isCorrect: isUserSolutionCorrect,
          multiple,
          numberOfAttempt,
        });
        questionsPerformance.push({
          question: questionDoc._id,
          isUserSolutionCorrect,
        });
      }
    })
  );

  // Update the full mark for the quiz document
  await Quiz.findByIdAndUpdate(req.quiz, { fullMark: quizFullMark });

  // Create a quiz performance document to record the attempt
  const quizPerformance = await QuizPerformance.create({
    course: req.course,
    chapter: req.chapter,
    curriculum: curriculumId,
    student: req.userId,
    questionsPerformance,
    quizFullMark,
    studentTotalPoints,
    numberOfAttempt,
  });

  // Send the response with the quiz performance or an error message
  return quizPerformance
    ? res.status(200).json({ message: "Done", allowedToReturn })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Retrieves and returns the results of all quiz attempts by a student for a specific curriculum,
 * including the best score achieved.
 *
 * @param {Object} req - Express.js request object that contains the client's request data.
 * @param {Object} res - Express.js response object used to send responses back to the client.
 * @param {Function} next - Middleware dispatch function used to forward any errors to the next middleware.
 */
export const quizResult = asyncHandler(async (req, res, next) => {
  // Extract curriculum ID from the request parameters and user ID from the request object
  const { curriculumId } = req.params;
  const student = req.userId;

  // Retrieve the quiz document by ID stored in request object to get quiz-specific information
  const quiz = await Quiz.findById(req.quiz);
  const fullMark = quiz.fullMark; // Maximum score achievable on the quiz
  const allowedToReturn = quiz.allowedToReturn; // Boolean indicating if results can be returned to the student

  // Check if the quiz results are allowed to be returned to the student
  if (!allowedToReturn) {
    // If not allowed, send a 403 forbidden response with an error message
    return next(
      new Error("Instructor didn't allow to return your result, yet."),
      {
        cause: 403,
      }
    );
  }

  // Retrieve all quiz performances for this curriculum and student
  const results = await QuizPerformance.find({
    curriculum: curriculumId,
    student,
  }).select("numberOfAttempt studentTotalPoints -_id"); // Selects only the number of attempts and total points, excluding the document ID

  // Find the maximum result based on student total points
  const maxResult = findMax(results, "studentTotalPoints");

  // Check if results were successfully retrieved and respond accordingly
  return results
    ? res
        .status(200)
        .json({ message: "Done", result: { fullMark, maxResult, results } }) // Return the quiz results, including the highest score
    : res.status(500).json({ message: "Something went wrong" }); // Handle cases where results retrieval may have failed
});

/**
 * Retrieves and returns detailed quiz performance for a specific attempt by a student.
 * This includes the total points scored, correctness of each answer, and detailed question and option performance.
 *
 * @param {Object} req - Express.js request object that contains the client's request data.
 * @param {Object} res - Express.js response object used to send responses back to the client.
 * @param {Function} next - Middleware dispatch function used to forward any errors to the next middleware.
 */
export const quizPerformance = asyncHandler(async (req, res, next) => {
  // Extracts curriculum ID from the request parameters
  const { curriculumId } = req.params;

  // Retrieve the attempt number from the query string or default to 1 if not provided
  const numberOfAttempt = req.query.numberOfAttempt || 1;

  // Retrieve the quiz details using the ID stored in the request object
  const quiz = await Quiz.findById(req.quiz);
  const allowedToReturn = quiz.allowedToReturn; // Determines if results can be shown to the student

  // Check if the instructor has allowed results to be returned, otherwise send an error
  if (!allowedToReturn) {
    return next(
      new Error("Instructor didn't allow to return your result, yet."),
      { cause: 403 }
    );
  }

  // Fetch the performance data for the specific curriculum, student, and attempt number
  const result = await QuizPerformance.findOne({
    curriculum: curriculumId,
    student: req.userId,
    numberOfAttempt,
  }).select("numberOfAttempt studentTotalPoints questionsPerformance -_id");

  const questionsStudentPerformance = result.questionsPerformance; // Detailed performance per question
  const questions = await Question.find({ curriculum: curriculumId }); // Fetch all questions for the curriculum
  const options = await Option.find({ curriculum: curriculumId }).select(
    "_id order text imageBlobName correctAnswer question"
  ); // Fetch all options related to those questions

  const studentTotalPoints = result.studentTotalPoints; // Total points scored by the student in this attempt
  const quizFullMark = quiz.fullMark; // Maximum points available for the quiz

  // Fetch all answers given by the student in this attempt
  const studentAnswers = await Answer.find({
    curriculum: curriculumId,
    student: req.userId,
    numberOfAttempt,
  }).select("answer isCorrect");

  // Map through each question's performance to enrich it with additional data such as image URLs and option correctness
  const quizPerformance = await Promise.all(
    questionsStudentPerformance.map(async (questionPerformance) => {
      const isUserSolutionCorrect = questionPerformance.isUserSolutionCorrect;
      const questionId = questionPerformance.question;
      const question = questions.find(
        (item) => questionId.toString() === item._id.toString()
      );
      const { accountSasTokenUrl: questionImageUrl } = await generateSASUrl(
        question.imageBlobName,
        "r",
        "60"
      );

      // Filter the options relevant to the current question and augment them with performance and image data
      const questionOptions = options.filter(
        (item) => questionId.toString() === item.question.toString()
      );
      let optionsPerformance = await Promise.all(
        questionOptions.map(async (option) => {
          const { accountSasTokenUrl: optionImageUrl } = await generateSASUrl(
            option.imageBlobName,
            "r",
            "60"
          );
          const studentAnswer = studentAnswers.find(
            (item) => option._id.toString() === item.answer.toString()
          );
          const isUserChoseThatOption = !!studentAnswer;
          const isThatOptionCorrectAnswer = option.correctAnswer;
          const rightChoose = studentAnswer?.isCorrect;
          const rightUnchoose = !studentAnswer && !isThatOptionCorrectAnswer;
          const isUserAnswerCorrect = rightChoose || rightUnchoose;

          return {
            isUserChoseThatOption,
            isUserAnswerCorrect,
            isThatOptionCorrectAnswer,
            imageUrl: optionImageUrl,
            text: option.text,
          };
        })
      );

      return {
        multiple: question.multiple,
        isUserSolutionCorrect,
        imageUrl: questionImageUrl,
        text: question.text,
        type: question.type,
        points: question.points,
        optionsPerformance,
      };
    })
  );

  // If performance data was successfully generated, return it in the response; otherwise, handle an error scenario
  return quizPerformance
    ? res.status(200).json({
        message: "Done",
        performance: { studentTotalPoints, quizFullMark, quizPerformance },
      })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Allows the instructor to enable returning quiz results to students for a specific curriculum.
 * It updates the quiz document to set the allowedToReturn flag to true and notifies the students
 * who have attempted the quiz.
 *
 * @param {Object} req - Express.js request object containing request parameters and data.
 * @param {Object} res - Express.js response object used for sending responses to the client.
 * @param {Function} next - Middleware dispatch function to handle errors or pass control to the next middleware.
 */
export const allowToReturnQuiz = asyncHandler(async (req, res, next) => {
  // Extract curriculum ID from the request parameters
  const { curriculumId } = req.params;

  // Retrieve instructor information to identify who is allowing the quiz results to be returned
  const instructor = await userModel
    .findById(req.userId)
    .select("userName -_id");
  const instructorUserName = instructor.userName;

  // Update the quiz document to allow returning results
  const quiz = await Quiz.findByIdAndUpdate(req.quiz, {
    allowedToReturn: true,
  }).select("_id allowedToReturn");

  // Find all students who have attempted the quiz and need to be notified
  const studentsToNotify = await QuizPerformance.find({
    curriculum: curriculumId,
    numberOfAttempt: 1,
  }).select("student course -_id");

  // If the quiz was not already allowed to return results, notify students
  if (true || !quiz.allowedToReturn) {
    const quizTitle = req.curriculum.title; // Title of the quiz's curriculum
    const courseTitle = req.course.title; // Title of the course associated with the curriculum

    // Construct notification message for students
    const message = `${instructorUserName} in course "${courseTitle}" has returned the quiz "${quizTitle}" to you. You can now view your results.`;
    // Construct notification object
    const coverImageUrl = req.course.coverImageUrl;

    const notification = {
      image: coverImageUrl,
      title: "Quiz Results",
      body: message,
      url: `https://e-learning-azure.vercel.app/courseDetails/${req.course._id}`,
    };
    // Notify each student who attempted the quiz
    await Promise.all(
      studentsToNotify.map(async (student) => {
        const studentId = student.student.toString();
        const { socketId, popUpId } = await userModel.findById(studentId);

        // Update or create a notification for the student
        let notify = await notificationModel.findOneAndUpdate(
          { user: studentId },
          { $push: { notifications: notification } },
          { new: true }
        );

        if (!notify) {
          notify = notificationModel.create({
            user: studentId,
            notifications: notification,
          });
        }

        getIo().to(socketId).emit("notification", notification);

        // Send web push notification if student has a registered endpoint
        if (popUpId.endpoint) {
          webpush.sendNotification(popUpId, JSON.stringify(notification));
        }
      })
    );
  }

  // Return success message if students were notified successfully
  return studentsToNotify
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({ message: "Something went wrong" });
});
