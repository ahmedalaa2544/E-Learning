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
    firstName: {
      type: String,
      min: 3,
      max: 20,
    },
    lastName: {
      type: String,
      min: 3,
      max: 20,
    },
    occupation: String,
    school: String,
    country: String,
    language: String,
    about: String,
    fullName: String,
    gitHubLink: String,
    linkedinLink: String,
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
      blobName: { type: String },
      url: { type: String },
    },
    coursesBought: {
      type: [{ type: Types.ObjectId, ref: ["Workshop", "Course"] }],
    },
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
    clicked: { type: Number, default: 0 },
    totalPaidOut: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// fullName
userSchmea.pre("findOneAndUpdate", function (next) {
  const query = this.getQuery();

  this.model.findOne(query).then((docToUpdate) => {
    const update = this.getUpdate();
    const oldFirstName = docToUpdate.firstName;
    const oldLastName = docToUpdate.lastName;

    if (update.firstName || update.lastName) {
      update.fullName = `${update.firstName || oldFirstName} ${
        update.lastName || oldLastName
      }`.trim();
    }
    next();
  });
});

const userModel = model("User", userSchmea);
export default userModel;
