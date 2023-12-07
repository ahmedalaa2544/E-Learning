import { asyncHandler } from "../../utils/asyncHandling.js";
import Course from "../../../DB/model/course.model.js";
import Chapter from "../../../DB/model/chapter.model.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Video from "../../../DB/model/video.model.js";
import Article from "../../../DB/model/article.model.js";
import mongoose from "mongoose";
import handleUpload from "./curriculum.handleUpload.js";
import { deleteDirectory, generateSASUrl } from "../../utils/azureServices.js";
import { mergeSort } from "../../utils/dataSructures.js";
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
  const { title, describtion } = req.body;
  // Generate a unique videoId using MongoDB ObjectId
  const videoId = new mongoose.Types.ObjectId();
  // Generate a unique curriculumId using MongoDB ObjectId
  const curriculumId = new mongoose.Types.ObjectId();
  let curriculums = await Curriculum.find({ chapter: chapterId });

  // Calculate the order value for the next curriculum by adding 1 to the number of existing curriculums.
  const order = curriculums.length + 1;
  // Handle video file uploads and retrieve updated video details
  const { videoUrl, resources, duration, blobVideoName } = await handleUpload(
    req.files,
    req.userId,
    courseId,
    chapterId,
    videoId
  );
  // Create a new Video document in the database
  const createdVideo = new Video({
    _id: videoId,
    course: courseId,
    chapter: chapterId,
    curriculum: curriculumId,
    title: title,
    describtion: describtion,
    url: videoUrl,
    blobName: blobVideoName,
    resources: resources,
    duration: duration,
    resources: resources,
  });
  // Save the new Video document in the database
  await createdVideo.save();

  // Create a new Curriculum document for the video
  const curriculum = new Curriculum({
    _id: curriculumId,
    course: courseId,
    chapter: chapterId,
    type: "video",
    order: order,
    video: createdVideo._id,
  });

  // Save the new Curriculum document in the database
  await curriculum.save();

  // Send a response indicating the success or failure of the video creation process
  return createdVideo
    ? res.status(200).json({ message: "Done", video: createdVideo._doc })
    : res.json({ message: "Something went wrong" });
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

  // Calculate the order value for the next curriculum by adding 1 to the number of existing curriculums.
  const order = curriculums.length + 1;
  /**
   * Handle article file uploads, retrieve updated article Resources
   *
   * @param {Object} req.files - Files attached to the request.
   * @param {string} req.userId - User ID obtained from the request.
   * @param {string} courseId - ID of the course associated with the article.
   * @param {string} chapterId - ID of the chapter associated with the article.
   * @param {string} articleId - ID of the article being updated.
   * @returns {Object} - An object containing the updated article details, new Blob Storage name, and additional resources.
   */

  const { _, resources, __, ___ } = await handleUpload(
    req.files,
    req.userId,
    courseId,
    chapterId,
    articleId
  );

  // Create a new Article document in the database
  const article = new Article({
    _id: articleId,
    course: courseId,
    chapter: chapterId,
    curriculum: curriculumId,
    title: title,
    quillContent: quillContent,
    resources: resources,
  });

  // Save the new Article document in the database
  await article.save();

  // Create a new Curriculum document for the article
  const curriculum = new Curriculum({
    _id: curriculumId,
    course: courseId,
    chapter: chapterId,
    type: "article",
    order: order,
    article: article._id,
  });

  // Save the new Curriculum document in the database
  await curriculum.save();

  // Send a response indicating the success or failure of the article creation process
  return article
    ? res.status(200).json({ message: "Done", article: article._doc })
    : res.json({ message: "Something went wrong" });
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
    : res.json({ message: "Something went wrong" });
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
  const { courseId, chapterId, videoId } = req.params;
  const { title, describtion } = req.body;

  /**
   * Handle video file uploads, retrieve updated video details, and provide the new Blob Storage name.
   *
   * @param {Object} req.files - Files attached to the request.
   * @param {string} req.userId - User ID obtained from the request.
   * @param {string} courseId - ID of the course associated with the video.
   * @param {string} chapterId - ID of the chapter associated with the video.
   * @param {string} videoId - ID of the video being updated.
   * @param {string} oldBlobVideoName - The old Blob Storage name of the video to be deleted.
   * @returns {Object} - An object containing the updated video details, new Blob Storage name, and additional resources.
   */
  /**
   * Note: If new resources are being uploaded for this video, existing resources will be overwritten.
   * This ensures that the latest set of resources replaces any previous attachments.
   */
  const { videoUrl, resources, duration, blobVideoName } = await handleUpload(
    req.files,
    req.userId,
    courseId,
    chapterId,
    videoId,
    video.blobName
  );
  // Update the video document with the edited details
  const editedVideo = await Video.findByIdAndUpdate(videoId, {
    title: title,
    describtion: describtion,
    Url: videoUrl,
    blobName: blobVideoName,
    duration: duration,
    resources: resources,
  });

  // Send a response indicating the success or failure of the video editing process
  return editedVideo
    ? res.status(200).json({ message: "Done" })
    : res.json({ message: "Something went wrong" });
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
  const { courseId, chapterId, articleId } = req.params;
  const { title, quillContent } = req.body;

  /**
   * Handle article file uploads, retrieve updated article Resources
   *
   * @param {Object} req.files - Files attached to the request.
   * @param {string} req.userId - User ID obtained from the request.
   * @param {string} courseId - ID of the course associated with the article.
   * @param {string} chapterId - ID of the chapter associated with the article.
   * @param {string} articleId - ID of the article being updated.
   * @returns {Object} - An object containing the updated article details, new Blob Storage name, and additional resources.
   */
  /**
   * Note: If new resources are being uploaded for this article, existing resources will be overwritten.
   * This ensures that the latest set of resources replaces any previous attachments.
   */
  const { _, resources, __, ___ } = await handleUpload(
    req.files,
    req.userId,
    courseId,
    chapterId,
    articleId
  );

  // Update the article document with the edited details
  const editedArticle = await Article.findByIdAndUpdate(articleId, {
    title: title,
    quillContent: quillContent,
    resources: resources,
  });

  // Send a response indicating the success or failure of the article editing process
  return editedArticle
    ? res.status(200).json({ message: "Done" })
    : res.json({ message: "Something went wrong" });
});

