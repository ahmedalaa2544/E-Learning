import { asyncHandler } from "../../utils/asyncHandling.js";
import onFinished from "on-finished";
import Course from "../../../DB/model/course.model.js";
import Chapter from "../../../DB/model/chapter.model.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Video from "../../../DB/model/video.model.js";
import Article from "../../../DB/model/article.model.js";
import Quiz from "../../../DB/model/quiz.model.js";
import Progress from "../../../DB/model/progress.model.js";
import Student from "../../../DB/model/student.model.js";
import notificationModel from "../../../DB/model/notification.model.js";
import { getIo } from "../../utils/server.js";
import webpush from "web-push";
import { getResoursces, getSubitles } from "../../utils/curriculum.js";
import mongoose from "mongoose";
import {
  uploadVideo,
  uploadResources,
  uploadSubtitles,
} from "./curriculum.handleUpload.js";
import {
  deleteDirectory,
  generateSASUrl,
  deleteBlob,
} from "../../utils/azureServices.js";
import { mergeSort, calculateDuration } from "../../utils/dataSructures.js";
/**
 * Controller function to create a new video within a course chapter, handling file uploads and database operations.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Object} - Response indicating the success or failure of the video creation process.
 */
export const createVideo = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId } = req.params;
  const { title, description } = req.body;

  // Generate a unique videoId using MongoDB ObjectId
  const videoId = new mongoose.Types.ObjectId();

  // Generate a unique curriculumId using MongoDB ObjectId
  const curriculumId = new mongoose.Types.ObjectId();
  const generateHLS = req.query.generateHLS;
  const generateVtt = req.query.generateVtt;

  // Retrieve existing curriculums for the chapter
  let curriculums = await Curriculum.find({ chapter: chapterId });
  // Calculate the order value for the next curriculum by adding 1 to the number of existing curriculums.
  const order = curriculums.length + 1;
  // Create a new Video document in the database
  const createdVideo = new Video({
    _id: videoId,
    course: courseId,
    chapter: chapterId,
    curriculum: curriculumId,
    description: description,
  });

  // Save the new Video document in the database
  await createdVideo.save();

  // Create a new Curriculum document for the video
  const curriculum = new Curriculum({
    _id: curriculumId,
    course: courseId,
    chapter: chapterId,
    video: videoId,
    type: "video",
    title: title,
    order: order,
  });

  // Save the new Curriculum document in the database
  await curriculum.save();
  // Send an immediate response to the client
  curriculum
    ? res.status(200).json({
        message: "Server Processing the Video",
        curriculum: {
          ...createdVideo._doc,
          _id: curriculumId,
          course: { title: req.course.title, _id: req.course._id },
          chapter: { title: req.chapter.title, _id: req.chapter._id },
          title: title,
          type: "video",
          order,
          video: videoId,
        },
      })
    : res.status(500).json({ message: "Something went wrong" });

  // Wait for the response to be sent, then perform additional actions
  onFinished(res, async (err, res) => {
    let videoUrl,
      duration = 0,
      blobVideoName;
    // Upload the video and retrieve information such as URL, duration, and blob name.
    ({ videoUrl, duration, blobVideoName } = await uploadVideo(
      req.files,
      req.userId,
      courseId,
      chapterId,
      curriculumId,
      false,
      generateHLS,
      generateVtt
    ));
    if (generateHLS) {
      blobVideoName = blobVideoName + "\\HLS" + "\\manifest.m3u8";
    }
    if (generateVtt) {
      var vttBlobName = blobVideoName + "\\thumbnails" + "\\thumbnails.vtt";
    }
    await Course.findByIdAndUpdate(courseId, {
      $inc: { duration: duration },
    });
    await Chapter.findByIdAndUpdate(chapterId, {
      $inc: { duration: duration },
    });
    // Save in DataBase
    await Video.findByIdAndUpdate(videoId, {
      ...(videoUrl && { url: videoUrl }),
      ...(blobVideoName && { blobName: blobVideoName }),
      ...(vttBlobName && { vttBlobName: vttBlobName }),
      ...(duration && { duration: duration }),
    });
  });
});

/**
 * Controller function to create a new article within a course chapter, handling file uploads and database operations.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Object} - Response indicating the success or failure of the article creation process.
 */
