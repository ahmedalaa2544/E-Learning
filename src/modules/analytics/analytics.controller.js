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

// This function gathers and sends analytics data for courses taught by the current user who is an instructor.
export const coursesAnalytics = asyncHandler(async (req, res, next) => {
  // Initialize counters for various metrics.
  let totalViews = 0,
    totalStudents = 0,
    totalRevenue = 0,
    watchedHours = 0,
    computerWatchedHours = 0,
    tabletWatchedHours = 0,
    mobileWatchedHours = 0;

  // Retrieve all instructor records for the current user.
  const userIsinstructorAt = await Instructor.find({ user: req.userId });

  // Process each course the instructor is associated with.
  await Promise.all(
    userIsinstructorAt.map(async (instructor_doc) => {
      // Fetch view statistics for the course.
      const views = await View.find({ course: instructor_doc.course });
      // Fetch all students enrolled in the course.
      const students = await Student.find({ course: instructor_doc.course });

      // Aggregate the number of students and calculate total revenue.
      totalStudents += students.length;
      students.map((student) => {
        totalRevenue += student.paid;
      });

      // Aggregate the total views from all view records.
      views.map((view) => {
        totalViews += view.length;
      });

      // Fetch all progress records for the course to calculate watched hours and device-specific usage.
      const progresses = await Progress.find({ course: instructor_doc.course });
      progresses.map((progress) => {
        const lastWatchedSecond = progress.lastWatchedSecond;
        watchedHours += lastWatchedSecond;
        const deviceType = progress.deviceType.toLowerCase();

        // Calculate watched hours per device type.
        if (deviceType === "computer")
          computerWatchedHours += lastWatchedSecond;
        if (deviceType === "tablet") tabletWatchedHours += lastWatchedSecond;
        if (deviceType === "mobile") mobileWatchedHours += lastWatchedSecond;
      });
    })
  );

  // Calculate the usage percentage for each type of device.
  const devicesUsage = [
    {
      device: "computer",
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

  // Send the analytics data as a JSON response.
  res.status(200).json({
    message: "done",
    analytics: {
      totalViews,
      totalStudents,
      totalRevenue,
      watchedHours,
      devicesUsage,
    },
  });
});
