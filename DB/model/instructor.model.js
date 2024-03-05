import { Schema, model, Types } from "mongoose";

const instructorSchema = new Schema(
  {
    course: {
      type: Types.ObjectId,
      ref: "Course",
      reuired: true,
    },
    courseOwner: { type: Types.ObjectId, ref: "User", required: true },
    // agent: [{ type: String, enum: ["computer", "tablet", "mobile"] }],
    user: { type: Types.ObjectId, ref: "User", required: true },
  },

  { timestamps: true }
);

const instructorModel = model("Instructor", instructorSchema);
export default instructorModel;
