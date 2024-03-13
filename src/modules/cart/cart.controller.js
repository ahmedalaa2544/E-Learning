import cartModel from "../../../DB/model/cart.model.js";
import userModel from "../../../DB/model/user.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import courseModel from "../../../DB/model/course.model.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import couponModel from "../../../DB/model/coupon.model.js";

export const addToCart = asyncHandler(async (req, res, next) => {
  // check existence course
  const course = await courseModel.findById(req.params.courseId);
  const workshop = await workshopModel.findById(req.params.courseId);
  if (!(course || workshop)) {
    return next(new Error("Course not found", { cause: 404 }));
  }

  // check if user bought this course before
  const user = await userModel.findById(req.user.id);
  if (user.coursesBought.includes(req.params.courseId)) {
    return next(
      new Error("U already Bought this course before", { cause: 400 })
    );
  }

  // check course in cart
  const checkCourseInCart = await cartModel.findOne({
    user: req.user.id,
    "course.courseId": req.params.courseId,
  });

  if (checkCourseInCart) {
    return next(new Error("Course already exists in Ur Cart", { cause: 404 }));
  }

  // add course to cart
  const cart = await cartModel.findOneAndUpdate(
    { user: req.user.id },
    {
      $push: {
        course: {
          courseId: req.params.courseId,
          price: course ? course.price : workshop.price,
          name: course ? course.title : workshop.title,
        },
      },
    },
    { new: true }
  );
  // response
  return res.status(201).json({ message: "Done", cart });
});

export const removeFromCart = asyncHandler(async (req, res, next) => {
  // check course
  const course = await courseModel.findById(req.params.courseId);
  const workshop = await workshopModel.findById(req.params.courseId);

  if (!(course || workshop)) {
    return next(new Error("Course not found", { cause: 404 }));
  }
  // check course in cart
  const checkCourseInCart = await cartModel.findOne({
    user: req.user.id,
    "course.courseId": req.params.courseId,
  });
  if (!checkCourseInCart) {
    return next(new Error("Course not exist in Ur Cart", { cause: 404 }));
  }
  // remove course from cart
  const remove = await cartModel.findOneAndUpdate(
    {
      user: req.user.id,
    },
    { $pull: { course: { courseId: req.params.courseId } } },
    { new: true }
  );
  // response
  return res.status(200).json({ message: "Done", remove });
});

export const addCoupon = asyncHandler(async (req, res, next) => {
  const chcekCoupon = await couponModel.findOne({ name: req.params.name });
  if (!chcekCoupon) {
    return next(new Error("Coupon not found", { cause: 404 }));
  }
  const cart = await cartModel.findOneAndUpdate(
    { user: req.user.id },
    {
      coupon: chcekCoupon._id,
    },
    { new: true }
  );
  // response
  return res.status(200).json({ message: "Done", cart });
});

export const delCoupon = asyncHandler(async (req, res, next) => {
  const cart = await cartModel.findOneAndUpdate(
    { user: req.user.id },
    { $unset: { coupon: "" } },
    { new: true }
  );
  // response
  return res.status(200).json({ message: "Done", cart });
});

export const getCart = asyncHandler(async (req, res) => {
  const { course } = await cartModel
    .findOne({ user: req.user.id })
    .populate({ path: "coupon" })
    .populate({
      path: "course.courseId",
      populate: {
        path: "createdBy",
        select: "userName",
      },
      select: "coverImageUrl -_id",
    });

  return res.status(200).json({ message: "Done", course });
});
