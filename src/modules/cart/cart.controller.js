import cartModel from "../../../DB/model/cart.model.js";
import userModel from "../../../DB/model/user.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import courseModel from "../../../DB/model/course.model.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import couponModel from "../../../DB/model/coupon.model.js";

export const AddToCart = asyncHandler(async (req, res, next) => {
  const { workId } = req.params;
  const { coupon } = req.query;
  let course;
  if (req.query.type == "course") {
    course = await courseModel.findById(workId);
  }

  if (req.query.type == "workshop") {
    course = await workshopModel.findById(workId);
  }

  if (!course) {
    return next(new Error("Course not found", { cause: 404 }));
  }
  // check if user bought this course before
  const user = await userModel.findById(req.user.id);
  if (user.coursesBought.includes(workId)) {
    return next(
      new Error("U already Bought this course before", { cause: 400 })
    );
  }

  // check course in cart
  const checkCourseInCart = await cartModel.findOne({
    user: req.user.id,
    "course.courseId": workId,
  });

  if (checkCourseInCart) {
    return next(new Error("Course already exists in Ur Cart", { cause: 404 }));
  }

  let couponPrice;
  if (coupon) {
    const coupon = await couponModel.findOne({ name: req.query.coupon });
    if (coupon?.courseId != workId) {
      return next(new Error("Coupon Not Vaild To This Course", { cause: 400 }));
    }
    const currentTimestamp = new Date().getTime();
    // Check if the coupon has expired
    if (currentTimestamp > coupon.expireAt) {
      return next(new Error("Coupon has Expired", { cause: 400 }));
    }
    couponPrice = course.price - (coupon.discount * course.price) / 100;
  }

  // add course to cart
  const cart = await cartModel.findOneAndUpdate(
    { user: req.user.id },
    {
      $push: {
        course: {
          courseId: workId,
          price: coupon ? couponPrice : course.price,
          name: course.title,
        },
      },
    },
    { new: true }
  );

  // response
  return res.status(201).json({ message: "Done", cart });
});

export const removeFromCart = asyncHandler(async (req, res, next) => {
  // check course in cart
  const checkCourseInCart = await cartModel.findOne({
    user: req.user.id,
    "course.courseId": req.params.courseId,
  });
  if (!checkCourseInCart) {
    return next(new Error("Course not exist in Ur Cart", { cause: 404 }));
  }
  // remove course from cart
  await cartModel.findOneAndUpdate(
    {
      user: req.user.id,
    },
    { $pull: { course: { courseId: req.params.courseId } } },
    { new: true }
  );
  // response
  return res.status(200).json({ message: "Done" });
});

export const getCart = asyncHandler(async (req, res) => {
  //get courses
  const { course } = await cartModel.findOne({ user: req.user.id }).populate({
    path: "course.courseId",
    model: "Course",
    populate: {
      path: "createdBy",
      select: "userName",
    },
    select: "coverImageUrl",
  });

  const Fcourses = course
    .filter((item) => item.courseId) // Filter out items where courseId is null or undefined
    .map((item) => ({
      courseId: item.courseId._id,
      createdBy: item.courseId.createdBy,
      coverImageUrl: item.courseId.coverImageUrl || "",
      price: item.price,
      name: item.name,
    }));

  if (course.length !== Fcourses.length) {
    const workshop = await cartModel.findOne({ user: req.user.id }).populate({
      path: "course.courseId",
      model: "Workshop",
      populate: {
        path: "instructor",
        select: "userName",
      },
      select: "coverImageUrl",
    });

    const Scourses = workshop.course
      .filter((item) => item.courseId) // Filter out items where courseId is null or undefined
      .map((item) => ({
        courseId: item.courseId._id,
        createdBy: item.courseId.instructor,
        coverImageUrl: item.courseId.coverImageUrl || "",
        price: item.price,
        name: item.name,
      }));

    const courses = Fcourses.concat(Scourses);

    let totalPrice = 0;
    courses.forEach((a) => {
      totalPrice += a.price;
    });

    return res.status(200).json({ message: "Done", courses, totalPrice });
  }
  let totalPrice = 0;
  Fcourses.forEach((a) => {
    totalPrice += a.price;
  });
  return res
    .status(200)
    .json({ message: "Done", courses: Fcourses, totalPrice });
});
