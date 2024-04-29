import orderModel from "../../../DB/model/order.model.js";
import studentModel from "../../../DB/model/student.model.js";
import Course from "../../../DB/model/course.model.js";
import cartModel from "../../../DB/model/cart.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import Stripe from "stripe";
import userModel from "../../../DB/model/user.model.js";
import couponModel from "../../../DB/model/coupon.model.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import { getIo } from "../../utils/server.js";
import chatModel from "../../../DB/model/chat.model.js";
import notificationModel from "../../../DB/model/notification.model.js";

export const createAccount = asyncHandler(async (req, res, next) => {
  const { course } = req.body;
  const stripe = new Stripe(process.env.STRIPE_KEY);
  const account = await stripe.accounts.create({
    controller: {
      stripe_dashboard: {
        type: "express",
      },
      fees: {
        payer: "application",
      },
      losses: {
        payments: "application",
      },
    },
  });
  await Course.findByIdAndUpdate(course, { accountId: account.id });
  console.log(`account: ${account.id}`);

  return account
    ? res.status(200).json({ message: "Done", account })
    : res.status(500).json({ message: "Something went wrong" });
});

export const accountLink = asyncHandler(async (req, res, next) => {
  const { account } = req.body;
  const stripe = new Stripe(process.env.STRIPE_KEY);
  console.log("reach account link");
  // console.log(req.headers.origin);
  // const account = "acct_1P9R5ECDFhxaCkbh";
  const accountLink = await stripe.accountLinks.create({
    account: account,
    return_url: `http://localhost:8080/return/${account}`,
    refresh_url: `http://localhost:8080/refresh/${account}`,
    type: "account_onboarding",
  });
  console.log(accountLink);

  return accountLink
    ? res.status(200).redirect(accountLink.url)
    : res.status(500).json({ message: "Something went wrong" });
});
export const accessDashboard = asyncHandler(async (req, res, next) => {
  const { account } = req.body;
  const stripe = new Stripe(process.env.STRIPE_KEY);
  console.log("reach accessDashboard");
  // const account = "acct_1P9R5ECDFhxaCkbh";
  const loginLink = await stripe.accounts.createLoginLink(account);
  console.log("Login link generated:", loginLink.url);
  return loginLink
    ? res.status(200).redirect(loginLink.url)
    : res.status(500).json({ message: "Something went wrong" });
});

