import { Router } from "express";
const router = Router();
import * as quizController from "./quiz.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./quiz.validation.js";
import isAuthenticated from "../../middleware/authntication.middleware.js";
import isAuthorized from "./quiz.authorization.js";
import { fileUpload, customValidation } from "../../utils/multer.js";

router.post(
  "/:curriculumId/question",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  fileUpload(customValidation.image)?.single("image"),
  validation(validators.createQuestionSchema),
  quizController.createQuestion
);

router.post(
  "/:curriculumId/question/:questionId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  fileUpload(customValidation.image)?.single("image"),
  validation(validators.createOptionSchema),
  quizController.createOption
);

router.get(
  "/:curriculumId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.createQuestionSchema),
  quizController.getQuiz
);
export default router;
