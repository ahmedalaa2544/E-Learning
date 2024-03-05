import { Schema, model, Types } from "mongoose";

const optionSchema = new Schema(
  {
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
