import { asyncHandler } from "../../utils/asyncHandling.js";
import Course from "../../../DB/model/course.model.js";
import Chapter from "../../../DB/model/chapter.model.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Video from "../../../DB/model/video.model.js";
import Article from "../../../DB/model/article.model.js";
import Category from "../../../DB/model/category.model.js";
import subCategoryModel from "../../../DB/model/subCategory.model.js";
import ratingModel from "../../../DB/model/rating.model.js";
import commentModel from "../../../DB/model/comment.model.js";
import userModel from "../../../DB/model/user.model.js";

import upload, {
  deleteDirectory,
  deleteBlob,
  generateSASUrl,
} from "../../utils/azureServices.js";
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
    : res.status(500).json({ message: "Something went wrong" });
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
  let blobImageName;
  let blobVideoName;
  let categoryId, subCategoryId;

  // Check if neither the 'upload' nor 'delete' query parameters are provided in the request.
  if (req.query.upload === undefined && req.query.delete === undefined) {
    // Retrieve the identifiers (IDs) for the specified category and subcategory.
    // Find the category ID based on the provided category name.
    categoryId = (await Category.findOne({ name: category }))._id;

    // Find the subcategory ID based on the provided subcategory name and its association with the category.
    subCategoryId = (
      await subCategoryModel.findOne({
        name: subCategory,
        categoryId: categoryId,
      })
    )._id;
  } else {
    // If either 'upload' or 'delete' query parameter is provided, use the category and subcategory from the existing course.

    // Use the category and subcategory IDs from the existing course.
    categoryId = req.course.category;
    subCategoryId = req.course.subcategory;
  }

  // Check if the request includes a query parameter for uploading a cover image.
  if (req.query.upload === "coverImage") {
    // Check if a cover image file is provided in the request.
    if (req.files?.coverImage) {
      // Extract the extension for the cover image.
      const blobImageExtension = req.files.coverImage[0].originalname
        .split(".")
        .pop();

      // Define the path for the cover image in the user's course directory.
      blobImageName = `Users\\${req.userId}\\Courses\\${courseId}\\Course_Cover_Image.${blobImageExtension}`;

      // Upload the cover image and obtain its URL.
      coverImageUrl = await upload(
        req.files.coverImage[0].path,
        blobImageName,
        "image",
        blobImageExtension
      );
    }
  }

  // Check if the request includes a query parameter for uploading a promotional video.
  if (req.query.upload === "promotionalVideo") {
    // Check if a promotional video file is provided in the request.
    if (req.files?.promotionalVideo) {
      // Extract the extension for the promotional video.
      const blobVideoExtension = req.files.promotionalVideo[0].originalname
        .split(".")
        .pop();

      // Define the path for the promotional video in the user's course directory.
      blobVideoName = `Users\\${req.userId}\\Courses\\${courseId}\\Course_Promotional_Video.${blobVideoExtension}`;

      // Upload the promotional video and obtain its URL.
      promotionalVideoUrl = await upload(
        req.files.promotionalVideo[0].path,
        blobVideoName,
        "video",
        blobVideoExtension
      );
    }
  }

  // Check if the request includes a query parameter for deleting the cover image
  if (req.query.delete === "coverImage") {
    // Retrieve the blob name associated with the course's cover image
    const coverImageBlobName = req.course.coverImageBlobName;

    // Delete the corresponding blob from storage
    await deleteBlob(coverImageBlobName);

    // Update the course document in the database to remove cover image details
    await Course.findByIdAndUpdate(courseId, {
      coverImageUrl: "",
      coverImageBlobName: "",
    });
  }

  // Check if the request includes a query parameter for deleting the promotional video
  if (req.query.delete === "promotionalVideo") {
    // Retrieve the blob name associated with the course's promotional video
    const promotionalVideoBlobName = req.course.promotionalVideoBlobName;

    // Delete the corresponding blob from storage
    await deleteBlob(promotionalVideoBlobName);

    // Update the course document in the database to remove promotional video details
    await Course.findByIdAndUpdate(courseId, {
      promotionalVideoUrl: "",
      promotionalVideoBlobName: "",
    });
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
      coverImageBlobName: blobImageName,
      promotionalVideoUrl: promotionalVideoUrl,
      promotionalVideoBlobName: blobVideoName,
      price: price,
      discount: discount,
      category: categoryId,
      subCategory: subCategoryId,
      tags: tags,
    }
  );

  // Retrieve the edited course from the database, including information about its category and subcategory.
  const editedCourse = await Course.findById(courseId)
    .populate({ path: "category", select: "name" })
    .populate({ path: "subCategory", select: "name" })
    .exec();

  // Extract the blob name associated with the course's cover image and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
  blobImageName = editedCourse.coverImageBlobName;
  const { accountSasTokenUrl: imageUrl } = await generateSASUrl(
    blobImageName,
    "r",
    "60"
  );

  // Extract the blob name associated with the course's promotional video and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
  blobVideoName = editedCourse.promotionalVideoBlobName;
  const { accountSasTokenUrl: videoUrl } = await generateSASUrl(
    blobVideoName,
    "r",
    "60"
  );

  // Return a JSON response indicating the success or failure of the course edit operation.
  return editedCourse
    ? res.status(200).json({
        message: "Done",
        course: {
          ...editedCourse._doc,
          coverImageUrl: imageUrl,
          coverImageBlobName: undefined,
          promotionalVideoUrl: videoUrl,
          promotionalVideoBlobName: undefined,
        },
      })
    : res.status(500).json({ message: "Something went wrong" });
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
    : res
        .status(500)
        .json({ message: "Something went wrong during course deletion." });
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
  const fetchedCourse = await Course.findById(courseId).populate([
    { path: "instructors", select: "userName profilePic" },
  ]);
  // If the course is not found, invoke the error middleware with a 404 status.
  if (!fetchedCourse) {
    return next(new Error("Course not found"), { cause: 404 });
  }

  // Calculate the average rating for the course
  const ratings = await ratingModel.find({ course: courseId });
  let sum = 0;
  ratings.map((rating) => {
    sum += rating.rating;
  });
  const courseRating = ratings.length > 0 ? sum / ratings.length : 0;

  // Retrieve comments associated with the course
  const courseComments = await commentModel
    .find({ course: courseId })
    .populate({ path: "user", select: "userName profilePic" })
    .exec();

  // Use Promise.all to concurrently process each comment and generate SAS URLs for user profile pictures.
  const userMeta = await Promise.all(
    courseComments.map(async (comment) => {
      comment = comment._doc;
      const { accountSasTokenUrl: urlProfilePic } = await generateSASUrl(
        comment.user.profilePic.blobName,
        "r",
        "60"
      );

      // Modify comment.user.profilePic to contain only the URL property.
      comment.user.profilePic = { url: urlProfilePic };

      return {
        ...comment,
        rating: ratings.find(
          (rating) => rating.user.toString() === comment.user._id.toString()
        ).rating,
      };
    })
  );

  // Extract the blob name associated with the course's cover image and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
  const blobImageName = fetchedCourse.coverImageBlobName;
  const { accountSasTokenUrl: imageUrl } = await generateSASUrl(
    blobImageName,
    "r",
    "60"
  );

  // Extract the blob name associated with the course's promotional video and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
  const blobVideoName = fetchedCourse.promotionalVideoBlobName;
  const { accountSasTokenUrl: videoUrl } = await generateSASUrl(
    blobVideoName,
    "r",
    "60"
  );
  // Return a JSON response based on the success or failure of the operation.
  return fetchedCourse
    ? res.status(200).json({
        message: "Done",
        course: {
          ...fetchedCourse._doc,
          coverImageUrl: imageUrl,
          coverImageBlobName: undefined,
          promotionalVideoUrl: videoUrl,
          promotionalVideoBlobName: undefined,
          rating: courseRating,
          numberOfRatings: ratings.length,
          comments: userMeta,
          finalPrice: fetchedCourse.finalPrice,
        },
      })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Retrieve a list of courses .
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
    let courses = await Course.find({ createdBy: req.userId })
      .populate({ path: "category", select: "name" })
      .populate({ path: "subCategory", select: "name" })
      .exec();

    // Extract the document representation for each course.
    courses = await Promise.all(
      courses.map(async (course) => {
        // Extract the blob name associated with the course's cover image and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
        const blobImageName = course.coverImageBlobName;

        const { accountSasTokenUrl: imageUrl } = await generateSASUrl(
          blobImageName,
          "r",
          "60"
        );

        // Extract the blob name associated with the course's promotional video and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
        const blobVideoName = course.promotionalVideoBlobName;
        const { accountSasTokenUrl: videoUrl } = await generateSASUrl(
          blobVideoName,
          "r",
          "60"
        );

        return {
          ...course._doc,
          coverImageUrl: imageUrl,
          coverImageBlobName: undefined,
          promotionalVideoUrl: videoUrl,
          promotionalVideoBlobName: undefined,
        };
      })
    );

    // Return a JSON response containing the list of user-created courses.
    return courses
      ? res.status(200).json({ message: "Done", courses: courses })
      : res.status(500).json({ message: "Something went wrong" });
  } else if (req.query.view === "student") {
    // Handling for 'student' view (to be implemented if needed).
  } else if (req.query.view === undefined || "all") {
    // Retrieve all courses, regardless of the creator.
    let courses = await Course.find()
      .populate({ path: "category", select: "name" })
      .populate({ path: "subCategory", select: "name" })
      .exec();

    // Extract the document representation for each course.
    courses = await Promise.all(
      courses.map(async (course) => {
        // Extract the blob name associated with the course's cover image and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
        const blobImageName = course.coverImageBlobName;

        const { accountSasTokenUrl: imageUrl } = await generateSASUrl(
          blobImageName,
          "r",
          "60"
        );

        // Extract the blob name associated with the course's promotional video and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
        const blobVideoName = course.promotionalVideoBlobName;
        const { accountSasTokenUrl: videoUrl } = await generateSASUrl(
          blobVideoName,
          "r",
          "60"
        );

        return {
          ...course._doc,
          coverImageUrl: imageUrl,
          coverImageBlobName: undefined,
          promotionalVideoUrl: videoUrl,
          promotionalVideoBlobName: undefined,
        };
      })
    );

    // Return a JSON response containing the list of all courses.
    return courses
      ? res.status(200).json({ message: "Done", courses: courses })
      : res.status(500).json({ message: "Something went wrong" });
  }

  // If the 'view' query parameter is not valid, return a 400 status with an error message.
  return res
    .status(403)
    .json({ message: "Please, enter a suitable 'view' query parameter" });
});

