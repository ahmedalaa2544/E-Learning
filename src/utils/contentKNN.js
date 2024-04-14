import Similarities from "../../DB/model/similarities.model.js";
import { mergeSortDescending } from "./dataSructures.js";
class ContentKNN {
  constructor(user) {
    this.user = user;
    // this.ratedCourses = ratedCourses;
    // this.similarities = similarities;
  }
  isUserRateThat = (ratings, courseSim) => {
    for (let i = 0; i < ratings.length; i++) {
      if (ratings[i].course.toString() == courseSim) {
        return true;
      }
    }

    return false;
  };

  estimate = async (ratedCourses) => {
    const coursesSim = await Similarities.find({});

    let predictions = coursesSim.map((courseSim, i) => {
      let simTotal = 0,
        weightedSum = 0;
      const k_neighbors = mergeSortDescending(
        courseSim.similarities,
        "similarity"
      ).slice(0, 10);
      // if (i == 0) console.log(i, " :", k_neighbors);
      if (
        !this.isUserRateThat(ratedCourses, courseSim._doc.course.toString())
      ) {
        ratedCourses.map((rated) => {
          const ratedItemSim = k_neighbors.find(
            (item) => rated.course.toString() === item.course.toString()
          );
          if (ratedItemSim?.similarity > 0) {
            simTotal += ratedItemSim.similarity;
            weightedSum += ratedItemSim.similarity * rated.rating;
            console.log(`simTotal ${simTotal} weightSum ${weightedSum}`);
          }
        });
        const predict = weightedSum / simTotal;
        console.log(`predict ${predict}`);
        return {
          course: courseSim._doc.course.toString(),
          predict: isNaN(predict) ? 0 : predict,
        };
      }
    });
    predictions = predictions.filter((item) => item != null);
    // predictions = predictions.map((item) => item.course);
    console.log(predictions);
    predictions = mergeSortDescending(predictions, "predict");
    return predictions;
  };
}

export default ContentKNN;
