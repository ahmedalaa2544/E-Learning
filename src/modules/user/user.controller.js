import userModel from "../../../DB/model/user.model.js";
import courseModel from "../../../DB/model/course.model.js";
import instructorModel from "../../../DB/model/instructor.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import Cryptr from "cryptr";
import tokenModel from "../../../DB/model/token.model.js";
import upload, { deleteBlob } from "../../utils/azureServices.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import orderModel from "../../../DB/model/order.model.js";
import bcryptjs from "bcryptjs";
import { ConfirmTemp } from "../../utils/htmlTemps.js";
import crypto from "crypto";
import sendEmail from "../../utils/sentEmail.js";
import notificationModel from "../../../DB/model/notification.model.js";
import View from "../../../DB/model/view.model.js";
import Instructor from "../../../DB/model/instructor.model.js";
import Student from "../../../DB/model/student.model.js";
import Progress from "../../../DB/model/progress.model.js";

export const getUser = asyncHandler(async (req, res, next) => {
  const newUser = await userModel
    .findById(req.user._id)
    .select("profilePic userName email age gender phone fullName");
  const cryptr = new Cryptr(process.env.CRPTO_PHONE);
  let decryptedPhone;
  newUser.phone
    ? (decryptedPhone = cryptr.decrypt(newUser.phone))
    : (newUser.phone = "");
  newUser.phone = decryptedPhone;
  const notification = await notificationModel.findOne({
    user: req.user.id,
  });
  if (notification) {
    let count = 0;
    notification.notifications.forEach((notification) => {
      if (!notification.isRead) {
        count += 1;
      }
    });
    newUser.unreadNotifyCount = count;
  }
  return res.status(200).json({ message: "Done", newUser });
});

export const updateProfile = asyncHandler(async (req, res, next) => {
  // update profile
  if (req.body.email) {
    const checkEmail = await userModel.findOne({ email: req.body.email });
    if (checkEmail) {
      return next(new Error("email is Registred"), { cause: 400 });
    }
    const activationCode = crypto.randomBytes(64).toString("hex");
    // create user
    await userModel.findByIdAndUpdate(req.user.id, {
      activationCode,
    });
    // create confirmLink
    const link = `https://education-project.azurewebsites.net/auth/confirmEmail/${activationCode}/${req.body.email}`;
    // send email
    await sendEmail({
      to: req.body.email,
      subject: "Email Confirmation",
      html: ConfirmTemp(link),
    });
  }
  const { email, ...newBody } = req.body;
  const user = await userModel.findByIdAndUpdate(
    req.user.id,
    { ...newBody },
    { new: true }
  );
  if (req.body.phone) {
    // Encrypt phone
    const cryptr = new Cryptr(process.env.CRPTO_PHONE);
    const encryptPhone = cryptr.encrypt(req.body.phone);
    user.phone = encryptPhone;
    user.save();
  }
  if (req.body.password) {
    // Encrypt password
    const hashPassword = await bcryptjs.hash(
      req.body.password,
      +process.env.SALAT_ROUND
    );
    user.password = hashPassword;
    user.save();
  }

  // upload profile picture
  if (req.file) {
    if (req.user.profilePic) {
      // delete promotionImage from Azure cloud
      await deleteBlob(req.user.profilePic.blobName);
    }

    // Extract the extension for the promotion image.
    const blobImageExtension = req.file.originalname.split(".").pop();
    // Define the path for the promotion image in the user's course directory.
    const dateOfPublish = Date.now(); // to change the url from pic to another
    const blobImageName = `Users\\${req.user.userName}_${req.user._id}\\profilePic\\${dateOfPublish}.${blobImageExtension}`;
    // Upload image and obtain its URL.
    const imageUrl = await upload(
      req.file.path,
      blobImageName,
      "image",
      blobImageExtension
    );

    // save changes in DB
    req.user.profilePic.blobName = blobImageName;
    req.user.profilePic.url = imageUrl;
    await req.user.save();
  }

  const { password, ...newUser } = user.toObject();

  return res.status(200).json({ message: "Done", newUser });
});

export const deleteAcc = asyncHandler(async (req, res, next) => {
  await userModel.findByIdAndUpdate(req.user.id, { isDeleted: true });
  await tokenModel.updateMany({ user: req.user.id }, { valid: false });
  return res.status(200).json({ message: "Done" });
});

