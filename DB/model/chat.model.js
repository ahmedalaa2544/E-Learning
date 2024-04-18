import mongoose, { Schema, Types, model } from "mongoose";

const chatSchmea = new Schema(
  {
    name: String,
    pic: String,
    participants: [{ type: Types.ObjectId, ref: "User", required: true }],
    type: { type: String, default: "private", enum: ["private", "group"] },
    messages: [
      {
        from: { type: Types.ObjectId, ref: "User", required: true },
        to: [{ type: Types.ObjectId, ref: "User", required: true }],
        text: String,
        media: { url: String, size: Number, typeOfMedia: String },
        time: String,
        status: { type: String, enum: ["sent", "delivered", "read"] },
      },
    ],
  },
  { timestamps: true }
);

const chatModel = model("Chat", chatSchmea);
export default chatModel;
