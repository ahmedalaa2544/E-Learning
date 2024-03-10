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

    description: String,
    timeLimit: Number,
    // pointsNumber: { Number, required: true },
    shuffleQuestions: Boolean,
    shuffleAnswers: Boolean,
    showCorrectAnswer: Boolean,
    maxAttempts: { type: Number, default: 1 },
    maxQuestionsInPage: { type: Number, default: 10 },
    lockdown: Boolean,
    numberOfQuestions: { type: Number, default: 1 },
  },

  { timestamps: true }
);

const quizModel = model("Quiz", quizSchema);
export default quizModel;
