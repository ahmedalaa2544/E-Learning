import { asyncHandler } from "../../utils/asyncHandling.js";
import onFinished from "on-finished";
import Course from "../../../DB/model/course.model.js";
import Chapter from "../../../DB/model/chapter.model.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Video from "../../../DB/model/video.model.js";
import Article from "../../../DB/model/article.model.js";
import Quiz from "../../../DB/model/quiz.model.js";
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
  const { title, description } = req.body;

  // Generate a unique videoId using MongoDB ObjectId
  const videoId = new mongoose.Types.ObjectId();

  // Generate a unique curriculumId using MongoDB ObjectId
  const curriculumId = new mongoose.Types.ObjectId();

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
    ? res
        .status(200)
        .json({ message: "Server Processing the Video", createdVideo })
    : res.status(500).json({ message: "Something went wrong" });

  // Wait for the response to be sent, then perform additional actions
  onFinished(res, async (err, res) => {
    let videoUrl, duration, blobVideoName;
    // Upload the video and retrieve information such as URL, duration, and blob name.
    ({ videoUrl, duration, blobVideoName } = await uploadVideo(
      req.files,
      req.userId,
      courseId,
      chapterId,
      curriculumId,
      false
    ));
    // Save in DataBase
    await Video.findByIdAndUpdate(videoId, {
      ...(videoUrl && { url: videoUrl }),
      ...(blobVideoName && { blobName: blobVideoName }),
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

  // Calculate the order value for the next curriculum by adding 1 to the number of existing curriculums.
  const order = curriculums.length + 1;

  // Create a new Article document in the database
  const article = new Article({
    _id: articleId,
    course: courseId,
    chapter: chapterId,
    curriculum: curriculumId,
    quillContent: quillContent,
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
    ? res
        .status(200)
        .json({ message: "Done", article: { ...article._doc, title: title } })
    : res.json({ message: "Something went wrong" });
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
  const { title, description, duaration, sorted } = req.body;
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
    description: description,
    duaration,
    sorted,
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
    ? res
        .status(200)
        .json({ message: "Done", quiz: { ...quiz._doc, title: title } })
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
  const { courseId, chapterId, curriculumId } = req.params;
  const { title, description } = req.body;
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
  let videoUrl, duration, blobVideoName, resources, subtitles;
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
  }

  // Check if the request involves uploading resources.
  if (req.query.upload === "resources") {
    /**
     * Note: If new resources are being uploaded for this video, existing resources will be overwritten.
     * This ensures that the latest set of resources replaces any previous attachments.
     */
    resources = await uploadResources(
      req.files,
      req.userId,
      courseId,
      chapterId,
      curriculumId
    );
  }

  // Check if the request involves uploading subtitles.
  if (req.query.upload === "subtitles") {
    // Upload subtitles and retrieve information such as blob name.
    ({ subtitles } = await uploadSubtitles(
      req.files,
      req.userId,
      courseId,
      chapterId,
      curriculumId,
      video.subtitles.blobName
    ));
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
      subtitles: "",
    });
  }

  // Check if the request involves deleting resources.
  if (req.query.delete === "resources") {
    // Retrieve the resources directory and delete it along with its content.
    const resourcesDirectory = curriculum.resources.directory;
    await deleteDirectory(resourcesDirectory);
    // Update the curriculum document in the database to remove resource-related details.
    await Curriculum.findByIdAndUpdate(curriculum, {
      resources: { directory: "", content: [] },
    });
  }

  // Check if the request involves deleting subtitles.
  if (req.query.delete === "subtitles") {
    // Retrieve the subtitles' blob name and delete it.
    const subtitlesBlobName = video.subtitles.blobName;
    await deleteBlob(subtitlesBlobName);
    // Update the Video document in the database to remove subtitle-related details.
    await Video.findByIdAndUpdate(curriculum.video, {
      subtitles: "",
    });
  }
  // Update the video document with the edited details
  await Video.findByIdAndUpdate(curriculum.video, {
    title: title,
    subtitles: subtitles,
    description: description,
    url: videoUrl,
    blobName: blobVideoName,
    duration: duration,
  });

  // Update the curriculum document with the edited details
  const editedCurriculum = await Curriculum.findByIdAndUpdate(curriculumId, {
    title: title,
    resources: resources,
  });
  // Send a response indicating the success or failure of the video editing process
  if (!res.headersSent) {
    return editedCurriculum
      ? res.status(200).json({ message: "Done" })
      : res.json({ message: "Something went wrong" });
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

  let resources;
  // Check if the request involves uploading resources.
  if (req.query.upload === "resources") {
    /**
     * Note: If new resources are being uploaded for this article, existing resources will be overwritten.
     * This ensures that the latest set of resources replaces any previous attachments.
     */
    resources = await uploadResources(
      req.files,
      req.userId,
      courseId,
      chapterId,
      curriculumId
    );
  }
  // Check if the request involves deleting resources.
  if (req.query.delete === "resources") {
    // Retrieve the resources directory and delete it along with its content.
    const resourcesDirectory = curriculum.resources.directory;
    await deleteDirectory(resourcesDirectory);
    // Update the curriculum document in the database to remove resource-related details.
    await Curriculum.findByIdAndUpdate(curriculum, {
      resources: { directory: "", content: [] },
    });
  }
  // Update the article document with the edited details
  await Article.findByIdAndUpdate(curriculum.article, {
    title: title,
    quillContent: quillContent,
    resources: resources,
  });
  // Update the curriculum document with the edited details
  const editedCurriculum = await Curriculum.findByIdAndUpdate(curriculumId, {
    title: title,
    resources: resources,
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
    .populate("video")
    .populate("article")
    .exec();

  // Check if the curriculum exists
  if (!curriculum) {
    return next(new Error("Curriculum not found"), { cause: 404 });
  }

  let resources = [];
  // Generate SAS URLs for each resource associated with the video
  for (const resource of curriculum.resources.content) {
    const { accountSasTokenUrl: resourceUrl } = await generateSASUrl(
      resource.blobName,
      "r",
      "60"
    );
    resources.push({ name: resource.name, url: resourceUrl });
  }
  if (curriculum.type === "video") {
    const video = curriculum.video;

    // Obtain the Shared Access Signature (SAS) URL for the video blob
    const { accountSasTokenUrl: videoUrl } = await generateSASUrl(
      video.blobName,
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
            type: "video",
            title: curriculum.title,
            url: videoUrl,
            blobName: undefined,
            resources: resources,
            subtitles: subtitlesUrl,
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
  const chapter = await Chapter.findById(chapterId);

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
    return { ...curriculum._doc, resources: undefined };
  });

  // Sort the curriculum based on the 'order' property using merge sort
  const sortedCurriculum = mergeSort(curriculum, "order");

  // Send a response containing the sorted curriculum details
  return curriculum
    ? res.status(200).json({
        message: "Done",
        curriculum: sortedCurriculum,
      })
    : //// Handle errors and pass them to the next middleware
      res.status(500).json({ message: "Something went wrong" });
});
