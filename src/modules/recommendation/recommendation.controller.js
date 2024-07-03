import {
  default as Course,
  default as courseModel,
} from "../../../DB/model/course.model.js";
import instructorModel from "../../../DB/model/instructor.model.js";
import Rating from "../../../DB/model/rating.model.js";
import Student from "../../../DB/model/student.model.js";
import userModel from "../../../DB/model/user.model.js";
import View from "../../../DB/model/view.model.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import { generateSASUrl } from "../../utils/azureServices.js";
import ContentKNN from "../../utils/contentKNN.js";
import EstimateRate from "../../utils/estimateRate.js";

/**
 * Retrieves and calculates personalized course recommendations for the user based on various interaction data.
 * This function fetches courses, user ratings, views, purchases, and wishlist items, then calculates different
 * sets of recommendations: what others are viewing, based on recent views, searches, user-specific predictions,
 * and wishlist.
 *
 * @param {Object} req - The HTTP request object, containing user-specific identifiers and data.
 * @param {Object} res - The HTTP response object used to send back the calculated recommendations.
 * @param {Function} next - The next middleware function in the Express.js route handling.
 * @returns {Object} A JSON response containing the calculated recommendations or an error message.
 */
export const getRecommendations = asyncHandler(async (req, res, next) => {
  // Fetch all published courses
  const courses = await Course.find({ status: "Published" });
  // Retrieve all ratings by the user
  const ratings = await Rating.find({ user: req.userId });
  // Find all views clicked by the user where the updatedAt timestamp is greater than 0
  const clicked = await View.find({ user: req.userId, updatedAt: { $gt: 0 } });
  // Fetch all courses the user has purchased
  const purchased = await Student.find({ user: req.userId });
  // Extract the wishlist directly from the user object
  const wishlist = req.user.wishlist;

  // Initialize the rating estimator with user data and interaction details
  const estimateRate = new EstimateRate(
    req.user,
    courses,
    ratings,
    clicked,
    purchased,
    wishlist
  );
  // Calculate estimated rates for recommendations
  estimateRate.estimatedRates();
  // Initialize content-based recommendation KNN with the user's ID
  const contentKNN = new ContentKNN(req.userId);
  // Get the last visited course
  const lastVisit = estimateRate.getLastVisit();
  // Get the last item from the wishlist
  const lastwishlisted = wishlist?.pop();

  // Setup empty arrays for different recommendation criteria
  const recommendedForYouRecommendations = [];
  const becauseYouViewedRecommendations = [];
  const becauseYouSearchedRecommendations = [];
  const becauseYouWishlistedRecommendations = [];

  // Calculate "Recommended for You" using ratings
  const recommendedForYouPredictions = await contentKNN.generateRecommendations(
    ratings
  );
  recommendedForYouPredictions.map((prediction) => {
    const course = courses.find(
      (item) => prediction.course.toString() === item._id.toString()
    );
    recommendedForYouRecommendations.push({
      course,
      coverImageBlobName: undefined,
      promotionalVideoBlobName: undefined,
    });
  });

  // Process the last visited course for "Because you viewed" recommendations
  if (lastVisit) {
    const becauseYouViewedPredictions =
      await contentKNN.generateItemBasedRecommendations([lastVisit.course]);
    becauseYouViewedPredictions.map((prediction) => {
      const course = courses.find(
        (item) => prediction.course.toString() === item._id.toString()
      );
      becauseYouViewedRecommendations.push({
        course,
        coverImageBlobName: undefined,
        promotionalVideoBlobName: undefined,
      });
    });
    var lastVisitTitle = courses.find(
      (item) => lastVisit.course.toString() === item._id.toString()
    ).title;
  }

  // Process the last item from the wishlist for "Because you wishlisted" recommendations
  if (lastwishlisted) {
    const becauseYouWishlistedPredictions =
      await contentKNN.generateItemBasedRecommendations([lastwishlisted]);
    becauseYouWishlistedPredictions.map((prediction) => {
      const course = courses.find(
        (item) => prediction.course.toString() === item._id.toString()
      );
      becauseYouWishlistedRecommendations.push({
        course,
        coverImageBlobName: undefined,
        promotionalVideoBlobName: undefined,
      });
    });
    var lastwishlistedTitle = courses.find(
      (item) => lastwishlisted.toString() === item._id.toString()
    ).title;
  }

  // Construct the final recommendations object with messages and grouped data
  const recommendations = {
    "Because you viewed": {
      key: lastVisitTitle,
      recommendations: becauseYouViewedRecommendations,
    },
    "Because you wishlisted": {
      key: lastwishlistedTitle,
      recommendations: becauseYouWishlistedRecommendations,
    },
    "Because you searched for": {
      key: undefined,
      recommendations: becauseYouSearchedRecommendations,
    },
    "Recommended for you": {
      recommendations: recommendedForYouRecommendations,
    },
    "Learners are viewing": {
      recommendations: undefined,
      message:
        "It will be implemented with Matrix Factorization until we collect data to train with.",
    },
  };

  // Respond with the recommendations if successful, otherwise send an error
  return recommendations
    ? res.status(200).json({ message: "Done", recommendations })
    : res.status(500).json({ message: "Something went wrong" });
});
/**
 * Retrieves and calculates personalized course recommendations for the user based on their interactions.
 * This function first fetches all published courses and various user-specific interaction data such as ratings,
 * views, and purchased courses. It also extracts wishlist items from the user profile. Using this data, it initializes
 * and computes a recommendation score through an estimator and a content-based K-nearest neighbors algorithm.
 * The function compiles a list of course recommendations personalized to the user's preferences and interactions,
 * which is then returned as a response.
 *
 * @param {Object} req - The HTTP request object, containing user-specific identifiers and data (e.g., userId).
 * @param {Object} res - The HTTP response object used to send back the calculated recommendations.
 * @param {Function} next - The next middleware function in the Express.js routing chain.
 * @returns {Promise<void>} Outputs directly through HTTP response: either the recommended courses or an error message.
 */