export const createArticle = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId } = req.params;
  const { title, quillContent } = req.body;
  // Generate a unique articleId using MongoDB ObjectId
  const articleId = new mongoose.Types.ObjectId();
  // Generate a unique curriculumId using MongoDB ObjectId
  const curriculumId = new mongoose.Types.ObjectId();
  let curriculums = await Curriculum.find({ chapter: chapterId });
  //calculate duration for article based on number of words
  const duration = calculateDuration(quillContent) * 60;
  // Calculate the order value for the next curriculum by adding 1 to the number of existing curriculums.
  const order = curriculums.length + 1;
  await Course.findByIdAndUpdate(courseId, {
    $inc: { duration: duration },
  });
  await Chapter.findByIdAndUpdate(chapterId, {
    $inc: { duration: duration },
  });
  // Create a new Article document in the database
  const article = new Article({
    _id: articleId,
    course: courseId,
    chapter: chapterId,
    curriculum: curriculumId,
    quillContent,
    duration,
  });

  // Save the new Article document in the database
  await article.save();

  // Create a new Curriculum document for the article
  const curriculum = new Curriculum({
    _id: curriculumId,
    course: courseId,
    chapter: chapterId,
    type: "article",
    title: title,
    order: order,
    article: article._id,
  });

  // Save the new Curriculum document in the database
  await curriculum.save();

  // Send a response indicating the success or failure of the article creation process
  return article
    ? res.status(200).json({
        message: "Done",
        article: {
          ...article._doc,
          course: { title: req.course.title, _id: req.course._id },
          chapter: { title: req.chapter.title, _id: req.chapter._id },
          title: title,
        },
      })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Controller function to create a new quiz within a course chapter, handling file uploads and database operations.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Object} - Response indicating the success or failure of the article creation process.
 */
export const createQuiz = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId } = req.params;
  const { title } = req.body;
  // Generate a unique quizId using MongoDB ObjectId
  const quizId = new mongoose.Types.ObjectId();
  // Generate a unique curriculumId using MongoDB ObjectId
  const curriculumId = new mongoose.Types.ObjectId();
  let curriculums = await Curriculum.find({ chapter: chapterId });

  // Calculate the order value for the next curriculum by adding 1 to the number of existing curriculums.
  const order = curriculums.length + 1;

  // Create a new quiz document in the database
  const quiz = new Quiz({
    _id: quizId,
    course: courseId,
    chapter: chapterId,
    curriculum: curriculumId,
  });

  // Save the new quiz document in the database
  await quiz.save();

  // Create a new Curriculum document for the quiz
  const curriculum = new Curriculum({
    _id: curriculumId,
    course: courseId,
    chapter: chapterId,
    type: "quiz",
    title: title,
    order: order,
    quiz: quizId,
  });

  // Save the new Curriculum document in the database
  await curriculum.save();

  // Send a response indicating the success or failure of the quiz creation process
  return quiz
    ? res.status(200).json({
        message: "Done",
        quiz: {
          ...quiz._doc,
          course: { title: req.course.title, _id: req.course._id },
          chapter: { title: req.chapter.title, _id: req.chapter._id },
          title: title,
        },
      })
    : res.status(500).json({ message: "Something went wrong" });
});
/**
 * Edit the order of a curriculum item within a specific chapter.
 *
 * @param {Object} req - Express request object containing chapterId, curriculumId, and new positions.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response indicating success or failure of the curriculum item order change.
 */
export const editCurriculum = asyncHandler(async (req, res, next) => {
  // Extract chapterId, curriculumId, and new positions from the request parameters and body.
  const { chapterId, curriculumId } = req.params;
  const { startPosition, endPosition } = req.body;

  // Find the curriculum item to be edited.
  const curriculum = await Curriculum.findById(curriculumId);

  // Check if the curriculum item exists.
  if (!curriculum) {
    return next(new Error("Curriculum not found"), { cause: 404 });
  }

  // Determine the direction of the position change and update the order accordingly.
  if (startPosition < endPosition) {
    // If the new position is after the original position, shift items up.
    await Curriculum.updateMany(
      {
        chapter: chapterId,
        order: {
          $gt: startPosition,
          $lte: endPosition,
        },
      },
      { $inc: { order: -1 } }
    );
  } else if (startPosition > endPosition) {
    // If the new position is before the original position, shift items down.
    await Curriculum.updateMany(
      {
        chapter: chapterId,
        order: {
          $gte: endPosition,
          $lt: startPosition,
        },
      },
      { $inc: { order: 1 } }
    );
  }

  // Update the order of the edited curriculum item.
  const editCurriculumOrder = await Curriculum.findByIdAndUpdate(curriculumId, {
    order: endPosition,
  });

  // Send a JSON response indicating the success or failure of the order change.
  return editCurriculumOrder
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({ message: "Something went wrong" });
});
/**
 * Handles updating video progress for a student.
 *
 * @param {Object} req - The HTTP request object containing parameters and body data.
 * @param {Object} res - The HTTP response object used to send back the progress update status.
 * @param {Function} next - The next middleware function in the Express.js route handling.
 * @returns {void} - Sends a JSON response indicating the status of the progress update.
 */
