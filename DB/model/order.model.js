import { Schema, Types, model } from "mongoose";

const orderSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    courses: [
      {
        _id: false,
        courseId: { type: Types.ObjectId, ref: "Workshop" || "Course" },
        coursePrice: { type: Number, required: true },
        name: String,
      },
    ],
    price: { type: Number, required: true },
    status: {
      type: String,
      default: "Not Completed",
      enum: ["Completed", "Not Completed"],
    },
  },
  { timestamps: true }
);

const orderModel = model("Order", orderSchema);
export default orderModel;
