import userModel from "../../../DB/model/user.model.js";
import courseModel from "../../../DB/model/course.model.js";
import instructorModel from "../../../DB/model/instructor.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import Cryptr from "cryptr";
import tokenModel from "../../../DB/model/token.model.js";
import upload, { deleteBlob } from "../../utils/azureServices.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import bcryptjs from "bcryptjs";

export const getUser = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);
  const cryptr = new Cryptr(process.env.CRPTO_PHONE);
  const decryptedPhone = cryptr.decrypt(user.phone);
  user.phone = decryptedPhone;
  const newUser = user;
  return res.status(200).json({ message: "Done", newUser });
});

export const updateProfile = asyncHandler(async (req, res, next) => {
  // update profile
  const checkEmail = await userModel.findOne({ email: req.body.email });
  if (checkEmail) {
    return next(new Error("email is Registred"), { cause: 400 });
  }
  const user = await userModel.findByIdAndUpdate(req.user.id, { ...req.body });
  if (req.body.phone) {
    // Encrypt phone
    const cryptr = new Cryptr(process.env.CRPTO_PHONE);
    const encryptPhone = cryptr.encrypt(req.body.phone);
    user.phone = encryptPhone;
    user.save();
  }
  if (req.body.password) {
    // Encrypt password
    const hashPassword = await bcryptjs.hash(
      req.body.password,
      +process.env.SALAT_ROUND
    );
    user.password = hashPassword;
    user.save();
  }

  // upload profile picture
  if (req.file) {
    if (req.user.profilePic) {
      // delete promotionImage from Azure cloud
      await deleteBlob(req.user.profilePic.blobName);
    }

    // Extract the extension for the promotion image.
    const blobImageExtension = req.file.originalname.split(".").pop();
    // Define the path for the promotion image in the user's course directory.
    const blobImageName = `Users\\${req.user.userName}_${req.user._id}\\profilePic\\image.${blobImageExtension}`;
    // Upload image and obtain its URL.
    const imageUrl = await upload(
      req.file.path,
      blobImageName,
      "image",
      blobImageExtension
    );

    // save changes in DB
    req.user.profilePic.blobName = blobImageName;
    req.user.profilePic.url = imageUrl;
    await req.user.save();
  }

  return res.status(200).json({ message: "Done", user });
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
  // chcek course in wishlist
  if (!req.user.wishlist.includes(courseId))
    return next(new Error("Course not exist in ur wishlist", { cause: 404 }));
  // remove
  await userModel.updateOne(
    { _id: req.user.id },
    { $pull: { wishlist: courseId } }
  );
  return res.status(200).json({ message: "Done" });
});

export const getWishlist = asyncHandler(async (req, res, next) => {
  const { wishlist } = await userModel
    .findById(req.user.id)
    .populate([{ path: "wishlist" }]);
  return res.status(200).json({ message: "Done", wishlist });
});

export const getCourses = asyncHandler(async (req, res, next) => {
  // get courses
  const courses = await userModel
    .findById(req.user.id)
    .populate([{ path: "coursesBought", model: "Course" }]);
  // get workshops
  const workshop = await userModel
    .findById(req.user.id)
    .populate([{ path: "coursesBought", model: "Workshop" }]);
  // return response
  return res.status(200).json({ message: "Done", courses, workshop });
});

export const getCreatedCourses = asyncHandler(async (req, res, next) => {
  // get courses
  const courses = await courseModel.find({ createdBy: req.user._id });
  const workshop = await workshopModel.find({ instructor: req.user._id });
  // return response
  return res.status(200).json({ message: "Done", courses, workshop });
});

export const search = asyncHandler(async (req, res, next) => {
  const query = req.query.q.toLowerCase();

  const instructors = await instructorModel
    .find()
    .populate({ path: "user", select: "userName profilePic.url" })
    .select("user -_id");

  const matchedData = instructors
    .filter((item) => item.user.userName.toLowerCase().includes(query))
    .slice(0, 3);

  // respone
  return res.status(200).json({ message: "Done", matchedData });
});
