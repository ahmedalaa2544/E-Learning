import orderModel from "../../../DB/model/order.model.js";
import courseModel from "../../../DB/model/course.model.js";
import cartModel from "../../../DB/model/cart.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import Stripe from "stripe";
import userModel from "../../../DB/model/user.model.js";
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
          },
          unit_amount: course.coursePrice * 100, //cent
        },
        quantity: 1,
      };
    }),
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
    response.status(400).send(`Webhook Errors: ${err.message}`);
    return;
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    // change order status
    const orderId = event.data.object.metadata.order_id;
    const order = await orderModel.findByIdAndUpdate(orderId, {
      status: "Completed",
    });
    // add course to user
    await userModel.findByIdAndUpdate(order.user, {
      $push: { coursesBought: order.courses.courseId },
    });
    // clear cart
    await cartModel.updateOne({ user: req.user.id }, { course: [] });
    return;
  }
  // Return a 200 response to acknowledge receipt of the event
  return response.status(200).json({ message: "Done" });
});
