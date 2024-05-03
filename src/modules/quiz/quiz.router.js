import { Router } from "express";
const router = Router();
import * as quizController from "./quiz.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./quiz.validation.js";
import isAuthenticated from "../../middleware/authntication.middleware.js";
import isAuthorized from "./quiz.authorization.js";
import { fileUpload, customValidation } from "../../utils/multer.js";

// Create a new question for a specific curriculum
router.post(
  "/:curriculumId/question",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  fileUpload(customValidation.image)?.single("image"),
  validation(validators.basicSchema),
  quizController.createQuestion
);

// Create a new option for a specific question within a curriculum
router.post(
  "/:curriculumId/question/:questionId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  fileUpload(customValidation.image)?.single("image"),
  validation(validators.createOptionSchema),
  quizController.createOption
);

//submit quiz
router.post(
  "/:curriculumId/submitQuiz",
  isAuthenticated,
  isAuthorized(["Student"]),
  validation(validators.submitQuizSchema),
  quizController.submitQuiz
);

//allow to reeturn quiz results to students
router.post(
  "/:curriculumId/allowToReturnQuiz",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.basicSchema),
  quizController.allowToReturnQuiz
);
// Update details of a specific curriculum
router.patch(
  "/:curriculumId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.updateQuizSchema),
  quizController.editQuiz
);
// Edit details or order of a specific question within a curriculum
router.patch(
  "/:curriculumId/question/:questionId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  fileUpload(customValidation.image)?.single("image"),
  validation(validators.createOptionSchema),
  quizController.editQuestion
);

// Edit details or order of a specific option within a question and curriculum
router.patch(
  "/:curriculumId/question/:questionId/option/:optionId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  fileUpload(customValidation.image)?.single("image"),
  validation(validators.createOptionSchema),
  quizController.editOption
);

// Delete a specific curriculum and its associated questions and options
router.delete(
  "/:curriculumId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.basicSchema),
  quizController.deleteQuiz
);

// Delete a specific question within a curriculum and its associated options
router.delete(
  "/:curriculumId/question/:questionId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.createOptionSchema),
  quizController.deleteQuestion
);

// Delete a specific option within a question and curriculum
router.delete(
  "/:curriculumId/question/:questionId/option/:optionId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.createOptionSchema),
  quizController.deleteOption
);

// Get details of a specific curriculum, including its questions and options
router.get(
  "/:curriculumId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.basicSchema),
  quizController.getQuiz
);

// retrieve quiz to show it to student
router.get(
  "/:curriculumId/quizForStudent",
  isAuthenticated,
  isAuthorized(["Student"]),
  validation(validators.basicSchema),
  quizController.retrieveQuizForStudent
);

// return student final results for different attempts of quiz
router.get(
  "/:curriculumId/quizResult",
  isAuthenticated,
  isAuthorized(["Student"]),
  validation(validators.basicSchema),
  quizController.quizResult
);

// return student detailed quiz performance for specific attempt
router.get(
  "/:curriculumId/quizPerformance",
  isAuthenticated,
  isAuthorized(["Student"]),
  validation(validators.basicSchema),
  quizController.quizPerformance
);

export default router;
