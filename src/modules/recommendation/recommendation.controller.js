import { asyncHandler } from "../../utils/asyncHandling.js";
import Course from "../../../DB/model/course.model.js";
import Chapter from "../../../DB/model/chapter.model.js";
import Curriculum from "../../../DB/model/curriculum.model.js";
import Video from "../../../DB/model/video.model.js";
import Article from "../../../DB/model/article.model.js";
import ratingModel from "../../../DB/model/rating.model.js";
import commentModel from "../../../DB/model/comment.model.js";
import userModel from "../../../DB/model/user.model.js";
import View from "../../../DB/model/view.model.js";
import Instructor from "../../../DB/model/instructor.model.js";
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

export const getRecommendations = asyncHandler(async (req, res, next) => {
  const courses = await Course.find({ status: "Published" });
  const ratings = await Rating.find({ user: req.userId });
  const clicked = await View.find({ user: req.userId });
  const purchased = await Student.find({ user: req.userId });
  const wishLisht = req.user.wishLisht;
  ratings.forEach((rate) => {
    rate._doc;
  });
  const estimateRate = new EstimateRate(
    req.user,
    courses,
    ratings,
    clicked,
    purchased,
    wishLisht
  );
  estimateRate.estimatedRates();
  const contentKNN = new ContentKNN(req.userId);
  const predictions = await contentKNN.estimate(ratings);
  return predictions
    ? res.status(200).json({ message: "Done", predictions })
    : res.status(500).json({ message: "Something went wrong" });
});
