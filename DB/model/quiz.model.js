import { Schema, model, Types } from "mongoose";

const quizSchema = new Schema(
  {
    course: {
      type: Types.ObjectId,
      ref: "Course",
      reuired: true,
    },
    chapter: {
      type: Types.ObjectId,
      ref: "Chapter",
      reuired: true,
    },
    curriculum: {
      type: Types.ObjectId,
      ref: "Curriculum",
      reuired: true,
    },

    description: {
      type: String,
      set: (value) => (value === "" ? null : value),
    },
    duaration: Number,
    // pointsNumber: { Number, required: true },
    sorted: { type: Boolean, required: true },
  },

  { timestamps: true }
);

const quizModel = model("Quiz", quizSchema);
export default quizModel;
