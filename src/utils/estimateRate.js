import Rating from "../../DB/model/rating.model.js";
import { normalizeToRange } from "./dataSructures.js";
import User from "../../DB/model/user.model.js";
// clicked
// purchase
// time views(watching)
// search
// wishlist
// comment sentiment analysis
/**
 * The EstimateRate class is designed to calculate estimated interest rates for courses based on user interactions.
 * This includes ratings, clicks, purchases, and wishlist entries. It aims to provide a comprehensive evaluation of user preferences.
 */
class EstimateRate {
  /**
   * Constructs an instance of the EstimateRate class.
   *
   * @param {Object} user The user object containing user-specific data.
   * @param {Array} courses An array of course objects to be evaluated.
   * @param {Array} ratings An array of rating objects related to the user.
   * @param {Array} clicked An array of click objects indicating courses the user has interacted with.
   * @param {Array} purchased An array of purchase objects indicating courses the user has bought.
   * @param {Array} wishLisht An array of course IDs that the user has added to their wishlist.
   */
  constructor(user, courses, ratings, clicked, purchased, wishLisht) {
    this.user = user; // Store the user data
    this.courses = courses; // Store the list of courses
    this.ratings = ratings; // Store the user's ratings
    this.clicked = clicked; // Store which courses have been clicked/viewed
    this.purchased = purchased; // Store which courses have been purchased
    this.wishLisht = wishLisht; // Store the wishlist items
  }

  /**
   * Asynchronously calculates estimated rates for all courses based on various user interactions.
   *
   * @returns {Promise<Array>} A promise that resolves to an array of objects, each containing a course ID and its estimated rate.
   */
  estimatedRates = async () => {
    const estimatedRates = this.courses.map((course) => {
      let estimatedRate = 0;
      const courseId = course._id;

      // Check if the course has been rated by the user
      const isRated = this.ratings.find(
        (item) => course._id.toString() === item.course.toString()
      );
      // Check if the course has been clicked by the user
      const isClicked = this.clicked.find(
        (item) => course._id.toString() === item.course.toString()
      );
      // Check if the course has been purchased by the user
      const isPurchased = this.purchased.find(
        (item) => course._id.toString() === item.course.toString()
      );
      // Check if the course is on the user's wishlist
      const isInWL = this.wishLisht?.find(
        (item) => course._id.toString() === item.toString()
      );

      // Add normalized rate to the estimated rate if the course is rated
      if (isRated) {
        var rate = isRated.rating;
        estimatedRate += normalizeToRange(rate, 0, 5, 0, 1);
      }
      // Add normalized click count to the estimated rate if the course is clicked
      if (isClicked) {
        var clickedTimes = isClicked.count;
        estimatedRate += normalizeToRange(
          clickedTimes,
          0,
          this.user.clicked,
          0,
          1
        );
      }
      // Increase the estimated rate if the course has been purchased
      if (isPurchased) {
        estimatedRate += 1;
      }
      // Increase the estimated rate if the course is in the wishlist
      if (isInWL) {
        estimatedRate += 1;
      }

      return { course: courseId, rate: estimatedRate };
    });

    return estimatedRates;
  };

  /**
   * Retrieves the most recent course the user clicked on.
   *
   * @returns {Object} The most recent clicked object, which provides details about the last course viewed.
   */
  getLastVisit = () => {
    return this.clicked[0];
  };
}

export default EstimateRate;
