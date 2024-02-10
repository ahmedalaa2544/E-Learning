import { Router } from "express";
const router = Router();
import * as userController from "./user.controller.js";
import { validation } from "../../middleware/validation.js";
import * as validators from "./user.validation.js";
import isAuth from "../../middleware/authntication.middleware.js";
import { customValidation, fileUpload } from "../../utils/multer.js";

router.patch(
  "/updateProfile",
  isAuth,
  validation(validators.updateSchema),
  userController.updateProfile
);

router.delete("/delete", isAuth, userController.deleteAcc);

router.patch(
  "/wishlist/:courseId",
  isAuth,
  validation(validators.wishlistSchema),
  userController.addWishlist
);

router.patch(
  "/wishlist/:courseId/remove",
  isAuth,
  validation(validators.wishlistSchema),
  userController.rmWishlist
);

router.get("/wishlist", isAuth, userController.getWishlist);

router.get("/courses", isAuth, userController.getCourses);

router.put(
  "/uploadPic",
  isAuth,
  fileUpload(customValidation.image).single("image"),
  userController.uploadPic
);

export default router;