export const videoProgress = asyncHandler(async (req, res, next) => {
  // Extract chapterId, curriculumId, and new positions from the request parameters and body.
  const { courseId, chapterId, curriculumId } = req.params;
  const { lastWatchedSecond } = req.body;
  const student = req.userId;
  const course = await Course.findById(courseId);
  const courseOwner = course.createdBy;
  let completed = false;
  let accomplishementPercentage;

  // Find the curriculum item to be edited.
  const curriculum = await Curriculum.findById(curriculumId).populate({
    path: "video",
    select: "duration",
  });

  // Check if the curriculum item exists.
  if (!curriculum) {
    return next(new Error("Curriculum not found"), { cause: 404 });
  }

  // Determine device type based on user agent.
  const deviceType = req.useragent.isMobile
    ? "mobile"
    : req.useragent.isTablet
    ? "tablet"
    : "computer";

  // Allow cross-origin credentials.
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Find existing progress record for the curriculum.
  const progress = await Progress.findOne({
    curriculum: curriculumId,
    student: req.userId,
  });
  const numberOfCurriculumsInCourse = await Curriculum.countDocuments({
    course: courseId,
  });
  const numberOfCompletedCurriculums = await Progress.countDocuments({
    course: courseId,
    student,
    completed: true,
  });
  // Check if video is completed.
  if (
    lastWatchedSecond > curriculum.video.duration - 5 &&
    !progress.completed
  ) {
    completed = true;
    accomplishementPercentage =
      ((numberOfCompletedCurriculums + 1) / numberOfCurriculumsInCourse) * 100;
  }

  // Update or create progress record.
  if (progress) {
    progress.lastWatchedSecond = lastWatchedSecond;
    progress.completed = completed;
    await progress.save();
  } else {
    await Progress.create({
      course: courseId,
      chapter: chapterId,
      curriculum: curriculumId,
      student,
      courseOwner,
      type: curriculum.type,
      deviceType,
      lastWatchedSecond,
      completed,
    });
  }
  if (completed) {
    const graduated = accomplishementPercentage === 100 ? true : false;
    // send notification when graduation
    if (graduated && !progress.completed) {
      let notification = {
        image: course.coverImageUrl,
        title: "Course Completion",
        body: `${req.user.userName}, Congratulations on completing the course! 🎉`,
        url: `https://e-learning-azure.vercel.app/courseDetails/${courseId}`,
      };
      let notify = await notificationModel.findOneAndUpdate(
        {
          user: req.user.id,
        },
        {
          $push: { notifications: notification },
        },
        { new: true }
      );

      if (!notify) {
        notify = await notificationModel.create({
          user: req.user.id,
          notifications: notification,
        });
      }
      notification = notify.notifications.reverse()[0];
      getIo().to(socketIds).emit("notification", notification);
      if (req.user.popUpId.endpoint) {
        webpush.sendNotification(
          req.user.popUpId,
          JSON.stringify(notification)
        );
      }
    }
    await Student.findOneAndUpdate(
      { user: student },
      { accomplishementPercentage, graduated }
    );
  }

  // Respond with the progress update status.
  res.status(200).json({ message: "Done", completed });
});

/**
 * Marks the curriculum item as completed for a student.
 *
 * @param {Object} req - The HTTP request object containing parameters and body data.
 * @param {Object} res - The HTTP response object used to send back the completion status.
 * @param {Function} next - The next middleware function in the Express.js route handling.
 * @returns {void} - Sends a JSON response indicating the completion status.
 */
