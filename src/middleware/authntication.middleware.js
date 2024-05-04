import { asyncHandler } from "../utils/asyncHandling.js";
import jwt from "jsonwebtoken";
import tokenModel from "../../DB/model/token.model.js";
import userModel from "../../DB/model/user.model.js";

const isAuth = asyncHandler(async (req, res, next) => {
  // check token exits and type
  let { token } = req.headers;

  if (!token?.startsWith(process.env.BEARER_TOKEN)) {
    return next(new Error("Login First!", { cause: 401 }));
  }
  // check payload
  token = token.split(process.env.BEARER_TOKEN)[1];
  const decoded = jwt.verify(token, process.env.TOKEN_SIGNTURE);
  if (!decoded?.id) {
    return next(new Error("Login First!", { cause: 401 }));
  }
  req.userId = decoded.id;
  const user = await userModel.findById(decoded.id);
  // check Online and deleted accounts
  if (!user?.isOnline) {
    return next(new Error("Login First!", { cause: 401 }));
  }
  if (user.isDeleted) {
    return next(
      new Error(
        "Your account has been deleted. Please log in before the 1st to recover it.",
        {
          cause: 401,
        }
      )
    );
  }
  // check token in DB
  const tokenDB = await tokenModel.findOne({ token, valid: true });
  if (!tokenDB) {
    return next(new Error("Login First!", { cause: 401 }));
  }
  // pass user
  req.user = user;
  return next();
});

export default isAuth;
