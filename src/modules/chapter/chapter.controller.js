import { asyncHandler } from "../../utils/asyncHandling.js";
import Chapter from "../../../DB/model/chapter.model.js";
import Course from "../../../DB/model/course.model.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Video from "../../../DB/model/video.model.js";
import Article from "../../../DB/model/article.model.js";
import { deleteDirectory } from "../../utils/azureServices.js";
import { mergeSort } from "../../utils/dataSructures.js";
/**
 * Create a new chapter within a specified course.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response indicating the success or failure of the chapter creation.
 */
export const createChapter = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId } = req.params;
  // Extract chapter details from the request body
  const { title } = req.body;

  let chapters = await Chapter.find({ course: courseId });

  // Calculate the order value for the next chapter .
  const order = chapters.length + 1;
  // Create a new Chapter document
  const createdChapter = new Chapter({
    course: courseId,
    order: order,
    title: title,
  });

  // Save the new Chapter document to the database
  await createdChapter.save();

  // Send a response based on the success or failure of the chapter creation
  return createdChapter
    ? res.status(200).json({ message: "Done", chapter: createdChapter._doc })
    : res
        .status(500)
        .json({ message: "Something went wrong during chapter creation." });
});
/**
 * Edit the details of a chapter within a specified course, including changing order if requested.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response indicating the success or failure of the chapter edit.
 *
 */
export const editChapter = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId, chapterId } = req.params;
  const { startPosition, endPosition, title, learningObjective } = req.body;
  const changeOrder = req.query.change_order;
  console.log(title, learningObjective);
  // Find the existing chapter based on chapterId
  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    return next(new Error("Chapter not found"), { cause: 404 });
  }

  /**
   * Update the order of chapters within a course based on changes in chapter sequence.
   * This function assumes that the necessary parameters (courseId, startPosition, endPosition, changeOrder) are available in the surrounding scope.
   */
  // If changeOrder flag is provided, update the order of chapters accordingly

  if (changeOrder) {
    // This block handles reordering chapters when moving a chapter down in the sequence
    if (startPosition < endPosition) {
      // If the new position is after the original position, shift items up

      await Chapter.updateMany(
        {
          course: courseId,
          order: {
            $gt: startPosition,
            $lte: endPosition,
          },
        },
        { $inc: { order: -1 } }
      );
    }
    // This block handles reordering chapters when moving a chapter up in the sequence
    else if (startPosition > endPosition) {
      // If the new position is before the original position, shift items down

      await Chapter.updateMany(
        {
          course: courseId,
          order: {
            $gte: endPosition,
            $lt: startPosition,
          },
        },
        { $inc: { order: 1 } }
      );
    }

    // Update the order of the edited chapter
    const editChapterOrder = await Chapter.findByIdAndUpdate(chapterId, {
      order: endPosition,
    });

    // Send a response based on the success or failure of the order update
    return editChapterOrder
      ? res.status(200).json({ message: "Done" })
      : res.status(500).json({
          message: "Something went wrong during chapter order update.",
        });
  }

  // If changeOrder flag is not provided, update the title and learningObjective of the chapter
  const editedChapter = await Chapter.findByIdAndUpdate(chapterId, {
    title: title,
    learningObjective: learningObjective,
  });

  // Send a response based on the success or failure of the chapter edit
  return editedChapter
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({
        message: "Something went wrong during chapter details update.",
      });
});

/**
 * Delete a chapter and its associated resources from the curriculum.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response indicating the success or failure of the operation.
 */
export const deleteChapter = asyncHandler(async (req, res, next) => {
  const { courseId, chapterId } = req.params;

  // Construct the directory path for the chapter resources
  const chapterDirectory = `Users\\${req.userId}\\Courses\\${courseId}\\${chapterId}`;

  // Delete the entire directory including chapter and associated resources
  await deleteDirectory(chapterDirectory);

  // Delete all curriculum entries associated with the chapter
  await Curriculum.deleteMany({ chapter: chapterId });

  // Delete all videos associated with the chapter
  await Video.deleteMany({ chapter: chapterId });

  // Delete all articles associated with the chapter
  await Article.deleteMany({ chapter: chapterId });

  // Delete the chapter document from the database
  const deletedChapter = await Chapter.findByIdAndDelete(chapterId);

  // Send a response based on the success or failure of the chapter deletion
  return deletedChapter
    ? res.status(200).json({ message: "Done" })
    : res
        .status(500)
        .json({ message: "Something went wrong during chapter deletion." });
});
/**
 * Retrieve details of a specific chapter within a given course.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response containing the details of the requested chapter or an error message if not found.
 */
export const getChapter = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { chapterId } = req.params;

  // Find the corresponding chapter based on chapterId
  const chapter = await Chapter.findById(chapterId).populate("course", "title");

  // Send a response based on the success or failure of the chapter retrieval
  return chapter
    ? res.status(200).json({
        message: "Done",
        chapter: chapter,
      })
    : res.status(500).json({
        message: "Chapter not found or something went wrong during retrieval.",
      });
});

/**
 * Retrieve all chapters associated with a specific course.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response containing the details of all chapters within the specified course or an error message.
 */
export const getChapters = asyncHandler(async (req, res, next) => {
  // Extract parameters from the request
  const { courseId } = req.params;

  // Find the corresponding course based on courseId
  const course = await Course.findById(courseId);

  // Check if the course exists
  if (!course) {
    return next(new Error("Course not found"), { cause: 404 });
  }

  // Retrieve all chapters associated with the specified course
  const chapters = await Chapter.find({ course: courseId });
  chapters.map((chapter) => chapter._doc);
  // Sort the chapters based on the 'order' property using merge sort
  const sortedchapters = mergeSort(chapters, "order");

  // Send a response based on the success or failure of the chapter retrieval
  return chapters
    ? res.status(200).json({
        message: "Done",
        chapters: sortedchapters,
      })
    : res.json({ message: "Something went wrong during chapter retrieval." });
});
