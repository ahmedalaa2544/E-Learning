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
    subtitles: {
      blobName: {
        type: String,
      },
    },
    describtion: {
      type: String,
      set: (value) => (value === "" ? null : value),
    },
    url: {
      type: String,
    },
    blobName: {
      type: String,
    },
    duration: {
      type: String,
    },
  },

  { timestamps: true }
);

const videoModel = model("Video", videoSchema);
export default videoModel;
