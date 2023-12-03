import { Schema, model, Types } from "mongoose";

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      max: 60,
    },
    subtitle: {
      type: String,
      required: function () {
        return !(this.status === "Draft");
      },
      max: 120,
    },
    description: {
      type: String,
      required: function () {
        return !(this.status === "Draft");
      },
      max: 200,
    },
    language: {
      type: String,
      required: function () {
        return !(this.status === "Draft");
      },
    },
    tags: [
      {
        type: String,
        max: 30,
        required: function () {
          return !(this.status === "Draft");
        },
      },
    ],
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Expert", "All Levels"],
      required: function () {
        return !(this.status === "Draft");
      },
    },
    coverImageUrl: {
      type: String,
      required: function () {
        return !(this.status === "Draft");
      },
    },

    promotionalVideoUrl: {
      type: String,
    },
    price: {
      type: Number,
      min: 0,
      required: function () {
        return !(this.status === "Draft");
      },
    },
    discount: { type: Number, min: 1, max: 100 }, // %
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: function () {
        return !(this.status === "Draft");
      },
    },
    category: {
      type: Types.ObjectId,
      ref: "Category",
      required: function () {
        return !(this.status === "Draft");
      },
    },
    subCategory: {
      type: Types.ObjectId,
      ref: "SubCategory",
      required: function () {
        return !(this.status === "Draft");
      },
    },
    instructors: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: function () {
          return !(this.status === "Draft");
        },
      },
    ],

    students: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["Draft", "Pending", "Published"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

const courseModel = model("Course", courseSchema);
export default courseModel;
