import { Schema, Types, model } from "mongoose";

const workshopSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String },
    requirements: [{ type: String }],
    tags: [{ type: String }],
    languages: [{ type: String }],
    price: { type: Number, min: 1 }, // client must use "finalPrice" not price
    discount: { type: Number, min: 0, max: 100 },
    durationInWeek: { type: Number },
    level: { type: String, enum: ["Beginner", "Medium", "Hard"] },
    status: { type: String, enum: ["Draft", "Pending", "Published"] },
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
  },
  {
    // id: false,
    timestamps: true, // used as start date
    toJSON: { virtuals: false }, // includes id & _id
    toObject: { virtuals: false },
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

const workshopModel = model("Workshop", workshopSchema);

export default workshopModel;
