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
      set: (value) => (value === "" ? null : value),
    },
    description: {
      type: String,
      required: function () {
        return !(this.status === "Draft");
      },
      max: 200,
      set: (value) => (value === "" ? null : value),
    },
    language: {
      type: String,
      required: function () {
        return !(this.status === "Draft");
      },
      set: (value) => (value === "" ? null : value),
    },
    tags: [
      {
        type: String,
        max: 30,
        required: function () {
          return !(this.status === "Draft");
        },
        set: (value) => (value === "" ? null : value),
      },
    ],
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Expert", "All Levels"],
      required: function () {
        return !(this.status === "Draft");
      },
      set: (value) => (value === "" ? null : value),
    },
    coverImageUrl: {
      type: String,
      required: function () {
        return !(this.status === "Draft");
      },
      set: (value) => (value === "" ? null : value),
    },
    coverImageBlobName: {
      type: String,
      required: function () {
        return !(this.status === "Draft");
      },
      set: (value) => (value === "" ? null : value),
    },
    promotionalVideoUrl: {
      type: String,
      set: (value) => (value === "" ? null : value),
    },
    promotionalVideoBlobName: {
      type: String,
      required: function () {
        return !(this.status === "Draft");
      },
      set: (value) => (value === "" ? null : value),
    },
    price: {
      type: Number,
      min: 0,
      required: function () {
        return !(this.status === "Draft");
      },
      set: (value) => (value === "" ? null : value),
    },
    discount: {
      type: Number,
      min: 1,
      max: 100,
      set: (value) => (value === "" ? null : value),
    }, // %
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: Types.ObjectId,
      ref: "Category",
      required: function () {
        return !(this.status === "Draft");
      },
      set: (value) => (value === "" ? null : value),
    },
    subCategory: {
      type: Types.ObjectId,
      ref: "SubCategory",
      required: function () {
        return !(this.status === "Draft");
      },
      set: (value) => (value === "" ? null : value),
    },
    instructors: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: function () {
          return !(this.status === "Draft");
        },
        set: (value) => (value === "" ? null : value),
      },
    ],

    students: [
      {
        type: Types.ObjectId,
        ref: "User",
        set: (value) => (value === "" ? null : value),
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