/**
 * Retrieve courses based on the specified category and optional subcategory, enriching their data with Shared Access Signature (SAS) URLs for cover images and promotional videos.
 *
 * @param {Object} req - Express request object containing category and subcategory IDs as parameters.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response containing a list of enriched courses or an error message.
 */
export const getCoursesWithCategAndSubCateg = asyncHandler(
  async (req, res, next) => {
    // Extract the category and subcategory IDs from the request parameters.
    const { categoryId, subCategoryId } = req.params;
    let courses;

    // Check if both category and subcategory IDs are provided.
    if (categoryId && subCategoryId) {
      // Retrieve courses associated with the specified category and subcategory.
      courses = await Course.find({
        category: categoryId,
        subCategory: subCategoryId,
      });
    } else if (categoryId) {
      // Retrieve courses associated with the specified category.
      courses = await Course.find({ category: categoryId });
    }

    // Enrich each course's data with SAS URLs for cover images and promotional videos.
    courses = await Promise.all(
      courses.map(async (course) => {
        // Extract the blob name associated with the course's cover image and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
        const blobImageName = course.coverImageBlobName;
        const { accountSasTokenUrl: imageUrl } = await generateSASUrl(
          blobImageName,
          "r",
          "60"
        );

        // Extract the blob name associated with the course's promotional video and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
        const blobVideoName = course.promotionalVideoBlobName;
        const { accountSasTokenUrl: videoUrl } = await generateSASUrl(
          blobVideoName,
          "r",
          "60"
        );

        // Return an enriched course object with updated URLs and excluding sensitive blob names.
        return {
          ...course._doc,
          coverImageUrl: imageUrl,
          coverImageBlobName: undefined,
          promotionalVideoUrl: videoUrl,
          promotionalVideoBlobName: undefined,
        };
      })
    );

    // Return a JSON response containing the list of enriched courses or an error message.
    return courses
      ? res.status(200).json({ message: "Done", courses: courses })
      : res.status(500).json({ message: "Something went wrong" });
  }
);

