import Chapter from "../../../DB/model/chapter.model.js";
import Course from "../../../DB/model/course.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";

/**
 * Authorization middleware to check if the user has the necessary permissions to perform an action.
 * The user is authorized if they are the creator of the specified course and the corresponding curriculum exists.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {void} - Proceeds to the next middleware if the user is authorized; otherwise, sends an error response.
 */
const authorization = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId } = req.params;

  // Find the corresponding course based on courseId
  const course = await Course.findById(courseId);
  if (!course) {
    // If the course is not found, send a 404 error response
    return next(new Error("Course not found"), { cause: 404 });
  }

  // Check if the user has access to the specified course (is the creator)
  if (!(course.createdBy.toString() === req.userId)) {
    // If the user does not have access, send a 401 error response
    return next(new Error("You do not have access"), { cause: 401 });
  }

  // Find the corresponding chapter based on chapterId
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    // If the chapter is not found, send a 404 error response
    return next(new Error("Chapter not found"), { cause: 404 });
  }

  // If the user is the creator of the course and the chapter exists, proceed to the next middleware
  return next();
});

export default authorization;
