import couponModel from "../../../DB/model/coupon.model.js";
import courseModel from "../../../DB/model/course.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import voucher_code from "voucher-code-generator";

export const createCoupon = asyncHandler(async (req, res, next) => {
  // generate code
  const code = voucher_code.generate({ length: 5 });

  const checkCourse = await courseModel.findById(req.body.courseId);
  if (!checkCourse) {
    return next(new Error("course not found", { cause: 404 }));
  }

  if (checkCourse.createdBy != req.user.id) {
    return next(
      new Error("You Have not Access to coupon on this course", { cause: 401 })
    );
  }

  // create coupon
  const coupon = await couponModel.create({
    name: code[0],
    discount: req.body.discount,
    courseId: req.body.courseId,
    expireAt: new Date(req.body.expireAt).getTime(),
    createdBy: req.user._id,
  });
  // response
  return res.status(200).json({ message: "Done", coupon });
});

export const delCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await couponModel.findByIdAndDelete(req.params.courseId);

  if (!coupon) {
    return next(new Error("Coupon not found", { cause: 404 }));
  }
  if (coupon?.createdBy != req.user.id) {
    return next(
      new Error("You Have not Access to coupon on this course", {
        cause: 401,
      })
    );
  }

  return res.status(200).json({ message: "Done" });
});

export const getCoupons = asyncHandler(async (req, res, next) => {
  const coupon = await couponModel
    .find({ createdBy: req.user.id })
    .populate([{ path: "courseId", select: "title coverImageUrl" }]);

  return res.status(200).json({ message: "Done", coupon });
});
