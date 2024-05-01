import { Schema, model, Types } from "mongoose";

const progressSchema = new Schema(
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
    student: { type: Types.ObjectId, ref: "User", required: true },
    courseOwner: { type: Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["video", "article"],
      required: true,
    },
    deviceType: { type: String, enum: ["computer", "tablet", "mobile"] },
    // watchedTime: {
    //   type: String,
    //   required: function () {
    //     return this.type === "video";
    //   },
    // },

    lastWatchedSecond: {
      type: Number,

      default: function () {
        if (this.type === "video") {
          return 0;
        }
      },
    },
    completed: { type: Boolean, default: false },
  },

  { timestamps: true }
);

const progressModel = model("Progress", progressSchema);
export default progressModel;
