import Chapter from "../../../DB/model/chapter.model.js";
import Course from "../../../DB/model/course.model.js";
import Instructor from "../../../DB/model/instructor.model.js";
import Student from "../../../DB/model/student.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";

/**
 * Authorization middleware to control access to course-related actions based on user roles and ownership.
 * It checks if the user is either the creator of the course, an assigned instructor, or a registered student,
 * depending on the required access roles specified.
 *
 * @param {string[]} accessRoles - An array of roles that are allowed access to the endpoint.
 * @returns {Function} A middleware function that checks user permissions and either continues to the next
 * middleware or returns an error response if unauthorized.
 */
const authorization = (accessRoles = []) => {
  return asyncHandler(async (req, res, next) => {
    // Log the access roles for debugging.
    console.log("accessRoles:", accessRoles);

    // Extract courseId and chapterId from the request parameters.
    const { courseId, chapterId } = req.params;

    // Retrieve the course from the database.
    const course = await Course.findById(courseId);
    // Attach the course to the request object for potential use in downstream middleware.
    req.course = course;

    // If the course does not exist, trigger a 404 Not Found error.
    if (!course) {
      return next(new Error("Course not found"), { cause: 404 });
    }

    // Check if the user is an instructor or the course creator if "Instructor" is in the access roles.
    if (accessRoles.includes("Instructor")) {
      var isInstructor = (await Instructor.findOne({
        course: courseId,
        user: req.userId,
      }).select("_id"))
        ? true
        : false;
      var isCreator = course.createdBy.toString() === req.userId;
    }

    // Check if the user is a student if "Student" is in the access roles.
    if (accessRoles.includes("Student")) {
      // var student = await Student.findOne({
      //   course: courseId,
      //   user: req.userId,
      // });
      var isStudent = (await Student.findOne({
        course: courseId,
        user: req.userId,
      }).select("_id"))
        ? true
        : false;
    }
    // Deny access if the user is neither an instructor nor the creator nor student in the course.
    if (!isInstructor && !isCreator && !isStudent) {
      return next(new Error("You do not have access"), { cause: 403 });
    }
    // If no specific checks are necessary, proceed to the next middleware.
    return next();
  });
};

export default authorization;
