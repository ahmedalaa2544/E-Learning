import { Router } from "express";
const router = Router({ mergeParams: true });
import * as curriculumController from "./curriculum.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./curriculum.validation.js";
import isAuthenticated from "../../middleware/authntication.middleware.js";
import isAuthorized from "./curriculum.authorization.js";
import { fileUpload, customValidation } from "../../utils/multer.js";

// Create a new video in the curriculum
router.post(
  "/video",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.createVideoSchema),
  fileUpload(customValidation.file.concat(customValidation.video)).fields([
    { name: "video", maxCount: 1 },
  ]),
  curriculumController.createVideo
);

// Create a new article in the curriculum
router.post(
  "/article",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.createArticleSchema),
  curriculumController.createArticle
);

// Create a new quiz in the curriculum
router.post(
  "/quiz",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.createQuizSchema),
  curriculumController.createQuiz
);

// save an accomplishement in curriculum order
router.patch(
  "/:curriculumId",
  isAuthenticated,
  isAuthorized(["Student"]),
  // validation(validators.editCurriculumSchema),
  curriculumController.editAccomplishement
);

// Edit an existing curriculum order
router.patch(
  "/:curriculumId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.editCurriculumSchema),
  curriculumController.editCurriculum
);

// Edit an existing video in the curriculum
router.patch(
  "/:curriculumId/video",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.editVideoSchema),
  fileUpload(customValidation.file.concat(customValidation.video)).fields([
    { name: "video", maxCount: 1 },
    { name: "resources", maxCount: 10 },
    { name: "subtitles", maxCount: 1 },
  ]),
  curriculumController.editVideo
);

// Edit an existing article in the curriculum
router.patch(
  "/:curriculumId/article",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.editArticleSchema),
  fileUpload(customValidation.file).fields([
    { name: "resources", maxCount: 10 },
  ]),
  curriculumController.editArticle
);

// Delete an existing curriculum from the curriculum
router.delete(
  "/:curriculumId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.deleteCurriculumSchema),
  curriculumController.deleteCurriculum
);
// Get curriculum video or article
router.get(
  "/:curriculumId",
  isAuthorized(["Instructor", "Student"]),

  validation(validators.getCurriculumSchema),
  curriculumController.getCurriculum
);

// Get the entire curriculums for a specific chapter
router.get(
  "/",
  validation(validators.getCurriculumsSchema),
  curriculumController.getCurriculums
);

export default router;
