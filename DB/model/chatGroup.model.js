import mongoose, { Schema, Types, model } from "mongoose";

const chatGroupSchmea = new Schema(
  {
    name: { type: String, required: true },
    participants: [{ type: Types.ObjectId, ref: "User", required: true }],
    messages: [
      {
        from: { type: Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const chatGroupModel = model("ChatGroup", chatGroupSchmea);
export default chatGroupModel;
