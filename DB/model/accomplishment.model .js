import { Schema, model, Types } from "mongoose";

const accomplishmentSchema = new Schema(
  {
    curriculum: {
      type: Types.ObjectId,
      ref: "Curriculum",
      reuired: true,
    },
    courseOwner: { type: Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["video", "article"],
      required: true,
    },
    agent: [{ type: String, enum: ["computer", "tablet", "mobile"] }],
    watchedTime: {
      type: String,
      required: function () {
        return this.type === "video";
      },
    },
    stopTime: {
      type: String,
      required: function () {
        return this.type === "video";
      },
    },
    student: { type: Types.ObjectId, ref: "Student", required: true },
    accomplished: { type: Boolean },
  },

  { timestamps: true }
);

const accomplishmentModel = model("Accomplishment", accomplishmentSchema);
export default accomplishmentModel;
