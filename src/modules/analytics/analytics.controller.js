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
import Progress from "../../../DB/model/progress.model.js";

import mongoose from "mongoose";
import upload, {
  deleteDirectory,
  deleteBlob,
  generateSASUrl,
} from "../../utils/azureServices.js";

export const coursesAnalytics = asyncHandler(async (req, res, next) => {
  // Extract courseId from the request parameters.
  // const { courseId } = req.params;
  console.log(" reach course analytics ");
  let totalViews = 0,
    totalStudents = 0,
    totalRevenue = 0,
    watchedHours = 0,
    computerWatchedHours = 0,
    tabletWatchedHours = 0,
    mobileWatchedHours = 0;
  console.log(req.userId);
  const userIsinstructorAt = await Instructor.find({ user: req.userId });
  await Promise.all(
    userIsinstructorAt.map(async (instrucor_doc) => {
      const views = await View.find({
        course: instrucor_doc.course,
      });

      const students = await Student.find({
        course: instrucor_doc.course,
      });
      totalStudents += students.length;

      students.map((student) => {
        // console.log(instrucor_doc.course);
        // console.log(student);
        totalRevenue += student.paid;
        if (student.graduated) {
          totalGraduates++;
        }
      });

      views.map((view) => {
        totalViews += view.count;
        // console.log(totalViews);
      });
      const progresses = await Progress.find({ course: instrucor_doc });
      progresses.map((progress) => {
        const lastWatchedSecond = progress.lastWatchedSecond;
        watchedHours += lastWatchedSecond;
        const deviceType = progress.deviceType.toLowerCase();
        if (deviceType == "computer") computerWatchedHours += lastWatchedSecond;
        if (deviceType == "tablet") tabletWatchedHours += lastWatchedSecond;
        if (deviceType == "mobile") mobileWatchedHours += lastWatchedSecond;
      });
    })
  );
  const devicesUsage = [
    {
      device: "comuter",
      usagePercentage: (computerWatchedHours / watchedHours) * 100,
    },
    {
      device: "tablet",
      usagePercentage: (tabletWatchedHours / watchedHours) * 100,
    },
    {
      device: "mobile",
      usagePercentage: (mobileWatchedHours / watchedHours) * 100,
    },
  ];
  res.status(200).json({
    message: "done",
    analytics: {
      totalViews,
      totalStudents,
      watchedHours,
      devicesUsage,
    },
  });
});
