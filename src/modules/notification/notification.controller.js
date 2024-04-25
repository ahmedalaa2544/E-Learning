import notificationModel from "../../../DB/model/notification.model.js";
import userModel from "../../../DB/model/user.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";

import webpush from "web-push";

const apiKeys = {
  publicKey:
    "BC715ldq3LNaKheFg_f4NiFBYZwj3qzRKcxnemdng3jBICMFvyjQ99c3SnkdQ2vL8mNPc6L0ZlWYyuF_zQoBlo0",
  privateKey: "fpgCqM8ef7h2eJPthrl_r9rwqoe6karSaQl8oaprHB0",
};

webpush.setVapidDetails(
  "mailto:YOUR_MAILTO_STRING",
  apiKeys.publicKey,
  apiKeys.privateKey
);

export const saveSub = asyncHandler(async (req, res) => {
  await userModel.findByIdAndUpdate(req.user.id, {
    popUpId: req.body.popUp,
  });
  res.json({ status: "Success", message: "Subscription saved!" });
});

export const readNotify = asyncHandler(async (req, res) => {
  const notification = await notificationModel.findOne({ user: req.user.id });

  if (req.params.notificationId) {
    // Mark the notification as read
    notification.notifications.forEach((notif) => {
      if (notif._id.toString() == req.params.notificationId) {
        notif.isRead = true;
      }
    });
    await notification.save();
    return res.status(200).json({ message: "Done" });
  }
  // Mark all notification as read
  notification.notifications.forEach((notif) => {
    notif.isRead = true;
  });
  await notification.save();
  return res.status(200).json({ message: "Done" });
});
///////////////////////////////////////////////////

// app.get("/send-notification", (req, res) => {
//   webpush.sendNotification(subDatabse[0], "Hello world");
//   res.json({ statue: "Success", message: "Message sent to push service" });
//   console.log(subDatabse);
// });
