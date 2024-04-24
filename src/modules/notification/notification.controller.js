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
    popUpId: req.body,
  });
  res.json({ status: "Success", message: "Subscription saved!" });
});

///////////////////////////////////////////////////

app.get("/send-notification", (req, res) => {
  webpush.sendNotification(subDatabse[0], "Hello world");
  res.json({ statue: "Success", message: "Message sent to push service" });
  console.log(subDatabse);
});
