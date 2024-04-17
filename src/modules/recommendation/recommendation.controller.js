import { asyncHandler } from "../../utils/asyncHandling.js";
import Course from "../../../DB/model/course.model.js";
import View from "../../../DB/model/view.model.js";
import Student from "../../../DB/model/student.model.js";
import Rating from "../../../DB/model/rating.model.js";
import ContentKNN from "../../utils/contentKNN.js";
import EstimateRate from "../../utils/estimateRate.js";
import mongoose from "mongoose";
import upload, {
  deleteDirectory,
  deleteBlob,
  generateSASUrl,
} from "../../utils/azureServices.js";

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
  const wishLisht = req.user.wishlist;

  // Initialize the rating estimator with user data and interaction details
  const estimateRate = new EstimateRate(
    req.user,
    courses,
    ratings,
    clicked,
    purchased,
    wishLisht
  );
  // Calculate estimated rates for recommendations
  estimateRate.estimatedRates();
  // Initialize content-based recommendation KNN with the user's ID
  const contentKNN = new ContentKNN(req.userId);
  // Get the last visited course
  const lastVisit = estimateRate.getLastVisit();
  // Get the last item from the wishlist
  const lastwishlisted = wishLisht?.pop();

  // Setup empty arrays for different recommendation criteria
  const RFYRecommendations = [];
  const BYVRecommendations = [];
  const BYSRecommendations = [];
  const BYWRecommendations = [];

  // Calculate "Recommended for You" using ratings
  const RFYPredictions = await contentKNN.generateRecommendations(ratings);
  RFYPredictions.map((prediction) => {
    const course = courses.find(
      (item) => prediction.course.toString() === item._id.toString()
    );
    RFYRecommendations.push({
      course,
      coverImageBlobName: undefined,
      promotionalVideoBlobName: undefined,
    });
  });

  // Process the last visited course for "Because you viewed" recommendations
  if (lastVisit) {
    const BYVPredictions = await contentKNN.generateItemBasedRecommendations([
      lastVisit.course,
    ]);
    console.log(BYVPredictions.length);
    BYVPredictions.map((prediction) => {
      const course = courses.find(
        (item) => prediction.course.toString() === item._id.toString()
      );
      BYVRecommendations.push({
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
    const BYWPredictions = await contentKNN.generateItemBasedRecommendations([
      lastwishlisted,
    ]);
    BYWPredictions.map((prediction) => {
      const course = courses.find(
        (item) => prediction.course.toString() === item._id.toString()
      );
      BYWRecommendations.push({
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
    "Learners are viewing": {
      recommendations: undefined,
      message:
        "It will be implemented with Matrix Factorization until we collect data to train with.",
    },
    "Because you viewed": {
      key: lastVisitTitle,
      recommendations: BYVRecommendations,
    },
    "Because you searched for": {
      key: "",
      recommendations: BYSRecommendations,
    },
    "Recommended for you": { recommendations: RFYRecommendations },
    "Because you wishlisted": {
      key: lastwishlistedTitle,
      recommendations: BYWRecommendations,
    },
  };

  // Respond with the recommendations if successful, otherwise send an error
  return recommendations
    ? res.status(200).json({ message: "Done", recommendations })
    : res.status(500).json({ message: "Something went wrong" });
});
