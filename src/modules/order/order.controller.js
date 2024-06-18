import Stripe from "stripe";
import webpush from "web-push";
import cartModel from "../../../DB/model/cart.model.js";
import chatModel from "../../../DB/model/chat.model.js";
import courseModel from "../../../DB/model/course.model.js";
import notificationModel from "../../../DB/model/notification.model.js";
import orderModel from "../../../DB/model/order.model.js";
import studentModel from "../../../DB/model/student.model.js";
import userModel from "../../../DB/model/user.model.js";
import workshopModel from "../../../DB/model/workshop.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import { getIo } from "../../utils/server.js";

//
export const createOrder = asyncHandler(async (req, res, next) => {
  //Check Cart
  const cart = await cartModel.findOne({ user: req.user.id });
  if (cart.course.length < 1) {
    return next(new Error("Cart is empty", { cause: 404 }));
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
      let c = await courseModel
        .findByIdAndUpdate(order.courses[i].courseId, {
          $inc: { numberOfStudents: 1 },
        })
        .populate([{ path: "createdBy" }]);
      let w = await workshopModel
        .findByIdAndUpdate(order.courses[i].courseId, {
          $inc: { numberOfStudents: 1 },
        })
        .populate([{ path: "instructor" }]);
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
      let checkCourse = c ? c : w;

      let notification = {
        image:
          checkCourse.coverImageUrl ||
          checkCourse.promotionImage.url ||
          undefined,
        title: "New Student",
        body: `${user.userName} Enroll Your Course, ${checkCourse.title}`,
        url: `https://e-learning-azure.vercel.app/courseDetails/${order.courses[i].courseId}`,
      };
      let notify = await notificationModel.findOneAndUpdate(
        {
          user: c ? c.createdBy.id : w.instructor.id,
        },
        {
          $push: { notifications: notification },
        },
        { new: true }
      );
      if (!notify) {
        notify = await notificationModel.create({
          user: c ? c.createdBy.id : w.instructor.id,
          notifications: notification,
        });
      }
      let sendToInstructor = c ? c.createdBy : w.instructor;

      notification = notify.notifications.reverse()[0];
      getIo().to(sendToInstructor.socketId).emit("notification", notification);
      if (sendToInstructor.popUpId.endpoint) {
        webpush.sendNotification(
          sendToInstructor.popUpId,
          JSON.stringify(notification)
        );
      }
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
