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
    quillContent: {
      type: String,
      required: true,
    },
    resources: [
      {
        name: {
          type: String,
          max: 60,
        },
        url: {
          type: String,
        },
      },
    ],
  },

  { timestamps: true }
);

const articleModel = model("Article", articleSchema);
export default articleModel;
