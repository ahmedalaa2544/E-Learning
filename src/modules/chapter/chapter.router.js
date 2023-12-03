import { Router } from "express";
const router = Router({ mergeParams: true });
import * as chapterController from "./chapter.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./chapter.validation.js";
import isAuthenticated from "../../middleware/authntication.middleware.js";
import isAuthorized from "./chapter.authorization.js";
import curriculumRouter from "../curriculum/curriculum.router.js";

// Routes for managing curriculum within a chapter
router.use("/:chapterId/curriculum", curriculumRouter);

// Create a new chapter
router.post(
  "/",
  isAuthenticated,
  isAuthorized,
  validation(validators.createChapterSchema),
  chapterController.createChapter
);

// Edit an existing chapter
router.patch(
  "/:chapterId",
  isAuthenticated,
  isAuthorized,
  validation(validators.editChapterSchema),
  chapterController.editChapter
);

// Delete an existing chapter
router.delete(
  "/:chapterId",
  isAuthenticated,
  isAuthorized,
  validation(validators.deleteChaptersSchema),
  chapterController.deleteChapter
);

// Get details of a specific chapter
router.get(
  "/:chapterId",
  validation(validators.getChapterSchema),
  chapterController.getChapter
);

// Get all chapters for a specific course
router.get(
  "/",
  validation(validators.getChaptersSchema),
  chapterController.getChapters
);

export default router;
