import { Schema, model, Types } from "mongoose";

const studentSchema = new Schema(
  {
    course: {
      type: Types.ObjectId,
      ref: "Course",
      reuired: true,
    },
    // agent: [{ type: String, enum: ["computer", "tablet", "mobile"] }],
    user: { type: Types.ObjectId, ref: "User", required: true },
    courseOwner: { type: Types.ObjectId, ref: "User", required: true },
    // price: { type: Number },
    paid: { type: Number },
    accomplishementPercentage: { type: Number, default: 0 },

    graduated: { type: Boolean, default: false },
  },

  { timestamps: true }
);

const studentModel = model("Student", studentSchema);
export default studentModel;
