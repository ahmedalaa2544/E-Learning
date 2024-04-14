import { Schema, model, Types, connect } from "mongoose";

const socketSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    socketId: {
      type: String,
      required: true,
    },
    token: {
      type: Types.ObjectId,
      ref: "Token",
      required: true,
    },
    expireAt: {
      type: Date,
      default: Date.now,
      index: { expires: "5/3600h" },
    },
  },
  { timestamps: true }
);

const socketModel = model("Socket", socketSchema);
export default socketModel;
