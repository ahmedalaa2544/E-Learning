import { asyncHandler } from "../../utils/asyncHandling.js";
import Course from "../../../DB/model/course.model.js";
import Chapter from "../../../DB/model/chapter.model.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Video from "../../../DB/model/video.model.js";
import Article from "../../../DB/model/article.model.js";
import upload, { deleteDirectory } from "../../utils/azureServices.js";
/**
 * Create a new course with the provided title.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response indicating success or failure.
 */
export const createCourse = asyncHandler(async (req, res, next) => {
  // Extract title from the request body.
  const { title } = req.body;

  // Create a new Course instance with the extracted title and the user ID from the request.
  const createdCourse = new Course({
    title: title,
    createdBy: req.userId,
  });

  // Save the newly created course to the database.
  await createdCourse.save();

  // Return a JSON response based on the success or failure of the operation.
  return createdCourse
    ? res.status(200).json({ message: "Done", course: createdCourse._doc })
    : res.json({ message: "Something went wrong" });
});

/**
 * Edit the details of a course based on the provided request parameters and body.
 *
 * @param {Object} req - Express request object containing updated course details.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response indicating success or failure of the course edit operation.
 */
export const editCourse = asyncHandler(async (req, res, next) => {
  // Destructure updated course details from the request body.
  const {
    title,
    subtitle,
    category,
    subCategory,
    language,
    price,
    discount,
    tags,
    description,
    level,
  } = req.body;

  // Extract courseId from the request parameters.
  const { courseId } = req.params;
  // Initialize variables for cover image and promotional video URLs.
  let coverImageUrl;
  let promotionalVideoUrl;
  // Check if a cover image file is provided in the request.
  if (req.files.coverImage) {
    // Extract the extension for the cover image.
    const blobImageExtension = req.files.coverImage[0].originalname
      .split(".")
      .pop();

    // Define the path for the cover image in the user's course directory.
    const blobImageName = `Users\\${req.userId}\\Courses\\${courseId}\\Course_Cover_Image.${blobImageExtension}`;
    // Upload the cover image and obtain its URL.
    coverImageUrl = await upload(
      req.files.coverImage[0].path,
      blobImageName,
      "image",
      blobImageExtension
    );
  }

  // Check if a promotional video file is provided in the request.
  if (req.files.promotionalVideo) {
    // Extract the extension for the promotional video.
    const blobVideoExtension = req.files.promotionalVideo[0].originalname
      .split(".")
      .pop();

    // Define the path for the promotional video in the user's course directory.
    const blobVideoName = `Users\\${req.userId}\\Courses\\${courseId}\\Course_Promotional_Video.${blobVideoExtension}`;

    // Upload the promotional video and obtain its URL.
    promotionalVideoUrl = await upload(
      req.files.promotionalVideo[0].path,
      blobVideoName,
      "video",
      blobVideoExtension
    );
  }

  // Update the course details in the database.
  await Course.updateOne(
    { _id: courseId },
    {
      title: title,
      subtitle: subtitle,
      description: description,
      language: language,
      level: level,
      coverImageUrl: coverImageUrl,
      promotionalVideoUrl: promotionalVideoUrl,
      price: price,
      discount: discount,
      category: category,
      subCategory: subCategory,
      tags: tags,
    }
  );

  // Retrieve the edited course from the database.
  const editedCourse = await Course.findById(courseId);

  // Return a JSON response indicating the success or failure of the course edit operation.
  return editedCourse
    ? res.status(200).json({ message: "Done", course: editedCourse._doc })
    : res.json({ message: "Something went wrong" });
});

/**
 * Delete a course and its associated content based on the provided course ID.
 *
 * @param {Object} req - Express request object containing the course ID to be deleted.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response indicating success or failure of the course deletion operation.
 */
export const deleteCourse = asyncHandler(async (req, res, next) => {
  // Extract courseId from the request parameters.
  const { courseId } = req.params;

  // Define the directory path for the course files.
  const courseDirectory = `Users\\${req.userId}\\Courses\\${courseId}\\`;

  // Delete the entire course directory, including associated files.
  await deleteDirectory(courseDirectory);

  // Delete curriculum entries related to the course.
  await Curriculum.deleteMany({ course: courseId });

  // Delete video entries related to the course.
  await Video.deleteMany({ course: courseId });

  // Delete article entries related to the course.
  await Article.deleteMany({ course: courseId });

  // Delete chapter entries related to the course.
  await Chapter.deleteMany({ course: courseId });

  // Delete the course document from the database.
  const deletedCourse = await Course.findByIdAndDelete(courseId);

  // Send a JSON response based on the success or failure of the course deletion.
  return deletedCourse
    ? res.status(200).json({ message: "Done" })
    : res.json({ message: "Something went wrong during course deletion." });
});

/**
 * Retrieve details of a course by its ID.
 *
 * @param {Object} req - Express request object with course ID as a parameter.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response containing course details or an error message.
 */
export const getCourse = asyncHandler(async (req, res, next) => {
  // Extract courseId from the request parameters.
  const { courseId } = req.params;

  // Find the course in the database by its ID.
  const fetchedCourse = await Course.findById(courseId);

  // If the course is not found, invoke the error middleware with a 404 status.
  if (!fetchedCourse) {
    return next(new Error("Course not found"), { cause: 404 });
  }

  // Return a JSON response based on the success or failure of the operation.
  return fetchedCourse
    ? res.status(200).json({ message: "Done", course: fetchedCourse._doc })
    : res.json({ message: "Something went wrong" });
});

/**
 * Retrieve a list of courses created by the authenticated user.
 *
 * @param {Object} req - Express request object containing user ID for identifying created courses.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response containing a list of user-created courses or an error message.
 */
export const getCourses = asyncHandler(async (req, res, next) => {
  // Check the 'view' query parameter to determine the type of courses to retrieve.
  if (req.query.view === "instructor") {
    // Find courses created by the authenticated user.
    let courses = await Course.find({ createdBy: req.userId });

    // If no courses are found, invoke the error middleware with a 404 status.
    if (courses.length <= 0) {
      return next(new Error("Courses not found"), { cause: 404 });
    }

    // Extract the document representation for each course.
    courses = courses.map((course) => course._doc);

    // Return a JSON response containing the list of user-created courses.
    return courses
      ? res.status(200).json({ message: "Done", courses: courses })
      : res.json({ message: "Something went wrong" });
  } else if (req.query.view === "student") {
    // Handling for 'student' view (to be implemented if needed).
  } else if (req.query.view === undefined || "all") {
    // Retrieve all courses, regardless of the creator.
    let courses = await Course.find();

    // Extract the document representation for each course.
    courses = courses.map((course) => course._doc);

    // Return a JSON response containing the list of all courses.
    return courses
      ? res.status(200).json({ message: "Done", courses: courses })
      : res.json({ message: "Something went wrong" });
  }

  // If the 'view' query parameter is not valid, return a 400 status with an error message.
  return res
    .status(400)
    .json({ message: "Please, enter a suitable 'view' query parameter" });
});
