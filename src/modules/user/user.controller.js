import userModel from "../../../DB/model/user.model.js";
import courseModel from "../../../DB/model/course.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import Cryptr from "cryptr";
import tokenModel from "../../../DB/model/token.model.js";

export const updateProfile = asyncHandler(async (req, res, next) => {
  // const { fullName, gender, phone, age } = req.body;
  // update profile
  const user = await userModel.findByIdAndUpdate(req.user.id, { ...req.body });
  if (req.body.phone) {
    // Encrypt phone
    const cryptr = new Cryptr(process.env.CRPTO_PHONE);
    const encryptPhone = cryptr.encrypt(req.body.phone);
    user.phone = encryptPhone;
    user.save();
  }
  return res.status(200).json({ message: "Done" });
});

export const deleteAcc = asyncHandler(async (req, res, next) => {
  await userModel.findByIdAndUpdate(req.user.id, { isDeleted: true });
  await tokenModel.updateMany({ user: req.user.id }, { valid: false });
  return res.status(200).json({ message: "Done" });
});

export const addWishlist = asyncHandler(async (req, res, next) => {
  // recieve data
  const { courseId } = req.params;
  // chcek course exists
  const course = await courseModel.findById(courseId);
  if (!course) return next(new Error("Course not found", { cause: 404 }));
  // add to wishlist
  await userModel.updateOne(
    { _id: req.user.id },
    { $addToSet: { wishlist: courseId } }
  );
  return res.status(200).json({ message: "Done" });
});

export const rmWishlist = asyncHandler(async (req, res, next) => {
  // recieve data
  const { courseId } = req.params;
  // add to wishlist
  await userModel.updateOne(
    { _id: req.user.id },
    { $pull: { wishlist: courseId } }
  );
  return res.status(200).json({ message: "Done" });
});
