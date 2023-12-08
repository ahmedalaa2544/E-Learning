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
  isAuthorized,
  validation(validators.createVideoSchema),
  curriculumController.createVideo
);

// Create a new article in the curriculum
router.post(
  "/article",
  isAuthenticated,
  isAuthorized,
  validation(validators.createArticleSchema),
  curriculumController.createArticle
);

// Edit an existing curriculum order
router.patch(
  "/:curriculumId",
  isAuthenticated,
  isAuthorized,
  validation(validators.editCurriculumSchema),
  curriculumController.editCurriculum
);

// Edit an existing video in the curriculum
router.patch(
  "/:curriculumId/video/:videoId",
  isAuthenticated,
  isAuthorized,
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
  "/:curriculumId/article/:articleId",
  isAuthenticated,
  isAuthorized,
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
  isAuthorized,
  validation(validators.deleteCurriculumSchema),
  curriculumController.deleteCurriculum
);

// Get details of a specific video in the curriculum
router.get(
  "/video/:videoId",
  validation(validators.getVideoSchema),
  curriculumController.getVideo
);

// Get details of a specific article in the curriculum
router.get(
  "/article/:articleId",
  validation(validators.getArticleSchema),
  curriculumController.getArticle
);

// Get the entire curriculum for a specific chapter
router.get(
  "/",
  validation(validators.getCurriculumSchema),
  curriculumController.getCurriculum
);

export default router;
