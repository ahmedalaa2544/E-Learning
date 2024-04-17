import mongoose, { Schema, Types, model } from "mongoose";

const chatSchmea = new Schema(
  {
    participants: [{ type: Types.ObjectId, ref: "User", required: true }],
    messages: [
      {
        from: { type: Types.ObjectId, ref: "User", required: true },
        to: [{ type: Types.ObjectId, ref: "User", required: true }],
        text: String,
        media: String,
        time: String,
        status: { type: String, enum: ["sent", "delivered", "read"] },
      },
    ],
  },
  { timestamps: true }
);

const chatModel = model("Chat", chatSchmea);
export default chatModel;
