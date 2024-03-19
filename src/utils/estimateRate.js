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
      const rate = this.ratings.find(
        (item) => course._id.toString() === item.course.toString()
      );
      if (rate) {
        var courseRate = rate.rating;
      }
      console.log(courseRate);
    });
  };
}

export default EstimateRate;
