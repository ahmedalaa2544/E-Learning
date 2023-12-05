import connectDB from "../DB/connection.js";
import authRouter from "./modules/auth/auth.router.js";
import userRouter from "./modules/user/user.router.js";
import uploadRouter from "./modules/upload/upload.router.js";
import courseRouter from "./modules/course/course.router.js";
import { globalErrorHandler } from "./utils/asyncHandling.js";
import cors from "cors";

const appRouter = (app, express) => {
  // Cors
  app.use(cors({}));

  app.use(express.json());

  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/upload", uploadRouter);
  app.use("/course", courseRouter);

  app.all("*", (req, res) => {
    return res.status(404).json({ message: "invalid Path" });
  });

  connectDB();
  app.use(globalErrorHandler);
};

export default appRouter;
