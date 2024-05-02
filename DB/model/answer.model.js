import { Schema, model, Types } from "mongoose";

const answerSchema = new Schema(
  {
    id: {
      type: Types.ObjectId,
      default: function () {
        return this._id || Types.ObjectId();
      },
    },
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
    question: {
      type: Types.ObjectId,
      ref: "Question",
      reuired: true,
    },
    answer: {
      type: Types.ObjectId,
      ref: "option",
      reuired: true,
    },
    student: {
      type: Types.ObjectId,
      ref: "User",
      reuired: true,
    },
    isCorrect: { type: Boolean, required: true },
    multiple: { type: Boolean, default: false },
    numberOfAttempt: { type: Number, default: 0 },
  },

  { timestamps: true }
);

const answerModel = model("Answer", answerSchema);
export default answerModel;
