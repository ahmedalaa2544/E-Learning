import { Schema, Types, model } from "mongoose";

const tokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "User",
    },
    valid: {
      type: Boolean,
      default: true,
    },
    agent: String,
    expiredAt: String,
  },
  { timestamps: true }
);

const tokenModel = model("Token", tokenSchema);
export default tokenModel;
