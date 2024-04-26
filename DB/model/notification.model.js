import mongoose, { Schema, Types, model } from "mongoose";

const notificationSchmea = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    notifications: [
      {
        image: String,
        title: { type: String, required: true },
        body: { type: String, required: true },
        url: String,
        isRead: { type: Boolean, default: false },
        time: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const notificationModel = model("Notification", notificationSchmea);
export default notificationModel;
