import { Schema, Types, model } from "mongoose";

const workshopSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String },
    requirements: [{ type: String }],
    tags: [{ type: String }],
    languages: [{ type: String }],
    price: { type: Number, min: 0, default: 0 }, // client must use "finalPrice" not price
    discount: { type: Number, min: 0, max: 100, default: 0 },
    durationInWeek: { type: Number },
    startDay: { type: String },
    sessionTime: { type: String },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Expert", "All Levels"],
    },
    status: {
      type: String,
      enum: ["Draft", "Pending", "Published"],
      default: "Draft",
    },
    schedule: [
      {
        type: String,
        enum: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
      },
    ],
    promotionImage: {
      blobName: { type: String },
      url: { type: String },
    },
    promotionVideo: {
      blobName: { type: String },
      url: { type: String },
    },
    categoryId: { type: Types.ObjectId, ref: "Category" },
    subCategoryId: { type: Types.ObjectId, ref: "SubCategory" },
    instructor: { type: Types.ObjectId, ref: "User" },
    rooms: [{ type: Types.ObjectId, ref: "Room" }],
    numberOfStudents: { type: Number, default: 0 },
    coupons: [{ type: Types.ObjectId, ref: "Coupon" }],
  },
  {
    id: false,
    timestamps: true, // used as start date
    toJSON: { virtuals: true }, // includes id & _id
    toObject: { virtuals: true },
  }
);

// *************** Virtuals ************ //
workshopSchema.virtual("finalPrice").get(function () {
  if (this.price) {
    return Number.parseFloat(
      this.price - (this.price * this.discount || 0) / 100
    ).toFixed(2);
  }
});

workshopSchema.virtual("revenue").get(function () {
  return this.price * this.numberOfStudents;
});

const workshopModel = model("Workshop", workshopSchema);

export default workshopModel;
