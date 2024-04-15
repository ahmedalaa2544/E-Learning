import { getIo } from "../utils/server.js";
import jwt from "jsonwebtoken";
import tokenModel from "../../DB/model/token.model.js";
import userModel from "../../DB/model/user.model.js";

const socketAuth = async (auth, socketId) => {
  try {
    if (!auth?.startsWith(process.env.BEARER_TOKEN)) {
      getIo().to(socketId).emit("authScoket", "inVaild Bearer Token");
      return false;
    }
    // check payload
    const token = auth.split(process.env.BEARER_TOKEN)[1];
    const decoded = jwt.verify(token, process.env.TOKEN_SIGNTURE);
    if (!decoded?.id) {
      getIo().to(socketId).emit("authScoket", "inVaild Payload");
      return false;
    }
    const user = await userModel.findById(decoded.id);
    // check Online and deleted accounts
    if (!user?.isOnline) {
      getIo().to(socketId).emit("authScoket", "LogIn First");
      return false;
    }
    if (user.isDeleted) {
      getIo()
        .to(socketId)
        .emit(
          "authScoket",
          "UR ACC Is Deleted,LogIn Before 30th to recover it"
        );
      return false;
    }
    // check token in DB
    const tokenDB = await tokenModel.findOne({ token, valid: true });
    if (!tokenDB) {
      getIo().to(socketId).emit("authScoket", "Token Not Vaild");
      return false;
    }
    return user;
  } catch (error) {
    getIo().to(socketId).emit("authScoket", error);
    return false;
  }
};

export default socketAuth;
