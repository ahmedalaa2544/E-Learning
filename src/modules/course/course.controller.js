import { asyncHandler } from "../../utils/asyncHandling.js";
import Course from "../../../DB/model/course.model.js";
import Chapter from "../../../DB/model/chapter.model.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Video from "../../../DB/model/video.model.js";
import Article from "../../../DB/model/article.model.js";
import Quiz from "../../../DB/model/quiz.model.js";
import Question from "../../../DB/model/question.model.js";
import Option from "../../../DB/model/option.model.js";
import ratingModel from "../../../DB/model/rating.model.js";
import commentModel from "../../../DB/model/comment.model.js";
import User from "../../../DB/model/user.model.js";
import View from "../../../DB/model/view.model.js";
import Progress from "../../../DB/model/progress.model.js";

import Similarities from "../../../DB/model/similarities.model.js";
import mongoose from "mongoose";
import upload, {
  deleteDirectory,
  deleteBlob,
  generateSASUrl,
  uploadHls,
} from "../../utils/azureServices.js";
import instructorModel from "../../../DB/model/instructor.model.js";
import fetch from "node-fetch";
import courseModel from "../../../DB/model/course.model.js";
import notificationModel from "../../../DB/model/notification.model.js";
import { getIo } from "../../utils/server.js";
import webpush from "web-push";
import searchModel from "../../../DB/model/search.keys.js";
import userModel from "../../../DB/model/user.model.js";
import curriculumModel from "../../../DB/model/curriculum.model.js";

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

  //save instrucator in DB Schema
  await instructorModel.create({
    course: createdCourse._id,
    courseOwner: req.userId,
    user: req.userId,
  });

  await userModel.findByIdAndUpdate(req.userId, {
    $inc: { totalNumberOfCourses: 1 },
  });

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
    duration,
    createdBy,
  } = req.body;
  // Extract courseId from the request parameters.
  const { courseId } = req.params;
  // Initialize variables for cover image and promotional video URLs.
  let coverImageUrl;
  let promotionalVideoUrl;
  let blobImageName;
  let blobVideoName;
  //
  // Check if the request includes a query parameter for uploading a cover image.
  if (req.query.upload === "coverImage") {
    // Check if a cover image file is provided in the request.
    if (req.files?.coverImage) {
      // Extract the extension for the cover image.
      const blobImageExtension = req.files.coverImage[0].originalname
        .split(".")
        .pop();

      // Define the path for the cover image in the user's course directory.
      blobImageName = `Users\\${req.user.userName}_${req.user._id}\\Courses\\${courseId}\\Course_Cover_Image.${blobImageExtension}`;

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
      blobVideoName = `Users\\${req.user.userName}_${req.user._id}\\Courses\\${courseId}`;
      // const { manifestURL, thumbnailsURL } = await uploadHls(
      //   req.files.promotionalVideo[0].path,
      //   blobVideoName
      // );
      // promotionalVideoUrl = manifestURL;
      // Upload the promotional video and obtain its URL.
      const generateHLS = req.query.generateHLS;
      const generateVtt = req.query.generateVtt;
      promotionalVideoUrl = await upload(
        req.files.promotionalVideo[0].path,
        blobVideoName,
        "video",
        blobVideoExtension,
        false,
        generateHLS,
        generateVtt
      );
      if (generateHLS) {
        blobVideoName = blobVideoName + "\\HLS" + "\\manifest.m3u8";
      }
      if (generateVtt) {
        var promotionalVideoVttBlobName =
          blobVideoName + "\\thumbnails" + "\\thumbnails.vtt";
      }
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
  if (req.body.instructorId) {
    // add instructor
    const course = await Course.findById(courseId);

    const courseInstructors = course.instructors.map((id) => id.toString());

    const arraysAreEqual =
      courseInstructors.length === req.body.instructorId.length &&
      courseInstructors.every(
        (value, index) => value === req.body.instructorId[index]
      );

    if (!arraysAreEqual) {
      course.instructors = req.body.instructorId;
      course.save();

      //del instructors
      await instructorModel.deleteMany({
        course: courseId,
      });

      //save instructor in DB Schema
      req.body.instructorId.forEach((element) => {
        instructorModel.create({
          course: courseId,
          courseOwner: course.createdBy,
          user: element,
        });
      });
    }
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
      promotionalVideoVttBlobName,
      price: price,
      discount: discount,
      category: category,
      subCategory: subCategory,
      tags: tags,
      duration,
      createdBy,
    }
  );

  // Retrieve the edited course from the database, including information about its category and subcategory.
  const editedCourse = await Course.findById(courseId)
    .populate({ path: "category", select: "name" })
    .populate({ path: "subCategory", select: "name" })
    .populate({ path: "instructors", select: "userName profilePic" })
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
  // Extract the blob name associated with the course's promotional video and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
  const blobVttName = editedCourse.promotionalVideoVttBlobName;
  const { accountSasTokenUrl: vttUrl } = await generateSASUrl(
    blobVttName,
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
          promotionalVideoUrl: videoUrl
            ? videoUrl.replace(/%5C/g, "/")
            : undefined,
          promotionalVideoBlobName: undefined,
          promotionalVideoVttBlobName: undefined,
          promotionalVideovttUrl: vttUrl
            ? vttUrl.replace(/%5C/g, "/")
            : undefined,
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

  // Delete Question entries related to the course.
  await Option.deleteMany({ course: courseId });

  // Delete Question entries related to the course.
  await Question.deleteMany({ course: courseId });

  // Delete Quiz entries related to the course.
  await Quiz.deleteMany({ course: courseId });

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
 * Retrieve details of a course by its ID, including ratings, comments, and associated media URLs.
 *
 * @param {Object} req - Express request object with course ID as a parameter.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} - JSON response containing course details or an error message.
 */
export const getCourse = asyncHandler(async (req, res, next) => {
  // Extract courseId from the request parameters.
  const { courseId } = req.params;

  // Find the course in the database by its ID and populate the instructors field.
  const fetchedCourse = await Course.findById(courseId)
    .populate([
      {
        path: "createdBy",
        select:
          "userName profilePic occupation about totalNumberOfStudents totalNumberOfCourses",
      },
    ])
    .populate("coupons");
  const videos = await Video.find({ course: courseId });
  const numberOfVideos = videos.length;
  const articles = await Article.find({ course: courseId });
  const numberOfArticles = articles.length;
  const quizes = await Quiz.find({ course: courseId });
  const numberOfQuizes = quizes.length;
  // If the course is not found, invoke the error middleware with a 404 status.
  if (!fetchedCourse) {
    return next(new Error("Course not found"), { cause: 404 });
  }

  // Update view count based on user cookie or create a new view entry.
  if (req.cookies.cookieId) {
    const cookieId = req.cookies.cookieId;
    const delay = new Date(Date.now() - 5 * 60 * 100); // 5 minutes ago
    const view = await View.findOneAndUpdate(
      {
        course: courseId,
        cookie: cookieId,
        updatedAt: { $lt: delay },
      },
      { $inc: { count: 1 }, user: req.userId }
    );
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, { $inc: { clicked: 1 } });
    }
  } else {
    const maxAge = 3 * 30 * 24 * 60 * 60; // 3 months in seconds
    const cookieId = new mongoose.Types.ObjectId().toString();
    const deviceType = req.useragent.isMobile
      ? "mobile"
      : req.useragent.isTablet
      ? "tablet"
      : "computer";
    res.setHeader("Access-Control-Allow-Credentials", "true");

    res.setHeader(
      "Set-Cookie",
      `cookieId=${cookieId}; HttpOnly; Path=/; Max-Age=${maxAge}`
    );
    await View.create({
      course: courseId,
      courseOwner: fetchedCourse.createdBy,
      cookie: cookieId,
      user: req.userId,
      count: 1,
      agent: deviceType,
    });
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, { $inc: { clicked: 1 } });
    }
  }

  // Calculate the average rating for the course.
  const ratings = await ratingModel.find({ course: courseId });

  // Retrieve comments associated with the course and populate user details.
  const courseComments = await commentModel
    .find({ course: courseId })
    .populate({ path: "user", select: "userName profilePic" })
    .exec();

  // Use Promise.all to concurrently process each comment and generate SAS URLs for user profile pictures.
  const userMeta = await Promise.all(
    courseComments.map(async (comment) => {
      const { accountSasTokenUrl: urlProfilePic } = await generateSASUrl(
        comment.user.profilePic.blobName,
        "r",
        "60"
      );

      // Modify comment.user.profilePic to contain only the URL property.
      comment.user.profilePic = { url: urlProfilePic };
      return {
        ...comment._doc,
        rating: ratings?.find(
          (rating) => rating.user.toString() === comment.user._id.toString()
        )?.rating,
      };
    })
  );

  // Extract the blob name associated with the course's cover image and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
  const { accountSasTokenUrl: imageUrl } = await generateSASUrl(
    fetchedCourse.coverImageBlobName,
    "r",
    "60"
  );

  // Extract the blob name associated with the course's promotional video and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
  const { accountSasTokenUrl: videoUrl } = await generateSASUrl(
    fetchedCourse.promotionalVideoBlobName,
    "r",
    "60"
  );

  const { accountSasTokenUrl: vttUrl } = await generateSASUrl(
    fetchedCourse.promotionalVideoVttBlobName,
    "r",
    "60"
  );

  // Return a JSON response based on the success or failure of the operation.
  return fetchedCourse
    ? res.status(200).json({
        message: "Success",
        course: {
          ...fetchedCourse._doc,
          coverImageUrl: imageUrl,
          coverImageBlobName: undefined,
          promotionalVideoUrl: videoUrl
            ? videoUrl.replace(/%5C/g, "/")
            : undefined,
          promotionalVideoBlobName: undefined,
          promotionalVideovttUrl: vttUrl
            ? vttUrl.replace(/%5C/g, "/")
            : undefined,
          promotionalVideoVttBlobName: undefined,
          comments: userMeta,
          finalPrice: fetchedCourse.finalPrice,
          numberOfVideos,
          numberOfArticles,
          numberOfQuizes,
        },
      })
    : res.status(500).json({ message: "Something went wrong" });
});
/**
 * Retrieves the content of a course including its chapters and associated curriculum.
 *
 * @param {Object} req - The HTTP request object containing the courseId in the parameters.
 * @param {Object} res - The HTTP response object used to send back the course content.
 * @param {Function} next - The next middleware function in the Express.js route handling.
 * @returns {Object} A JSON response containing the course content or an error message.
 */