export const recommendedForYou = asyncHandler(async (req, res, next) => {
  // Retrieve all courses that are currently marked as 'Published'
  const courses = await Course.find({ status: "Published" }).populate({
    path: "createdBy",
    select: { userName: 1 },
  });

  // Fetch all ratings submitted by the current user
  const ratings = await Rating.find({ user: req.userId });

  // Fetch all views from this user that have an updatedAt value greater than 0
  const clicked = await View.find({ user: req.userId, updatedAt: { $gt: 0 } });

  // Retrieve all courses that the user has enrolled in
  const purchased = await Student.find({ user: req.userId });

  // Extract the courses in the user's wishlist from the user object
  const wishlist = req.user.wishlist;

  // Initialize a rating estimator with user interactions and course data
  const estimateRate = new EstimateRate(
    req.user,
    courses,
    ratings,
    clicked,
    purchased,
    wishlist
  );

  // Compute estimated rates to use in generating recommendations
  estimateRate.estimatedRates();

  // Create a content-based recommender system instance for this user
  const contentKNN = new ContentKNN(req.userId);

  // Prepare an array to store the final recommendations
  const recommendedForYouRecommendations = [];

  // Generate personalized course recommendations based on user ratings
  const recommendedForYouPredictions = await contentKNN.generateRecommendations(
    ratings
  );
  recommendedForYouPredictions.forEach((prediction) => {
    // Match each prediction with the corresponding course in the database
    const course = courses.find(
      (item) => prediction.course.toString() === item._id.toString()
    );
    // Add the course and its media details to the recommendations list
    recommendedForYouRecommendations.push({
      course,
      coverImageBlobName: undefined, // Placeholder for future implementation
      promotionalVideoBlobName: undefined, // Placeholder for future implementation
    });
  });

  let recommend = recommendedForYouRecommendations.filter(
    (item) => item.course !== undefined
  );

  if (recommend.length < 3) {
    const courses = await courseModel
      .find()
      .populate({
        path: "createdBy",
        select: { userName: 1 },
      })
      .limit(3);
    courses.forEach((course) => {
      recommend.push({
        course,
        coverImageBlobName: undefined, // Placeholder for future implementation
        promotionalVideoBlobName: undefined, // Placeholder for future implementation
      });
    });
  }

  // Send the compiled list of recommendations to the user or handle errors
  if (recommendedForYouRecommendations.length > 0) {
    res.status(200).json({
      message: "Done",
      recommendations: recommend,
    });
  } else {
    res.status(500).json({ message: "Something went wrong" });
  }
});

