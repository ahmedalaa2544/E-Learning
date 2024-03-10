import { Schema, model, Types } from "mongoose";

const optionSchema = new Schema(
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
    order: {
      type: Number,
      required: true,
    },
    text: String,
    imageUrl: {
      type: String,
    },
    imageBlobName: {
      type: String,
    },
    correctAnswer: { type: Boolean, required: true },
  },

  { timestamps: true }
);

const optionModel = model("Option", optionSchema);
export default optionModel;
