import { Router } from "express";
const router = Router();
import * as courseController from "./course.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./course.validation.js";
import isAuthenticated from "../../middleware/authntication.middleware.js";
import isAuthorized from "./course.authorization.js";
import chapterRouter from "../chapter/chapter.router.js";
import { fileUpload, customValidation } from "../../utils/multer.js";
/**
 * Router for managing chapters within a specific course.
 * Mounted at: /courses/:courseId/chapter
 */
router.use("/:courseId/chapter", chapterRouter);

/**
 * Create a new course.
 * Route: POST /courses
 * Middleware: isAuthenticated, validation, fileUpload
 */
router.post(
  "/",
  isAuthenticated,
  validation(validators.createCourseSchema),
  courseController.createCourse
);

/**
 * Edit details of a specific course.
 * Route: PATCH /courses/:courseId
 * Middleware: isAuthenticated, isAuthorized, validation, fileUpload
 */
router.patch(
  "/:courseId",
  isAuthenticated,
  isAuthorized,
  validation(validators.editCourseSchema),
  fileUpload(customValidation.image.concat(customValidation.video)).fields([
    { name: "coverImage", maxCount: 1 },
    { name: "promotionalVideo", maxCount: 1 },
  ]),
  courseController.editCourse
);

/**
 * Delete a specific course.
 * Route: DELETE /courses/:courseId
 * Middleware: isAuthenticated, isAuthorized, validation
 */
router.delete(
  "/:courseId",
  isAuthenticated,
  isAuthorized,
  validation(validators.deleteCourseSchema),
  courseController.deleteCourse
);

/**
 * Retrieve details of a specific course.
 * Route: GET /courses/:courseId
 * Middleware: validation
 */
router.get(
  "/:courseId",
  validation(validators.getCourseSchema),
  courseController.getCourse
);

/**
 * Retrieve a list of courses created by the authenticated user.
 * Route: GET /courses
 * Middleware: isAuthenticated
 */
router.get("/", isAuthenticated, courseController.getMyCreatedCourses);

export default router;