export const curriculumCompleted = asyncHandler(async (req, res, next) => {
  // Extract chapterId, curriculumId, and new positions from the request parameters and body.
  const { courseId, chapterId, curriculumId } = req.params;
  const student = req.userId;
  const courseOwner = req.course.createdBy;
  const completed = JSON.parse(req.body.completed);
  let accomplishementPercentage;
  // Find the curriculum item to be marked as completed.
  const curriculum = await Curriculum.findById(curriculumId);

  // Check if the curriculum item exists.
  if (!curriculum) {
    return next(new Error("Curriculum not found"), { cause: 404 });
  }

  // Find existing progress record for the curriculum.
  const progress = await Progress.findOne({
    curriculum: curriculumId,
    student: req.userId,
  });
  const numberOfCurriculumsInCourse = await Curriculum.countDocuments({
    course: courseId,
  });
  const numberOfCompletedCurriculums = await Progress.countDocuments({
    course: courseId,
    student,
    completed: true,
  });

  // Update or create progress record to mark the curriculum as completed.
  if (progress) {
    if (!progress.completed && completed) {
      accomplishementPercentage =
        ((numberOfCompletedCurriculums + 1) / numberOfCurriculumsInCourse) *
        100;
    } else if (progress.completed && !completed) {
      accomplishementPercentage =
        ((numberOfCompletedCurriculums - 1) / numberOfCurriculumsInCourse) *
        100;
    }
    progress.completed = completed;
    await progress.save();
  } else {
    if (completed) {
      accomplishementPercentage =
        ((numberOfCompletedCurriculums + 1) / numberOfCurriculumsInCourse) *
        100;
    }
    await Progress.create({
      course: courseId,
      chapter: chapterId,
      curriculum: curriculumId,
      student,
      courseOwner,
      type: curriculum.type,
      completed,
    });
  }
  const graduated = accomplishementPercentage === 100 ? true : false;
  // send notification when graduation
  if (graduated && !progress.completed) {
    const course = await Course.findById(courseId);
    let notification = {
      image: course.coverImageUrl,
      title: "Course Completion",
      body: `${req.user.userName}, Congratulations on completing the course! 🎉`,
      url: `https://e-learning-azure.vercel.app/courseDetails/${courseId}`,
    };
    let notify = await notificationModel.findOneAndUpdate(
      {
        user: req.user.id,
      },
      {
        $push: { notifications: notification },
      },
      { new: true }
    );

    if (!notify) {
      notify = await notificationModel.create({
        user: req.user.id,
        notifications: notification,
      });
    }
    notification = notify.notifications.reverse()[0];
    getIo().to(socketIds).emit("notification", notification);
    if (req.user.popUpId.endpoint) {
      webpush.sendNotification(req.user.popUpId, JSON.stringify(notification));
    }
  }
  await Student.findOneAndUpdate(
    { user: student },
    { accomplishementPercentage, graduated }
  );

  // Respond with the completion status.
  res.status(200).json({ message: "Done" });
});

/**
 * Controller function to edit a video within a course chapter, file uploads, and database updates.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Object} - Response indicating the success or failure of the video editing process.
 */
