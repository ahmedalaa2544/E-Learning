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
    title: {
      type: String,
      required: true,
    },
    quillContent: {
      type: String,
      required: true,
    },
    resources: {
      directory: { type: String },
      content: [
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
  },

  { timestamps: true }
);

const articleModel = model("Article", articleSchema);
export default articleModel;