export const addAndRmWishlist = asyncHandler(async (req, res, next) => {
  // recieve data
  const { courseId } = req.params;
  const course = await courseModel.findById(courseId);
  if (!course) return next(new Error("Course not found", { cause: 404 }));
  // chcek course exists
  if (req.user.wishlist.includes(courseId)) {
    // remove
    await userModel.findByIdAndUpdate(req.user.id, {
      $pull: { wishlist: courseId },
    });
    return res.status(200).json({ message: "Removed From WishList" });
  }
  // add to wishlist
  await userModel.findByIdAndUpdate(req.user.id, {
    $addToSet: { wishlist: courseId },
  });
  return res.status(200).json({ message: "Added To WishList" });
});

export const rmWishlist = asyncHandler(async (req, res, next) => {
  // recieve data
  const { courseId } = req.params;
  // chcek course in wishlist
  if (!req.user.wishlist.includes(courseId))
    return next(new Error("Course not exist in ur wishlist", { cause: 404 }));
  // remove
  await userModel.updateOne(
    { _id: req.user.id },
    { $pull: { wishlist: courseId } }
  );
  return res.status(200).json({ message: "Done" });
});

export const getWishlist = asyncHandler(async (req, res, next) => {
  const { wishlist } = await userModel
    .findById(req.user.id)
    .populate([{ path: "wishlist" }]);
  return res.status(200).json({ message: "Done", wishlist });
});

export const getCourses = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  if (req.query.view === "course") {
    // get courses
    const { coursesBought } = await userModel
      .findById(req.user.id)
      .populate([{ path: "coursesBought", model: "Course" }]);

    let courses = coursesBought.slice(startIndex, endIndex);

    return res.status(200).json({ message: "Done", courses });
  }
  if (req.query.view === "workshop") {
    // get workshops
    const { coursesBought } = await userModel
      .findById(req.user.id)
      .populate([{ path: "coursesBought", model: "Workshop" }]);

    let workshop = coursesBought.slice(startIndex, endIndex);

    // return response
    return res.status(200).json({ message: "Done", workshop });
  }
  return next(new Error("return vaild view", { cause: 404 }));
});

export const getCreatedCourses = asyncHandler(async (req, res, next) => {
  // get courses
  const courses = await courseModel.find({ createdBy: req.user._id });
  const workshop = await workshopModel.find({ instructor: req.user._id });
  // return response
  return res.status(200).json({ message: "Done", courses, workshop });
});

export const search = asyncHandler(async (req, res, next) => {
  const query = req.query.q.toLowerCase();

  let matchedData;

  if (query == "" || query == " ") {
    matchedData = "";
    return res.status(200).json({ message: "Done", matchedData });
  }

  if (req.query.type == "user") {
    const users = await userModel.find().select("userName profilePic");

    matchedData = users
      .filter((item) => item.userName.toLowerCase().includes(query))
      .slice(0, 5);

    // respone
    return res.status(200).json({ message: "Done", matchedData });
  }

  if (req.query.type == "instructor") {
    const user = await instructorModel.find();
    const userArray = user.map((user) => user.user);

    const users = await userModel
      .find({ _id: { $in: userArray } })
      .select("userName profilePic");

    matchedData = users
      .filter((item) => item.userName.toLowerCase().includes(query))
      .slice(0, 5);

    // respone
    return res.status(200).json({ message: "Done", matchedData });
  }

  return next(new Error("Enter Vaild Search Type", { cause: 401 }));
});