export const learnersAreViewing = asyncHandler(async (req, res, next) => {
  // Placeholder response until the actual implementation is ready
  res.status(200).json({
    message:
      "It will be implemented with Matrix Factorization until we collect data to train with.",
  });
});

/**
 * Generates course recommendations based on the last course viewed by the user, provided the viewing
 * was recent (within the last two days). This function retrieves all published courses, identifies the most
 * recently viewed course, and uses a content-based K-nearest neighbors algorithm to find similar courses.
 * Recommendations are based on the similarity to the last viewed course and are returned if the last view
 * was recent enough to be relevant.
 *
 * @param {Object} req - The HTTP request object, containing user-specific identifiers and data, such as userId.
 * @param {Object} res - The HTTP response object used to send back the calculated recommendations.
 * @param {Function} next - The next middleware function in the Express.js routing chain.
 * @returns {Promise<void>} Outputs directly through HTTP response: either the recommendations or an error message.
 */
export const becauseYouViewed = asyncHandler(async (req, res, next) => {
  // Retrieve all courses that are currently published
  const courses = await Course.find({ status: "Published" });
  console.log("reach because you viewed" + req.userId);
  // Initialize a content-based KNN recommender with the current user's ID
  const contentKNN = new ContentKNN(req.userId);

  // Prepare an array to store recommendations
  const becauseYouViewedRecommendations = [];
  let timeDifference = 100000000;
  // Fetch all views by the user with a non-zero updatedAt timestamp
  const clicked = await View.find({ user: req.userId }).sort({ updatedAt: -1 });
  // Determine the most recent course viewed by the user, if any
  const lastVisit = clicked[0];
  if (lastVisit) {
    // Find the course details from the list of published courses
    var lastVisitCourse = courses.find(
      (item) => lastVisit.course.toString() === item._id.toString()
    );

    // Extract the title of the last visited course for the recommendation key
    var lastVisitTitle = lastVisitCourse
      ? lastVisitCourse.title
      : "Recently Viewed Course";

    // Calculate the time difference from the last visit to now in days
    const lastVisitTime = lastVisit.updatedAt;
    timeDifference = (new Date() - lastVisitTime) / (1000 * 60 * 60 * 24);
    console.log(timeDifference);
    // Check if the last visit was within the last two days
    if (timeDifference < 2) {
      console.log(`clicked first element ${timeDifference}`);
      // Generate recommendations based on the last visited course
      const becauseYouViewedPredictions =
        await contentKNN.generateItemBasedRecommendations([lastVisit.course]);
      becauseYouViewedPredictions.map((prediction) => {
        const course = courses.find(
          (item) => prediction.course.toString() === item._id.toString()
        );
        becauseYouViewedRecommendations.push({
          course,
          coverImageBlobName: undefined,
          promotionalVideoBlobName: undefined,
        });
      });
    }
  }

  // Construct the final recommendations object
  const recommendations = {
    key: { _id: lastVisit.course, title: lastVisitTitle },
    recommendations: becauseYouViewedRecommendations,
  };

  // Send the recommendations if available, otherwise report an error
  return recommendations
    ? res.status(200).json({
        message: "Done",
        recommendations: timeDifference < 2 ? recommendations : undefined,
      })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Generates course recommendations based on the last course added to the user's wishlist. The function
 * retrieves all published courses, identifies the last wishlisted course, and uses a content-based
 * K-nearest neighbors algorithm to find similar courses. Recommendations are produced if the wishlist
 * activity is recent and relevant.
 *
 * @param {Object} req - The HTTP request object, containing user-specific identifiers and data, such as userId and user object.
 * @param {Object} res - The HTTP response object used to send back the calculated recommendations.
 * @param {Function} next - The next middleware function in the Express.js routing chain.
 * @returns {Promise<void>} Outputs directly through HTTP response: either the recommendations or an error message.
 */
export const becauseYouWishlsted = asyncHandler(async (req, res, next) => {
  // Retrieve all courses that are currently published to filter against the wishlist
  const courses = await Course.find({ status: "Published" });

  // Initialize a content-based KNN recommender with the current user's ID
  const contentKNN = new ContentKNN(req.userId);

  // Prepare an array to store recommendations
  const becauseYouWishlistedRecommendations = [];

  // Access the user's wishlist from the request object
  const wishlist = req.user.wishlist;

  // Identify the last item added to the wishlist, if it exists
  const lastwishlisted = wishlist?.pop();

  // Retrieve details of the last wishlisted course from the fetched courses
  const lastwishlistedCourse = courses.find(
    (item) => lastwishlisted.toString() === item._id.toString()
  );

  // Extract the title for use in the recommendation key
  const lastwishlistedTitle = lastwishlistedCourse
    ? lastwishlistedCourse.title
    : "Recently Wishlisted Course";

  // Uncomment the following lines if tracking the time since wishlist addition is necessary
  // const lastwishlistedTime = lastwishlistedCourse.updatedAt;
  // const timeDifference = (new Date() - lastwishlistedTime) / (1000 * 60 * 60 * 24); // Calculate time difference in days

  // Assuming time difference is calculated and valid (uncomment and use if applicable)
  // if (timeDifference < 2) {
  // Generate recommendations based on the last wishlisted course using the KNN model
  const becauseYouWishlistedPredictions =
    await contentKNN.generateItemBasedRecommendations([lastwishlisted]);
  becauseYouWishlistedPredictions.map((prediction) => {
    const course = courses.find(
      (item) => prediction.course.toString() === item._id.toString()
    );
    becauseYouWishlistedRecommendations.push({
      course,
      coverImageBlobName: undefined,
      promotionalVideoBlobName: undefined,
    });
  });
  // }

  // Construct the final recommendations object with the key and recommendations list
  const recommendations = {
    key: { _id: lastwishlisted, title: lastwishlistedTitle },
    recommendations: becauseYouWishlistedRecommendations,
  };

  // Send the recommendations if available, otherwise report an error
  return recommendations
    ? res.status(200).json({ message: "Done", recommendations })
    : res.status(500).json({ message: "Something went wrong" });
});

/**
 * Generates course recommendations based on the last course purchased by the user, provided the purchase
 * was recent (within the last three days). This function retrieves all published courses, identifies the most
 * recently purchased course, and uses a content-based K-nearest neighbors algorithm to find similar courses.
 * Recommendations are produced if the purchase activity is recent and relevant.
 *
 * @param {Object} req - The HTTP request object, containing user-specific identifiers and data, such as userId.
 * @param {Object} res - The HTTP response object used to send back the calculated recommendations.
 * @param {Function} next - The next middleware function in the Express.js routing chain.
 * @returns {Promise<void>} Outputs directly through HTTP response: either the recommendations or an error message.
 */
export const becauseYouPurchased = asyncHandler(async (req, res, next) => {
  // Retrieve all courses that are currently published to filter against the purchases
  const courses = await Course.find({ status: "Published" });

  // Initialize a content-based KNN recommender with the current user's ID
  const contentKNN = new ContentKNN(req.userId);

  // Prepare an array to store recommendations
  const becauseYouPurchasedRecommendations = [];

  // Fetch all courses the user has purchased, sorted by most recent purchase
  const purchased = await Student.find({ user: req.userId }).sort({
    updatedAt: -1,
  });
  let timeDifference = 10000000;
  // Identify the last item purchased by the user, if any
  const lastPurchased = purchased[0];
  if (lastPurchased) {
    // Retrieve details of the last purchased course from the fetched courses
    var lastPurchasedCourse = courses.find(
      (item) => lastPurchased.course.toString() === item._id.toString()
    );

    // Extract the title of the last purchased course for the recommendation key
    var lastPurchasedTitle = lastPurchasedCourse
      ? lastPurchasedCourse.title
      : "Recently Purchased Course";

    // Calculate the time difference from the last purchase to now in days
    const lastPurchasedTime = lastPurchased.updatedAt;
    timeDifference = (new Date() - lastPurchasedTime) / (1000 * 60 * 60 * 24);

    console.log(lastPurchased);
    // Check if the last purchase was within the last three days
    if (timeDifference < 3) {
      // Generate recommendations based on the last purchased course using the KNN model

      const becauseYouPurchasedPredictions =
        await contentKNN.generateItemBasedRecommendations([
          lastPurchased.course,
        ]);
      becauseYouPurchasedPredictions?.map((prediction) => {
        const course = courses.find(
          (item) => prediction.course.toString() === item._id.toString()
        );
        becauseYouPurchasedRecommendations.push({
          course,
          coverImageBlobName: undefined,
          promotionalVideoBlobName: undefined,
        });
      });
    }
  }

  // Construct the final recommendations object with the key and recommendations list
  const recommendations = {
    key: { _id: lastPurchased.course, title: lastPurchasedTitle },
    recommendations: becauseYouPurchasedRecommendations,
  };
  // Send the recommendations if available, otherwise report an error
  return recommendations
    ? res.status(200).json({
        message: "Done",
        recommendations: timeDifference < 3 ? recommendations : undefined,
      })
    : res.status(500).json({ message: "Something went wrong" });
});

export const popularCourses = asyncHandler(async (req, res, next) => {
  const categoryId = req.params.categoryId;
  console.log(categoryId);
  let recommendations;
  recommendations = await Course.find({
    status: "Published",
    category: categoryId,
  })
    .sort({ numberOfStudents: -1 })
    .limit(10);
  recommendations =
    recommendations.length === 0
      ? await Course.find({
          status: "Published",
        })
          .sort({ numberOfStudents: -1 })
          .limit(10)
      : recommendations;
  return recommendations
    ? res.status(200).json({ message: "Done", recommendations })
    : res.status(500).json({ message: "Something went wrong" });
});

export const realtedCourses = asyncHandler(async (req, res, next) => {
  const courseId = req.params.courseId;
  // Initialize a content-based KNN recommender with the current user's ID
  const contentKNN = new ContentKNN(req.userId);
  const courses = await contentKNN.generateItemBasedRecommendations(courseId);
  const recommendations = await Promise.all(
    courses.map(async (recommendation) => {
      const course = await Course.findById(recommendation.course).select(
        "title _id numberOfStudents duration coverImageBlobName level rating numberOfRatings"
      );
      // Extract the blob name associated with the course's cover image and generate a Shared Access Signature (SAS) URL with read access and a 60-minute expiry.
      const { accountSasTokenUrl: coverImageUrl } = await generateSASUrl(
        course.coverImageBlobName,
        "r",
        "60"
      );
      const fetchedInstructor = await instructorModel
        .findOne({ course: courseId })
        .select("user");

      const instructor = await userModel
        .findById(fetchedInstructor.user)
        .select("userName firstName lastName profilePic");
      const { accountSasTokenUrl: prfilePicUrl } = await generateSASUrl(
        instructor?.profilePic?.blobName,
        "r",
        "60"
      );
      return {
        ...course._doc,
        coverImageBlobName: undefined,
        coverImageUrl,
        instructor: {
          ...instructor?._doc,
          profilePic: undefined,
          prfilePicUrl,
        },
      };
    })
  );
  return recommendations
    ? res.status(200).json({ message: "Done", recommendations })
    : res.status(500).json({ message: "Something went wrong" });
});

export const bestSell = asyncHandler(async (req, res, next) => {
  if (req.query.view == "course") {
    const courses = await Course.find({ status: "Published" })
      .sort({
        numberOfStudents: -1,
      })
      .limit(10);
    return res.status(200).json({ message: "Done", courses });
  } else if (req.query.view == "workshop") {
    const workshops = await workshopModel
      .find({ status: "Published" })
      .sort({
        numberOfStudents: -1,
      })
      .limit(10);
    return res.status(200).json({ message: "Done", workshops });
  }
  return res.status(400).json({ message: "Invalid view" });
});

export const recentStarted = asyncHandler(async (req, res, next) => {
  const currentDate = new Date();

  let workshops = await workshopModel.aggregate([
    {
      $addFields: {
        startDayAsDate: { $dateFromString: { dateString: "$startDay" } },
      },
    },
    {
      $match: {
        status: "Published",
        startDayAsDate: { $gt: currentDate },
      },
    },
    {
      $sort: { startDayAsDate: 1 },
    },
    {
      $limit: 10,
    },
  ]);

  workshops = await workshopModel.populate(workshops, {
    path: "instructor",
    select: { userName: 1 },
  });

  return res.status(200).json({ message: "Done", workshops });
});

export const recommendedForYouUnauth = asyncHandler(async (req, res, next) => {
  console.log("runing");
  const courses = await courseModel.aggregate([{ $sample: { size: 10 } }]);
  console.log(courses);
  return res.status(200).json({ message: "Done", courses });
});
