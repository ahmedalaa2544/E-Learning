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
      required: true,
      set: (value) => (value === "" ? null : value),
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
      set: (value) => (value === "" ? null : value),
    },
    article: {
      type: Types.ObjectId,
      ref: "Article",
      required: function () {
        return this.type === "article";
      },
      set: (value) => (value === "" ? null : value),
    },
    title: {
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
          blobName: {
            type: String,
          },
        },
      ],
    },
  },

  { timestamps: true }
);

const curriculumModel = model("Curriculum", curriculumSchema);
export default curriculumModel;
