import mongoose, { Schema, Types, model } from "mongoose";

const notificationSchmea = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    notifications: [
      {
        from: { type: Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const notificationModel = model("Notification", notificationSchmea);
export default notificationModel;
