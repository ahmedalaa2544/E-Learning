import { Schema, model, Types } from "mongoose";

const curriculumSchema = new Schema(
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
    type: {
      type: String,
      enum: ["video", "article"],
      require: true,
    },
    order: {
      type: Number,
      required: true,
    },
    video: {
      type: Types.ObjectId,
      ref: "Video",
      required: function () {
        return this.type === "video";
      },
    },
    article: {
      type: Types.ObjectId,
      ref: "Article",
      required: function () {
        return this.type === "article";
      },
    },
  },

  { timestamps: true }
);

const curriculumModel = model("Curriculum", curriculumSchema);
export default curriculumModel;
