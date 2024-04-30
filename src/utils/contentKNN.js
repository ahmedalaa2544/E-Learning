import Similarities from "../../DB/model/similarities.model.js";
import { mergeSortDescending, mergeSort } from "./dataSructures.js";
/**
 * The ContentKNN class uses collaborative filtering techniques based on the K-nearest neighbors algorithm
 * to provide personalized course recommendations to a user.
 */
class ContentKNN {
  /**
   * Constructs a new instance of ContentKNN with a specific user.
   *
   * @param {Object} user The user object for whom the recommendations are to be made.
   */
  constructor(user) {
    this.user = user;
  }

  /**
   * Determines if the user has rated a specific course.
   *
   * @param {Array} ratings Array of user's ratings.
   * @param {String} courseSim The course ID to check against the user's ratings.
   * @returns {Boolean} True if the user has rated the course, otherwise false.
   */
  hasUserRatedCourse = (ratings, courseSim) => {
    return ratings.some((rating) => rating.course.toString() === courseSim);
  };

  /**
   * Generates personalized recommendations for the user based on their past course ratings.
   *
   * @param {Array} ratedCourses Array of courses that the user has rated.
   * @returns {Promise<Array>} A promise that resolves to an array of recommended courses with predicted ratings.
   */
  generateRecommendations = async (ratedCourses) => {
    const coursesSim = await Similarities.find({});
    let predictions = coursesSim.map((courseSim) => {
      let simTotal = 0,
        weightedSum = 0;
      const kNeighbors = mergeSortDescending(
        courseSim.similarities,
        "similarity"
      ).slice(0, 10);

      if (
        !this.hasUserRatedCourse(ratedCourses, courseSim._doc.course.toString())
      ) {
        ratedCourses.forEach((rated) => {
          const ratedItemSim = kNeighbors.find(
            (item) => rated.course.toString() === item.course.toString()
          );
          if (ratedItemSim && ratedItemSim.similarity > 0) {
            simTotal += ratedItemSim.similarity;
            weightedSum += ratedItemSim.similarity * rated.rating;
          }
        });
        const predict = weightedSum / simTotal;
        return {
          course: courseSim._doc.course.toString(),
          predict: isNaN(predict) ? 0 : predict,
        };
      }
    });

    predictions = predictions.filter((item) => item != null);
    return mergeSortDescending(predictions, "predict").slice(0, 10);
  };

  /**
   * Generates recommendations related to a single item, typically the last item viewed or interacted with by the user.
   *
   * @param {String} item The course ID of the last visited course.
   * @returns {Promise<Array>} A promise that resolves to an array of recommended courses based on the last visited course.
   */
  generateItemBasedRecommendations = async (item) => {
    const predictions = await Similarities.findOne({
      course: item,
    });
    return generateItemBasedRecommendations
      ? mergeSortDescending(predictions?.similarities, "similarity").slice(
          0,
          10
        )
      : [];
  };
}

export default ContentKNN;