/**
 * Handle the process of posting a rating for a specific course.
 *
 * @param {Object} req - Express request object containing rating data in the request body and the course ID in the URL parameters.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response indicating the success or failure of the rating posting process.
 */
export const postRating = asyncHandler(async (req, res, next) => {
  // Extract rating and course ID from the request body and parameters
  const { rating } = req.body;
  const { courseId } = req.params;
  let rate;

  // Check if the user has already rated the course
  if (!(await ratingModel.findOne({ user: req.userId }))) {
    // If not, create a new rating record
    rate = new ratingModel({
      course: courseId,
      user: req.userId,
      rating: rating,
    });
    await rate.save(); // Save the newly created rating
  } else {
    // If the user has already rated the course, update their existing rating
    rate = await ratingModel.findOneAndUpdate(
      { user: req.userId },
      { rating: rating }
    );
  }
  // Return a JSON response indicating the success or failure of the rating posting process
  return rate
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Handles the process of posting a comment for a specific course.
 *
 * @param {Object} req - The Express request object containing the course ID in the URL parameters and the comment data in the request body.
 * @param {Object} res - The Express response object used to send back the response.
 * @param {Function} next - The next middleware function in the Express middleware chain.
 * @returns {Object} - JSON response indicating the success or failure of the comment posting process.
 */
export const postComment = asyncHandler(async (req, res, next) => {
  // Extract course ID and comment data from the request
  const { courseId } = req.params;
  const { comment } = req.body;

  // Create a new comment record
  const createdComment = new commentModel({
    course: courseId,
    user: req.userId,
    comment: comment,
  });
  await createdComment.save(); // Save the newly created comment

  // Return a JSON response indicating the success or failure of the comment posting process
  return createdComment
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({ message: "Failed to post comment" });
});

export const addInstructor = asyncHandler(async (req, res, next) => {
  // check instruction
  const checkInst = await userModel.findById(req.params.instructorId);
  if (!checkInst) {
    return next(new Error("instructor not found", { cause: 404 }));
  }
  const course = await Course.findByIdAndUpdate(
    req.params.courseId,
    {
      $push: { instructors: req.params.instructorId },
    },
    { new: true }
  );

  // response
  return res.status(200).json({ message: "Done", course });
});
