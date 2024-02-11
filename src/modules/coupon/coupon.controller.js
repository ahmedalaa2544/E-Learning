import couponModel from "../../../DB/model/coupon.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import voucher_code from "voucher-code-generator";

export const createCoupon = asyncHandler(async (req, res, next) => {
  // generate code
  const code = voucher_code.generate({ length: 5 });

  // create coupon
  const coupon = await couponModel.create({
    name: code[0],
    discount: req.body.discount,
    expireAt: new Date(req.body.expireAt).getTime(),
    createdBy: req.user._id,
  });
  // response
  return res.status(200).json({ message: "Done", coupon });
});

export const delCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await couponModel.findOneAndDelete({ name: req.params.name });
  if (!coupon) {
    return next(new Error("Coupon not found", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done" });
});
