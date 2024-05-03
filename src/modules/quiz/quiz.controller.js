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
      // console.log(questionImageUrl.replace(/%5C/g, "/"));
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
export const retrieveQuizForStudent = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { curriculumId } = req.params;
  console.log(curriculumId);
  let quiz = await Quiz.findById(req.quiz);
  const maxAttempts = quiz.maxAttempts;
  const studentNumberOfAttempts = await QuizPerformance.countDocuments({
    curriculum: curriculumId,
    student: req.userId,
  });
  if (maxAttempts <= studentNumberOfAttempts && !maxAttempts === 0) {
    return next(new Error("You have exhausted all your attempts"), {
      cause: 403,
    });
  }
  // const fullMark = (
  //   await Question.aggregate([
  //     {
  //       $match: { curriculum: new mongoose.Types.ObjectId(curriculumId) }, // Optional: filter condition
  //     },
  //     {
  //       $group: {
  //         _id: null, // Grouping without specific field (all documents considered as a single group)
  //         fullMark: { $sum: "$points" }, // Summing up totalAmount field
  //       },
  //     },
  //   ])
  // )[0].fullMark;
  let fullMark = 0;

  const numberOfQuestions =
    quiz.numberOfQuestions === 0 ? Infinity : quiz.numberOfQuestions;
  const isShuffledQuestions = quiz.shuffleQuestions;
  let questions = [];

  let requiredQuestions = await Question.find({
    quiz: req.quiz,
    required: true,
  }).sort({
    order: 1,
  });

  let unRequiredQuestions = await Question.find({
    quiz: req.quiz,
    required: false,
  }).sort({
    order: 1,
  });

  requiredQuestions = isShuffledQuestions
    ? shuffleArray(requiredQuestions)
    : requiredQuestions;
  unRequiredQuestions = isShuffledQuestions
    ? shuffleArray(unRequiredQuestions)
    : unRequiredQuestions;
  const sliceLimit = numberOfQuestions - requiredQuestions.length;
  if (sliceLimit <= 0) {
    questions = requiredQuestions.slice(0, numberOfQuestions);
  } else {
    unRequiredQuestions = unRequiredQuestions.slice(0, sliceLimit);
    questions = [...new Set([...requiredQuestions, ...unRequiredQuestions])];
  }
  questions = isShuffledQuestions ? shuffleArray(questions) : questions;
  questions.map((question) => {
    fullMark += question.points;
  });
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
      if (quiz.shuffleAnswers) {
        options = shuffleArray(options);
      }
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
        order: undefined,
      };
    })
  );

  // Construct the quiz object with enhanced question data
  quiz = {
    ...quiz._doc,
    fullMark,
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

export const submitQuiz = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { curriculumId } = req.params;
  const { quiz } = req.body;
  const quizDoc = await Quiz.findById(req.quiz);
  const allowedToReturn = quizDoc.allowedToReturn;
  const maxAttempts = quizDoc.maxAttempts;
  const studentNumberOfAttempts = await QuizPerformance.countDocuments({
    curriculum: curriculumId,
    student: req.userId,
  });
  if (maxAttempts <= studentNumberOfAttempts && !maxAttempts === 0) {
    return next(new Error("You have exhausted all your attempts"), {
      cause: 403,
    });
  }
  const numberOfAttempt = studentNumberOfAttempts + 1;
  let studentTotalPoints = 0;
  let quizFullMark = 0;
  const questionsPerformance = [];
  // quiz = [{ questionId, answers: [ _id ,  _id ] },{ _id, answers: [_id ]}];
  await Promise.all(
    quiz.map(async (question) => {
      const questionId = question.questionId;
      const questionDoc = await Question.findById(questionId);
      const questionPoints = questionDoc.points;
      console.log(questionPoints);
      console.log("questionPoints", questionPoints);
      quizFullMark += questionPoints;
      const multiple = questionDoc.multiple;
      if (multiple) {
        const stundentAnswers = question.answers;
        const correctAnswers = await Option.find({
          question: questionId,
          correctAnswer: true,
        });
        let isUserSolutionCorrect =
          correctAnswers.length === stundentAnswers.length;
        await Promise.all(
          stundentAnswers.map(async (answer) => {
            const isUserAnswerCorrect = correctAnswers.some(
              (item) => answer === item._id.toString()
            );
            if (!isUserAnswerCorrect) isUserSolutionCorrect = false;

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
        if (isUserSolutionCorrect) {
          studentTotalPoints += questionPoints;
        }
        questionsPerformance.push({
          question: questionDoc._id,
          isUserSolutionCorrect,
        });
      } else {
        const stundentAnswer = question.answers[0];
        const correctAnswerDoc = await Option.findOne({
          question: questionId,
          correctAnswer: true,
        }).select("_id");
        const correctAnswer = correctAnswerDoc._id.toString();
        let isUserSolutionCorrect = correctAnswer === stundentAnswer;
        console.log("correctAnswer : " + correctAnswer);
        console.log("stundentAnswer : " + stundentAnswer);

        if (isUserSolutionCorrect) {
          studentTotalPoints += questionPoints;
        }
        await Answer.create({
          course: req.course,
          chapter: req.chapter,
          curriculum: curriculumId,
          question: questionId,
          answer: stundentAnswer,
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
  await Quiz.findByIdAndUpdate(req.quiz, { fullMark: quizFullMark });
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
  // const
  return quizPerformance
    ? res.status(200).json({ message: "Done", allowedToReturn })
    : res.status(500).json({ message: "Something went wrong" });
});

export const quizResult = asyncHandler(async (req, res, next) => {
  console.log("reach quiz result");
  console.log(req.userId);
  const { curriculumId } = req.params;
  const student = req.userId;
  const quiz = await Quiz.findById(req.quiz);
  const fullMark = quiz.fullMark;
  const allowedToReturn = quiz.allowedToReturn;
  if (!allowedToReturn) {
    return next(
      new Error("Insructor didn't allow to return your reslut , yet ."),
      {
        cause: 403,
      }
    );
  }
  const resluts = await QuizPerformance.find({
    curriculum: curriculumId,
    student,
  }).select("numberOfAttempt studentTotalPoints -_id");
  const maxResult = findMax(resluts, "studentTotalPoints");
  return resluts
    ? res
        .status(200)
        .json({ message: "Done", result: { fullMark, maxResult, resluts } })
    : res.status(500).json({ message: "Something went wrong" });
});

export const quizPerformance = asyncHandler(async (req, res, next) => {
  const { curriculumId } = req.params;
  const numberOfAttempt = req.query.numberOfAttempt || 1;
  console.log(numberOfAttempt);
  const quiz = await Quiz.findById(req.quiz);
  const allowedToReturn = quiz.allowedToReturn;
  const student = req.userId;
  if (!allowedToReturn) {
    return next(
      new Error("Insructor didn't allow to return your reslut , yet ."),
      {
        cause: 403,
      }
    );
  }
  const result = await QuizPerformance.findOne({
    curriculum: curriculumId,
    student,
    numberOfAttempt,
  }).select("numberOfAttempt studentTotalPoints questionsPerformance -_id");
  const questionsStudentPerformance = result.questionsPerformance;
  const questions = await Question.find({ curriculum: curriculumId });
  const options = await Option.find({ curriculum: curriculumId }).select(
    "_id order text imageBlobName correctAnswer question"
  );
  const studentTotalPoints = result.studentTotalPoints;
  const quizFullMark = quiz.fullMark;

  const studentAnswers = await Answer.find({
    curriculum: curriculumId,
    student,
    numberOfAttempt,
  }).select("answer isCorrect");
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
          const isUserChooceThatOption = studentAnswer ? true : false;
          const isThatOptionCorrectAnswer = option.correctAnswer;
          const reighChooce = studentAnswer?.isCorrect;
          const rightUnchooce = !studentAnswer && !isThatOptionCorrectAnswer;
          const isUserAnswerCorrect =
            reighChooce || rightUnchooce ? true : false;
          return {
            isUserChooceThatOption,
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
  return quizPerformance
    ? res.status(200).json({
        message: "Done",
        performance: { studentTotalPoints, quizFullMark, quizPerformance },
      })
    : res.status(500).json({ message: "Something went wrong" });
});
export const allowToReturnQuiz = asyncHandler(async (req, res, next) => {
  const { curriculumId } = req.params;
  const isntructor = await userModel
    .findById(req.userId)
    .select("userName -_id");
  const instructorUserName = isntructor.userName;
  const quiz = await Quiz.findByIdAndUpdate(req.quiz, {
    allowedToReturn: true,
  }).select("_id allowedToReturn");

  const studentsToNotify = await QuizPerformance.find({
    curriculum: curriculumId,
  }).select("student -_id");
  if (!quiz.allowedToReturn) {
    const quizTitle = req.curriculum.title;
    const courseTitle = req.course.title;
    const message = `${instructorUserName} in course "${courseTitle}" return quiz "${quizTitle}" to you , you can get your results now .`;
    await Promise.all(
      studentsToNotify.map((student) => {
        const sudentId = student.student;
      })
    );
  }
  return studentsToNotify
    ? res.status(200).json({
        message: "Done",
      })
    : res.status(500).json({ message: "Something went wrong" });
});
