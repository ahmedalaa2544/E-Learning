import { asyncHandler } from "../../utils/asyncHandling.js";
import Course from "../../../DB/model/course.model.js";
import Chapter from "../../../DB/model/chapter.model.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Video from "../../../DB/model/video.model.js";
import Article from "../../../DB/model/article.model.js";
import ratingModel from "../../../DB/model/rating.model.js";
import commentModel from "../../../DB/model/comment.model.js";
import userModel from "../../../DB/model/user.model.js";
import View from "../../../DB/model/view.model.js";
import Instructor from "../../../DB/model/instructor.model.js";
import Student from "../../../DB/model/student.model.js";

import mongoose from "mongoose";
import upload, {
  deleteDirectory,
  deleteBlob,
  generateSASUrl,
} from "../../utils/azureServices.js";

export const coursesAnalytics = asyncHandler(async (req, res, next) => {
  // Extract courseId from the request parameters.
  const { courseId } = req.params;
  let viewsNumber = 0,
    totalStudents = 0,
    totalRevenue = 0;
  totalGraduates = 0;
  const instructorAt = await Instructor.find({ user: req.userId });
  await Promise.all(
    instructorAt.map(async (instrucor) => {
      const viewsList = await View.find({ course: instrucor.course });
      const students = await Student.find({ course: instrucor.course });
      totalStudents += students.length;
      students.map((student) => {
        totalRevenue += student.paid;
        if (student.graduated) {
          totalGraduates++;
        }
      });

      viewsList.map((view) => (viewsNumber += view.count));
    })
  );
});
