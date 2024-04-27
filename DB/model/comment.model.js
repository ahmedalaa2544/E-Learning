import { Schema, model, Types } from "mongoose";
const commentSchema = new Schema(
  {
    course: {
      type: Types.ObjectId,
      ref: "Course",
      required: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: {
      type: String,
      min: 3,
      max: 120,
      required: true,
    },
    predictedSentiment: {
      type: Number,
      enum: [0, 1],
    },
    userFeedbackSentiment: {
      type: Number,
      enum: [0, 1],
    },
  },
  { timestamps: true }
);

const commentModel = model("Comment", commentSchema);
export default commentModel;
