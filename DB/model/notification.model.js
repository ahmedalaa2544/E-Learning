import { Schema, model, Types, connect } from "mongoose";

const notificationSchema = new Schema(
  {
    from: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const notificationModel = model("Notification", notificationSchema);
export default notificationModel;
