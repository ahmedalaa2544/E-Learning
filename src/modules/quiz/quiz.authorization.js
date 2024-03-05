import Course from "../../../DB/model/course.model.js";
import Instructor from "../../../DB/model/instructor.model.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Quiz from "../../../DB/model/quiz.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";

/**
 * Authorization middleware to check if the user has the necessary permissions to perform an action.
 * The user is authorized if they are the creator of the specified course and the corresponding course exists.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {void} - Proceeds to the next middleware if the user is authorized; otherwise, sends an error response.
 */
const authorization = (accessRoles = []) => {
  return asyncHandler(async (req, res, next) => {
    // Extract parameters from the request
    const { curriculumId } = req.params;

    // Find the corresponding curriculum based on courseId
    const curriculum = await Curriculum.findById(curriculumId);
    req.course = curriculum.course;
    req.chapter = curriculum.chapter;
    req.quiz = curriculum.quiz;
    if (!curriculum || curriculum.type != "quiz") {
      // If the course is not found, send a 404 error response
      return next(new Error("Quiz not found"), { cause: 404 });
    }
    // Find the corresponding curriculum based on courseId
    const course = await Course.findById(curriculum.course);
    if (!course) {
      // If the course is not found, send a 404 error response
      return next(new Error("Course not found"), { cause: 404 });
    }
    if (accessRoles.includes("Instructor")) {
      const isInstructor = await Instructor.findOne({
        course: curriculum.course,
        user: req.userId,
      });
      const isCreator = course.createdBy.toString() === req.userId;
      if (isCreator && isInstructor) {
        return next(new Error("You do not have access"), { cause: 403 });
      }
    }
    // // Check if the user has access to the specified course (is the creator)
    // if (!(course.createdBy.toString() === req.userId)) {
    //   // If the user does not have access, send a 403 error response
    //   return next(new Error("You do not have access"), { cause: 403 });
    // }

    // If the user is the creator of the course and the course exists, proceed to the next middleware
    return next();
  });
};

export default authorization;
