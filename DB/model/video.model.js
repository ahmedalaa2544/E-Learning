import { Schema, model, Types } from "mongoose";

const videoSchema = new Schema(
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
    describtion: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
    blobName: {
      type: String,
      required: true,
    },
    duration: {
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

const videoModel = model("Video", videoSchema);
export default videoModel;