export const revenue = asyncHandler(async (req, res, next) => {
  // get created Courses
  const course = await courseModel
    .find({ createdBy: req.user.id })
    .select("title numberOfStudents price coverImageUrl");
  // get created workShops
  const workshop = await workshopModel
    .find({ instructor: req.user.id })
    .select("title numberOfStudents price promotionImage");
  // get all of them
  const Fcourses = course.concat(workshop);

  const courses = Fcourses.map((item) => ({
    courseId: item._id,
    title: item.title,
    coverImageUrl: item.coverImageUrl
      ? item.coverImageUrl
      : item.promotionImage?.url,
    price: item.price,
    numberOfStudents: item.numberOfStudents,
    revenue: item.revenue,
  }));

  const sOrders = await orderModel.find({
    "courses.courseId": { $in: Fcourses },
    status: "Paid",
  });
  const fOrders = await orderModel.find({
    "courses.courseId": { $in: Fcourses },
    status: "Refunded",
  });

  let successRate = Math.round(
    (sOrders.length / (sOrders.length + fOrders.length)) * 100
  );
  let totalNumberOfStudents = 0;
  let totalRevenue = 0;

  courses.forEach((course) => {
    totalNumberOfStudents += course.numberOfStudents || 0;
    totalRevenue += course.revenue || 0;
  });

  const user = await userModel.findById(req.user.id);
  user.currentBalance = totalRevenue - user.totalPaidOut * 1.3;
  user.totalNumberOfStudents = totalNumberOfStudents;
  user.totalRevenue = totalRevenue;
  user.save();

  const currentBalance = user.currentBalance < 0 ? 0 : user.currentBalance;
  const totalPaidOut = user.totalPaidOut;

  //chart revenue per day
  const now = new Date();
  const lastmonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const salesLastMonth = await orderModel.find({
    "courses.courseId": { $in: Fcourses },
    status: "Paid",
    createdAt: { $gt: lastmonth },
  });

  const revenuePerDay = {};
  salesLastMonth.forEach((sale) => {
    const createdAtDate = new Date(sale.createdAt);
    const dayOfMonth = createdAtDate.getDate(); // Extracting only the day part

    sale.courses.forEach((course) => {
      const coursePrice = course.coursePrice;

      if (!revenuePerDay[dayOfMonth]) {
        revenuePerDay[dayOfMonth] = 0;
      }

      revenuePerDay[dayOfMonth] += coursePrice;
    });
  });

  // respone
  return res.status(200).json({
    message: "Done",
    courses,
    totalRevenue,
    totalNumberOfStudents,
    currentBalance,
    totalPaidOut,
    revenuePerDay,
    successRate,
  });
});

export const detailsRevenue = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const lastmonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const course = await courseModel.find({ createdBy: req.user.id });
  const workShop = await workshopModel.find({ instructor: req.user.id });
  const courses = course.concat(workShop);
  const salesLastMonth = await orderModel.find({
    "courses.courseId": { $in: courses },
    status: "Paid",
    createdAt: { $gt: lastmonth },
  });

  //chart sales
  const salesCountPerDay = {};

  salesLastMonth.forEach((sale) => {
    const createdAtDate = new Date(sale.createdAt);
    const dayOfMonth = createdAtDate.getDate();

    if (salesCountPerDay[dayOfMonth]) {
      salesCountPerDay[dayOfMonth]++;
    } else {
      salesCountPerDay[dayOfMonth] = 1;
    }
  });

  // Initialize counters for various metrics.
  let totalViews = 0,
    watchedHours = 0,
    computerWatchedHours = 0,
    tabletWatchedHours = 0,
    mobileWatchedHours = 0,
    satifaction = 0,
    numberOfCourses = 0;

  // Retrieve all instructor records for the current user.
  const userIsinstructorAt = await Instructor.find({ user: req.userId });

  // Process each course the instructor is associated with.
  await Promise.all(
    userIsinstructorAt.map(async (instructor_doc) => {
      const course = await courseModel
        .findById(instructor_doc.course)
        .select("rating");

      numberOfCourses += 1;
      const rating = course?.rating ? course.rating : 0;
      satifaction += rating;
      // Fetch view statistics for the course.
      const views = await View.find({ course: instructor_doc.course });
      // Fetch all students enrolled in the course.
      const students = await Student.find({ course: instructor_doc.course });

      // Aggregate the number of students and calculate total revenue.
      // totalStudents += students.length;
      // students.map((student) => {
      //   totalRevenue += student.paid;
      // });

      // Aggregate the total views from all view records.
      views.map((view) => {
        totalViews += view.count;
      });

      // Fetch all progress records for the course to calculate watched hours and device-specific usage.
      const progresses = await Progress.find({ course: instructor_doc.course });
      progresses.map((progress) => {
        const lastWatchedSecond = progress.lastWatchedSecond;
        watchedHours += lastWatchedSecond;
        const deviceType = progress.deviceType.toLowerCase();

        // Calculate watched hours per device type.
        if (deviceType === "computer")
          computerWatchedHours += lastWatchedSecond;
        if (deviceType === "tablet") tabletWatchedHours += lastWatchedSecond;
        if (deviceType === "mobile") mobileWatchedHours += lastWatchedSecond;
      });
    })
  );

  // Calculate the usage percentage for each type of device.
  const devicesUsage = [
    {
      device: "computer",
      usagePercentage:
        watchedHours > 0 ? (computerWatchedHours / watchedHours) * 100 : 0,
    },
    {
      device: "tablet",
      usagePercentage:
        watchedHours > 0 ? (tabletWatchedHours / watchedHours) * 100 : 0,
    },
    {
      device: "mobile",
      usagePercentage:
        watchedHours > 0 ? (mobileWatchedHours / watchedHours) * 100 : 0,
    },
  ];
  const satifactionPercentage = (satifaction / (5 * numberOfCourses)) * 100;
  return res.status(200).json({
    message: "Done",
    analytics: {
      totalViews,
      totalStudents: req.user.totalNumberOfStudents,
      totalRevenue: req.user.totalRevenue,
      salesCountPerDay,
      watchedHours,
      devicesUsage,
      satifactionPercentage,
    },
  });
});

