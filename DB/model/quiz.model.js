import { Schema, model, Types } from "mongoose";

const quizSchema = new Schema(
  {
    id: {
      type: Types.ObjectId,
      default: function () {
        return this.curriculum || Types.ObjectId();
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

    description: String,
    timeLimit: { type: Number, default: 0 },
    // pointsNumber: { Number, required: true },
    shuffleQuestions: Boolean,
    shuffleAnswers: Boolean,
    showCorrectAnswer: Boolean,
    maxAttempts: { type: Number, default: 0 },
    maxQuestionsInPage: { type: Number, default: 0 },
    lockdown: Boolean,
    numberOfQuestions: { type: Number, default: 0 },
    allowedToReturn: { type: Boolean, default: true },
    fullMark: { type: Number, default: 0 },
  },

  { timestamps: true }
);

const quizModel = model("Quiz", quizSchema);
export default quizModel;
