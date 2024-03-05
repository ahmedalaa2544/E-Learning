import { Schema, model, Types } from "mongoose";

const viewSchema = new Schema(
  {
    course: {
      type: Types.ObjectId,
      ref: "Course",
      reuired: true,
    },
    // user: { type: Types.ObjectId, ref: "User" },
    courseOwner: { type: Types.ObjectId, ref: "User", required: true },

    cookie: { type: String, required: true },
    count: Number,
    agent: { type: String, enum: ["Computer", "Tablet", "Mobile"] },
  },

  { timestamps: true }
);

const viewModel = model("View", viewSchema);
export default viewModel;
