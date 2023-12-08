import { Schema, model, Types } from "mongoose";

const chapterSchema = new Schema(
  {
    course: {
      type: Types.ObjectId,
      ref: "Course",
      reuired: true,
    },
    order: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      max: 80,
    },
    learningObjective: {
      type: String,
      max: 200,
      set: (value) => (value === "" ? null : value),
    },
  },

  { timestamps: true }
);

const chapterModel = model("Chapter", chapterSchema);
export default chapterModel;