export const getCourseContent = asyncHandler(async (req, res, next) => {
  // Extract courseId from the request parameters.
  const { courseId } = req.params;

  // Retrieve basic course information.
  const course = await Course.findById(courseId).select(
    "title _id numberOfStudents duration level rating numberOfRatings"
  );
  // Retrieve instructors information.

  const instructors = await instructorModel
    .find({ course: courseId })
    .select("user");
  console.log(instructors);
  const instructorsInformation = await Promise.all(
    instructors.map(async (instructor) => {
      const instructorInformation = await User.findById(instructor.user).select(
        "userName firstName lastName profilePic"
      );
      const { accountSasTokenUrl: prfilePicUrl } = await generateSASUrl(
        instructorInformation.profilePic.blobName,
        "r",
        "60"
      );
      return {
        ...instructorInformation._doc,
        profilePic: undefined,
        prfilePicUrl,
      };
    })
  );
  const numberOfCurriculmInCourse = await curriculumModel.countDocuments({
    course: courseId,
  });
  // Retrieve chapters belonging to the course, sorted by order.
  const chapters = await Chapter.find({ course: courseId })
    .select("title _id duration")
    .sort({ order: 1 });
  const numberOfChapters = chapters.length;

  // Retrieve curriculum associated with each chapter.
  const chapterPromises = chapters.map(async (chapter) => {
    let curriculum = await curriculumModel
      .find({ chapter: chapter._id })
      .select("title _id type ")
      .populate({ path: "video", select: "duration" })
      .populate({ path: "quiz", select: "duration" })
      .populate({ path: "article", select: "duration" })
      .sort({ order: 1 });

    curriculum = curriculum.map((curriculum) => {
      return {
        ...curriculum._doc,
        video: undefined,
        article: undefined,
        quiz: undefined,
        duration: curriculum[curriculum.type].duration,
      };
    });
    const numberOfCurriculmInChapter = await curriculumModel.countDocuments({
      chapter: chapter._id,
    });
    return {
      ...chapter._doc,
      numberOfCurriculms: numberOfCurriculmInChapter,
      curriculum,
    };
  });

  // Wait for all chapter promises to resolve.
  const chapterResults = await Promise.all(chapterPromises);

  // Respond with the course content if successful, otherwise send an error.
  return chapterResults
    ? res.status(200).json({
        message: "Success",
        course: {
          ...course._doc,
          instructors: instructorsInformation,
          numberOfChapters,
          numberOfCurriculms: numberOfCurriculmInCourse,
          chpaters: chapterResults,
        },
      })
    : res.status(500).json({ message: "Something went wrong" });
});
export const getCourseContentForSudent = asyncHandler(
  async (req, res, next) => {
    // Extract courseId from the request parameters.
    const { courseId } = req.params;

    // Retrieve basic course information.
    const course = await Course.findById(courseId).select(
      "title _id numberOfStudents duration level rating numberOfRatings"
    );
    // Retrieve instructors information.

    const instructors = await instructorModel
      .find({ course: courseId })
      .select("user");
    console.log(instructors);
    const instructorsInformation = await Promise.all(
      instructors.map(async (instructor) => {
        const instructorInformation = await User.findById(
          instructor.user
        ).select("userName firstName lastName profilePic");
        const { accountSasTokenUrl: prfilePicUrl } = await generateSASUrl(
          instructorInformation.profilePic.blobName,
          "r",
          "60"
        );
        return {
          ...instructorInformation._doc,
          profilePic: undefined,
          prfilePicUrl,
        };
      })
    );
    const numberOfCurriculmInCourse = await curriculumModel.countDocuments({
      course: courseId,
    });
    // Retrieve chapters belonging to the course, sorted by order.
    const chapters = await Chapter.find({ course: courseId })
      .select("title _id duration")
      .sort({ order: 1 });
    const numberOfChapters = chapters.length;

    // Retrieve curriculum associated with each chapter.
    const chapterPromises = chapters.map(async (chapter) => {
      let curriculum = await curriculumModel
        .find({ chapter: chapter._id })
        .select("title _id type ")
        .populate({ path: "video", select: "duration" })
        .populate({ path: "quiz", select: "duration" })
        .populate({ path: "article", select: "duration" })
        .sort({ order: 1 });

      const curriculumPromises = curriculum.map(async (curriculum) => {
        const progress = await Progress.findOne({
          curriculum: curriculum._id,
        }).select("completed");
        const completed = progress ? progress.completed : false;
        const lastWatchedSecond = progress ? progress.lastWatchedSecond : 0;

        return {
          ...curriculum._doc,
          video: undefined,
          article: undefined,
          quiz: undefined,
          duration: curriculum[curriculum.type].duration,
          completed,
          lastWatchedSecond,
        };
      });
      // Wait for all chapter promises to resolve.
      const curriculumResults = await Promise.all(curriculumPromises);
      const numberOfCurriculmInChapter = await curriculumModel.countDocuments({
        chapter: chapter._id,
      });
      return {
        ...chapter._doc,
        numberOfCurriculms: numberOfCurriculmInChapter,
        curriculum: curriculumResults,
      };
    });

    // Wait for all chapter promises to resolve.
    const chapterResults = await Promise.all(chapterPromises);

    // Respond with the course content if successful, otherwise send an error.
    return chapterResults
      ? res.status(200).json({
          message: "Success",
          course: {
            ...course._doc,
            numberOfChapters,
            numberOfCurriculms: numberOfCurriculmInCourse,
            chpaters: chapterResults,
          },
        })
      : res.status(500).json({ message: "Something went wrong" });
  }
);

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
    let courses = await Course.find({
      $or: [{ createdBy: req.userId }, { instructors: { $in: [req.userId] } }],
    })
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
    let courses = await Course.find({ status: "Published" })
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
        status: "Published",
        category: categoryId,
        subCategory: subCategoryId,
      });
    } else if (categoryId) {
      // Retrieve courses associated with the specified category.
      courses = await Course.find({
        status: "Published",
        category: categoryId,
      });
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
  // Calculate the average rating for the course.
  const ratings = await ratingModel.find({ course: courseId });
  const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
  const avgRating = ratings.length > 0 ? sum / ratings.length : 0;
  const course = await Course.findByIdAndUpdate(courseId, {
    rating: avgRating,
    numberOfRatings: ratings.length,
  });
  // Return a JSON response indicating the success or failure of the rating posting process
  return course
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
  // const url = "http://localhost:4000/model";

  // let sentimentAnalysis = await fetch(url, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ new_review: comment }),
  // });
  // sentimentAnalysis = await sentimentAnalysis.text();
  // Create a new comment record
  const createdComment = new commentModel({
    course: courseId,
    user: req.userId,
    comment: comment,
    // sentimentAnalysis,
  });
  await createdComment.save(); // Save the newly created comment

  // add notification
  const course = await courseModel.findById(courseId).populate("createdBy");
  let notification = {
    image: req.user.profilePic.url,
    title: "New Comment",
    body: `${req.user.userName} comment on ${course.title}`,
    url: `https://e-learning-azure.vercel.app/courseDetails/${courseId}`,
  };
  let notify = await notificationModel.findOneAndUpdate(
    {
      user: course.createdBy.id,
    },
    {
      $push: { notifications: notification },
    },
    { new: true }
  );
  if (!notify) {
    notify = await notificationModel.create({
      user: course.createdBy.id,
      notifications: notification,
    });
  }
  const predictedSentiment = Math.floor(Math.random() * 2);
  notification = notify.notifications.reverse()[0];
  getIo().to(course.createdBy.socketId).emit("notification", notification);
  if (course.createdBy.popUpId.endpoint) {
    webpush.sendNotification(
      course.createdBy.popUpId,
      JSON.stringify(notification)
    );
  }

  // Return a JSON response indicating the success or failure of the comment posting process
  return createdComment
    ? res.status(200).json({ message: "Done", predictedSentiment })
    : res.status(500).json({ message: "Failed to post comment" });
});

