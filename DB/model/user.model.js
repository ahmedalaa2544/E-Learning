import mongoose, { Schema, Types, model } from "mongoose";

const userSchmea = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      min: 3,
      max: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      min: 8,
    },
    fullName: String,
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    age: {
      type: Number,
      min: 4,
      max: 100,
    },
    profilePic: {
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/dtxu6cgvy/image/upload/v1691768838/Default/user/default-avatar-profile-icon-social-media-user-vector-default-avatar-profile-icon-social-media-user-vector-portrait-176194876_tojg0u.webp",
      },
      id: {
        type: String,
        default:
          "Default/user/default-avatar-profile-icon-social-media-user-vector-default-avatar-profile-icon-social-media-user-vector-portrait-176194876_tojg0u",
      },
    },
    coursesBought: [
      {
        courseId: { type: Types.ObjectId, ref: "Course" },
      },
    ],
    wishlist: {
      type: [{ type: Types.ObjectId, ref: "Course" }],
    },
    phone: String,
    isOnline: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isConfirm: {
      type: Boolean,
      default: false,
    },
    forgetCode: String,
    activationCode: String,
  },
  { timestamps: true }
);

const userModel = model("User", userSchmea);
export default userModel;