export const editVideo = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId, curriculumId } = req.params;
  const { title, description, subtitleslanguage, subtitlesId } = req.body;
  // Retrieve the existing curriculum document based on curriculumId
  const curriculum = await Curriculum.findById(curriculumId);
  // Check if the curriculum exists
  if (!curriculum) {
    return next(new Error("Curriculum not found"), { cause: 404 });
  }
  // Retrieve the existing video document based on videoId
  const video = await Video.findById(curriculum.video);
  // Check if the video exists
  if (!video) {
    return next(new Error("Video not found"), { cause: 404 });
  }

  // Declare variables to store video-related information.
  let videoUrl, duration, blobVideoName, subtitlesBlobName;
  // Check if the request involves uploading a video.
  if (req.query.upload === "video") {
    // Send an immediate response to the client
    res.status(200).json({ message: "Server Processing the Video" });
    // Wait for the response to be sent, then perform additional actions
    onFinished(res, async (err, res) => {
      // Upload the video and retrieve information such as URL, duration, and blob name.
      ({ videoUrl, duration, blobVideoName } = await uploadVideo(
        req.files,
        req.userId,
        courseId,
        chapterId,
        curriculumId,
        video.blobName
      ));
    });
    await Course.findByIdAndUpdate(courseId, {
      $inc: { duration: duration },
    });
    await Chapter.findByIdAndUpdate(chapterId, {
      $inc: { duration: duration },
    });
  }

  // Check if the request involves uploading subtitles.
  if (req.query.upload === "subtitles") {
    // Upload subtitles and retrieve information such as blob name.
    subtitlesBlobName = await uploadSubtitles(
      req,
      req.files,
      req.userId,
      courseId,
      chapterId,
      curriculumId,
      video.subtitles.blobName
    );
    console.log(subtitlesBlobName);
    var subtitles = {
      blobName: subtitlesBlobName,
      language: subtitleslanguage,
    };
  }

  // Check if the request involves deleting the video.
  if (req.query.delete === "video") {
    // Retrieve blob names associated with the video and its subtitles, then delete them.
    const videoBlobName = video.blobName;
    const subtitlesBlobName = video.subtitles.blobName;
    await deleteBlob(videoBlobName);
    await deleteBlob(subtitlesBlobName);
    // Update the Video document in the database to remove video-related details.
    await Video.findByIdAndUpdate(curriculum.video, {
      url: "",
      blobName: "",
      duration: "",
      subtitles: [],
    });
  }

  // Check if the request involves deleting subtitles.
  if (req.query.delete === "subtitles") {
    const video = await Video.findByIdAndUpdate(curriculum.video, {
      $pull: { subtitles: { _id: subtitlesId } },
    }).select("subtitles");
    const subtitles = video.subtitles;
    const pulledSubtitle = subtitles.find(
      (item) => item._id.toString() === subtitlesId
    );
    await deleteBlob(pulledSubtitle.blobName);
  }
  // Update the video document with the edited details
  await Video.findByIdAndUpdate(curriculum.video, {
    title: title,
    $push: {
      subtitles,
    },
    description: description,
    url: videoUrl,
    blobName: blobVideoName,
    duration: duration,
  });
  if (req.query.upload === "video") {
    await Course.findByIdAndUpdate(courseId, {
      $inc: { duration: duration },
    });
  }
  // Update the curriculum document with the edited details
  const editedCurriculum = await Curriculum.findByIdAndUpdate(curriculumId, {
    title: title,
  });
  // Send a response indicating the success or failure of the video editing process
  if (!res.headersSent) {
    return editedCurriculum
      ? res.status(200).json({ message: "Done" })
      : res.status(500).json({ message: "Something went wrong" });
  }
});
/**
 * Handles uploading resources and updating the corresponding curriculum with the new resources.
 * This function uses the onFinished library to ensure that resource uploading happens after the response is sent.
 *
 * @param {Object} req - The request object from Express, containing request data including files and parameters.
 * @param {Object} res - The response object from Express, used to send a response to the client.
 * @param {Function} next - The next middleware function in the Express middleware chain.
 */
export const putResources = asyncHandler(async (req, res, next) => {
  // Extract courseId, chapterId, and curriculumId from request parameters to identify the location to put resources.
  const { courseId, chapterId, curriculumId } = req.params;

  // Wait for the response to be fully handled, then execute additional logic for resource handling.
  onFinished(res, async (err, res) => {
    // Upload resources after the client receives the response, improving perceived performance.
    const resources = await uploadResources(
      req,
      req.files,
      req.userId,
      courseId,
      chapterId,
      curriculumId
    );

    // Update the curriculum by appending new resources to the existing array of resources.
    const curriculum = await Curriculum.findByIdAndUpdate(curriculumId, {
      $push: { resources: { $each: resources } },
    });
  });

  // Check if the response headers have not been sent yet.
  if (!res.headersSent) {
    // Send a 200 status with a success message if the headers are not yet sent.
    res.status(200).json({ message: "Done" });
  }
});

/**
 * Handles the deletion of a specific resource from a curriculum's resource list
 * and subsequently deletes the resource's blob from storage.
 * This function completes resource deletion operations after the response is sent to the client,
 * using onFinished to ensure non-blocking behavior.
 *
 * @param {Object} req - The request object from Express, which contains parameters identifying the resource.
 * @param {Object} res - The response object from Express, used to send a response back to the client.
 * @param {Function} next - The next middleware function in the Express middleware chain.
 */
