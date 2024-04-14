import Rating from "../../DB/model/rating.model.js";
import { normalizeToRange } from "./dataSructures.js";
import User from "../../DB/model/user.model.js";
class EstimateRate {
  // clicked
  // purchase
  // time views(watching)
  // search
  // wishlist
  // comment sentiment analysis

  constructor(user, courses, ratings, clicked, purchased, wishLisht) {
    this.user = user;
    this.courses = courses;
    this.ratings = ratings;
    this.clicked = clicked;
    this.purchased = purchased;
    this.wishLisht = wishLisht;
  }
  estimatedRates = async () => {
    const estimatedRates = this.courses.map((course) => {
      let estimatedRate = 0;
      const courseId = course._id;
      const isRated = this.ratings.find(
        (item) => course._id.toString() === item.course.toString()
      );
      const isClicked = this.clicked.find(
        (item) => course._id.toString() === item.course.toString()
      );
      const isPurchased = this.purchased.find(
        (item) => course._id.toString() === item.course.toString()
      );
      const isInWL = this.wishLisht?.find(
        (item) => course._id.toString() === item.course.toString()
      );
      if (isRated) {
        var rate = isRated.rating;
        estimatedRate += normalizeToRange(rate, 0, 5, 0, 1);
      }
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
      if (isPurchased) {
        estimatedRate += 1;
      }
      if (isInWL) {
        estimatedRate += 1;
      }

      return { course: courseId, rate: estimatedRate };
    });
    return estimatedRates;
  };
  getLastVisit = () => {
    return this.clicked[0].course.toString();
  };
}

export default EstimateRate;
