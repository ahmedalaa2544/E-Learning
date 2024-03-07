import { Schema, model, Types } from "mongoose";

const articleSchema = new Schema(
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
    duration: Number,
    quillContent: {
      type: String,
      required: true,
    },
  },

  { timestamps: true }
);

const articleModel = model("Article", articleSchema);
export default articleModel;
