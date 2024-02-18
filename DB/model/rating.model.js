import { Schema, model, Types } from "mongoose";

const ratingSchema = new Schema(
  {
    course: {
      type: Types.ObjectId,
      ref: "Course",
      reuired: true,
    },
    user: { type: Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
  },

  { timestamps: true }
);

const ratingModel = model("Rating", ratingSchema);
export default ratingModel;
