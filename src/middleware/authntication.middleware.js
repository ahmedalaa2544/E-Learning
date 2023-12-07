import { asyncHandler } from "../utils/asyncHandling.js";
import jwt from "jsonwebtoken";
import tokenModel from "../../DB/model/token.model.js";
import userModel from "../../DB/model/user.model.js";

const isAuth = asyncHandler(async (req, res, next) => {
  // check token exits and type
  let { token } = req.headers;

  if (!token?.startsWith(process.env.BEARER_TOKEN)) {
    return next(new Error("required valid token"), { cause: 400 });
  }
  // check payload
  token = token.split(process.env.BEARER_TOKEN)[1];
  const decoded = jwt.verify(token, process.env.TOKEN_SIGNTURE);
  if (!decoded?.id) {
    return next(new Error("inVaild Payload", { cause: 404 }));
  }
  req.userId = decoded.id;
  const user = await userModel.findById(decoded.id);
  // check Online and deleted accounts
  if (!user.isOnline) {
    return next(new Error("LogIn First", { cause: 400 }));
  }
  if (user.isDeleted) {
    return next(
      new Error("UR ACC Is Deleted,LogIn Before 30th to recover it", {
        cause: 400,
      })
    );
  }
  // check token in DB
  const tokenDB = await tokenModel.findOne({ token, valid: true });
  if (!tokenDB) {
    return next(new Error("Token Not Vaild", { cause: 404 }));
  }
  // pass user
  req.user = user;
  return next();
});

export default isAuth;
