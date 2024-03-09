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
    timeLimit: Number,
    // pointsNumber: { Number, required: true },
    shuffleQuestions: Boolean,
    shuffleAnswers: Boolean,
    showCorrectAnswer: Boolean,
    maxAttempts: Number,
    maxQuestionsInPage: Number,
    lockdown: Boolean,
    numberOfQuestions: Number,
  },

  { timestamps: true }
);

const quizModel = model("Quiz", quizSchema);
export default quizModel;
