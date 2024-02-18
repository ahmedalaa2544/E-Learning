import { Schema, model, Types } from "mongoose";

const commentSchema = new Schema(
  {
    course: {
      type: Types.ObjectId,
      ref: "Course",
      reuired: true,
    },
    user: { type: Types.ObjectId, ref: "User", required: true },
    comment: { type: String, min: 3, max: 120, required: true },
  },

  { timestamps: true }
);

const commentModel = model("Comment", commentSchema);
export default commentModel;
