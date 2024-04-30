import { asyncHandler } from "../utils/asyncHandling.js";
import jwt from "jsonwebtoken";
import tokenModel from "../../DB/model/token.model.js";
import userModel from "../../DB/model/user.model.js";

const isAuth = asyncHandler(async (req, res, next) => {
  // check token exits and type
  let { token } = req.headers;

  if (!token?.startsWith(process.env.BEARER_TOKEN)) {
    return res.redirect("https://e-learning-azure.vercel.app/logout");
  }
  // check payload
  token = token.split(process.env.BEARER_TOKEN)[1];
  const decoded = jwt.verify(token, process.env.TOKEN_SIGNTURE);
  if (!decoded?.id) {
    return res.redirect("https://e-learning-azure.vercel.app/logout");
  }
  req.userId = decoded.id;
  const user = await userModel.findById(decoded.id);
  // check Online and deleted accounts
  if (!user?.isOnline) {
    return res.redirect("https://e-learning-azure.vercel.app/logout");
  }
  if (user.isDeleted) {
    return next(
      new Error("UR ACC Is Deleted,LogIn Before 30th to recover it", {
        cause: 401,
      })
    );
  }
  // check token in DB
  const tokenDB = await tokenModel.findOne({ token, valid: true });
  if (!tokenDB) {
    return res.redirect("https://e-learning-azure.vercel.app/logout");
  }
  // pass user
  req.user = user;
  return next();
});

export default isAuth;