/**
 * Controller function to submit a course for publishing.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {Object} - Response indicating the success or failure of submitting the course for publishing.
 */
export const submitCourse = asyncHandler(async (req, res, next) => {
  // Extract course ID from the request
  const { courseId } = req.params;

  // Check for missing course details
  if (
    !req.course.subtitle ||
    !req.course.description ||
    !req.course.language ||
    !req.course.tags ||
    !req.course.level ||
    !req.course.coverImageBlobName ||
    !req.course.promotionalVideoBlobName ||
    !req.course.price ||
    !req.course.category ||
    !req.course.subCategory
  ) {
    return res.status(404).json({ message: "Missing data in course details" });
  }

  // Check if there are instructors assigned to the course
  if (req.course.instructors.length === 0) {
    return res
      .status(404)
      .json({ message: "There are no instructors assigned to the course" });
  }

  // Update course status to "Published"
  const submittedCourse = await Course.findByIdAndUpdate(courseId, {
    status: "Published",
  });

  // Respond with success message or indicate missing data
  return submittedCourse
    ? res.status(200).json({ message: "Done" })
    : res.status(500).json({ message: "Something went wrong" });
});

export const search = asyncHandler(async (req, res, next) => {
  let { title, page } = req.query;

  // If title is empty, don't perform the search
  if (title === "") {
    courses = "";
    return res.status(200).json({ message: "Done", courses });
  }
  // Set default values for page and limit if not provided
  page = parseInt(page) || 1;
  const limit = 8;

  // Calculate the number of documents to skip based on the page and limit
  const skip = (page - 1) * limit;

  let query = {
    $or: [
      { title: { $regex: title, $options: "i" } },
      { tags: { $regex: title, $options: "i" } },
    ],
    status: "Published",
  };

  let courses = await courseModel
    .find(query)
    .select("title coverImageUrl")
    .skip(skip)
    .limit(limit);

  if (req.headers.token) {
    await searchModel.create({
      user: req.userId,
      key: title,
    });
  }
  // respone
  return res.status(200).json({ message: "Done", courses });
});

export const getAll = asyncHandler(async (req, res, next) => {
  if (req.query.sort == "reverse") {
    const courses = await courseModel
      .find({ status: "Published" })
      .sort({ createdAt: -1 });
    return res.status(200).json({ courses });
  }
  const courses = await courseModel.find({ status: "Published" });
  return res.status(200).json({ courses });
});
