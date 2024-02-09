import roomModel from "../../../DB/model/room.model.js";
import { asyncHandler } from "../../utils/asyncHandling.js";
import { WebhookReceiver } from "livekit-server-sdk";

export const room_started = asyncHandler(async (req, res, next) => {
  // create receiver
  const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_SECRET_KEY
  );

  // event is a WebhookEvent object
  const event = receiver.receive(req.body, req.get("Authorization"));

  // update room statur
  // await roomModel.findOneAndUpdate(
  //   { sessionId: "RM_hycBMAjmt6Ub" },
  //   {
  //     roomStatus: "started",
  //   }
  // );
  console.log(event);
});
