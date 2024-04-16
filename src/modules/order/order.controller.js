import orderModel from "../../../DB/model/order.model.js";
import studentModel from "../../../DB/model/student.model.js";
import courseModel from "../../../DB/model/course.model.js";
import cartModel from "../../../DB/model/cart.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import Stripe from "stripe";
import userModel from "../../../DB/model/user.model.js";
import couponModel from "../../../DB/model/coupon.model.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import chatGroupModel from "../../../DB/model/chatGroup.model.js";
import { getIo } from "../../utils/server.js";
//
export const createOrder = asyncHandler(async (req, res, next) => {
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

  //check courses
  for (let i = 0; i < cart.course.length; i++) {
    const course = courseModel.findById(cart.course[i].courseId);
    if (!course) {
      return next(
        new Error(`Course ${cart.course[i].courseId} Not Found`, {
          cause: 404,
        })
      );
    }

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

  //Craete order
  const order = await orderModel.create({
    user: req.user.id,
    courses: orderCourses,
    price: orderPrice,
  });
  // invoice

  //Payment
  const stripe = new Stripe(process.env.STRIPE_KEY);
  let existCoupon;
  if (checkCoupon?.name !== undefined) {
    existCoupon = await stripe.coupons.create({
      percent_off: checkCoupon.discount,
      duration: "once",
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    metadata: { order_id: order._id.toString() },
    success_url: process.env.SUCCESS_URL, //Get it from Front
    cancel_url: process.env.CANCEL_URL, //Get it from Front
    line_items: order.courses.map((course) => {
      return {
        price_data: {
          currency: "EGP",
          product_data: {
            name: course.name,
            image: course.coverImageUrl,
          },
          unit_amount: course.coursePrice * 100, //cent
        },
        quantity: 1,
      };
    }),
    discounts: existCoupon ? [{ coupon: existCoupon.id }] : [],
  });

  return res.status(200).json({ message: "Done", result: session.url, order });
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
    let cBought = [];
    for (let i = 0; i < order.courses.length; i++) {
      cBought.push(order.courses[i].courseId);
      const c = await courseModel
        .findByIdAndUpdate(order.courses[i].courseId, {
          $inc: { numberOfStudents: 1 },
        })
        .populate([{ path: "createdBy", select: "socketId" }]);
      const w = await workshopModel
        .findByIdAndUpdate(order.courses[i].courseId, {
          $inc: { numberOfStudents: 1 },
        })
        .populate([{ path: "instructor", select: "socketId" }]);
      if (w) {
        await chatGroupModel.findOneAndUpdate(
          { name: w.title },
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
    }
    // add course to user
    const user = await userModel.findByIdAndUpdate(order.user, {
      $push: { coursesBought: { $each: cBought } },
    });

    let sendToInstructor = c ? c.createdBy.socketId : w.instructor.socketId;
    getIo.to(user.socketId).emit("receiveNotification", {
      title: "Successfully Payment", //rename the message
      from: `${c ? c.title : w.title}`,
      message: `Welcome to ${c ? c.title : w.title}`,
    });
    getIo.to(sendToInstructor).emit("receiveNotification", {
      title: "SomeOne Enroll Your Course",
      from: `${c ? c.title : w.title}`,
      message: `${user.userName} Enroll Your Course`,
    });

    // clear cart
    await cartModel.updateOne({ user: order.user }, { course: [] });
    return response.status(200).json({ message: "Done" });
  }
  // Return a 200 response to acknowledge receipt of the event
  return response.status(400).json({ message: "failed" });
});