//
export const createOrder = asyncHandler(async (req, res, next) => {
  const stripe = new Stripe(process.env.STRIPE_KEY);

  //Check Cart
  const cart = await cartModel.findOne({ user: req.user.id });
  if (cart.course.length < 1) {
    return next(new Error("Cart is empty", { cause: 404 }));
  }
  let checkCoupon;
  // Check Coupon
  if (cart.coupon) {
    checkCoupon = await couponModel.findOne({
      _id: cart.coupon,
      expireAt: { $gt: Date.now() },
    });
    if (checkCoupon.name == undefined) {
      return next(new Error("inVaild Coupon", { cause: 404 }));
    }
  }
  let orderCourses = [];
  let orderPrice = 0;

  // Define the criteria for grouping (e.g., connected account ID)
  console.log("reach ");
  const criteria = {
    $group: {
      _id: "$createdBy", // Group by connected account ID
      courses: { $push: "$$ROOT" }, // Push the documents into an array
    },
  };

  // Use the aggregate() method to group items
  const courseGroup = await Course.aggregate([criteria]);
  console.log(courseGroup[1]);
  // return res.status(200).json({ message: "Done", courseGroup });

  //check courses
  for (let i = 0; i < cart.course.length; i++) {
    if (checkCoupon) {
      if (checkCoupon.courseId.toString() != cart.course[i].courseId) {
        return next(
          new Error(`coupon not vaild to this ${cart.course[i].name} course`)
        );
      }
    }
    const course = Course.findById(cart.course[i].courseId);
    if (!course) {
      return next(
        new Error(`Course ${cart.course[i].courseId} Not Found`, {
          cause: 404,
        })
      );
    }
    const connectedAccountId = course.connectedAccountId; // Implement this function to get the connected account ID for the course
    if (!groupedItems[connectedAccountId]) {
      groupedItems[connectedAccountId] = [];
    }
    groupedItems[connectedAccountId].push(cart.course[i]);
    if (!cart.course[i].price) {
      cart.course[i].price = 0;
    }

    orderCourses.push({
      courseId: cart.course[i].courseId,
      coursePrice: cart.course[i].price,
      name: cart.course[i].name,
    });

    orderPrice = +cart.course[i].price + +orderPrice;
  }

  // Create separate orders for each group of items
  const orders = [];
  for (const connectedAccountId in groupedItems) {
    const groupCourses = groupedItems[connectedAccountId];
    for (const course of groupCourses) {
      if (!course.price) {
        course.price = 0;
      }
      orderCourses.push({
        courseId: course.courseId,
        coursePrice: course.price,
        name: course.name,
      });
      orderPrice += +course.price;
    }
    const order = await orderModel.create({
      user: req.user.id,
      courses: orderCourses,
      price: orderPrice,
      destination: connectedAccountId, // Store the destination connected account ID for the order
    });
    orders.push(order);
  }

  // Create a single Stripe Checkout Session for the entire order with a single destination connected account ID
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    metadata: { orders: orders.map((order) => order._id.toString()) },
    success_url: process.env.SUCCESS_URL,
    cancel_url: process.env.CANCEL_URL,
    line_items: orders.map((order) => ({
      price_data: {
        currency: "EGP",
        product_data: {
          name: "Order", // You can customize the name as needed
        },
        unit_amount: order.price * 100, //cent
      },
      quantity: 1,
    })),
    payment_intent_data: {
      application_fee_amount: 123,
      transfer_data: {
        destination: connectedAccountId,
      },
    },
  });
  return res.status(200).json({ message: "Done", result: session.url });
});
//webhook
export const orderWebhook = asyncHandler(async (request, response) => {
  const sig = request.headers["stripe-signature"];
  let event;
  const stripe = new Stripe(process.env.STRIPE_KEY);
  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.ENDPOINT_SECERT
    );
  } catch (err) {
    console.log(request.body, sig);
    response.status(400).send(`Webhook Errors: ${err.message}`);
    return;
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    // change order status
    const orderId = event.data.object.metadata.order_id;
    const order = await orderModel.findByIdAndUpdate(orderId, {
      status: "Paid",
    });
    const user = await userModel.findById(order.user);
    let cBought = [];
    for (let i = 0; i < order.courses.length; i++) {
      cBought.push(order.courses[i].courseId);
      let c = await Course.findByIdAndUpdate(order.courses[i].courseId, {
        $inc: { numberOfStudents: 1 },
      }).populate([{ path: "createdBy", select: "socketId" }]);
      let w = await workshopModel
        .findByIdAndUpdate(order.courses[i].courseId, {
          $inc: { numberOfStudents: 1 },
        })
        .populate([{ path: "instructor", select: "socketId" }]);
      if (w) {
        await chatModel.findOneAndUpdate(
          { name: w.title, type: "group" },
          {
            $push: { participants: order.user },
          }
        );
      }

      await studentModel.create({
        course: order.courses[i].courseId,
        user: order.user,
        paid: order.courses[i].coursePrice,
        courseOwner: c ? c.createdBy.id : w.instructor.id,
      });

      //add notification
      const notification = {
        from: user.id,
        title: "SomeOne Enroll Your Course",
        message: `${user.userName} Enroll Your Course`,
      };
      const notify = await notificationModel.findOneAndUpdate(
        {
          user: c ? c.createdBy.id : w.instructor.id,
        },
        {
          $push: { notifications: notification },
        }
      );
      if (!notify) {
        await notificationModel.create({
          user: c ? c.createdBy.id : w.instructor.id,
          notifications: notification,
        });
      }
      let sendToInstructor = c ? c.createdBy.socketId : w.instructor.socketId;

      getIo().to(sendToInstructor).emit("notification", notification);
    }
    // add course to user
    await userModel.findByIdAndUpdate(order.user, {
      $push: { coursesBought: { $each: cBought } },
    });
    // clear cart
    await cartModel.updateOne({ user: order.user }, { course: [] });
    return response.status(200).json({ message: "Done" });
  }
  // Return a 200 response to acknowledge receipt of the event
  return response.status(400).json({ message: "failed" });
});
