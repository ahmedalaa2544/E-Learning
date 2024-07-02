import { Router } from "express";
import isAuthenticated from "../../middleware/authntication.middleware.js";
import * as recommendationController from "./recommendation.controller.js";
const router = Router();
//
router.get("/", isAuthenticated, recommendationController.getRecommendations);
// Route to fetch personalized course recommendations for the user
router.get(
  "/recommendedForYou",
  isAuthenticated,
  recommendationController.recommendedForYou
);

// Route to get information about what similar learners to you are currently viewing
router.get(
  "/learnersAreViewing",
  isAuthenticated,
  recommendationController.learnersAreViewing
);

// Route to fetch course recommendations based on the last course viewed by the user
router.get(
  "/becauseYouViewed",
  isAuthenticated,
  recommendationController.becauseYouViewed
);

// Route to fetch course recommendations based on the last course wishlisted by the user
router.get(
  "/becauseYouWishlsted",
  isAuthenticated,
  recommendationController.becauseYouWishlsted
);

// Route to fetch course recommendations based on the last course purchased by the user
router.get(
  "/becauseYouPurchased",
  isAuthenticated,
  recommendationController.becauseYouPurchased
);

router.get(
  "/popularCourses/:categoryId",
  isAuthenticated,
  recommendationController.popularCourses
);

router.get(
  "/relatedCourses/:courseId",
  isAuthenticated,
  recommendationController.realtedCourses
);
// router.get(
//     "/becauseYouSearched",
//     isAuthenticated,
//     recommendationController.becauseYouSearched
//   );

router.get("/best-sell", recommendationController.bestSell);

router.get("/coming-workshops", recommendationController.recentStarted);
export default router;
