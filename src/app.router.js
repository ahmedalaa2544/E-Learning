import connectDB from "../DB/connection.js";
import authRouter from "./modules/auth/auth.router.js";
import userRouter from "./modules/user/user.router.js";
import uploadRouter from "./modules/upload/upload.router.js";
import workshopRouter from "./modules/workshop/workshop.router.js";
import roomRouter from "./modules/room/room.router.js";
import roomEventRouter from "./modules/roomEvent/roomEvent.router.js";
import courseRouter from "./modules/course/course.router.js";
import categRouter from "./modules/category/categ.router.js";
import cartRouter from "./modules/cart/cart.router.js";
import orderRouter from "./modules/order/order.router.js";
import paymentRouter from "./modules/payment/payment.router.js";
import couponRouter from "./modules/coupon/coupon.router.js";
import analyticsRouter from "./modules/analytics/analytics.router.js";
import quizRouter from "./modules/quiz/quiz.router.js";
import chatRouter from "./modules/chat/chat.router.js";
import recommendationRouter from "./modules/recommendation/recommendation.router.js";
import notificationRouter from "./modules/notification/notification.router.js";
import { globalErrorHandler } from "./utils/asyncHandling.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import useragent from "express-useragent";

const appRouter = (app, express) => {
  // Cors // ////////
  app.use(cors({ origin: true, credentials: true }));

  // app.use((req, res, next) => {
  //   res.setHeader("Access-Control-Allow-Origin", "*");
  //   res.setHeader(
  //     "Access-Control-Allow-Methods",
  //     "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  //   );
  //   res.setHeader(
  //     "Access-Control-Allow-Headers",
  //     "Content-Type, Authorization"
  //   );
  //   next();
  // });

  app.use((req, res, next) => {
    if (
      req.originalUrl.includes("/order/webhook") ||
      req.originalUrl.includes("/roomEvent")
    ) {
      return next();
    }
    express.json()(req, res, next);
  });
  app.use(cookieParser());
  app.use(useragent.express());
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/upload", uploadRouter);
  app.use("/course", courseRouter);
  app.use("/workshop", workshopRouter);
  app.use("/room", roomRouter);
  app.use("/roomEvent", roomEventRouter);
  app.use("/category", categRouter);
  app.use("/cart", cartRouter);
  app.use("/order", orderRouter);
  app.use("/payment", paymentRouter);
  app.use("/coupon", couponRouter);
  app.use("/analytics", analyticsRouter);
  app.use("/quiz", quizRouter);
  app.use("/chat", chatRouter);
  app.use("/recommendation", recommendationRouter);
  app.use("/notification", notificationRouter);
  app.all("*", (req, res) => {
    return res.status(404).json({ message: "invalid Path" });
  });

  connectDB();
  app.use(globalErrorHandler);
};

export default appRouter;