export const deleteResource = asyncHandler(async (req, res, next) => {
  // Extract curriculumId and resourceId from request parameters to identify the specific resource.
  const { curriculumId, resourceId } = req.params;

  // Set up post-response logic to delete the resource, ensuring that the client is not delayed.
  onFinished(res, async (err, res) => {
    // Update the curriculum document by removing the specified resource.
    const curriculum = await Curriculum.findByIdAndUpdate(curriculumId, {
      $pull: { resources: { _id: resourceId } },
    }).select("resources");

    // Extract the specific content of the curriculum's resources after the update.
    const content = curriculum.resources;
    // Find the resource that was deleted to access its blobName for further deletion from storage.
    const resource = content.find((item) => item._id.toString() === resourceId);

    // Delete the blob associated with the resource from storage.
    await deleteBlob(resource.blobName);
  });

  // Check if the response headers have not been sent yet.
  if (!res.headersSent) {
    // Send a 200 OK response indicating that the operation was successfully initiated.
    res.status(200).json({ message: "Done" });
  }
});

/**
 * Controller function to edit a artcile within a course chapter, file uploads, and database updates.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Object} - Response indicating the success or failure of the video editing process.
 */
export const editArticle = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId, curriculumId } = req.params;
  const { title, quillContent } = req.body;
  // Retrieve the existing curriculum document based on curriculumId
  const curriculum = await Curriculum.findById(curriculumId);
  // Check if the curriculum exists
  if (!curriculum) {
    return next(new Error("Curriculum not found"), { cause: 404 });
  }

  // Retrieve the existing article document based on videoId
  const article = await Article.findById(curriculum.article);
  // Check if the article exists
  if (!article) {
    return next(new Error("Article not found"), { cause: 404 });
  }
  //calculate duration for article based on number of words
  const duration = calculateDuration(quillContent);

  // Update the article document with the edited details
  await Article.findByIdAndUpdate(curriculum.article, {
    title: title,
    quillContent: quillContent,
    duration,
  });

  // Update the curriculum document with the edited details
  const editedCurriculum = await Curriculum.findByIdAndUpdate(curriculumId, {
    title: title,
  });
  await Course.findByIdAndUpdate(courseId, {
    $inc: { duration: duration },
  });
  await Chapter.findByIdAndUpdate(chapterId, {
    $inc: { duration: duration },
  });
  // Send a response indicating the success or failure of the article editing process
  return editedCurriculum
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Controller function to delete a curriculum including its associated resources and documents.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves once the curriculum is successfully deleted.
 */
export const deleteCurriculum = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId, curriculumId } = req.params;

  // Retrieve the existing curriculum document based on curriculumId
  const curriculum = await Curriculum.findById(curriculumId);

  // Check if the curriculum exists
  if (!curriculum) {
    return next(new Error("Curriculum not found"), { cause: 404 });
  }

  // Update the order of subsequent curricula in the same chapter to maintain order
  await Curriculum.updateMany(
    {
      chapter: chapterId,
      order: {
        $gt: curriculum.order,
      },
    },
    { $inc: { order: -1 } }
  );
  // Construct the directory path for the curriculum resources
  const curriculumDirectory = `Users\\${req.userId}\\Courses\\${courseId}\\${chapterId}\\${curriculumId}`;

  // Delete the entire directory including curriculum and associated resources
  await deleteDirectory(curriculumDirectory);

  // Delete the associated video or article document based on curriculum type
  if (curriculum.type === "video") {
    await Video.deleteOne({ _id: curriculum.video });
  } else if (curriculum.type === "article") {
    await Article.deleteOne({ _id: curriculum.article });
  }

  // Delete the curriculum document from the database
  const deletedCurriculum = await Curriculum.deleteOne({ _id: curriculumId });

  // Send a response based on the success of the curriculum deletion
  return deletedCurriculum
    ? res.status(200).json({ message: "Done" })
    : res
        .status(500)
        .json({ message: "An error occurred while deleting the curriculum." });
});
/**
 * Controller function to retrieve curriculum details, including videos or articles, and associated resources.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves once curriculum details are successfully retrieved and formatted in the response.
 */
