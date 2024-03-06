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
  isAuthorized(["Instructor"]),
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
  isAuthorized(["Instructor"]),
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
 * Route: GET /courses
 * Description: Retrieve a list of courses created by the authenticated user.
 * Middleware: isAuthenticated
 *
 * This route supports an optional query parameter 'view', where:
 * - If 'view' is set to 'all', it triggers the 'getCourses' method to fetch all courses without check is authenticated.
 * - If 'view' is not provided or set to any other value, the route proceeds to the next middleware and check if is authenticated.
 */
router.get(
  "/",
  (req, res, next) => {
    if (req.query.view === "all" || req.query.view === undefined) {
      courseController.getCourses(req, res, next);
    } else {
      next();
    }
  },
  isAuthenticated,
  courseController.getCourses
);

/**
 * Route to retrieve courses associated with a specific category.
 */
router.get(
  "/category/:categoryId/subCategory/",
  validation(validators.getCoursesWithCategSchema),
  courseController.getCoursesWithCategAndSubCateg
);

/**
 * Route to retrieve courses associated with a specific category and subCategory.
 */
router.get(
  "/category/:categoryId/subCategory/:subCategoryId",
  validation(validators.getCoursesWithCategAndSubCategSchema),
  courseController.getCoursesWithCategAndSubCateg
);
/**
 * Route for posting a rating for a specific course.
 */
router.post(
  "/:courseId/rating",
  isAuthenticated,
  validation(validators.createRatingSchema),
  courseController.postRating
);

/**
 * Route for posting a comment for a specific course.
 */
router.post(
  "/:courseId/comment",
  isAuthenticated,
  validation(validators.createcommentSchema),
  courseController.postComment
);

// add instructor
router.patch(
  "/:courseId/instructor/:instructorId",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.instructorSchema),
  courseController.addInstructor
);
/**
 * PATCH route to submit a course for publishing.
 * */

router.patch(
  "/:courseId/submit",
  isAuthenticated,
  isAuthorized(["Instructor"]),
  validation(validators.deleteCourseSchema),
  courseController.submitCourse
);
export default router;
