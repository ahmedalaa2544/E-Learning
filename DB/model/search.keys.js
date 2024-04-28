import { Schema, Types, model } from "mongoose";

const searchSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    key: { type: String, required: true },
  },
  { timestamps: true }
);

const searchModel = model("Search", searchSchema);
export default searchModel;