/**
 * Delete a video along with its associated resources and metadata.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {void} - Sends a response indicating the success or failure of the video deletion.
 */
export const deleteVideo = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId, videoId } = req.params;

  // Retrieve the existing video document based on videoId
  const video = await Video.findById(videoId);

  // Check if the video exists
  if (!video) {
    return next(new Error("Video not found"), { cause: 404 });
  }

  // Construct the directory path for the video resources
  const videoDirectory = `Users\\${req.userId}\\Courses\\${courseId}\\${chapterId}\\${videoId}`;

  // Delete the entire directory including video and associated resources
  await deleteDirectory(videoDirectory);

  // Delete the video document from the database
  const deletedVideo = await video.deleteOne({ _id: videoId });

  // Send a response based on the success of the video deletion
  return deletedVideo
    ? res.status(200).json({ message: "Done" })
    : res.json({ message: "Something went wrong" });
});

/**
 * Delete an article along with its associated resources and metadata.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {void} - Sends a response indicating the success or failure of the article deletion.
 */
export const deleteArticle = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId, articleId } = req.params;

  // Retrieve the existing article document based on articleId
  const article = await Article.findById(articleId);

  // Check if the article exists
  if (!article) {
    return next(new Error("Article not found"), { cause: 404 });
  }

  // Construct the directory path for the article resources
  const articleDirectory = `Users\\${req.userId}\\Courses\\${courseId}\\${chapterId}\\${articleId}`;

  // Delete the entire directory including article and associated resources
  await deleteDirectory(articleDirectory);

  // Delete the article document from the database
  const deletedArticle = await article.deleteOne({ _id: articleId });

  // Send a response based on the success of the article deletion
  return deletedArticle
    ? res.status(200).json({ message: "Done" })
    : res.json({ message: "Something went wrong" });
});

/**
 * Retrieve details of a specific video within a given course and chapter.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {void} - Sends a response containing video details or an error message.
 */
export const getVideo = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId, videoId } = req.params;

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

  // Retrieve the existing video document based on videoId
  const video = await Video.findById(videoId);

  // Check if the video exists
  if (!video) {
    return next(new Error("Video not found"), { cause: 404 });
  }

  //Obtain the Shared Access Signature (SAS) URL for a specific video blob.

  const videoBlobName = video.blobName;
  const { accountSasTokenUrl } = await generateSASUrl(videoBlobName, "r", "60");

  // Send a response containing video details
  return video
    ? res.status(200).json({
        message: "Done",
        video: { ...video._doc, url: accountSasTokenUrl, blobName: undefined },
      })
    : res.json({ message: "Something went wrong" });
});

/**
 * Retrieve details of a specific article within a given course and chapter.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {void} - Sends a response containing article details or an error message.
 */
export const getArticle = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId, articleId } = req.params;

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

  // Retrieve the existing article document based on articleId
  const article = await Article.findById(articleId);

  // Check if the article exists
  if (!article) {
    return next(new Error("Article not found"), { cause: 404 });
  }

  // Send a response containing article details
  return article
    ? res.status(200).json({ message: "Done", article: article._doc })
    : res.json({ message: "Something went wrong" });
});

/**
 * Retrieve the curriculum (sequence of videos and articles) for a specific chapter within a course.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {void} - Sends a response containing the curriculum details or an error message.
 */
export const getCurriculum = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId } = req.params;

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

  // Retrieve the curriculum for the specified chapter, including video and article details
  const curriculum = await Curriculum.find({
    chapter: chapterId,
  })
    .populate("video")
    .populate("article")
    .exec();

  // Map the curriculum documents to plain objects
  curriculum.map((curriculum) => curriculum._doc);

  // Sort the curriculum based on the 'order' property using merge sort
  const sortedCurriculum = mergeSort(curriculum, "order");

  // Send a response containing the sorted curriculum details
  return curriculum
    ? res.status(200).json({ message: "Done", curriculum: sortedCurriculum })
    : //// Handle errors and pass them to the next middleware
      res.json({ message: "Something went wrong" });
});