export const getCurriculum = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId, curriculumId } = req.params;

  // Find the corresponding course based on courseId
  const course = await Course.findById(courseId);

  // If the course is not found, send a 404 error response
  if (!course) {
    return next(new Error("Course not found"), { cause: 404 });
  }

  // Find the corresponding chapter based on chapterId
  const chapter = await Chapter.findById(chapterId);

  // If the chapter is not found, send a 404 error response
  if (!chapter) {
    return next(new Error("Chapter not found"), { cause: 404 });
  }

  // Retrieve the existing curriculum document based on curriculumId, populating associated video or article details
  const curriculum = await Curriculum.findById(curriculumId)
    // .select("subtitles")
    .populate("video")
    .populate("article")
    .populate("course", "title")
    .populate("chapter", "title")
    .exec();
  // Check if the curriculum exists
  if (!curriculum) {
    return next(new Error("Curriculum not found"), { cause: 404 });
  }

  const resources = curriculum.resources
    ? await getResoursces(curriculum.resources)
    : undefined;
  const subtitles = curriculum.video.subtitles
    ? await getSubitles(curriculum.video.subtitles)
    : undefined;

  if (curriculum.type === "video") {
    const video = curriculum.video;

    // Obtain the Shared Access Signature (SAS) URL for the video blob
    const { accountSasTokenUrl: videoUrl } = await generateSASUrl(
      video.blobName,
      "r",
      "60"
    );
    // Obtain the Shared Access Signature (SAS) URL for the video blob
    const { accountSasTokenUrl: vttUrl } = await generateSASUrl(
      video.vttBlobName,
      "r",
      "60"
    );
    const { accountSasTokenUrl: subtitlesUrl } = await generateSASUrl(
      video.subtitles.blobName,
      "r",
      "60"
    );
    // Send a response containing video details
    return video
      ? res.status(200).json({
          message: "Done",
          video: {
            ...video._doc,
            course: curriculum.course,
            chapter: curriculum.chapter,
            type: "video",
            title: curriculum.title,
            url: videoUrl ? videoUrl.replace(/%5C/g, "/") : undefined,
            blobName: undefined,
            resources,
            subtitles,
            vttBlobName: undefined,
            vttUrl: vttUrl ? vttUrl.replace(/%5C/g, "/") : undefined,
          },
        })
      : res.status(500).json({ message: "Something went wrong" });
  }

  if (curriculum.type === "article") {
    const article = curriculum.article;

    // Send a response containing article details
    return article
      ? res.status(200).json({
          message: "Done",
          article: {
            ...article._doc,
            course: curriculum.course,
            chapter: curriculum.chapter,
            type: "article",
            title: curriculum.title,
            resources: resources,
          },
        })
      : res.status(500).json({ message: "Something went wrong" });
  }
});

/**
 * Retrieve the curriculum (sequence of videos and articles) for a specific chapter within a course.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {void} - Sends a response containing the curriculum details or an error message.
 */
export const getCurriculums = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId } = req.params;

  // Find the corresponding course based on courseId
  const course = await Course.findById(courseId);

  // If the course is not found, send a 404 error response
  if (!course) {
    return next(new Error("Course not found"), { cause: 404 });
  }

  // Find the corresponding chapter based on chapterId
  const chapter = await Chapter.findById(chapterId).populate("course", "title");
  // If the chapter is not found, send a 404 error response
  if (!chapter) {
    return next(new Error("Chapter not found"), { cause: 404 });
  }

  // Retrieve the curriculum for the specified chapter, including video and article details
  let curriculum = await Curriculum.find({
    chapter: chapterId,
  });

  // Map the curriculum documents to plain objects and overwrite resources with undefined
  curriculum = curriculum.map((curriculum) => {
    return {
      ...curriculum._doc,
      resources: undefined,
      course: undefined,
      chapter: undefined,
    };
  });

  // Sort the curriculum based on the 'order' property using merge sort
  const sortedCurriculum = mergeSort(curriculum, "order");

  // Send a response containing the sorted curriculum details
  return curriculum
    ? res.status(200).json({
        message: "Done",
        curriculum: sortedCurriculum,
        course: chapter.course,
        chapter: { _id: chapter._id, title: chapter.title },
      })
    : //// Handle errors and pass them to the next middleware
      res.status(500).json({ message: "Something went wrong" });
});
