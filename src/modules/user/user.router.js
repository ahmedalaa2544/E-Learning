import { Router } from "express";
const router = Router();
import * as userController from "./user.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./user.validation.js";
import isAuth from "../../middleware/authntication.middleware.js";
import { customValidation, fileUpload } from "../../utils/multer.js";

router.get("/profile", isAuth, userController.getUser);

router.patch(
  "/profile",
  isAuth,
  fileUpload(customValidation.image).single("image"),
  validation(validators.updateSchema),
  userController.updateProfile
);

router.delete("/", isAuth, userController.deleteAcc);

router.patch(
  "/wishlist/:courseId",
  isAuth,
  validation(validators.wishlistSchema),
  userController.addAndRmWishlist
);

router.patch(
  "/wishlist/:courseId/remove",
  isAuth,
  validation(validators.wishlistSchema),
  userController.rmWishlist
);

router.get("/wishlist", isAuth, userController.getWishlist);

router.get("/BoughtCourses", isAuth, userController.getCourses);

router.get("/createCourses", isAuth, userController.getCreatedCourses);

router.get("/instructor/search", userController.search);

router.get("/revenue", isAuth, userController.revenue);

router.get("/SalesPerMonth", isAuth, userController.detailsRevenue);

router.get("/order", isAuth, userController.order);

router.patch(
  "/refund/:courseId",
  isAuth,
  validation(validators.wishlistSchema),
  userController.refund
);

export default router;