export const order = asyncHandler(async (req, res, next) => {
  const orders = await orderModel.find({
    user: req.user.id,
    status: { $in: ["Paid", "Refunded"] },
  });
  let currentBalance = req.user.RefundedBalence;
  let spent = 0;
  orders.forEach((order) => {
    if (order.status == "Paid") {
      spent += order.price;
    }
  });

  // response
  return res
    .status(200)
    .json({ message: "Done", orders, spent, currentBalance });
});

export const refundOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const user = await userModel.findById(req.user.id);
  const order = await orderModel.findById(orderId);

  const now = new Date();
  const lessThan3DaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  if (order.createdAt < lessThan3DaysAgo) {
    return next(
      new Error(
        "Refund request denied, Purchases older than 3 days are ineligible"
      )
    );
  }
  let courses = [];

  order.courses.forEach((c) => {
    if (!user.coursesBought.includes(c.courseId)) {
      user.RefundedBalence -= order.price;
      return next(new Error(`You refund This ${c.name} Course Before!`));
    }
    courses.push(c.courseId);
  });

  courses.forEach(async (c) => {
    const checkCourse = await courseModel.findByIdAndUpdate(
      { _id: c },
      { $inc: { numberOfStudents: -1 } }
    );
    if (!checkCourse) {
      await workshopModel.findByIdAndUpdate(
        { _id: c },
        { $inc: { numberOfStudents: -1 } }
      );
    }
  });

  order.status = "Refunded";
  order.save();
  user.RefundedBalence += order.price;
  user.coursesBought = user.coursesBought.filter(
    (course) => !courses.find((c) => c.toString() === course.toString())
  );
  await user.save();

  return res.status(200).json({ message: "Done" });
});

export const refund = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const course = await courseModel.findById(courseId);
  const workShop = await workshopModel.findById(courseId);

  if (!course && !workShop) {
    return next(new Error("Course not found", { cause: 404 }));
  }
  const user = await userModel.findById(req.user.id);
  if (!user.coursesBought.includes(courseId)) {
    return next(new Error("You Did Not Buy This Course", { cause: 404 }));
  }
  const now = new Date();
  const lessThan3DaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const order = await orderModel.findOne({
    user: req.user.id,
    status: "Paid",
    createdAt: { $gt: lessThan3DaysAgo },
    "courses.courseId": courseId,
  });
  if (order) {
    await userModel.findByIdAndUpdate(req.user.id, {
      $pull: { coursesBought: courseId },
    });

    await orderModel.create({
      user: req.user.id,
      status: "Refunded",
      courses: [
        {
          courseId,
          coursePrice: course ? course.price : workShop.price,
          name: course ? course.title : workShop.title,
        },
      ],
      price: course ? course.price : workShop.price,
    });
    req.user.RefundedBalence += order.price;

    course
      ? await courseModel.updateOne(
          { _id: courseId },
          { $inc: { numberOfStudents: -1 } }
        )
      : await workshopModel.updateOne(
          { _id: courseId },
          { $inc: { numberOfStudents: -1 } }
        );

    return res.status(200).json({
      message: `You Refunded ${course ? course.title : workShop.title} Course`,
    });
  }
  return next(
    new Error(
      "Refund request denied, Purchases older than 3 days are ineligible"
    ),
    {
      cause: 400,
    }
  );
});

export const withdraw = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user.id);
  if (user.currentBalance < 200) {
    return next(new Error("Minimum 200EGP To Withdraw"));
  }
  user.totalPaidOut += user.currentBalance - user.currentBalance * 0.3;
  user.currentBalance = 0;
  user.save();
  return res.status(200).json({ message: "Done" });
});

export const getNotify = asyncHandler(async (req, res, next) => {
  let [{ notifications }] = await notificationModel
    .find({
      user: req.user.id,
    })
    .slice("notifications", -10);

  if (!notifications) {
    notifications = [];
  }

  notifications.reverse();
  return res.status(200).json({ message: "Done", notifications });
});
