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
    const curriculum = await Curriculum.findById(curriculumId)
      .populate("course", "title")
      .populate("chapter", "title");
    req.curriculum = curriculum;
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
    // Check if the user is an instructor or the course creator if "Instructor" is in the access roles.
    if (accessRoles.includes("Instructor")) {
      var isInstructor = (await Instructor.findOne({
        course: req.course,
        user: req.userId,
      }).select("_id"))
        ? true
        : false;
      var isCreator = course.createdBy.toString() === req.userId;
    }

    // Check if the user is a student if "Student" is in the access roles.
    if (accessRoles.includes("Student")) {
      return next();
      // var student = await Student.findOne({
      //   course: courseId,
      //   user: req.userId,
      // });
      var isStudent = (await Student.findOne({
        course: req.course,
        user: req.userId,
      }).select("_id"))
        ? true
        : false;
    }
    // console.log(student);
    // Deny access if the user is neither an instructor nor the creator nor student in the course.
    if (!isInstructor && !isCreator && !isStudent) {
      return next(new Error("You do not have access"), { cause: 403 });
    }
    // If no specific checks are necessary, proceed to the next middleware.
    return next();
  });
};

export default authorization;
