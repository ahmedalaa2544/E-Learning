import { Schema, model, Types } from "mongoose";

const quizPerformanceSchema = new Schema(
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
    student: {
      type: Types.ObjectId,
      ref: "User",
      reuired: true,
    },
    questionsPerformance: [
      {
        question: { type: Types.ObjectId, ref: "Question", reuired: true },
        isUserSolutionCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],
    numberOfAttempt: { type: Number, default: 0 },
    quizFullMark: { type: Number, required: true },
    studentTotalPoints: { type: Number, default: 0 },
    returned: { type: Boolean, default: false },
  },

  { timestamps: true }
);

const quizPerformanceModel = model("QuizPerformance", quizPerformanceSchema);
export default quizPerformanceModel;
